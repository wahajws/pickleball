// src/pages/admin/tabs/CompanyCourtsTab.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Paper,
  Typography,
  Box,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Divider,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Checkbox,
  FormControlLabel,
  Alert,
  CircularProgress,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";

import { useApiQuery } from "../../../hooks/useQuery";
import { API_BASE_URL, API_ENDPOINTS } from "../../../config/api";

// ---------- helpers ----------
const getAuthToken = () => {
  const direct =
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("access_token");
  if (direct) return direct;

  try {
    const auth = JSON.parse(localStorage.getItem("auth") || "null");
    if (auth?.token) return auth.token;
    if (auth?.accessToken) return auth.accessToken;
  } catch {}

  try {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    if (user?.token) return user.token;
    if (user?.accessToken) return user.accessToken;
  } catch {}

  return null;
};

const apiFetch = async (path, { method = "GET", body } = {}) => {
  const token = getAuthToken();
  const url = `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;

  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = json?.message || json?.error?.message || `Request failed (${res.status})`;
    const err = new Error(msg);
    err.status = res.status;
    err.data = json;
    throw err;
  }
  return json;
};

const emptyCourtForm = {
  name: "",
  court_number: "",
  court_type: "pickleball",
  surface_type: "",
  description: "",
  capacity: 4,
  has_lights: false,
  hourly_rate: "",
  status: "active",
};

export const CompanyCourtsTab = ({ companyId }) => {
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [reloadBranchesKey, setReloadBranchesKey] = useState(0);
  const [reloadCourtsKey, setReloadCourtsKey] = useState(0);

  // dialogs
  const [openForm, setOpenForm] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [activeCourtId, setActiveCourtId] = useState(null);
  const [form, setForm] = useState(emptyCourtForm);
  const [saving, setSaving] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  // ✅ IMPORTANT: NO /admin endpoints
  const branchesEndpoint = useMemo(() => {
    if (!companyId) return "";
    return API_ENDPOINTS.BRANCHES.LIST(companyId); // /companies/:companyId/branches
  }, [companyId]);

  const courtsEndpoint = useMemo(() => {
    if (!companyId || !selectedBranchId) return "";
    return API_ENDPOINTS.COURTS.LIST(companyId, selectedBranchId); // /companies/:companyId/branches/:branchId/courts
  }, [companyId, selectedBranchId]);

  // GET branches
  const {
    data: branchesRes,
    isLoading: branchesLoading,
    error: branchesError,
  } = useApiQuery(
    ["company", "branches", companyId, reloadBranchesKey],
    branchesEndpoint,
    { enabled: !!companyId && !!branchesEndpoint }
  );

  const branches = useMemo(() => {
    const arr = branchesRes?.data?.branches || branchesRes?.branches || branchesRes?.data || branchesRes;
    return Array.isArray(arr) ? arr : [];
  }, [branchesRes]);

  // auto-select first branch
  useEffect(() => {
    if (!selectedBranchId && branches.length) setSelectedBranchId(branches[0].id);
  }, [branches, selectedBranchId]);

  // GET courts
  const {
    data: courtsRes,
    isLoading: courtsLoading,
    error: courtsError,
  } = useApiQuery(
    ["company", "courts", companyId, selectedBranchId, reloadCourtsKey],
    courtsEndpoint,
    { enabled: !!companyId && !!selectedBranchId && !!courtsEndpoint }
  );

  const courts = useMemo(() => {
    const arr = courtsRes?.data?.courts || courtsRes?.courts || courtsRes?.data || courtsRes;
    return Array.isArray(arr) ? arr : [];
  }, [courtsRes]);

  const branchName = useMemo(() => {
    return branches.find((b) => b.id === selectedBranchId)?.name || "";
  }, [branches, selectedBranchId]);

  const openCreate = () => {
    setErrMsg("");
    setIsEdit(false);
    setActiveCourtId(null);
    setForm(emptyCourtForm);
    setOpenForm(true);
  };

  const openEdit = (court) => {
    setErrMsg("");
    setIsEdit(true);
    setActiveCourtId(court?.id);
    setForm({
      name: court?.name || "",
      court_number: court?.court_number || "",
      court_type: court?.court_type || "pickleball",
      surface_type: court?.surface_type || "",
      description: court?.description || "",
      capacity: court?.capacity ?? 4,
      has_lights: !!court?.has_lights,
      hourly_rate: court?.hourly_rate ?? "",
      status: court?.status || "active",
    });
    setOpenForm(true);
  };

  const closeForm = () => {
    if (saving) return;
    setOpenForm(false);
  };

  const handleSave = async () => {
    setErrMsg("");

    if (!companyId || !selectedBranchId) return setErrMsg("Select a branch first.");
    if (!form.name?.trim()) return setErrMsg("Court name is required.");
    if (form.hourly_rate === "" || form.hourly_rate === null) return setErrMsg("Hourly rate is required.");

    setSaving(true);
    try {
      const payload = {
        branch_id: selectedBranchId,
        name: form.name.trim(),
        court_number: form.court_number || null,
        court_type: form.court_type || "pickleball",
        surface_type: form.surface_type || null,
        description: form.description || null,
        capacity: Number(form.capacity || 4),
        has_lights: !!form.has_lights,
        hourly_rate: Number(form.hourly_rate),
        status: form.status || "active",
      };

      if (isEdit && activeCourtId) {
        await apiFetch(API_ENDPOINTS.COURTS.UPDATE(companyId, selectedBranchId, activeCourtId), {
          method: "PATCH",
          body: payload,
        });
      } else {
        await apiFetch(API_ENDPOINTS.COURTS.CREATE(companyId, selectedBranchId), {
          method: "POST",
          body: payload,
        });
      }

      setOpenForm(false);
      setReloadCourtsKey((k) => k + 1);
    } catch (e) {
      setErrMsg(e?.message || "Failed to save court");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (court) => {
    setErrMsg("");
    if (!court?.id) return;

    const ok = window.confirm(`Delete court "${court.name}"?`);
    if (!ok) return;

    try {
      await apiFetch(API_ENDPOINTS.COURTS.DELETE(companyId, selectedBranchId, court.id), { method: "DELETE" });
      setReloadCourtsKey((k) => k + 1);
    } catch (e) {
      setErrMsg(e?.message || "Failed to delete court");
    }
  };

  const quickCreate4Courts = async () => {
    setErrMsg("");
    if (!selectedBranchId) return setErrMsg("Select a branch first.");

    try {
      const existingNames = new Set(courts.map((c) => (c?.name || "").toLowerCase()));
      const toCreate = ["Court 1", "Court 2", "Court 3", "Court 4"].filter(
        (n) => !existingNames.has(n.toLowerCase())
      );

      if (!toCreate.length) return setErrMsg("Courts 1–4 already exist for this branch.");

      for (const name of toCreate) {
        await apiFetch(API_ENDPOINTS.COURTS.CREATE(companyId, selectedBranchId), {
          method: "POST",
          body: {
            branch_id: selectedBranchId,
            name,
            court_type: "pickleball",
            capacity: 4,
            has_lights: false,
            hourly_rate: 60,
            status: "active",
          },
        });
      }

      setReloadCourtsKey((k) => k + 1);
    } catch (e) {
      setErrMsg(e?.message || "Failed to create courts");
    }
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 900 }}>
            Courts
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage courts under a branch
          </Typography>
        </Box>

        <Stack direction="row" spacing={1} alignItems="center">
          <Button
            startIcon={<RefreshIcon />}
            variant="outlined"
            onClick={() => {
              setReloadBranchesKey((k) => k + 1);
              setReloadCourtsKey((k) => k + 1);
            }}
          >
            Refresh
          </Button>

          <Button startIcon={<AddIcon />} variant="contained" onClick={openCreate} disabled={!selectedBranchId}>
            Add Court
          </Button>
        </Stack>
      </Box>

      <Divider sx={{ my: 2 }} />

      {errMsg ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errMsg}
        </Alert>
      ) : null}

      {branchesError ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load branches.
        </Alert>
      ) : null}

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center" sx={{ mb: 2 }}>
        <FormControl sx={{ minWidth: 260 }} size="small" disabled={branchesLoading}>
          <InputLabel>Branch</InputLabel>
          <Select label="Branch" value={selectedBranchId} onChange={(e) => setSelectedBranchId(e.target.value)}>
            {branches.map((b) => (
              <MenuItem key={b.id} value={b.id}>
                {b.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Chip
          label={selectedBranchId ? `Selected: ${branchName || selectedBranchId}` : "Select a branch"}
          color={selectedBranchId ? "info" : "default"}
          sx={{ fontWeight: 700 }}
        />

        <Box sx={{ flexGrow: 1 }} />

        <Button variant="outlined" onClick={quickCreate4Courts} disabled={!selectedBranchId || courtsLoading}>
          Quick add Court 1–4
        </Button>
      </Stack>

      {/* Courts table */}
      <Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, overflow: "hidden" }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 800 }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Number</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Surface</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Capacity</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Rate</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
              <TableCell align="right" sx={{ fontWeight: 800 }}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {courtsLoading ? (
              <TableRow>
                <TableCell colSpan={7}>
                  <Box sx={{ display: "flex", gap: 1, alignItems: "center", py: 2 }}>
                    <CircularProgress size={18} />
                    <Typography variant="body2" color="text.secondary">
                      Loading courts...
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : courtsError ? (
              <TableRow>
                <TableCell colSpan={7}>
                  <Alert severity="error">Failed to load courts for this branch.</Alert>
                </TableCell>
              </TableRow>
            ) : !courts.length ? (
              <TableRow>
                <TableCell colSpan={7}>
                  <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                    No courts found for this branch.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              courts.map((c) => (
                <TableRow key={c.id} hover>
                  <TableCell>{c.name}</TableCell>
                  <TableCell>{c.court_number || "—"}</TableCell>
                  <TableCell>{c.surface_type || "—"}</TableCell>
                  <TableCell>{c.capacity ?? "—"}</TableCell>
                  <TableCell>{c.hourly_rate != null ? `${c.hourly_rate}` : "—"}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={c.status || "unknown"}
                      color={c.status === "active" ? "success" : "default"}
                      sx={{ textTransform: "capitalize" }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => openEdit(c)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDelete(c)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Box>

      {/* Create/Edit Dialog */}
      <Dialog open={openForm} onClose={closeForm} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 900 }}>{isEdit ? "Edit Court" : "Add Court"}</DialogTitle>

        <DialogContent dividers>
          {errMsg ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errMsg}
            </Alert>
          ) : null}

          <Stack spacing={2}>
            <TextField
              label="Court Name"
              value={form.name}
              onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
              required
              fullWidth
            />

            <TextField
              label="Court Number (optional)"
              value={form.court_number}
              onChange={(e) => setForm((s) => ({ ...s, court_number: e.target.value }))}
              fullWidth
            />

            <FormControl size="small" fullWidth>
              <InputLabel>Surface Type</InputLabel>
              <Select
                label="Surface Type"
                value={form.surface_type}
                onChange={(e) => setForm((s) => ({ ...s, surface_type: e.target.value }))}
              >
                <MenuItem value="">None</MenuItem>
                <MenuItem value="indoor">Indoor</MenuItem>
                <MenuItem value="outdoor">Outdoor</MenuItem>
                <MenuItem value="hard">Hard</MenuItem>
                <MenuItem value="clay">Clay</MenuItem>
                <MenuItem value="grass">Grass</MenuItem>
                <MenuItem value="synthetic">Synthetic</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Capacity"
              type="number"
              value={form.capacity}
              onChange={(e) => setForm((s) => ({ ...s, capacity: e.target.value }))}
              fullWidth
              inputProps={{ min: 1 }}
            />

            <TextField
              label="Hourly Rate"
              type="number"
              value={form.hourly_rate}
              onChange={(e) => setForm((s) => ({ ...s, hourly_rate: e.target.value }))}
              required
              fullWidth
              inputProps={{ min: 0, step: "0.01" }}
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={!!form.has_lights}
                  onChange={(e) => setForm((s) => ({ ...s, has_lights: e.target.checked }))}
                />
              }
              label="Has lights"
            />

            <FormControl size="small" fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                label="Status"
                value={form.status}
                onChange={(e) => setForm((s) => ({ ...s, status: e.target.value }))}
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="maintenance">Maintenance</MenuItem>
                <MenuItem value="closed">Closed</MenuItem>
                <MenuItem value="deleted">Deleted</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Description (optional)"
              value={form.description}
              onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
              fullWidth
              multiline
              minRows={2}
            />
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={closeForm} disabled={saving}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};
