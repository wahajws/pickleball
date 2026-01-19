import React, { useMemo, useState, useCallback } from "react";
import dayjs from "dayjs";

import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
} from "@mui/material";
import {
  Business as BusinessIcon,
  CheckCircle as ActiveIcon,
  Cancel as SuspendedIcon,
  Store as BranchIcon,
  People as UsersIcon,
  History as HistoryIcon,
  Event as EventIcon,
} from "@mui/icons-material";

import { useQueries } from "@tanstack/react-query";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";

import { AdminLayout } from "../../components/layouts/AdminLayout";
import { useApiQuery } from "../../hooks/useQuery";
import { API_BASE_URL, API_ENDPOINTS } from "../../config/api";
import { Loading } from "../../components/common/Loading";
import { formatDateTime } from "../../utils/format";

// ---------------- helpers ----------------
const toArray = (res) => {
  const arr =
    res?.data?.companies ||
    res?.data?.branches ||
    res?.data?.users ||
    res?.data?.bookings || // ✅ add bookings support
    res?.data?.rows ||
    res?.data?.data ||
    res?.data ||
    res;
  return Array.isArray(arr) ? arr : [];
};

const getToken = () => {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("access_token") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("authToken") ||
    ""
  );
};

const fetchJson = async (endpoint) => {
  const token = getToken();
  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE_URL}${endpoint}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  let body = null;
  try {
    body = await res.json();
  } catch (e) {
    // ignore
  }

  if (!res.ok) {
    const msg = body?.message || `Request failed (${res.status})`;
    throw new Error(msg);
  }

  return body;
};

// ✅ booking status palette (simple)
const statusToColor = (status) => {
  const s = String(status || "").toLowerCase();
  if (s === "confirmed") return "#2e7d32";
  if (s === "pending") return "#ed6c02";
  if (s === "cancelled") return "#d32f2f";
  if (s === "completed") return "#1976d2";
  if (s === "no_show") return "#6d4c41";
  if (s === "expired") return "#616161";
  return "#455a64";
};

// ✅ convert booking -> start/end datetime (supports many possible field names)
const getBookingStartEnd = (b) => {
  const rawStart =
    b?.start_at ||
    b?.start_time ||
    b?.starts_at ||
    b?.start ||
    b?.booking_start ||
    b?.start_datetime ||
    b?.booking_start_at ||
    b?.slot_start ||
    b?.from;

  const rawEnd =
    b?.end_at ||
    b?.end_time ||
    b?.ends_at ||
    b?.end ||
    b?.booking_end ||
    b?.end_datetime ||
    b?.booking_end_at ||
    b?.slot_end ||
    b?.to;

  // If start exists (best case)
  if (rawStart) {
    const start = dayjs(rawStart);
    if (start.isValid()) {
      // end optional
      if (rawEnd) {
        const end = dayjs(rawEnd);
        if (end.isValid()) return { start: start.toISOString(), end: end.toISOString() };
      }

      // no end? add duration
      const mins = Number(b?.duration_minutes || b?.duration || 60);
      const end = start.add(Number.isFinite(mins) ? mins : 60, "minute");
      return { start: start.toISOString(), end: end.toISOString() };
    }
  }

  // If only date + time exist
  const dateOnly = b?.booking_date || b?.date;
  const timeOnly = b?.booking_time || b?.time || b?.slot_start_time;

  if (dateOnly && timeOnly) {
    const start = dayjs(`${dateOnly}T${timeOnly}`);
    if (start.isValid()) {
      const mins = Number(b?.duration_minutes || b?.duration || 60);
      const end = start.add(Number.isFinite(mins) ? mins : 60, "minute");
      return { start: start.toISOString(), end: end.toISOString() };
    }
  }

  // fallback: created_at
  if (b?.created_at) {
    const start = dayjs(b.created_at);
    if (start.isValid()) {
      const end = start.add(60, "minute");
      return { start: start.toISOString(), end: end.toISOString() };
    }
  }

  return null;
};

