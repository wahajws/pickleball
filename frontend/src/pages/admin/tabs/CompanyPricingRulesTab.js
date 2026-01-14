import React, { useEffect, useMemo, useState } from "react";
import {
  Paper, Typography, Box, Stack, Button, Divider, Table, TableHead, TableRow, TableCell,
  TableBody, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert, CircularProgress,
  IconButton, FormControl, InputLabel, Select, MenuItem
} from "@mui/material";
import { Add, Edit, Delete, Refresh } from "@mui/icons-material";

import { useApiQuery } from "../../../hooks/useQuery";
import { API_ENDPOINTS } from "../../../config/api";
import { adminFetch } from "./_adminApi";

const empty = {
  branch_id: "",
  name: "",
  applies_to: "court", // UI only (backend doesn’t store this)
  day_of_week: "1",    // store as string for UI input, convert to number when sending
  start_time: "08:00",
  end_time: "20:00",
  price_per_hour: "",
  currency: "MYR",
};

export const CompanyPricingRulesTab = ({ companyId }) => {
  const [reloadKey, setReloadKey] = useState(0);
  const [errMsg, setErrMsg] = useState("");

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const [form, setForm] = useState(empty);

  // ✅ Branch list (needed because backend requires branch_id)
  const branchesEndpoint = useMemo(() => {
    return API_ENDPOINTS?.BRANCHES?.LIST
      ? API_ENDPOINTS.BRANCHES.LIST(companyId)
      : `/companies/${companyId}/branches`;
  }, [companyId]);

  const { data: branchesRes } = useApiQuery(
    ["company", companyId, "branches"],
    branchesEndpoint,
    { enabled: !!companyId }
  );

  const branches = useMemo(() => {
    const arr =
      branchesRes?.data?.branches ||
      branchesRes?.branches ||
      branchesRes?.data ||
      branchesRes;
    return Array.isArray(arr) ? arr : [];
  }, [branchesRes]);

  // auto-pick first branch when opening or when branches loaded
  useEffect(() => {
    if (!form.branch_id && branches.length) {
      setForm((s) => ({ ...s, branch_id: branches[0].id }));
    }
  }, [branches]); // eslint-disable-line react-hooks/exhaustive-deps

  // ✅ IMPORTANT: use non-admin company route (as you said admin should not append)
  const endpoint = useMemo(
    () => `/companies/${companyId}/pricing-rules`,
    [companyId]
  );

  const { data, isLoading, error } = useApiQuery(
    ["company", companyId, "pricing-rules", reloadKey, form.branch_id],
    // filter by branchId so list matches selected branch (optional)
    form.branch_id ? `${endpoint}?branchId=${encodeURIComponent(form.branch_id)}` : endpoint,
    { enabled: !!companyId }
  );

  const rows = useMemo(() => {
    const arr = data?.data?.rules || data?.data?.rows || data?.data || data;
    return Array.isArray(arr) ? arr : [];
  }, [data]);

  const openCreate = () => {
    setErrMsg("");
    setIsEdit(false);
    setActiveId(null);
    setForm((s) => ({
      ...empty,
      branch_id: s.branch_id || branches?.[0]?.id || "",
    }));
    setOpen(true);
  };

  const openEdit = (r) => {
    setErrMsg("");
    setIsEdit(true);
    setActiveId(r?.id);

    setForm({
      branch_id: r?.branch_id || branches?.[0]?.id || "",
      name: r?.name || "",
      applies_to: r?.court_id ? "court" : "branch", // UI guess
      day_of_week: String(r?.day_of_week ?? "1"),
      start_time: r?.start_time || "08:00",
      end_time: r?.end_time || "20:00",
      price_per_hour: r?.price_per_hour ?? "",
      currency: r?.currency || "MYR",
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
    if (!form.name.trim()) return setErrMsg("Rule name required");
    if (form.price_per_hour === "" || form.price_per_hour === null) return setErrMsg("Price required");
    if (!form.start_time) return setErrMsg("Start time required");
    if (!form.end_time) return setErrMsg("End time required");

    // ✅ convert day_of_week => number
    const dow = Number(form.day_of_week);
    if (Number.isNaN(dow) || dow < 0 || dow > 6) {
      return setErrMsg("day_of_week must be between 0 and 6");
    }

    setSaving(true);
    try {
      const payload = {
        branch_id: form.branch_id,
        name: form.name.trim(),
        court_id: form.applies_to === "court" ? (form.court_id || null) : null, // optional if you add court picker later
        day_of_week: dow,
        start_time: form.start_time,
        end_time: form.end_time,
        price_per_hour: Number(form.price_per_hour),
        currency: (form.currency || "MYR").toUpperCase(),
      };

      if (isEdit && activeId) {
        await adminFetch(`${endpoint}/${activeId}`, { method: "PATCH", body: payload });
      } else {
        await adminFetch(endpoint, { method: "POST", body: payload });
      }

      setOpen(false);
      setReloadKey((k) => k + 1);
    } catch (e) {
      setErrMsg(e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const del = async (r) => {
    setErrMsg("");
    const ok = window.confirm(`Delete pricing rule "${r?.name}"?`);
    if (!ok) return;

    try {
      await adminFetch(`${endpoint}/${r.id}`, { method: "DELETE" });
      setReloadKey((k) => k + 1);
    } catch (e) {
      setErrMsg(e?.message || "Delete failed");
    }
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 900 }}>Price Matrix</Typography>
          <Typography variant="body2" color="text.secondary">
            Create pricing rules for bookings
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button startIcon={<Refresh />} variant="outlined" onClick={() => setReloadKey((k) => k + 1)}>
            Refresh
          </Button>
          <Button startIcon={<Add />} variant="contained" onClick={openCreate}>
            Add Rule
          </Button>
        </Stack>
      </Box>

      <Divider sx={{ my: 2 }} />

      {errMsg ? <Alert severity="error" sx={{ mb: 2 }}>{errMsg}</Alert> : null}
      {error ? <Alert severity="error" sx={{ mb: 2 }}>Failed to load pricing rules</Alert> : null}

      {/* ✅ Branch filter */}
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 2 }} alignItems="center">
        <FormControl size="small" sx={{ minWidth: 240 }}>
          <InputLabel>Branch</InputLabel>
          <Select
            label="Branch"
            value={form.branch_id || ""}
            onChange={(e) => setForm((s) => ({ ...s, branch_id: e.target.value }))}
          >
            {branches.map((b) => (
              <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      <Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, overflow: "hidden" }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 800 }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Day</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Time</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Price/hr</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Currency</TableCell>
              <TableCell align="right" sx={{ fontWeight: 800 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6}>
                <Box sx={{ display: "flex", gap: 1, alignItems: "center", py: 2 }}>
                  <CircularProgress size={18} />
                  <Typography variant="body2" color="text.secondary">Loading...</Typography>
                </Box>
              </TableCell></TableRow>
            ) : rows.length ? (
              rows.map((r) => (
                <TableRow key={r.id} hover>
                  <TableCell>{r.name}</TableCell>
                  <TableCell>{r.day_of_week}</TableCell>
                  <TableCell>{r.start_time && r.end_time ? `${r.start_time} - ${r.end_time}` : "Any"}</TableCell>
                  <TableCell>{r.price_per_hour ?? "—"}</TableCell>
                  <TableCell>{r.currency || "MYR"}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => openEdit(r)}><Edit fontSize="small" /></IconButton>
                    <IconButton size="small" color="error" onClick={() => del(r)}><Delete fontSize="small" /></IconButton>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow><TableCell colSpan={6}>
                <Typography sx={{ py: 2 }} color="text.secondary">No pricing rules</Typography>
              </TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Box>

      <Dialog open={open} onClose={close} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 900 }}>{isEdit ? "Edit Pricing Rule" : "Add Pricing Rule"}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <FormControl size="small" fullWidth>
              <InputLabel>Branch</InputLabel>
              <Select
                label="Branch"
                value={form.branch_id || ""}
                onChange={(e) => setForm((s) => ({ ...s, branch_id: e.target.value }))}
              >
                {branches.map((b) => (
                  <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Rule Name"
              value={form.name}
              onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
              required
            />

            <TextField
              label="Applies To (UI only)"
              value={form.applies_to}
              onChange={(e) => setForm((s) => ({ ...s, applies_to: e.target.value }))}
              helperText='Backend uses branch_id/court_id. "applies_to" is UI only.'
            />

            <TextField
              label="Day of week (0=Sun ... 6=Sat)"
              value={form.day_of_week}
              onChange={(e) => setForm((s) => ({ ...s, day_of_week: e.target.value }))}
              required
            />

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Start Time (HH:mm)"
                fullWidth
                value={form.start_time}
                onChange={(e) => setForm((s) => ({ ...s, start_time: e.target.value }))}
                required
              />
              <TextField
                label="End Time (HH:mm)"
                fullWidth
                value={form.end_time}
                onChange={(e) => setForm((s) => ({ ...s, end_time: e.target.value }))}
                required
              />
            </Stack>

            <TextField
              label="Price per hour"
              type="number"
              value={form.price_per_hour}
              onChange={(e) => setForm((s) => ({ ...s, price_per_hour: e.target.value }))}
              required
            />

            <TextField
              label="Currency"
              value={form.currency}
              onChange={(e) => setForm((s) => ({ ...s, currency: e.target.value }))}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={close} disabled={saving}>Cancel</Button>
          <Button onClick={save} variant="contained" disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};
