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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  IconButton,
  MenuItem,
} from "@mui/material";
import { Add, Edit, Delete, Refresh } from "@mui/icons-material";

import { adminFetch } from "./_adminApi";
import { API_ENDPOINTS } from "../../../config/api";

const empty = {
  branch_id: "",
  trainer_id: "",
  name: "",
  description: "",
  capacity: 10,
  duration_mins: 60,
  price: "",
  status: "active",
};

export const CompanyClassesTab = ({ companyId }) => {
  const [reloadKey, setReloadKey] = useState(0);
  const [errMsg, setErrMsg] = useState("");

  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);

  const [branches, setBranches] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [loadingMeta, setLoadingMeta] = useState(false);

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const [form, setForm] = useState(empty);

  // ✅ Company module endpoints (NO /admin)
  const classesEndpoint = useMemo(() => {
    if (!companyId) return "";
    const ep = API_ENDPOINTS?.COMPANY_MODULES?.CLASSES;
    if (ep?.LIST) return ep.LIST(companyId); // /companies/:companyId/classes
    return `/companies/${companyId}/classes`;
  }, [companyId]);

  const branchesEndpoint = useMemo(() => {
    if (!companyId) return "";
    const ep = API_ENDPOINTS?.BRANCHES;
    if (ep?.LIST) return ep.LIST(companyId); // /companies/:companyId/branches
    return `/companies/${companyId}/branches`;
  }, [companyId]);

  const trainersEndpoint = useMemo(() => {
    if (!companyId) return "";
    const ep = API_ENDPOINTS?.COMPANY_MODULES?.TRAINERS;
    if (ep?.LIST) return ep.LIST(companyId); // /companies/:companyId/trainers
    return `/companies/${companyId}/trainers`;
  }, [companyId]);

  const loadMeta = async () => {
    if (!branchesEndpoint || !trainersEndpoint) return;
    setLoadingMeta(true);
    try {
      const [bRes, tRes] = await Promise.all([
        adminFetch(branchesEndpoint),
        adminFetch(trainersEndpoint),
      ]);

      const bArr =
        bRes?.data?.branches || bRes?.branches || bRes?.data || bRes;
      const tArr =
        tRes?.data?.trainers || tRes?.trainers || tRes?.data || tRes;

      setBranches(Array.isArray(bArr) ? bArr : []);
      setTrainers(Array.isArray(tArr) ? tArr : []);
    } catch (e) {
      // don't hard fail the page; show msg only
      setErrMsg(e?.message || "Failed to load branches/trainers");
      setBranches([]);
      setTrainers([]);
    } finally {
      setLoadingMeta(false);
    }
  };

  const loadClasses = async () => {
    if (!classesEndpoint) return;
    setErrMsg("");
    setLoading(true);
    try {
      const data = await adminFetch(classesEndpoint);
      const arr =
        data?.data?.rows ||
        data?.data?.classes ||
        data?.classes ||
        data?.data ||
        data;
      setRows(Array.isArray(arr) ? arr : []);
    } catch (e) {
      setErrMsg(e?.message || "Failed to load classes");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!companyId) return;
    loadMeta();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId, branchesEndpoint, trainersEndpoint]);

  useEffect(() => {
    loadClasses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classesEndpoint, reloadKey]);

  const openCreate = () => {
    setErrMsg("");
    setIsEdit(false);
    setActiveId(null);

    // default select first branch/trainer if available
    setForm({
      ...empty,
      branch_id: branches?.[0]?.id || "",
      trainer_id: trainers?.[0]?.id || "",
    });

    setOpen(true);
  };

  const openEdit = (c) => {
    setErrMsg("");
    setIsEdit(true);
    setActiveId(c?.id);

    setForm({
      branch_id: c?.branch_id || "",
      trainer_id: c?.trainer_id || "",
      name: c?.name || "",
      description: c?.description || "",
      capacity: c?.capacity ?? 10,
      duration_mins: c?.duration_mins ?? 60,
      price: c?.price ?? "",
      status: c?.status || "active",
    });

    setOpen(true);
  };

  const close = () => {
    if (saving) return;
    setOpen(false);
  };

  const save = async () => {
    setErrMsg("");

    if (!form.branch_id) return setErrMsg("Branch is required");
    if (!form.trainer_id) return setErrMsg("Trainer is required");
    if (!form.name.trim()) return setErrMsg("Class name required");

    setSaving(true);
    try {
      const payload = {
        branch_id: form.branch_id,               // ✅ required
        trainer_id: form.trainer_id,             // ✅ required (NOT null)
        name: form.name.trim(),
        description: (form.description || "").trim() || null,
        capacity: Number(form.capacity || 0),
        duration_mins: Number(form.duration_mins || 0),
        price: form.price === "" ? null : Number(form.price),
        status: form.status || "active",
      };

      if (isEdit && activeId) {
        await adminFetch(`${classesEndpoint}/${activeId}`, {
          method: "PATCH",
          body: payload,
        });
      } else {
        await adminFetch(classesEndpoint, { method: "POST", body: payload });
      }

      setOpen(false);
      setReloadKey((k) => k + 1);
    } catch (e) {
      setErrMsg(e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const del = async (c) => {
    setErrMsg("");
    const ok = window.confirm(`Delete class "${c?.name}"?`);
    if (!ok) return;

    try {
      await adminFetch(`${classesEndpoint}/${c.id}`, { method: "DELETE" });
      setReloadKey((k) => k + 1);
    } catch (e) {
      setErrMsg(e?.message || "Delete failed");
    }
  };

  const trainerLabel = (id) => trainers.find((t) => t.id === id)?.name || id || "—";
  const branchLabel = (id) => branches.find((b) => b.id === id)?.name || id || "—";

  return (
    <Paper sx={{ p: 2 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 900 }}>Classes</Typography>
          <Typography variant="body2" color="text.secondary">
            Manage classes (company module)
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button startIcon={<Refresh />} variant="outlined" onClick={() => setReloadKey((k) => k + 1)}>
            Refresh
          </Button>
          <Button startIcon={<Add />} variant="contained" onClick={openCreate} disabled={loadingMeta}>
            Add Class
          </Button>
        </Stack>
      </Box>

      <Divider sx={{ my: 2 }} />

      {errMsg ? <Alert severity="error" sx={{ mb: 2 }}>{errMsg}</Alert> : null}

      <Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, overflow: "hidden" }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 800 }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Branch</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Trainer</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Duration</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Capacity</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Price</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
              <TableCell align="right" sx={{ fontWeight: 800 }}>Actions</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8}>
                  <Box sx={{ display: "flex", gap: 1, alignItems: "center", py: 2 }}>
                    <CircularProgress size={18} />
                    <Typography variant="body2" color="text.secondary">Loading...</Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : rows.length ? (
              rows.map((c) => (
                <TableRow key={c.id} hover>
                  <TableCell>{c.name}</TableCell>
                  <TableCell>{branchLabel(c.branch_id)}</TableCell>
                  <TableCell>{trainerLabel(c.trainer_id)}</TableCell>
                  <TableCell>{c.duration_mins ?? "—"} mins</TableCell>
                  <TableCell>{c.capacity ?? "—"}</TableCell>
                  <TableCell>{c.price ?? "—"}</TableCell>
                  <TableCell>{c.status || "—"}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => openEdit(c)}><Edit fontSize="small" /></IconButton>
                    <IconButton size="small" color="error" onClick={() => del(c)}><Delete fontSize="small" /></IconButton>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8}>
                  <Typography sx={{ py: 2 }} color="text.secondary">No classes</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Box>

      <Dialog open={open} onClose={close} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 900 }}>{isEdit ? "Edit Class" : "Add Class"}</DialogTitle>
        <DialogContent dividers>
          {loadingMeta ? (
            <Alert severity="info" sx={{ mb: 2 }}>
              Loading branches & trainers...
            </Alert>
          ) : null}

          <Stack spacing={2}>
            <TextField
              select
              label="Branch"
              value={form.branch_id}
              onChange={(e) => setForm((s) => ({ ...s, branch_id: e.target.value }))}
              required
              disabled={loadingMeta}
            >
              {branches.map((b) => (
                <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Trainer"
              value={form.trainer_id}
              onChange={(e) => setForm((s) => ({ ...s, trainer_id: e.target.value }))}
              required
              disabled={loadingMeta}
            >
              {trainers.map((t) => (
                <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
              ))}
            </TextField>

            <TextField
              label="Name"
              value={form.name}
              onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
              required
            />

            <TextField
              label="Description"
              multiline
              minRows={2}
              value={form.description}
              onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
            />

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Duration (mins)"
                type="number"
                fullWidth
                value={form.duration_mins}
                onChange={(e) => setForm((s) => ({ ...s, duration_mins: e.target.value }))}
              />
              <TextField
                label="Capacity"
                type="number"
                fullWidth
                value={form.capacity}
                onChange={(e) => setForm((s) => ({ ...s, capacity: e.target.value }))}
              />
            </Stack>

            <TextField
              label="Price"
              type="number"
              value={form.price}
              onChange={(e) => setForm((s) => ({ ...s, price: e.target.value }))}
            />

            <TextField
              select
              label="Status"
              value={form.status}
              onChange={(e) => setForm((s) => ({ ...s, status: e.target.value }))}
            >
              <MenuItem value="active">active</MenuItem>
              <MenuItem value="inactive">inactive</MenuItem>
              <MenuItem value="deleted">deleted</MenuItem>
            </TextField>
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={close} disabled={saving}>Cancel</Button>
          <Button variant="contained" onClick={save} disabled={saving || loadingMeta}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};
