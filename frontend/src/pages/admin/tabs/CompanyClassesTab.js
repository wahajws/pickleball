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
  Chip,
} from "@mui/material";
import { Add, Edit, Delete, Refresh } from "@mui/icons-material";

import { adminFetch } from "./_adminApi";
import { API_BASE_URL, API_ENDPOINTS } from "../../../config/api";

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

// ✅ token helper (for existing image blob preview)
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

  // ✅ image states
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  const [existingImages, setExistingImages] = useState([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [existingPreviewUrl, setExistingPreviewUrl] = useState("");

  // ✅ Company module endpoints (NO /admin)
  const classesEndpoint = useMemo(() => {
    if (!companyId) return "";
    const ep = API_ENDPOINTS?.COMPANY_MODULES?.CLASSES;
    if (ep?.LIST) return ep.LIST(companyId);
    return `/companies/${companyId}/classes`;
  }, [companyId]);

  const branchesEndpoint = useMemo(() => {
    if (!companyId) return "";
    const ep = API_ENDPOINTS?.BRANCHES;
    if (ep?.LIST) return ep.LIST(companyId);
    return `/companies/${companyId}/branches`;
  }, [companyId]);

  const trainersEndpoint = useMemo(() => {
    if (!companyId) return "";
    const ep = API_ENDPOINTS?.COMPANY_MODULES?.TRAINERS;
    if (ep?.LIST) return ep.LIST(companyId);
    return `/companies/${companyId}/trainers`;
  }, [companyId]);

  // ✅ cleanup previews
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

  const loadMeta = async () => {
    if (!branchesEndpoint || !trainersEndpoint) return;
    setLoadingMeta(true);
    try {
      const [bRes, tRes] = await Promise.all([
        adminFetch(branchesEndpoint),
        adminFetch(trainersEndpoint),
      ]);

      const bArr = bRes?.data?.branches || bRes?.branches || bRes?.data || bRes;
      const tArr = tRes?.data?.trainers || tRes?.trainers || tRes?.data || tRes;

      setBranches(Array.isArray(bArr) ? bArr : []);
      setTrainers(Array.isArray(tArr) ? tArr : []);
    } catch (e) {
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

  // ✅ Load existing class images (owner_type = other)
  const loadExistingClassImages = async (classId) => {
    if (!classId) return;
    setLoadingImages(true);
    try {
      const res = await adminFetch(
        `/media-files/owner?owner_type=other&owner_id=${classId}`,
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

  // ✅ Load image blob preview with token
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

  // ✅ when edit dialog opened + primary image changes
  useEffect(() => {
    if (!open || !isEdit) return;
    if (!primaryImage?.id) return;
    loadExistingImagePreview(primaryImage.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isEdit, primaryImage?.id]);

  const openCreate = () => {
    setErrMsg("");
    setIsEdit(false);
    setActiveId(null);
    resetImages();

    setForm({
      ...empty,
      branch_id: branches?.[0]?.id || "",
      trainer_id: trainers?.[0]?.id || "",
    });

    setOpen(true);
  };

  const openEdit = async (c) => {
    setErrMsg("");
    setIsEdit(true);
    setActiveId(c?.id);
    resetImages();

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

    // ✅ load existing images for this class
    await loadExistingClassImages(c?.id);
  };

  const close = () => {
    if (saving) return;
    setOpen(false);
  };

  // ✅ Upload class image (owner_type=other)
  const uploadClassImage = async (classId) => {
    if (!imageFile || !classId) return;

    const fd = new FormData();
    fd.append("file", imageFile, imageFile.name);
    fd.append("owner_type", "other");
    fd.append("owner_id", classId);
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

    if (!form.branch_id) return setErrMsg("Branch is required");
    if (!form.trainer_id) return setErrMsg("Trainer is required");
    if (!form.name.trim()) return setErrMsg("Class name required");

    setSaving(true);
    try {
      const payload = {
        branch_id: form.branch_id,
        trainer_id: form.trainer_id,
        name: form.name.trim(),
        description: (form.description || "").trim() || null,
        capacity: Number(form.capacity || 0),
        duration_mins: Number(form.duration_mins || 0),
        price: form.price === "" ? null : Number(form.price),
        status: form.status || "active",
      };

      let classId = activeId;

      if (isEdit && activeId) {
        await adminFetch(`${classesEndpoint}/${activeId}`, {
          method: "PATCH",
          body: payload,
        });
        classId = activeId;
      } else {
        const created = await adminFetch(classesEndpoint, {
          method: "POST",
          body: payload,
        });

        classId =
          created?.data?.class?.id ||
          created?.data?.classes?.id ||
          created?.class?.id ||
          created?.data?.id ||
          created?.id ||
          null;
      }

      // ✅ upload after save if image selected
      if (classId && imageFile) {
        await uploadClassImage(classId);
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
                    <IconButton size="small" onClick={() => openEdit(c)}>
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => del(c)}>
                      <Delete fontSize="small" />
                    </IconButton>
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

            {/* ✅ Existing Image (Edit mode only) */}
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

            {/* ✅ New image upload */}
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
          <Button variant="contained" onClick={save} disabled={saving || loadingMeta}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};
