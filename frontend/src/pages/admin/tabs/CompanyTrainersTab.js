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
import { API_BASE_URL, API_ENDPOINTS } from "../../../config/api";

const empty = { name: "", email: "", phone: "", bio: "" };

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

export const CompanyTrainersTab = ({ companyId }) => {
  const [reloadKey, setReloadKey] = useState(0);
  const [errMsg, setErrMsg] = useState("");

  const [selectedBranchId, setSelectedBranchId] = useState("");

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const [form, setForm] = useState(empty);

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  const [existingImages, setExistingImages] = useState([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [existingPreviewUrl, setExistingPreviewUrl] = useState("");

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
    const qs = selectedBranchId
      ? `branchId=${encodeURIComponent(selectedBranchId)}`
      : "";
    const ep =
      API_ENDPOINTS?.COMPANY_TRAINERS || API_ENDPOINTS?.COMPANY_MODULES?.TRAINERS;

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

  const trainersApi = useMemo(() => {
    const ep =
      API_ENDPOINTS?.COMPANY_TRAINERS || API_ENDPOINTS?.COMPANY_MODULES?.TRAINERS;
    return {
      create: (cid) => (ep?.CREATE ? ep.CREATE(cid) : `/companies/${cid}/trainers`),
      update: (cid, id) =>
        (ep?.UPDATE ? ep.UPDATE(cid, id) : `/companies/${cid}/trainers/${id}`),
      del: (cid, id) =>
        (ep?.DELETE ? ep.DELETE(cid, id) : `/companies/${cid}/trainers/${id}`),
    };
  }, []);

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
      if (existingPreviewUrl) URL.revokeObjectURL(existingPreviewUrl);
    };
  }, [imagePreview, existingPreviewUrl]);

  const resetImages = () => {
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview("");

    setExistingImages([]);
    setLoadingImages(false);

    if (existingPreviewUrl) URL.revokeObjectURL(existingPreviewUrl);
    setExistingPreviewUrl("");
  };

  const loadExistingTrainerImages = async (trainerId) => {
    if (!trainerId) return;
    setLoadingImages(true);
    try {
      const res = await adminFetch(
        `/media-files/owner?owner_type=other&owner_id=${trainerId}`,
        { method: "GET" }
      );

      const arr = res?.data?.mediaFiles || res?.data || [];
      setExistingImages(Array.isArray(arr) ? arr : []);
    } catch (e) {
      setExistingImages([]);
    } finally {
      setLoadingImages(false);
    }
  };

  const primaryImage = useMemo(() => {
    if (!existingImages?.length) return null;
    return existingImages.find((x) => x?.is_primary) || existingImages[0] || null;
  }, [existingImages]);

  const loadExistingImagePreview = async (mediaId) => {
    if (!mediaId) return;

    try {
      if (existingPreviewUrl) URL.revokeObjectURL(existingPreviewUrl);
      setExistingPreviewUrl("");

      const token = getAuthToken();
      const url = `${API_BASE_URL}/media-files/${mediaId}`;

      const resp = await fetch(url, {
        method: "GET",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!resp.ok) throw new Error(`Image fetch failed (${resp.status})`);

      const blob = await resp.blob();
      const blobUrl = URL.createObjectURL(blob);
      setExistingPreviewUrl(blobUrl);
    } catch {
      setExistingPreviewUrl("");
    }
  };

  useEffect(() => {
    if (!open || !isEdit) return;
    if (!primaryImage?.id) return;
    loadExistingImagePreview(primaryImage.id);
  }, [open, isEdit, primaryImage?.id]);

  // ---------- UI ----------
  const openCreate = () => {
    setErrMsg("");
    setIsEdit(false);
    setActiveId(null);
    setForm(empty);
    resetImages();
    setOpen(true);
  };

  const openEdit = async (t) => {
    setErrMsg("");
    setIsEdit(true);
    setActiveId(t?.id);

    setForm({
      name: t?.name || "",
      email: t?.email || "",
      phone: t?.phone || "",
      bio: t?.bio || "",
    });

    resetImages();
    setOpen(true);

    await loadExistingTrainerImages(t?.id);
  };

  const close = () => {
    if (saving) return;
    setOpen(false);
  };

  const uploadTrainerImage = async (trainerId) => {
    if (!imageFile || !trainerId) return;

    const fd = new FormData();
    fd.append("file", imageFile, imageFile.name);
    fd.append("owner_type", "other");
    fd.append("owner_id", trainerId);
    fd.append("is_primary", "true");

    const res = await adminFetch("/media-files/upload", {
      method: "POST",
      body: fd,
    });

    if (res?.success === false) throw new Error(res?.message || "Image upload failed");
    return res;
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

      let trainerId = activeId;

      if (isEdit && activeId) {
        await adminFetch(trainersApi.update(companyId, activeId), {
          method: "PATCH",
          body: payload,
        });
        trainerId = activeId;
      } else {
        const created = await adminFetch(trainersApi.create(companyId), {
          method: "POST",
          body: payload,
        });

        trainerId =
          created?.data?.trainer?.id ||
          created?.trainer?.id ||
          created?.data?.id ||
          created?.id ||
          null;
      }

      if (trainerId && imageFile) {
        await uploadTrainerImage(trainerId);
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

            {isEdit ? (
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 800, mb: 1 }}>
                  Existing Image
                </Typography>

                {loadingImages ? (
                  <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                    <CircularProgress size={16} />
                    <Typography variant="body2" color="text.secondary">
                      Loading...
                    </Typography>
                  </Box>
                ) : primaryImage ? (
                  <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                    <img
                      src={existingPreviewUrl || ""}
                      alt="existing"
                      style={{
                        width: 150,
                        height: 90,
                        objectFit: "cover",
                        borderRadius: 10,
                        border: "1px solid #ddd",
                        background: "#fafafa",
                      }}
                    />
                    <Stack spacing={0.5}>
                      <Chip size="small" label={primaryImage.file_name || "image"} />
                      <Typography variant="caption" color="text.secondary">
                        {primaryImage.is_primary ? "Primary" : "Secondary"}
                      </Typography>
                    </Stack>
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No image uploaded yet
                  </Typography>
                )}
              </Box>
            ) : null}

            <Button variant="outlined" component="label">
              Choose New Image (Optional)
              <input
                hidden
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;

                  setImageFile(file);

                  if (imagePreview) URL.revokeObjectURL(imagePreview);
                  setImagePreview(URL.createObjectURL(file));
                }}
              />
            </Button>

            {imageFile ? <Chip label={imageFile.name} /> : null}

            {imagePreview ? (
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 800, mb: 1 }}>
                  New Preview
                </Typography>
                <img
                  src={imagePreview}
                  alt="preview"
                  style={{
                    width: 150,
                    height: 90,
                    objectFit: "cover",
                    borderRadius: 10,
                    border: "1px solid #ddd",
                  }}
                />
              </Box>
            ) : null}
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
