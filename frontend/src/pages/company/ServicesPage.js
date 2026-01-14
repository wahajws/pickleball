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
  MenuItem,
  Switch,
  FormControlLabel,
} from "@mui/material";
import { Add, Edit, Delete } from "@mui/icons-material";
import { CompanyLayout } from "../../components/layouts/CompanyLayout";
import { Loading } from "../../components/common/Loading";
import { useToast } from "../../components/common/Toast";
import {
  useApiQuery,
  useApiMutation,
  useApiUpdate,
  useApiDelete,
} from "../../hooks/useQuery";
import { API_ENDPOINTS } from "../../config/api";
import { formatDateTime } from "../../utils/format";

// must match backend ENUM exactly
const SERVICE_TYPES = [
  { value: "court_booking", label: "Court Booking" },
  { value: "gym_membership", label: "Gym Membership" },
  { value: "class_session", label: "Class Session" },
  { value: "coaching", label: "Coaching" },
  { value: "equipment_rental", label: "Equipment Rental" },
  { value: "other", label: "Other" },
];

const getLoggedInUserId = () => {
  // try common keys
  const keysToTry = ["user", "auth", "authUser"];
  for (const k of keysToTry) {
    try {
      const raw = localStorage.getItem(k);
      if (!raw) continue;
      const obj = JSON.parse(raw);
      if (obj?.id) return obj.id;
      if (obj?.user?.id) return obj.user.id;
    } catch {
      // ignore
    }
  }
  return null;
};

const extractErrorMessage = (err) => {
  const data = err?.response?.data;
  if (data?.errors?.length) {
    // backend style: { errors: [{field,message}, ...] }
    return data.errors.map((e) => `${e.field}: ${e.message}`).join("\n");
  }
  return data?.message || "Request failed";
};