export const DashboardPage = () => {
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");

  // 1) Companies
  const { data: companiesData, isLoading: companiesLoading } = useApiQuery(
    ["admin", "companies"],
    API_ENDPOINTS.ADMIN.PLATFORM.COMPANIES
  );

  const companies = useMemo(() => toArray(companiesData), [companiesData]);

  const activeCompanies = useMemo(
    () => companies.filter((c) => String(c.status || "").toLowerCase() === "active"),
    [companies]
  );

  const suspendedCompanies = useMemo(
    () => companies.filter((c) => String(c.status || "").toLowerCase() === "suspended"),
    [companies]
  );

  // 2) Branch count aggregation
  const branchQueries = useQueries({
    queries: companies.map((c) => {
      const endpoint = API_ENDPOINTS.BRANCHES?.LIST
        ? API_ENDPOINTS.BRANCHES.LIST(c.id)
        : `/companies/${c.id}/branches`;

      return {
        queryKey: ["admin", "company-branches", c.id],
        queryFn: () => fetchJson(endpoint),
        enabled: !!companies.length,
        staleTime: 30_000,
      };
    }),
  });

  const branchesLoading = useMemo(
    () => branchQueries.some((q) => q.isLoading),
    [branchQueries]
  );

  const totalBranches = useMemo(() => {
    let sum = 0;
    for (const q of branchQueries) {
      const arr =
        q?.data?.data?.branches ||
        q?.data?.branches ||
        q?.data?.data?.rows ||
        q?.data?.rows ||
        q?.data?.data ||
        q?.data;

      if (Array.isArray(arr)) sum += arr.length;
      else if (Array.isArray(arr?.rows)) sum += arr.rows.length;
    }
    return sum;
  }, [branchQueries]);

  // 3) Users count (keep old behavior)
  const totalUsers = 0;

  // 4) Audit logs (still disabled like your code)
  const { data: auditData, isLoading: auditLoading } = useApiQuery(
    ["admin", "audit-logs", "recent"],
    API_ENDPOINTS.ADMIN.PLATFORM.AUDIT_LOGS + "?limit=5",
    { enabled: false }
  );
  const auditLogs = useMemo(() => toArray(auditData), [auditData]);

  const recentCompanies = useMemo(() => {
    return [...companies]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5);
  }, [companies]);

  const recentSuspended = useMemo(() => {
    return [...suspendedCompanies]
      .sort(
        (a, b) =>
          new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at)
      )
      .slice(0, 5);
  }, [suspendedCompanies]);

 
  const BOOKINGS_ENDPOINT =
    API_ENDPOINTS?.ADMIN?.PLATFORM?.BOOKINGS;

  const {
    data: bookingsData,
    isLoading: bookingsLoading,
    error: bookingsError,
  } = useApiQuery(
    ["admin", "bookings", "all"],
    `${BOOKINGS_ENDPOINT}?limit=5000`,
    { enabled: true }
  );

  const bookings = useMemo(() => toArray(bookingsData), [bookingsData]);

  const bookingEvents = useMemo(() => {
    return bookings
      .map((b) => {
        const dt = getBookingStartEnd(b);
        if (!dt) return null;

        const bookingStatus = b?.booking_status || b?.status || "unknown";

        const title =
          b?.booking_number ||
          b?.booking_no ||
          b?.reference ||
          b?.customer_name ||
          b?.user_name ||
          `Booking ${String(b?.id || "").slice(0, 6)}`;

        return {
          id: b?.id || `${title}-${dt.start}`,
          title,
          start: dt.start,
          end: dt.end,
          backgroundColor: statusToColor(bookingStatus),
          borderColor: statusToColor(bookingStatus),
          extendedProps: {
            ...b,
            booking_status: bookingStatus,
          },
        };
      })
      .filter(Boolean);
  }, [bookings]);

  const filteredBookingEvents = useMemo(() => {
    if (statusFilter === "all") return bookingEvents;
    return bookingEvents.filter(
      (e) => String(e?.extendedProps?.booking_status || "").toLowerCase() === statusFilter
    );
  }, [bookingEvents, statusFilter]);

  const statusCounts = useMemo(() => {
    const counts = {
      all: bookingEvents.length,
      pending: 0,
      confirmed: 0,
      cancelled: 0,
      completed: 0,
      no_show: 0,
      expired: 0,
      unknown: 0,
    };

    for (const e of bookingEvents) {
      const s = String(e?.extendedProps?.booking_status || "unknown").toLowerCase();
      if (counts[s] === undefined) counts.unknown += 1;
      else counts[s] += 1;
    }
    return counts;
  }, [bookingEvents]);

  const onEventClick = useCallback((info) => {
    const booking = info?.event?.extendedProps;
    setSelectedBooking(booking || null);
  }, []);

  if (companiesLoading) {
    return (
      <AdminLayout>
        <Loading />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Container maxWidth="lg">

        {/* ALL BOOKINGS CALENDAR */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <EventIcon />
              <Typography variant="h6">All Bookings Calendar</Typography>
            </Box>

            {/* status filters */}
            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
              <Chip
                label={`All (${statusCounts.all})`}
                clickable
                color={statusFilter === "all" ? "primary" : "default"}
                onClick={() => setStatusFilter("all")}
              />
              <Chip
                label={`Pending (${statusCounts.pending})`}
                clickable
                color={statusFilter === "pending" ? "primary" : "default"}
                onClick={() => setStatusFilter("pending")}
              />
              <Chip
                label={`Confirmed (${statusCounts.confirmed})`}
                clickable
                color={statusFilter === "confirmed" ? "primary" : "default"}
                onClick={() => setStatusFilter("confirmed")}
              />
              <Chip
                label={`Cancelled (${statusCounts.cancelled})`}
                clickable
                color={statusFilter === "cancelled" ? "primary" : "default"}
                onClick={() => setStatusFilter("cancelled")}
              />
              <Chip
                label={`Completed (${statusCounts.completed})`}
                clickable
                color={statusFilter === "completed" ? "primary" : "default"}
                onClick={() => setStatusFilter("completed")}
              />
              <Chip
                label={`No Show (${statusCounts.no_show})`}
                clickable
                color={statusFilter === "no_show" ? "primary" : "default"}
                onClick={() => setStatusFilter("no_show")}
              />
              <Chip
                label={`Expired (${statusCounts.expired})`}
                clickable
                color={statusFilter === "expired" ? "primary" : "default"}
                onClick={() => setStatusFilter("expired")}
              />
            </Stack>

            {bookingsLoading ? (
              <Loading />
            ) : bookingsError ? (
              <Alert severity="error">
                Failed to load bookings: {String(bookingsError?.message || bookingsError)}
                <br />
                <strong>Tip:</strong> update your endpoint here →
                <code style={{ marginLeft: 8 }}>{BOOKINGS_ENDPOINT}</code>
              </Alert>
            ) : (
              <Box sx={{ mt: 1 }}>
                <FullCalendar
                  plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
                  initialView="dayGridMonth"
                  headerToolbar={{
                    left: "prev,next today",
                    center: "title",
                    right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
                  }}
                  timeZone="Asia/Kuala_Lumpur"
                  nowIndicator
                  selectable={false}
                  events={filteredBookingEvents}
                  eventClick={onEventClick}
                  height="auto"
                  dayMaxEvents={true}
                  slotMinTime="06:00:00"
                  slotMaxTime="23:00:00"
                />
              </Box>
            )}
          </Paper>
        </Grid>
        {/* KPI Cards */}
        <Grid container spacing={3} sx={{ mt: 2 }}>

          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <BusinessIcon sx={{ fontSize: 40, color: "primary.main", mr: 2 }} />
                  <Box>
                    <Typography variant="h4">{companies.length}</Typography>
                    <Typography color="text.secondary">Total Companies</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <ActiveIcon sx={{ fontSize: 40, color: "success.main", mr: 2 }} />
                  <Box>
                    <Typography variant="h4">{activeCompanies.length}</Typography>
                    <Typography color="text.secondary">Active Companies</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <SuspendedIcon sx={{ fontSize: 40, color: "error.main", mr: 2 }} />
                  <Box>
                    <Typography variant="h4">{suspendedCompanies.length}</Typography>
                    <Typography color="text.secondary">Suspended Companies</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <BranchIcon sx={{ fontSize: 40, color: "info.main", mr: 2 }} />
                  <Box>
                    <Typography variant="h4">{branchesLoading ? "…" : totalBranches}</Typography>
                    <Typography color="text.secondary">Total Branches</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <UsersIcon sx={{ fontSize: 40, color: "warning.main", mr: 2 }} />
                  <Box>
                    <Typography variant="h4">{totalUsers}</Typography>
                    <Typography color="text.secondary">Total Users</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Activity Section */}
        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Recently Created Companies
              </Typography>
              <List dense>
                {recentCompanies.length > 0 ? (
                  recentCompanies.map((company, idx) => (
                    <React.Fragment key={company.id}>
                      <ListItem>
                        <ListItemText
                          primary={company.name}
                          secondary={formatDateTime(company.created_at)}
                        />
                        <Chip
                          label={company.status}
                          size="small"
                          color={company.status === "active" ? "success" : "default"}
                        />
                      </ListItem>
                      {idx < recentCompanies.length - 1 && <Divider />}
                    </React.Fragment>
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                    No companies yet
                  </Typography>
                )}
              </List>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Recently Suspended Companies
              </Typography>
              <List dense>
                {recentSuspended.length > 0 ? (
                  recentSuspended.map((company, idx) => (
                    <div key={company.id}>
                      <ListItem>
                        <ListItemText
                          primary={company.name}
                          secondary={formatDateTime(company.updated_at || company.created_at)}
                        />
                        <Chip label="Suspended" size="small" color="error" />
                      </ListItem>
                      {idx < recentSuspended.length - 1 && <Divider />}
                    </div>
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                    No suspended companies
                  </Typography>
                )}
              </List>
            </Paper>
          </Grid>

          

          {/* Audit log section */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Box display="flex" alignItems="center" mb={2}>
                <HistoryIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Latest Audit Log Entries</Typography>
              </Box>

              {auditLoading ? (
                <Loading />
              ) : auditLogs.length > 0 ? (
                <List dense>
                  {auditLogs.map((log, idx) => (
                    <div key={log.id}>
                      <ListItem>
                        <ListItemText
                          primary={`${log.action} - ${log.entity_type}`}
                          secondary={`${log.actor_user_id} • ${formatDateTime(log.created_at)}`}
                        />
                      </ListItem>
                      {idx < auditLogs.length - 1 && <Divider />}
                    </div>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                  No audit logs available
                </Typography>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Container>

      {/* ✅ Booking Details Popup */}
      <Dialog open={!!selectedBooking} onClose={() => setSelectedBooking(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Booking Details</DialogTitle>
        <DialogContent dividers>
          {selectedBooking ? (
            <Stack spacing={1}>
              <Typography variant="body2">
                <b>ID:</b> {selectedBooking.id}
              </Typography>

              <Typography variant="body2">
                <b>Booking No:</b>{" "}
                {selectedBooking.booking_number || selectedBooking.booking_no || "-"}
              </Typography>

              <Typography variant="body2">
                <b>Status:</b> {selectedBooking.booking_status || selectedBooking.status || "-"}
              </Typography>

              <Typography variant="body2">
                <b>Company:</b> {selectedBooking.company_id || "-"}
              </Typography>

              <Typography variant="body2">
                <b>Branch:</b> {selectedBooking.branch_id || "-"}
              </Typography>

              <Typography variant="body2">
                <b>User:</b> {selectedBooking.user_id || "-"}
              </Typography>

              <Typography variant="body2">
                <b>Start:</b>{" "}
                {formatDateTime(
                  selectedBooking.start_at ||
                    selectedBooking.start_time ||
                    selectedBooking.booking_start ||
                    selectedBooking.start_datetime ||
                    selectedBooking.created_at
                )}
              </Typography>

              <Typography variant="body2">
                <b>End:</b>{" "}
                {formatDateTime(
                  selectedBooking.end_at ||
                    selectedBooking.end_time ||
                    selectedBooking.booking_end ||
                    selectedBooking.end_datetime ||
                    null
                )}
              </Typography>
            </Stack>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedBooking(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </AdminLayout>
  );
};
