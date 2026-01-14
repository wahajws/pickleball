// src/pages/admin/tabs/CompanyTrainerBookingsTab.jsx
import React, { useMemo, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
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
  MenuItem,
  IconButton,
  Tooltip,
} from "@mui/material";
import { Add, Edit, Delete, Refresh } from "@mui/icons-material";

import { useApiQuery } from "../../../hooks/useQuery";
import { API_BASE_URL, API_ENDPOINTS } from "../../../config/api";

const getToken = () =>
  localStorage.getItem("token") ||
  localStorage.getItem("access_token") ||
  localStorage.getItem("accessToken") ||
  localStorage.getItem("authToken") ||
  "";

const apiFetch = async (path, { method = "GET", body } = {}) => {
  const token = getToken();
  const res = await fetch(`${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = json?.error?.message || json?.message || `Request failed (${res.status})`;
    const err = new Error(msg);
    err.status = res.status;
    err.data = json;
    throw err;
  }
  return json;
};

const fmt = (d) => {
  if (!d) return "";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return String(d);
  return dt.toLocaleString();
};

const StatusChip = ({ status }) => {
  const s = status || "booked";
  const color =
    s === "booked"
      ? "success"
      : s === "completed"
      ? "info"
      : s === "cancelled"
      ? "default"
      : "default";

  return <Chip size="small" label={s} color={color} sx={{ textTransform: "capitalize" }} />;
};

const emptyForm = {
  id: "",
  branch_id: "",
  trainer_id: "",
  class_id: "",
  customer_id: "",
  start_datetime: "",
  end_datetime: "",
  hourly_rate: "",
  total_amount: "",
  currency: "MYR",
  status: "booked",
};

export const CompanyTrainerBookingsTab = ({ companyId }) => {
  const [filters, setFilters] = useState({ branchId: "", trainerId: "", status: "" });
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");

  // ✅ Branch list (dropdown)
  const { data: branchesData } = useApiQuery(
    ["admin", "branches", companyId],
    API_ENDPOINTS.BRANCHES.LIST(companyId),
    { enabled: !!companyId }
  );

  const branches = useMemo(() => {
    if (Array.isArray(branchesData?.data?.branches)) return branchesData.data.branches;
    if (Array.isArray(branchesData?.data)) return branchesData.data;
    return [];
  }, [branchesData]);

  // ✅ Trainers list (dropdown) - use COMPANY_MODULES.TRAINERS.LIST
  const trainersEndpoint = useMemo(() => {
    if (!companyId) return null;
    const qs = filters.branchId ? `branchId=${encodeURIComponent(filters.branchId)}` : "";
    return API_ENDPOINTS.COMPANY_MODULES.TRAINERS.LIST(companyId, qs);
  }, [companyId, filters.branchId]);

  const { data: trainersData } = useApiQuery(
    ["admin", "trainers", companyId, filters.branchId],
    trainersEndpoint,
    { enabled: !!trainersEndpoint }
  );

  const trainers = useMemo(() => {
    if (Array.isArray(trainersData?.data?.trainers)) return trainersData.data.trainers;
    if (Array.isArray(trainersData?.data)) return trainersData.data;
    return [];
  }, [trainersData]);
  
  const classesEndpoint = useMemo(() => {
    if (!companyId) return null;
    const qs = new URLSearchParams();
    // filter by selected branch in the FORM (not filters), because dialog uses form.branch_id
    if (form.branch_id) qs.set("branchId", form.branch_id);
    // If you have API_ENDPOINTS for classes use it; else fallback to route
    return API_ENDPOINTS?.COMPANY_MODULES?.CLASSES?.LIST
      ? API_ENDPOINTS.COMPANY_MODULES.CLASSES.LIST(companyId, qs.toString())
      : `/companies/${companyId}/classes?${qs.toString()}`;
  }, [companyId, form.branch_id]);

  const { data: classesData } = useApiQuery(
    ["admin", "classes", companyId, form.branch_id],
    classesEndpoint,
    { enabled: !!classesEndpoint }
  );

  const classes = useMemo(() => {
    const arr =
      classesData?.data?.classes ||
      classesData?.classes ||
      classesData?.data?.rows ||
      classesData?.data ||
      classesData;
    return Array.isArray(arr) ? arr : [];
  }, [classesData]);

  const bookingsEndpoint = useMemo(() => {
    if (!companyId) return null;
    const qs = new URLSearchParams();
    if (filters.branchId) qs.set("branchId", filters.branchId);
    if (filters.trainerId) qs.set("trainerId", filters.trainerId);
    if (filters.status) qs.set("status", filters.status);

    // IMPORTANT: your api.js defines COMPANY_MODULES.TRAINER_BOOKINGS (not ADMIN_CONSOLE)
    return API_ENDPOINTS.COMPANY_MODULES.TRAINER_BOOKINGS.LIST(companyId, qs.toString());
  }, [companyId, filters]);

  const {
    data: bookingsData,
    isLoading,
    error: loadErr,
    refetch,
  } = useApiQuery(["admin", "trainerBookings", companyId, filters], bookingsEndpoint, {
    enabled: !!bookingsEndpoint,
  });

  const bookings = useMemo(() => {
    const arr =
      bookingsData?.data?.trainer_bookings ||
      bookingsData?.data?.bookings ||
      bookingsData?.data ||
      bookingsData;
    return Array.isArray(arr) ? arr : [];
  }, [bookingsData]);

  const openCreate = () => {
    setError("");
    setForm({
      ...emptyForm,
      branch_id: filters.branchId || "",
      trainer_id: filters.trainerId || "",
    });
    setOpen(true);
  };

  const openEdit = (row) => {
    setError("");
    setForm({
      id: row.id,
      branch_id: row.branch_id || "",
      trainer_id: row.trainer_id || "",
      customer_id: row.customer_id || "",
      class_id: row.class_id || "",
      start_datetime: row.start_datetime ? new Date(row.start_datetime).toISOString().slice(0, 16) : "",
      end_datetime: row.end_datetime ? new Date(row.end_datetime).toISOString().slice(0, 16) : "",
      hourly_rate: row.hourly_rate ?? "",
      total_amount: row.total_amount ?? "",
      currency: row.currency || "MYR",
      status: row.status || "booked",
    });
    setOpen(true);
  };

  const close = () => {
    if (saving) return;
    setOpen(false);
  };

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const payload = {
        branch_id: form.branch_id,
        trainer_id: form.trainer_id,
        class_id: form.class_id,
        start_datetime: form.start_datetime ? new Date(form.start_datetime).toISOString() : null,
        end_datetime: form.end_datetime ? new Date(form.end_datetime).toISOString() : null,
        hourly_rate: form.hourly_rate === "" ? null : Number(form.hourly_rate),
        total_amount: form.total_amount === "" ? undefined : Number(form.total_amount),
        currency: form.currency || "MYR",
        status: form.status || "booked",
      };

      if (form.customer_id && String(form.customer_id).trim()) {
        payload.customer_id = String(form.customer_id).trim();
      }
      if (!payload.branch_id || !payload.trainer_id) {
        throw new Error("branch_id and trainer_id are required");
      }

      // ✅ use COMPANY_MODULES.TRAINER_BOOKINGS endpoints (FIXED)
      if (form.id) {
        await apiFetch(API_ENDPOINTS.COMPANY_MODULES.TRAINER_BOOKINGS.UPDATE(companyId, form.id), {
          method: "PATCH",
          body: payload,
        });
      } else {
        await apiFetch(API_ENDPOINTS.COMPANY_MODULES.TRAINER_BOOKINGS.CREATE(companyId), {
          method: "POST",
          body: payload,
        });
      }

      setOpen(false);
      await refetch?.();
    } catch (e) {
      setError(e?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row) => {
    if (!window.confirm("Delete this trainer booking?")) return;
    try {
      await apiFetch(API_ENDPOINTS.COMPANY_MODULES.TRAINER_BOOKINGS.DELETE(companyId, row.id), {
        method: "DELETE",
      });
      await refetch?.();
    } catch (e) {
      alert(e?.message || "Failed to delete");
    }
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, alignItems: "center" }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 900 }}>
            Trainer Bookings
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Create / view trainer bookings
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title="Refresh">
            <IconButton onClick={() => refetch?.()}>
              <Refresh />
            </IconButton>
          </Tooltip>
          <Button startIcon={<Add />} variant="contained" onClick={openCreate}>
            New Booking
          </Button>
        </Box>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Filters */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={4}>
          <TextField
            select
            fullWidth
            label="Branch"
            value={filters.branchId}
            onChange={(e) => setFilters((s) => ({ ...s, branchId: e.target.value, trainerId: "" }))}
          >
            <MenuItem value="">All</MenuItem>
            {branches.map((b) => (
              <MenuItem key={b.id} value={b.id}>
                {b.name}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            select
            fullWidth
            label="Trainer"
            value={filters.trainerId}
            onChange={(e) => setFilters((s) => ({ ...s, trainerId: e.target.value }))}
          >
            <MenuItem value="">All</MenuItem>
            {trainers.map((t) => (
              <MenuItem key={t.id} value={t.id}>
                {t.name || t.full_name || t.email || t.id}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            select
            fullWidth
            label="Status"
            value={filters.status}
            onChange={(e) => setFilters((s) => ({ ...s, status: e.target.value }))}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="booked">booked</MenuItem>
            <MenuItem value="completed">completed</MenuItem>
            <MenuItem value="cancelled">cancelled</MenuItem>
          </TextField>
        </Grid>
      </Grid>

      {/* Errors */}
      {loadErr ? (
        <Typography color="error" sx={{ mb: 1 }}>
          {loadErr?.message || "Failed to load trainer bookings"}
        </Typography>
      ) : null}

      {/* Table */}
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Start</TableCell>
            <TableCell>End</TableCell>
            <TableCell>Trainer</TableCell>
            <TableCell>Class</TableCell>
            <TableCell align="right">Hourly</TableCell>
            <TableCell align="right">Total</TableCell>
            <TableCell>Currency</TableCell>
            <TableCell>Status</TableCell>
            <TableCell width={140} align="right">
              Actions
            </TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={8}>Loading...</TableCell>
            </TableRow>
          ) : bookings.length ? (
            bookings.map((row) => (
              <TableRow key={row.id} hover>
                <TableCell>{fmt(row.start_datetime)}</TableCell>
                <TableCell>{fmt(row.end_datetime)}</TableCell>
                <TableCell>{row.trainer?.name || row.trainer?.full_name || row.trainer_id}</TableCell>
                <TableCell>{row.class?.name || row.class?.fname || row.class_id}</TableCell>
                <TableCell align="right">{row.hourly_rate}</TableCell>
                <TableCell align="right">{row.total_amount}</TableCell>
                <TableCell>{row.currency}</TableCell>
                <TableCell>
                  <StatusChip status={row.status} />
                </TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => openEdit(row)}>
                    <Edit fontSize="small" />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => remove(row)}>
                    <Delete fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={8} sx={{ color: "text.secondary" }}>
                No trainer bookings yet. Click “New Booking”.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Dialog */}
      <Dialog open={open} onClose={close} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 900 }}>
          {form.id ? "Edit Trainer Booking" : "New Trainer Booking"}
        </DialogTitle>

        <DialogContent dividers>
          {error ? (
            <Typography color="error" sx={{ mb: 1 }}>
              {error}
            </Typography>
          ) : null}

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                select
                fullWidth
                label="Branch"
                value={form.branch_id}
                onChange={(e) => setForm((s) => ({ ...s, branch_id: e.target.value }))}
              >
                {branches.map((b) => (
                  <MenuItem key={b.id} value={b.id}>
                    {b.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
             <Grid item xs={12} md={6}>
              <TextField
                select
                fullWidth
                label="Class"
                value={form.class_id || ""}
                onChange={(e) => setForm((s) => ({ ...s, class_id: e.target.value }))}
                helperText="Leave empty for Private session"
              >
                <MenuItem value="">Private session</MenuItem>

                {classes.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name || c.id}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                select
                fullWidth
                label="Trainer"
                value={form.trainer_id}
                onChange={(e) => setForm((s) => ({ ...s, trainer_id: e.target.value }))}
              >
                {trainers.map((t) => (
                  <MenuItem key={t.id} value={t.id}>
                    {t.name || t.full_name || t.email || t.id}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Start"
                type="datetime-local"
                InputLabelProps={{ shrink: true }}
                value={form.start_datetime}
                onChange={(e) => setForm((s) => ({ ...s, start_datetime: e.target.value }))}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="End"
                type="datetime-local"
                InputLabelProps={{ shrink: true }}
                value={form.end_datetime}
                onChange={(e) => setForm((s) => ({ ...s, end_datetime: e.target.value }))}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Hourly Rate"
                type="number"
                value={form.hourly_rate}
                onChange={(e) => setForm((s) => ({ ...s, hourly_rate: e.target.value }))}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Total Amount (optional)"
                type="number"
                value={form.total_amount}
                onChange={(e) => setForm((s) => ({ ...s, total_amount: e.target.value }))}
                helperText="Leave empty → backend auto-calculates"
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Currency"
                value={form.currency}
                onChange={(e) => setForm((s) => ({ ...s, currency: e.target.value.toUpperCase() }))}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                select
                fullWidth
                label="Status"
                value={form.status}
                onChange={(e) => setForm((s) => ({ ...s, status: e.target.value }))}
              >
                <MenuItem value="booked">booked</MenuItem>
                <MenuItem value="completed">completed</MenuItem>
                <MenuItem value="cancelled">cancelled</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Customer ID (optional)"
                value={form.customer_id}
                onChange={(e) => setForm((s) => ({ ...s, customer_id: e.target.value }))}
              />
            </Grid>
          </Grid>
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
