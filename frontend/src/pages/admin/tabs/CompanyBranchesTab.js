// src/pages/admin/tabs/CompanyBranchesTab.jsx
import React, { useMemo, useState } from "react";
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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Chip,
  CircularProgress,
} from "@mui/material";
import { Add, Edit, Delete, Refresh } from "@mui/icons-material";

import { useApiQuery } from "../../../hooks/useQuery";
import { API_ENDPOINTS } from "../../../config/api";
import { adminFetch } from "./_adminApi";

const emptyForm = {
  name: "",
  slug: "",
  description: "",
  address_line1: "",
  address_line2: "",
  city: "",
  state: "",
  postal_code: "",
  country: "Malaysia",
  latitude: "",
  longitude: "",
  timezone: "Asia/Kuala_Lumpur",
  status: "active",
};

export const CompanyBranchesTab = ({ companyId }) => {
  const [reloadKey, setReloadKey] = useState(0);
  const [errMsg, setErrMsg] = useState("");

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const endpoint = useMemo(() => {
    return API_ENDPOINTS.BRANCHES.LIST(companyId); // /companies/:companyId/branches
  }, [companyId]);

  const { data, isLoading, error } = useApiQuery(
    ["company", "branches", companyId, reloadKey],
    endpoint,
    { enabled: !!companyId }
  );

  const branches = useMemo(() => {
    const arr = data?.data?.branches || data?.branches || data?.data || data;
    return Array.isArray(arr) ? arr : [];
  }, [data]);

  const openCreate = () => {
    setErrMsg("");
    setIsEdit(false);
    setActiveId(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (b) => {
    setErrMsg("");
    setIsEdit(true);
    setActiveId(b?.id);
    setForm({
      name: b?.name || "",
      slug: b?.slug || "",
      description: b?.description || "",
      address_line1: b?.address_line1 || "",
      address_line2: b?.address_line2 || "",
      city: b?.city || "",
      state: b?.state || "",
      postal_code: b?.postal_code || "",
      country: b?.country || "Malaysia",
      latitude: b?.latitude ?? "",
      longitude: b?.longitude ?? "",
      timezone: b?.timezone || "Asia/Kuala_Lumpur",
      status: b?.status || "active",
    });
    setOpen(true);
  };

  const close = () => {
    if (saving) return;
    setOpen(false);
  };

  const save = async () => {
    setErrMsg("");
    if (!form.name.trim()) return setErrMsg("Branch name is required");
    if (!form.address_line1.trim()) return setErrMsg("Address line 1 is required");
    if (!form.city.trim()) return setErrMsg("City is required");
    if (!form.country.trim()) return setErrMsg("Country is required");
    if (form.latitude === "" || form.longitude === "") return setErrMsg("Latitude & Longitude required");

    setSaving(true);
    try {
      const payload = {
        ...form,
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
      };

      // ✅ IMPORTANT: no /admin here
      if (isEdit && activeId) {
        await adminFetch(API_ENDPOINTS.BRANCHES.UPDATE(companyId, activeId), {
          method: "PATCH",
          body: payload,
        });
      } else {
        await adminFetch(API_ENDPOINTS.BRANCHES.CREATE(companyId), {
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

  const del = async (b) => {
    setErrMsg("");
    const ok = window.confirm(`Delete branch "${b?.name}"?`);
    if (!ok) return;

    try {
      await adminFetch(API_ENDPOINTS.BRANCHES.DELETE(companyId, b.id), { method: "DELETE" });
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
            Branches
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Create branch here
          </Typography>
        </Box>

        <Stack direction="row" spacing={1}>
          <Button startIcon={<Refresh />} variant="outlined" onClick={() => setReloadKey((k) => k + 1)}>
            Refresh
          </Button>
          <Button startIcon={<Add />} variant="contained" onClick={openCreate}>
            Add Branch
          </Button>
        </Stack>
      </Box>

      <Divider sx={{ my: 2 }} />

      {errMsg ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errMsg}
        </Alert>
      ) : null}
      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load branches
        </Alert>
      ) : null}

      <Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, overflow: "hidden" }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 800 }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>City</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
              <TableCell align="right" sx={{ fontWeight: 800 }}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4}>
                  <Box sx={{ display: "flex", gap: 1, alignItems: "center", py: 2 }}>
                    <CircularProgress size={18} />
                    <Typography variant="body2" color="text.secondary">
                      Loading...
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : branches.length ? (
              branches.map((b) => (
                <TableRow key={b.id} hover>
                  <TableCell>{b.name}</TableCell>
                  <TableCell>{b.city}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={b.status || "active"}
                      color={b.status === "active" ? "success" : "default"}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => openEdit(b)}>
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => del(b)}>
                      <Delete fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4}>
                  <Typography sx={{ py: 2 }} color="text.secondary">
                    No branches
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Box>

      <Dialog open={open} onClose={close} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 900 }}>{isEdit ? "Edit Branch" : "Add Branch"}</DialogTitle>
        <DialogContent dividers>
          {errMsg ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errMsg}
            </Alert>
          ) : null}

          <Stack spacing={2}>
            <TextField
              label="Name"
              value={form.name}
              onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
              required
            />
            <TextField
              label="Slug (optional)"
              value={form.slug}
              onChange={(e) => setForm((s) => ({ ...s, slug: e.target.value }))}
            />
            <TextField
              label="Address Line 1"
              value={form.address_line1}
              onChange={(e) => setForm((s) => ({ ...s, address_line1: e.target.value }))}
              required
            />
            <TextField
              label="Address Line 2"
              value={form.address_line2}
              onChange={(e) => setForm((s) => ({ ...s, address_line2: e.target.value }))}
            />

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="City"
                fullWidth
                value={form.city}
                onChange={(e) => setForm((s) => ({ ...s, city: e.target.value }))}
                required
              />
              <TextField
                label="State"
                fullWidth
                value={form.state}
                onChange={(e) => setForm((s) => ({ ...s, state: e.target.value }))}
              />
            </Stack>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Postal Code"
                fullWidth
                value={form.postal_code}
                onChange={(e) => setForm((s) => ({ ...s, postal_code: e.target.value }))}
              />
              <TextField
                label="Country"
                fullWidth
                value={form.country}
                onChange={(e) => setForm((s) => ({ ...s, country: e.target.value }))}
                required
              />
            </Stack>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Latitude"
                fullWidth
                type="number"
                value={form.latitude}
                onChange={(e) => setForm((s) => ({ ...s, latitude: e.target.value }))}
                required
              />
              <TextField
                label="Longitude"
                fullWidth
                type="number"
                value={form.longitude}
                onChange={(e) => setForm((s) => ({ ...s, longitude: e.target.value }))}
                required
              />
            </Stack>

            <TextField
              label="Timezone"
              value={form.timezone}
              onChange={(e) => setForm((s) => ({ ...s, timezone: e.target.value }))}
            />
            <TextField
              label="Description"
              multiline
              minRows={2}
              value={form.description}
              onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
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
