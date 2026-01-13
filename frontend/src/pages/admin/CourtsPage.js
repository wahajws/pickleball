import React, { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
} from "@mui/material";
import { Add, Edit, Delete } from "@mui/icons-material";

import { AdminLayout } from "../../components/layouts/AdminLayout";
import { Loading } from "../../components/common/Loading";
import { useToast } from "../../components/common/Toast";
import { useApiQuery, useApiMutation, useApiUpdate, useApiDelete } from "../../hooks/useQuery";
import { API_ENDPOINTS } from "../../config/api";
import { formatDateTime } from "../../utils/format";

const SURFACE_TYPES = ["indoor", "outdoor", "hard", "clay", "grass", "synthetic"];
const STATUS = ["active", "maintenance", "closed"];

export const CourtsPage = () => {
  const { id: companyId } = useParams(); // route uses /admin/companies/:id/...
  const { showToast } = useToast();

  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [editCourt, setEditCourt] = useState(null);

  const [formValues, setFormValues] = useState({
    name: "",
    court_number: "",
    court_type: "pickleball",
    surface_type: "",
    description: "",
    capacity: 4,
    has_lights: false,
    hourly_rate: "",
    status: "active",
  });

  // branches (dropdown)
  const branchesEndpoint =
    API_ENDPOINTS.BRANCHES?.LIST ? API_ENDPOINTS.BRANCHES.LIST(companyId) : `/companies/${companyId}/branches`;

  const { data: branchesRes, isLoading: branchesLoading, error: branchesError } = useApiQuery(
    ["admin", "company", "branches", companyId],
    branchesEndpoint,
    { enabled: !!companyId }
  );

  const branches = useMemo(() => {
    if (Array.isArray(branchesRes?.data?.branches)) return branchesRes.data.branches;
    if (Array.isArray(branchesRes?.data)) return branchesRes.data;
    return [];
  }, [branchesRes]);

  // auto select first branch
  React.useEffect(() => {
    if (!selectedBranchId && branches.length) setSelectedBranchId(branches[0].id);
  }, [branches, selectedBranchId]);

  // courts endpoints (depends on selectedBranchId)
  const courtsEndpoint = selectedBranchId
    ? API_ENDPOINTS.ADMIN.COMPANY.BRANCH_COURTS.LIST(companyId, selectedBranchId)
    : "";

  const { data: courtsRes, isLoading: courtsLoading, error: courtsError, refetch } = useApiQuery(
    ["admin", "company", "courts", companyId, selectedBranchId],
    courtsEndpoint,
    { enabled: !!companyId && !!selectedBranchId }
  );

  const courts = useMemo(() => {
    if (Array.isArray(courtsRes?.data?.courts)) return courtsRes.data.courts;
    if (Array.isArray(courtsRes?.data)) return courtsRes.data;
    return [];
  }, [courtsRes]);

  const createCourt = useApiMutation(
    () => API_ENDPOINTS.ADMIN.COMPANY.BRANCH_COURTS.CREATE(companyId, selectedBranchId),
    {
      onSuccess: () => {
        showToast("Court created", "success");
        setOpenDialog(false);
        refetch();
      },
      onError: (err) => showToast(err?.response?.data?.message || "Failed to create court", "error"),
    }
  );

  const updateCourt = useApiUpdate(
    ({ courtId }) => API_ENDPOINTS.ADMIN.COMPANY.BRANCH_COURTS.UPDATE(companyId, selectedBranchId, courtId),
    {
      onSuccess: () => {
        showToast("Court updated", "success");
        setOpenDialog(false);
        setEditCourt(null);
        refetch();
      },
      onError: (err) => showToast(err?.response?.data?.message || "Failed to update court", "error"),
    }
  );

  const deleteCourt = useApiDelete(
    ({ courtId }) => API_ENDPOINTS.ADMIN.COMPANY.BRANCH_COURTS.DELETE(companyId, selectedBranchId, courtId),
    {
      onSuccess: () => {
        showToast("Court deleted", "success");
        refetch();
      },
      onError: (err) => showToast(err?.response?.data?.message || "Failed to delete court", "error"),
    }
  );

  const resetForm = () => {
    setFormValues({
      name: "",
      court_number: "",
      court_type: "pickleball",
      surface_type: "",
      description: "",
      capacity: 4,
      has_lights: false,
      hourly_rate: "",
      status: "active",
    });
  };

  const openAdd = () => {
    setEditCourt(null);
    resetForm();
    setOpenDialog(true);
  };

  const openEdit = (court) => {
    setEditCourt(court);
    setFormValues({
      name: court.name || "",
      court_number: court.court_number || "",
      court_type: court.court_type || "pickleball",
      surface_type: court.surface_type || "",
      description: court.description || "",
      capacity: court.capacity ?? 4,
      has_lights: !!court.has_lights,
      hourly_rate: court.hourly_rate ?? "",
      status: court.status || "active",
    });
    setOpenDialog(true);
  };

  const save = async () => {
    if (!companyId) return showToast("Missing companyId", "error");
    if (!selectedBranchId) return showToast("Select branch first", "error");

    if (!formValues.name) return showToast("Court name required", "error");
    if (formValues.hourly_rate === "" || formValues.hourly_rate === null)
      return showToast("Hourly rate required", "error");

    const payload = {
      name: formValues.name,
      court_number: formValues.court_number || null,
      court_type: formValues.court_type || "pickleball",
      surface_type: formValues.surface_type || null,
      description: formValues.description || null,
      capacity: Number(formValues.capacity ?? 4),
      has_lights: !!formValues.has_lights,
      hourly_rate: Number(formValues.hourly_rate),
      status: formValues.status || "active",
    };

    if (editCourt?.id) {
      await updateCourt.mutateAsync({ courtId: editCourt.id, data: payload });
    } else {
      await createCourt.mutateAsync(payload);
    }
  };

  const remove = async (courtId) => {
    if (window.confirm("Delete this court?")) {
      await deleteCourt.mutateAsync({ courtId });
    }
  };

  if (branchesLoading || courtsLoading) {
    return (
      <AdminLayout>
        <Loading />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Container maxWidth="lg" sx={{ mt: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h4">Courts</Typography>
          <Button startIcon={<Add />} variant="contained" onClick={openAdd} disabled={!selectedBranchId}>
            Add Court
          </Button>
        </Box>

        {branchesError ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {branchesError?.response?.data?.message || "Failed to load branches"}
          </Alert>
        ) : null}

        <Paper sx={{ p: 2, mb: 2 }}>
          <FormControl fullWidth>
            <InputLabel>Branch</InputLabel>
            <Select
              label="Branch"
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
            >
              {branches.map((b) => (
                <MenuItem key={b.id} value={b.id}>
                  {b.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Paper>

        {courtsError ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {courtsError?.response?.data?.message || "Failed to load courts"}
          </Alert>
        ) : null}

        <Paper sx={{ p: 2 }}>
          {courts.length ? (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>No</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Surface</TableCell>
                  <TableCell>Capacity</TableCell>
                  <TableCell>Lights</TableCell>
                  <TableCell>Hourly Rate</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {courts.map((c) => (
                  <TableRow key={c.id} hover>
                    <TableCell>{c.name}</TableCell>
                    <TableCell>{c.court_number || "—"}</TableCell>
                    <TableCell>{c.court_type || "pickleball"}</TableCell>
                    <TableCell>{c.surface_type || "—"}</TableCell>
                    <TableCell>{c.capacity ?? 4}</TableCell>
                    <TableCell>{c.has_lights ? "Yes" : "No"}</TableCell>
                    <TableCell>{c.hourly_rate}</TableCell>
                    <TableCell>{c.status}</TableCell>
                    <TableCell>{c.created_at ? formatDateTime(c.created_at) : "—"}</TableCell>
                    <TableCell align="right">
                      <IconButton color="primary" onClick={() => openEdit(c)}>
                        <Edit />
                      </IconButton>
                      <IconButton color="error" onClick={() => remove(c.id)}>
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Typography color="text.secondary">No courts found</Typography>
          )}
        </Paper>

        {/* Dialog */}
        <Dialog open={openDialog} onClose={() => setOpenDialog(false)} fullWidth maxWidth="sm">
          <DialogTitle>{editCourt ? "Edit Court" : "Add Court"}</DialogTitle>
          <DialogContent>
            <TextField
              label="Court Name"
              fullWidth
              margin="normal"
              value={formValues.name}
              onChange={(e) => setFormValues({ ...formValues, name: e.target.value })}
            />

            <TextField
              label="Court Number"
              fullWidth
              margin="normal"
              value={formValues.court_number}
              onChange={(e) => setFormValues({ ...formValues, court_number: e.target.value })}
            />

            <TextField
              label="Court Type"
              fullWidth
              margin="normal"
              value={formValues.court_type}
              onChange={(e) => setFormValues({ ...formValues, court_type: e.target.value })}
              helperText="default: pickleball"
            />

            <FormControl fullWidth margin="normal">
              <InputLabel>Surface Type</InputLabel>
              <Select
                label="Surface Type"
                value={formValues.surface_type}
                onChange={(e) => setFormValues({ ...formValues, surface_type: e.target.value })}
              >
                <MenuItem value="">—</MenuItem>
                {SURFACE_TYPES.map((s) => (
                  <MenuItem key={s} value={s}>
                    {s}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Capacity"
              fullWidth
              margin="normal"
              value={formValues.capacity}
              onChange={(e) => setFormValues({ ...formValues, capacity: e.target.value })}
            />

            <TextField
              label="Hourly Rate"
              fullWidth
              margin="normal"
              value={formValues.hourly_rate}
              onChange={(e) => setFormValues({ ...formValues, hourly_rate: e.target.value })}
            />

            <FormControl fullWidth margin="normal">
              <InputLabel>Status</InputLabel>
              <Select
                label="Status"
                value={formValues.status}
                onChange={(e) => setFormValues({ ...formValues, status: e.target.value })}
              >
                {STATUS.map((s) => (
                  <MenuItem key={s} value={s}>
                    {s}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Description"
              fullWidth
              margin="normal"
              multiline
              minRows={2}
              value={formValues.description}
              onChange={(e) => setFormValues({ ...formValues, description: e.target.value })}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={!!formValues.has_lights}
                  onChange={(e) => setFormValues({ ...formValues, has_lights: e.target.checked })}
                />
              }
              label="Has Lights"
              sx={{ mt: 1 }}
            />
          </DialogContent>

          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={save}
              disabled={createCourt.isPending || updateCourt.isPending}
            >
              {editCourt ? "Update" : "Create"}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </AdminLayout>
  );
};
