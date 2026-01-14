import React, { useEffect, useMemo, useState } from "react";
import {
  Paper,
  Typography,
  Box,
  Stack,
  Button,
  Divider,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  IconButton,
  Alert,
  CircularProgress,
  Tooltip,
} from "@mui/material";
import { Add, Refresh, Cancel, Visibility } from "@mui/icons-material";

import { useApiQuery } from "../../../hooks/useQuery";
import { API_ENDPOINTS } from "../../../config/api";
import { adminFetch } from "./_adminApi";

// -------- helpers --------
const fmt = (d) => {
  if (!d) return "—";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return String(d);
  return dt.toLocaleString();
};

const StatusChip = ({ status }) => {
  const s = String(status || "pending").toLowerCase();
  const color =
    s === "confirmed"
      ? "success"
      : s === "completed"
      ? "info"
      : s === "cancelled"
      ? "default"
      : s === "pending"
      ? "warning"
      : "default";

  return (
    <Chip size="small" label={s} color={color} sx={{ textTransform: "capitalize" }} />
  );
};

// IMPORTANT: Booking model uses booking_status (not status)
const emptyForm = {
  branch_id: "",
  court_id: "",
  service_id: "",
  customer_id: "",
  start_datetime: "",
  end_datetime: "",
  booking_status: "confirmed",
  notes: "",
};

const BOOKING_STATUSES = [
  "pending",
  "confirmed",
  "cancelled",
  "completed",
  "no_show",
  "expired",
];

