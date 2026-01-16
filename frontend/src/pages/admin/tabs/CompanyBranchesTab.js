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
import { API_BASE_URL, API_ENDPOINTS } from "../../../config/api";
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

export const CompanyBranchesTab = ({ companyId }) => {
  const [reloadKey, setReloadKey] = useState(0);
  const [errMsg, setErrMsg] = useState("");

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEdit, setIsEdit] = useState(false);

  const [activeId, setActiveId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  const [existingImages, setExistingImages] = useState([]);
  const [loadingImages, setLoadingImages] = useState(false);

  const [existingPreviewUrl, setExistingPreviewUrl] = useState("");

  const endpoint = useMemo(() => API_ENDPOINTS.BRANCHES.LIST(companyId), [companyId]);

  const { data, isLoading, error } = useApiQuery(
    ["company", "branches", companyId, reloadKey],
    endpoint,
    { enabled: !!companyId }
  );

  const branches = useMemo(() => {
    const arr = data?.data?.branches || data?.branches || data?.data || data;
    return Array.isArray(arr) ? arr : [];
  }, [data]);

  // cleanup preview url
  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
      if (existingPreviewUrl) URL.revokeObjectURL(existingPreviewUrl);
    };
  }, [imagePreview, existingPreviewUrl]);

  const loadExistingBranchImages = async (branchId) => {
    setLoadingImages(true);
    try {
      const res = await adminFetch(
        `/media-files/owner?owner_type=branch&owner_id=${branchId}`,
        { method: "GET" }
      );

      const arr = res?.data?.mediaFiles || res?.data?.images || res?.data || [];
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
      // clear old
      if (existingPreviewUrl) URL.revokeObjectURL(existingPreviewUrl);
      setExistingPreviewUrl("");

      const token = getAuthToken();

      const url = `${API_BASE_URL}/media-files/${mediaId}`;

      const resp = await fetch(url, {
        method: "GET",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!resp.ok) {
        throw new Error(`Image fetch failed (${resp.status})`);
      }

      const blob = await resp.blob();
      const blobUrl = URL.createObjectURL(blob);
      setExistingPreviewUrl(blobUrl);
    } catch (e) {
      // fallback empty
      setExistingPreviewUrl("");
    }
  };

  const openCreate = () => {
    setErrMsg("");
    setIsEdit(false);
    setActiveId(null);
    setForm(emptyForm);
    setOpen(true);

    // reset images
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview("");

    setExistingImages([]);
    if (existingPreviewUrl) URL.revokeObjectURL(existingPreviewUrl);
    setExistingPreviewUrl("");
  };

  const openEdit = async (b) => {
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

    // reset new preview
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview("");

    // reset existing
    setExistingImages([]);
    if (existingPreviewUrl) URL.revokeObjectURL(existingPreviewUrl);
    setExistingPreviewUrl("");

    setOpen(true);

    // load existing images
    await loadExistingBranchImages(b?.id);
  };

  useEffect(() => {
    if (!open || !isEdit) return;
    if (!primaryImage?.id) return;
    loadExistingImagePreview(primaryImage.id);
  }, [open, isEdit, primaryImage?.id]);

  const close = () => {
    if (saving) return;
    setOpen(false);
  };

  const uploadBranchImage = async (branchId) => {
    if (!imageFile) return null;

    const fd = new FormData();
    fd.append("file", imageFile, imageFile.name);
    fd.append("owner_type", "branch");
    fd.append("owner_id", branchId);
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

    if (!form.name.trim()) return setErrMsg("Branch name is required");
    if (!form.address_line1.trim()) return setErrMsg("Address line 1 is required");
    if (!form.city.trim()) return setErrMsg("City is required");
    if (!form.country.trim()) return setErrMsg("Country is required");
    if (form.latitude === "" || form.longitude === "")
      return setErrMsg("Latitude & Longitude required");

    setSaving(true);
    try {
      const payload = {
        ...form,
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
      };

      let branchId = activeId;
      let resp;

      if (isEdit && activeId) {
        resp = await adminFetch(API_ENDPOINTS.BRANCHES.UPDATE(companyId, activeId), {
          method: "PATCH",
          body: payload,
        });
        branchId = activeId;
      } else {
        resp = await adminFetch(API_ENDPOINTS.BRANCHES.CREATE(companyId), {
          method: "POST",
          body: payload,
        });

        branchId =
          resp?.data?.branch?.id ||
          resp?.branch?.id ||
          resp?.data?.id ||
          resp?.id ||
          null;
      }

      if (branchId && imageFile) {
        await uploadBranchImage(branchId);
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
                    <Chip size="small" label={b.status || "active"} color={b.status === "active" ? "success" : "default"} />
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
          <Stack spacing={2}>
            <TextField label="Name" value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} required />
            <TextField label="Slug (optional)" value={form.slug} onChange={(e) => setForm((s) => ({ ...s, slug: e.target.value }))} />

            <TextField label="Address Line 1" value={form.address_line1} onChange={(e) => setForm((s) => ({ ...s, address_line1: e.target.value }))} required />
            <TextField label="Address Line 2" value={form.address_line2} onChange={(e) => setForm((s) => ({ ...s, address_line2: e.target.value }))} />

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField label="City" fullWidth value={form.city} onChange={(e) => setForm((s) => ({ ...s, city: e.target.value }))} required />
              <TextField label="State" fullWidth value={form.state} onChange={(e) => setForm((s) => ({ ...s, state: e.target.value }))} />
            </Stack>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField label="Postal Code" fullWidth value={form.postal_code} onChange={(e) => setForm((s) => ({ ...s, postal_code: e.target.value }))} />
              <TextField label="Country" fullWidth value={form.country} onChange={(e) => setForm((s) => ({ ...s, country: e.target.value }))} required />
            </Stack>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField label="Latitude" fullWidth type="number" value={form.latitude} onChange={(e) => setForm((s) => ({ ...s, latitude: e.target.value }))} required />
              <TextField label="Longitude" fullWidth type="number" value={form.longitude} onChange={(e) => setForm((s) => ({ ...s, longitude: e.target.value }))} required />
            </Stack>

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

            <TextField label="Timezone" value={form.timezone} onChange={(e) => setForm((s) => ({ ...s, timezone: e.target.value }))} />
            <TextField label="Description" multiline minRows={2} value={form.description} onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))} />
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