export const ServicesPage = () => {
  const { companyId } = useParams();
  const { showToast } = useToast();

  const [openDialog, setOpenDialog] = useState(false);
  const [editService, setEditService] = useState(null);

  // ✅ fields aligned with backend Service model
  const [formValues, setFormValues] = useState({
    name: "",
    service_type: "",
    description: "",
    base_price: "",
    currency: "MYR",
    is_active: true,
  });

  // ✅ choose correct endpoint
  // your working request was like:
  // POST http://localhost:3001/api/admin/companies/:companyId/services
  const listEndpoint =
    API_ENDPOINTS.SERVICES?.LIST
      ? API_ENDPOINTS.SERVICES.LIST(companyId)
      : API_ENDPOINTS.ADMIN.COMPANY.SERVICES(companyId);

  const createEndpoint =
    API_ENDPOINTS.SERVICES?.CREATE
      ? API_ENDPOINTS.SERVICES.CREATE(companyId)
      : API_ENDPOINTS.ADMIN.COMPANY.SERVICES(companyId);

  const updateEndpoint = (serviceId) =>
    API_ENDPOINTS.SERVICES?.UPDATE
      ? API_ENDPOINTS.SERVICES.UPDATE(companyId, serviceId)
      : `${API_ENDPOINTS.ADMIN.COMPANY.SERVICES(companyId)}/${serviceId}`;

  const deleteEndpoint = (serviceId) =>
    API_ENDPOINTS.SERVICES?.DELETE
      ? API_ENDPOINTS.SERVICES.DELETE(companyId, serviceId)
      : `${API_ENDPOINTS.ADMIN.COMPANY.SERVICES(companyId)}/${serviceId}`;

  const { data, isLoading, error, refetch } = useApiQuery(
    ["company", "services", companyId],
    listEndpoint,
    { enabled: !!companyId }
  );

  // ✅ supports: { data: { services: [] } } OR { data: [] } OR []
  const services = useMemo(() => {
    if (Array.isArray(data?.data?.services)) return data.data.services;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data)) return data;
    return [];
  }, [data]);

  // ✅ CREATE (POST)
  const createService = useApiMutation(createEndpoint, {
    onSuccess: () => {
      showToast("Service created successfully", "success");
      setOpenDialog(false);
      refetch();
    },
    onError: (err) => {
      showToast(extractErrorMessage(err), "error");
    },
  });

  // ✅ UPDATE (PATCH via your hook)
  const updateService = useApiUpdate((id) => updateEndpoint(id), {
    onSuccess: () => {
      showToast("Service updated successfully", "success");
      setOpenDialog(false);
      setEditService(null);
      refetch();
    },
    onError: (err) => {
      showToast(extractErrorMessage(err), "error");
    },
  });

  // ✅ DELETE
  const deleteService = useApiDelete((id) => deleteEndpoint(id), {
    onSuccess: () => {
      showToast("Service deleted successfully", "success");
      refetch();
    },
    onError: (err) => {
      showToast(extractErrorMessage(err), "error");
    },
  });

  const handleOpenDialog = (service = null) => {
    if (service) {
      setEditService(service);
      setFormValues({
        name: service.name || "",
        service_type: service.service_type || "",
        description: service.description || "",
        base_price:
          service.base_price === null || service.base_price === undefined
            ? ""
            : String(service.base_price),
        currency: service.currency || "MYR",
        is_active: service.is_active !== false,
      });
    } else {
      setEditService(null);
      setFormValues({
        name: "",
        service_type: "",
        description: "",
        base_price: "",
        currency: "MYR",
        is_active: true,
      });
    }
    setOpenDialog(true);
  };

  const handleSave = async () => {
    if (!companyId) {
      showToast("companyId missing in URL", "error");
      return;
    }

    // basic validation
    if (!formValues.name?.trim()) {
      showToast("Service name required", "error");
      return;
    }
    if (!formValues.service_type) {
      showToast("Service type required", "error");
      return;
    }

    const userId = getLoggedInUserId();

    const payload = {
      company_id: companyId, // safe
      name: formValues.name.trim(),
      service_type: formValues.service_type,
      description: formValues.description?.trim() || null,
      base_price:
        formValues.base_price === "" ? null : Number(formValues.base_price),
      currency: (formValues.currency || "MYR").toUpperCase(),
      is_active: !!formValues.is_active,
    };

    // If backend requires these and doesn’t set from token, this fixes 400
    if (userId) {
      if (!editService) payload.created_by = userId;
      payload.updated_by = userId;
    }

    try {
      if (editService) {
        await updateService.mutateAsync({ id: editService.id, data: payload });
      } else {
        await createService.mutateAsync(payload); // IMPORTANT: only payload
      }
    } catch {
      // error handled in onError
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this service?")) {
      await deleteService.mutateAsync(id);
    }
  };

  if (isLoading) {
    return (
      <CompanyLayout>
        <Loading />
      </CompanyLayout>
    );
  }

  if (error) {
    return (
      <CompanyLayout>
        <Container maxWidth="lg" sx={{ mt: 3 }}>
          <Alert severity="error">
            {error?.response?.data?.message || "Failed to load services"}
          </Alert>
        </Container>
      </CompanyLayout>
    );
  }

  return (
    <CompanyLayout>
      <Container maxWidth="lg" sx={{ mt: 3 }}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Typography variant="h4">Services</Typography>
          <Button
            startIcon={<Add />}
            variant="contained"
            onClick={() => handleOpenDialog()}
          >
            Add Service
          </Button>
        </Box>

        <Paper sx={{ p: 2 }}>
          {services.length ? (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Base Price</TableCell>
                  <TableCell>Currency</TableCell>
                  <TableCell>Active</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {services.map((s) => (
                  <TableRow key={s.id} hover>
                    <TableCell>{s.name}</TableCell>
                    <TableCell>{s.service_type}</TableCell>
                    <TableCell>{s.base_price ?? "—"}</TableCell>
                    <TableCell>{s.currency ?? "MYR"}</TableCell>
                    <TableCell>{s.is_active ? "Yes" : "No"}</TableCell>
                    <TableCell>
                      {s.created_at ? formatDateTime(s.created_at) : "—"}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        color="primary"
                        onClick={() => handleOpenDialog(s)}
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => handleDelete(s.id)}
                      >
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Typography color="text.secondary">No services found</Typography>
          )}
        </Paper>

        <Dialog open={openDialog} onClose={() => setOpenDialog(false)} fullWidth>
          <DialogTitle>
            {editService ? "Edit Service" : "Add New Service"}
          </DialogTitle>

          <DialogContent>
            <TextField
              label="Service Name"
              fullWidth
              margin="normal"
              value={formValues.name}
              onChange={(e) =>
                setFormValues({ ...formValues, name: e.target.value })
              }
            />

            <TextField
              select
              label="Service Type"
              fullWidth
              margin="normal"
              value={formValues.service_type}
              onChange={(e) =>
                setFormValues({ ...formValues, service_type: e.target.value })
              }
            >
              <MenuItem value="">-- Select Type --</MenuItem>
              {SERVICE_TYPES.map((t) => (
                <MenuItem key={t.value} value={t.value}>
                  {t.label}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Description"
              fullWidth
              margin="normal"
              multiline
              minRows={2}
              value={formValues.description}
              onChange={(e) =>
                setFormValues({ ...formValues, description: e.target.value })
              }
            />

            <TextField
              label="Base Price"
              type="number"
              fullWidth
              margin="normal"
              value={formValues.base_price}
              onChange={(e) =>
                setFormValues({ ...formValues, base_price: e.target.value })
              }
            />

            <TextField
              label="Currency"
              fullWidth
              margin="normal"
              value={formValues.currency}
              onChange={(e) =>
                setFormValues({
                  ...formValues,
                  currency: e.target.value.toUpperCase(),
                })
              }
              inputProps={{ maxLength: 3 }}
              helperText="Example: MYR"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={!!formValues.is_active}
                  onChange={(e) =>
                    setFormValues({ ...formValues, is_active: e.target.checked })
                  }
                />
              }
              label="Active"
            />
          </DialogContent>

          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={createService.isPending || updateService.isPending}
            >
              {editService ? "Update" : "Create"}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </CompanyLayout>
  );
};