export const CompanyBookingsTab = ({ companyId }) => {
  const [filters, setFilters] = useState({
    branchId: "",
    booking_status: "",
    from: "",
    to: "",
  });

  const [reloadKey, setReloadKey] = useState(0);
  const [errMsg, setErrMsg] = useState("");

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  // ---------- Branches ----------
  const branchesEndpoint = useMemo(() => {
    if (!companyId) return "";
    return API_ENDPOINTS.BRANCHES.LIST(companyId);
  }, [companyId]);

  const {
    data: branchesRes,
    isLoading: branchesLoading,
    error: branchesError,
  } = useApiQuery(["company", "branches", companyId, reloadKey], branchesEndpoint, {
    enabled: !!companyId && !!branchesEndpoint,
  });

  const branches = useMemo(() => {
    const arr =
      branchesRes?.data?.branches ||
      branchesRes?.branches ||
      branchesRes?.data?.rows ||
      branchesRes?.data ||
      branchesRes;
    return Array.isArray(arr) ? arr : [];
  }, [branchesRes]);

  // auto-select first branch
  useEffect(() => {
    if (!filters.branchId && branches.length) {
      setFilters((s) => ({ ...s, branchId: branches[0].id }));
    }
  }, [branches, filters.branchId]);

  // ---------- Courts ----------
  const courtsEndpoint = useMemo(() => {
    if (!companyId || !form.branch_id) return "";
    return API_ENDPOINTS.COURTS.LIST(companyId, form.branch_id);
  }, [companyId, form.branch_id]);

  const {
    data: courtsRes,
    isLoading: courtsLoading,
    error: courtsError,
  } = useApiQuery(["company", "courts", companyId, form.branch_id, reloadKey], courtsEndpoint, {
    enabled: !!companyId && !!form.branch_id && !!courtsEndpoint,
  });

  const courts = useMemo(() => {
    const arr = courtsRes?.data?.courts || courtsRes?.courts || courtsRes?.data || courtsRes;
    return Array.isArray(arr) ? arr : [];
  }, [courtsRes]);

  // ---------- Services ----------
  const servicesEndpoint = useMemo(() => {
    if (!companyId || !form.branch_id) return "";
    const qs = new URLSearchParams();
    qs.set("branchId", form.branch_id);

    return API_ENDPOINTS?.SERVICES?.LIST
      ? API_ENDPOINTS.SERVICES.LIST(companyId, qs.toString())
      : `/companies/${companyId}/services?${qs.toString()}`;
  }, [companyId, form.branch_id]);

  const {
    data: servicesRes,
    isLoading: servicesLoading,
    error: servicesError,
  } = useApiQuery(["company", "services", companyId, form.branch_id, reloadKey], servicesEndpoint, {
    enabled: !!companyId && !!form.branch_id && !!servicesEndpoint,
  });

  const services = useMemo(() => {
    const arr =
      servicesRes?.data?.services ||
      servicesRes?.services ||
      servicesRes?.data?.rows ||
      servicesRes?.data ||
      servicesRes;
    return Array.isArray(arr) ? arr : [];
  }, [servicesRes]);

  // ---------- Bookings ----------
  const bookingsEndpoint = useMemo(() => {
    if (!companyId) return "";
    const qs = new URLSearchParams();

    if (filters.branchId) qs.set("branchId", filters.branchId);

    // ✅ send only booking_status values
    if (filters.booking_status) {
      qs.set("status", filters.booking_status); // your backend getAll reads `status`
    }

    if (filters.from) qs.set("from", filters.from);
    if (filters.to) qs.set("to", filters.to);

    return API_ENDPOINTS.BOOKINGS.LIST(companyId, qs.toString());
  }, [companyId, filters]);

  const {
    data: bookingsRes,
    isLoading: bookingsLoading,
    error: bookingsError,
    refetch: refetchBookings,
  } = useApiQuery(["company", "bookings", companyId, filters, reloadKey], bookingsEndpoint, {
    enabled: !!companyId && !!bookingsEndpoint,
  });

  const bookings = useMemo(() => {
    const arr =
      bookingsRes?.data?.bookings ||
      bookingsRes?.data?.rows ||
      bookingsRes?.bookings ||
      bookingsRes?.data ||
      bookingsRes;
    return Array.isArray(arr) ? arr : [];
  }, [bookingsRes]);

  // ---------- UI actions ----------
  const openCreate = () => {
    setErrMsg("");
    const branch_id = filters.branchId || "";
    setForm({
      ...emptyForm,
      branch_id,
      court_id: "",
      service_id: "",
      start_datetime: "",
      end_datetime: "",
      booking_status: "confirmed",
    });
    setOpen(true);
  };

  const close = () => {
    if (saving) return;
    setOpen(false);
  };

  const save = async () => {
    setErrMsg("");

    if (!companyId) return setErrMsg("companyId missing");
    if (!form.branch_id) return setErrMsg("Branch is required");
    if (!form.court_id) return setErrMsg("Court is required");
    if (!form.service_id) return setErrMsg("Service is required");
    if (!form.start_datetime) return setErrMsg("Start time is required");
    if (!form.end_datetime) return setErrMsg("End time is required");

    const startISO = new Date(form.start_datetime).toISOString();
    const endISO = new Date(form.end_datetime).toISOString();
    if (new Date(endISO) <= new Date(startISO)) return setErrMsg("End must be after Start");

    // ✅ normalize booking_status to allowed values
    const bs = String(form.booking_status || "confirmed").toLowerCase();
    const booking_status = BOOKING_STATUSES.includes(bs) ? bs : "confirmed";

    setSaving(true);
    try {
      const payload = {
        branch_id: form.branch_id,
        customer_id: (form.customer_id || "").trim() || null,

        // ✅ ONLY booking_status here
        booking_status,

        notes: (form.notes || "").trim() || null,

        items: [
          {
            court_id: form.court_id,
            service_id: form.service_id,
            start_datetime: startISO,
            end_datetime: endISO,
          },
        ],
      };

      await adminFetch(API_ENDPOINTS.BOOKINGS.CREATE(companyId), {
        method: "POST",
        body: payload,
      });

      setOpen(false);
      setReloadKey((k) => k + 1);
      await refetchBookings?.();
    } catch (e) {
      setErrMsg(e?.message || "Failed to create booking");
    } finally {
      setSaving(false);
    }
  };

  const cancelBooking = async (row) => {
    setErrMsg("");
    const ok = window.confirm("Cancel this booking?");
    if (!ok) return;

    try {
      await adminFetch(API_ENDPOINTS.BOOKINGS.CANCEL(companyId, row.id), { method: "POST" });
      setReloadKey((k) => k + 1);
      await refetchBookings?.();
    } catch (e) {
      setErrMsg(e?.message || "Failed to cancel booking");
    }
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 900 }}>
            Bookings
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Company bookings
          </Typography>
        </Box>

        <Stack direction="row" spacing={1}>
          <Button
            startIcon={<Refresh />}
            variant="outlined"
            onClick={() => {
              setReloadKey((k) => k + 1);
              refetchBookings?.();
            }}
          >
            Refresh
          </Button>
          <Button startIcon={<Add />} variant="contained" onClick={openCreate}>
            New Booking
          </Button>
        </Stack>
      </Box>

      <Divider sx={{ my: 2 }} />

      {errMsg ? <Alert severity="error" sx={{ mb: 2 }}>{errMsg}</Alert> : null}
      {branchesError ? <Alert severity="error" sx={{ mb: 2 }}>Failed to load branches</Alert> : null}
      {bookingsError ? <Alert severity="error" sx={{ mb: 2 }}>Failed to load bookings</Alert> : null}

      {/* Filters */}
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 2 }}>
        <TextField
          select
          size="small"
          label="Branch"
          value={filters.branchId}
          disabled={branchesLoading}
          onChange={(e) => setFilters((s) => ({ ...s, branchId: e.target.value }))}
          sx={{ minWidth: 260 }}
        >
          {branches.map((b) => (
            <MenuItem key={b.id} value={b.id}>
              {b.name || b.id}
            </MenuItem>
          ))}
        </TextField>

        {/* ✅ booking_status filter */}
        <TextField
          select
          size="small"
          label="Status"
          value={filters.booking_status}
          onChange={(e) => setFilters((s) => ({ ...s, booking_status: e.target.value }))}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="">All</MenuItem>
          {BOOKING_STATUSES.map((s) => (
            <MenuItem key={s} value={s}>{s}</MenuItem>
          ))}
        </TextField>

        <TextField
          size="small"
          label="From (optional)"
          type="date"
          InputLabelProps={{ shrink: true }}
          value={filters.from}
          onChange={(e) => setFilters((s) => ({ ...s, from: e.target.value }))}
        />
        <TextField
          size="small"
          label="To (optional)"
          type="date"
          InputLabelProps={{ shrink: true }}
          value={filters.to}
          onChange={(e) => setFilters((s) => ({ ...s, to: e.target.value }))}
        />
      </Stack>

      {/* Table */}
      <Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, overflow: "hidden" }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 800 }}>Start</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>End</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Court</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Service</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
              <TableCell align="right" sx={{ fontWeight: 800 }}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {bookingsLoading ? (
              <TableRow>
                <TableCell colSpan={6}>
                  <Box sx={{ display: "flex", gap: 1, alignItems: "center", py: 2 }}>
                    <CircularProgress size={18} />
                    <Typography variant="body2" color="text.secondary">
                      Loading...
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : bookings.length ? (
              bookings.map((r) => {
                const item0 = r?.items?.[0];

                const start =
                  item0?.start_datetime ||
                  item0?.start_time ||
                  r?.start_datetime ||
                  r?.start;

                const end =
                  item0?.end_datetime ||
                  item0?.end_time ||
                  r?.end_datetime ||
                  r?.end;

                const courtLabel =
                  item0?.court?.name ||
                  r?.court?.name ||
                  item0?.court_id ||
                  r?.court_id ||
                  "—";

                const serviceLabel =
                  item0?.service?.name ||
                  r?.service?.name ||
                  item0?.service_id ||
                  r?.service_id ||
                  "—";

                const status = r?.booking_status || "pending";

                return (
                  <TableRow key={r.id} hover>
                    <TableCell>{fmt(start)}</TableCell>
                    <TableCell>{fmt(end)}</TableCell>
                    <TableCell>{courtLabel}</TableCell>
                    <TableCell>{serviceLabel}</TableCell>
                    <TableCell>
                      <StatusChip status={status} />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="View (optional)">
                        <IconButton size="small" disabled>
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Cancel">
                        <span>
                          <IconButton
                            size="small"
                            color="warning"
                            onClick={() => cancelBooking(r)}
                            disabled={String(status).toLowerCase() === "cancelled"}
                          >
                            <Cancel fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={6}>
                  <Typography sx={{ py: 2 }} color="text.secondary">
                    No bookings
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Box>

      {/* Create dialog */}
      <Dialog open={open} onClose={close} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 900 }}>New Booking</DialogTitle>

        <DialogContent dividers>
          {courtsError ? <Alert severity="error" sx={{ mb: 2 }}>Failed to load courts</Alert> : null}
          {servicesError ? <Alert severity="error" sx={{ mb: 2 }}>Failed to load services</Alert> : null}

          <Stack spacing={2}>
            <TextField
              select
              label="Branch"
              value={form.branch_id}
              onChange={(e) =>
                setForm((s) => ({
                  ...s,
                  branch_id: e.target.value,
                  court_id: "",
                  service_id: "",
                }))
              }
              required
            >
              {branches.map((b) => (
                <MenuItem key={b.id} value={b.id}>
                  {b.name || b.id}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Court"
              value={form.court_id}
              onChange={(e) => setForm((s) => ({ ...s, court_id: e.target.value }))}
              required
              disabled={!form.branch_id || courtsLoading}
              helperText={!form.branch_id ? "Select branch first" : ""}
            >
              {courts.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name || c.id}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Service"
              value={form.service_id}
              onChange={(e) => setForm((s) => ({ ...s, service_id: e.target.value }))}
              required
              disabled={!form.branch_id || servicesLoading}
              helperText={!services.length ? "Create at least 1 service first" : ""}
            >
              {services.map((sv) => (
                <MenuItem key={sv.id} value={sv.id}>
                  {sv.name || sv.id}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Start"
              type="datetime-local"
              InputLabelProps={{ shrink: true }}
              value={form.start_datetime}
              onChange={(e) => setForm((s) => ({ ...s, start_datetime: e.target.value }))}
              required
            />
            <TextField
              label="End"
              type="datetime-local"
              InputLabelProps={{ shrink: true }}
              value={form.end_datetime}
              onChange={(e) => setForm((s) => ({ ...s, end_datetime: e.target.value }))}
              required
            />

            {/* ✅ Correct booking statuses */}
            <TextField
              select
              label="Booking Status"
              value={form.booking_status}
              onChange={(e) => setForm((s) => ({ ...s, booking_status: e.target.value }))}
            >
              {BOOKING_STATUSES.map((s) => (
                <MenuItem key={s} value={s}>{s}</MenuItem>
              ))}
            </TextField>

            <TextField
              label="Customer ID (optional)"
              value={form.customer_id}
              onChange={(e) => setForm((s) => ({ ...s, customer_id: e.target.value }))}
            />

            <TextField
              label="Notes (optional)"
              value={form.notes}
              onChange={(e) => setForm((s) => ({ ...s, notes: e.target.value }))}
              multiline
              minRows={2}
            />
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={close} disabled={saving}>
            Cancel
          </Button>
          <Button variant="contained" onClick={save} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};
