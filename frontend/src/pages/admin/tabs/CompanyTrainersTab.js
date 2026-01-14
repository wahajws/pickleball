// src/pages/admin/tabs/CompanyTrainersTab.jsx
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
  IconButton,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
} from "@mui/material";
import { Add, Edit, Delete, Refresh } from "@mui/icons-material";

import { useApiQuery } from "../../../hooks/useQuery";
import { adminFetch } from "./_adminApi";
import { API_ENDPOINTS } from "../../../config/api";

const empty = { name: "", email: "", phone: "", bio: "" };

export const CompanyTrainersTab = ({ companyId }) => {
  const [reloadKey, setReloadKey] = useState(0);
  const [errMsg, setErrMsg] = useState("");

  const [selectedBranchId, setSelectedBranchId] = useState("");

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const [form, setForm] = useState(empty);

  // ---------- Branches ----------
  const branchesEndpoint = useMemo(() => {
    if (!companyId) return "";
    const ep = API_ENDPOINTS?.BRANCHES;
    if (ep?.LIST) return ep.LIST(companyId);
    return `/companies/${companyId}/branches`;
  }, [companyId]);

  const {
    data: branchesRes,
    isLoading: branchesLoading,
    error: branchesError,
  } = useApiQuery(["company", "branches", companyId], branchesEndpoint, {
    enabled: !!companyId && !!branchesEndpoint,
  });

  const branches = useMemo(() => {
    const arr =
      branchesRes?.data?.branches ||
      branchesRes?.branches ||
      branchesRes?.data ||
      branchesRes;
    return Array.isArray(arr) ? arr : [];
  }, [branchesRes]);

  useEffect(() => {
    if (!selectedBranchId && branches.length) {
      setSelectedBranchId(branches[0].id);
    }
  }, [branches, selectedBranchId]);

  const branchName = useMemo(() => {
    return branches.find((b) => b.id === selectedBranchId)?.name || "";
  }, [branches, selectedBranchId]);

  // ---------- Trainers (LIST endpoint with querystring) ----------
  const trainersListEndpoint = useMemo(() => {
    if (!companyId) return "";
    const qs = selectedBranchId ? `branchId=${encodeURIComponent(selectedBranchId)}` : "";
    const ep = API_ENDPOINTS?.COMPANY_TRAINERS || API_ENDPOINTS?.COMPANY_MODULES?.TRAINERS;

    // Your constants show COMPANY_TRAINERS.LIST(companyId) => no qs support
    // so append qs manually
    const base = ep?.LIST ? ep.LIST(companyId) : `/companies/${companyId}/trainers`;
    return `${base}${qs ? `?${qs}` : ""}`;
  }, [companyId, selectedBranchId]);

  const { data, isLoading, error } = useApiQuery(
    ["company", "trainers", companyId, selectedBranchId, reloadKey],
    trainersListEndpoint,
    { enabled: !!companyId && !!trainersListEndpoint }
  );

  const rows = useMemo(() => {
    const arr =
      data?.data?.rows ||
      data?.data?.trainers ||
      data?.trainers ||
      data?.data ||
      data;
    return Array.isArray(arr) ? arr : [];
  }, [data]);

  // ✅ Base endpoints WITHOUT querystring (for POST/PATCH/DELETE)
  const trainersApi = useMemo(() => {
    const ep = API_ENDPOINTS?.COMPANY_TRAINERS || API_ENDPOINTS?.COMPANY_MODULES?.TRAINERS;
    return {
      create: (cid) => (ep?.CREATE ? ep.CREATE(cid) : `/companies/${cid}/trainers`),
      update: (cid, id) => (ep?.UPDATE ? ep.UPDATE(cid, id) : `/companies/${cid}/trainers/${id}`),
      del: (cid, id) => (ep?.DELETE ? ep.DELETE(cid, id) : `/companies/${cid}/trainers/${id}`),
    };
  }, []);

  // ---------- UI ----------
  const openCreate = () => {
    setErrMsg("");
    setIsEdit(false);
    setActiveId(null);
    setForm(empty);
    setOpen(true);
  };

  const openEdit = (t) => {
    setErrMsg("");
    setIsEdit(true);
    setActiveId(t?.id);
    setForm({
      name: t?.name || "",
      email: t?.email || "",
      phone: t?.phone || "",
      bio: t?.bio || "",
    });
    setOpen(true);
  };

  const close = () => {
    if (saving) return;
    setOpen(false);
  };

  const save = async () => {
    setErrMsg("");

    if (!selectedBranchId) return setErrMsg("Select a branch first");
    if (!form.name.trim()) return setErrMsg("Trainer name required");

    setSaving(true);
    try {
      const payload = {
        branch_id: selectedBranchId,
        name: form.name.trim(),
        email: (form.email || "").trim() || null,
        phone: (form.phone || "").trim() || null,
        bio: (form.bio || "").trim() || null,
      };

      if (isEdit && activeId) {
        await adminFetch(trainersApi.update(companyId, activeId), {
          method: "PATCH",
          body: payload,
        });
      } else {
        await adminFetch(trainersApi.create(companyId), {
          method: "POST",
          body: payload,
        });
      }

      setOpen(false);
      setReloadKey((k) => k + 1);
    } catch (e) {
      setErrMsg(e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const del = async (t) => {
    setErrMsg("");
    const ok = window.confirm(`Delete trainer "${t?.name}"?`);
    if (!ok) return;

    try {
      await adminFetch(trainersApi.del(companyId, t.id), { method: "DELETE" });
      setReloadKey((k) => k + 1);
    } catch (e) {
      setErrMsg(e?.message || "Delete failed");
    }
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 900 }}>
            Trainers
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Create trainers for classes & trainer bookings
          </Typography>
        </Box>

        <Stack direction="row" spacing={1}>
          <Button startIcon={<Refresh />} variant="outlined" onClick={() => setReloadKey((k) => k + 1)}>
            Refresh
          </Button>
          <Button startIcon={<Add />} variant="contained" onClick={openCreate} disabled={!selectedBranchId}>
            Add Trainer
          </Button>
        </Stack>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Branch selector */}
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center" sx={{ mb: 2 }}>
        <FormControl sx={{ minWidth: 260 }} size="small" disabled={branchesLoading || !branches.length}>
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
      </Stack>

      {errMsg ? <Alert severity="error" sx={{ mb: 2 }}>{errMsg}</Alert> : null}
      {branchesError ? <Alert severity="error" sx={{ mb: 2 }}>Failed to load branches</Alert> : null}
      {error ? <Alert severity="error" sx={{ mb: 2 }}>Failed to load trainers</Alert> : null}

      <Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, overflow: "hidden" }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 800 }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Email</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Phone</TableCell>
              <TableCell align="right" sx={{ fontWeight: 800 }}>Actions</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4}>
                  <Box sx={{ display: "flex", gap: 1, alignItems: "center", py: 2 }}>
                    <CircularProgress size={18} />
                    <Typography variant="body2" color="text.secondary">Loading...</Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : rows.length ? (
              rows.map((t) => (
                <TableRow key={t.id} hover>
                  <TableCell>{t.name}</TableCell>
                  <TableCell>{t.email || "—"}</TableCell>
                  <TableCell>{t.phone || "—"}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => openEdit(t)}>
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => del(t)}>
                      <Delete fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4}>
                  <Typography sx={{ py: 2 }} color="text.secondary">
                    No trainers
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Box>

      <Dialog open={open} onClose={close} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 900 }}>{isEdit ? "Edit Trainer" : "Add Trainer"}</DialogTitle>

        <DialogContent dividers>
          <Stack spacing={2}>
            <TextField
              label="Name"
              value={form.name}
              onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
              required
            />
            <TextField
              label="Email (optional)"
              value={form.email}
              onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
            />
            <TextField
              label="Phone (optional)"
              value={form.phone}
              onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))}
            />
            <TextField
              label="Bio (optional)"
              multiline
              minRows={2}
              value={form.bio}
              onChange={(e) => setForm((s) => ({ ...s, bio: e.target.value }))}
            />
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={close} disabled={saving}>Cancel</Button>
          <Button variant="contained" onClick={save} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};
