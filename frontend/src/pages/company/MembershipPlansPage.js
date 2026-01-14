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

const PLAN_TYPES = ["recurring", "prepaid_pass", "credits"];
const PLAN_SCOPES = ["company_wide", "branch_specific"];
const BILLING_TYPES = ["monthly", "annual", "prepaid_passes", "credits"];

export const MembershipPlansPage = () => {
  const { companyId } = useParams();
  const { showToast } = useToast();

  const [openDialog, setOpenDialog] = useState(false);
  const [editPlan, setEditPlan] = useState(null);

  const [formValues, setFormValues] = useState({
    name: "",
    description: "",
    service_id: "",
    plan_type: "recurring",
    plan_scope: "company_wide",
    branch_id: "",
    billing_type: "monthly",
    billing_cycle_days: "",
    price: "",
    currency: "MYR",
    max_active_per_user: 1,
    is_active: true,
  });

  // ---------------------------
  // Endpoints (same fallback style you used)
  // ---------------------------

  // membership plans endpoints
  const membershipEndpoint =
    API_ENDPOINTS.MEMBERSHIP_PLANS?.LIST
      ? API_ENDPOINTS.MEMBERSHIP_PLANS.LIST(companyId)
      : API_ENDPOINTS.ADMIN?.COMPANY?.MEMBERSHIP_PLANS
      ? API_ENDPOINTS.ADMIN.COMPANY.MEMBERSHIP_PLANS(companyId)
      : `/admin/companies/${companyId}/membership-plans`;

  const membershipCreateEndpoint =
    API_ENDPOINTS.MEMBERSHIP_PLANS?.CREATE
      ? API_ENDPOINTS.MEMBERSHIP_PLANS.CREATE(companyId)
      : membershipEndpoint;

  const membershipUpdateEndpoint = (id) =>
    API_ENDPOINTS.MEMBERSHIP_PLANS?.UPDATE
      ? API_ENDPOINTS.MEMBERSHIP_PLANS.UPDATE(companyId, id)
      : `${membershipEndpoint}/${id}`;

  const membershipDeleteEndpoint = (id) =>
    API_ENDPOINTS.MEMBERSHIP_PLANS?.DELETE
      ? API_ENDPOINTS.MEMBERSHIP_PLANS.DELETE(companyId, id)
      : `${membershipEndpoint}/${id}`;

  // services list endpoint (for dropdown)
  const servicesEndpoint =
    API_ENDPOINTS.SERVICES?.LIST
      ? API_ENDPOINTS.SERVICES.LIST(companyId)
      : API_ENDPOINTS.ADMIN?.COMPANY?.SERVICES
      ? API_ENDPOINTS.ADMIN.COMPANY.SERVICES(companyId)
      : `/admin/companies/${companyId}/services`;

  // branches list endpoint (for dropdown when branch_specific)
  const branchesEndpoint =
    API_ENDPOINTS.BRANCHES?.LIST
      ? API_ENDPOINTS.BRANCHES.LIST(companyId)
      : `/companies/${companyId}/branches`;

  // ---------------------------
  // Queries
  // ---------------------------
  const {
    data: membershipData,
    isLoading: membershipLoading,
    error: membershipError,
    refetch: refetchMemberships,
  } = useApiQuery(["company", "membership-plans", companyId], membershipEndpoint, {
    enabled: !!companyId,
  });

  const { data: servicesData } = useApiQuery(
    ["company", "services", companyId],
    servicesEndpoint,
    { enabled: !!companyId }
  );

  const { data: branchesData } = useApiQuery(
    ["company", "branches", companyId],
    branchesEndpoint,
    { enabled: !!companyId }
  );

  // membership plans response shapes
  const plans = useMemo(() => {
    if (Array.isArray(membershipData?.data?.membership_plans)) return membershipData.data.membership_plans;
    if (Array.isArray(membershipData?.data?.plans)) return membershipData.data.plans;
    if (Array.isArray(membershipData?.data)) return membershipData.data;
    if (Array.isArray(membershipData)) return membershipData;
    return [];
  }, [membershipData]);

  // services response shapes
  const services = useMemo(() => {
    if (Array.isArray(servicesData?.data?.services)) return servicesData.data.services;
    if (Array.isArray(servicesData?.data)) return servicesData.data;
    if (Array.isArray(servicesData)) return servicesData;
    return [];
  }, [servicesData]);

  const servicesById = useMemo(() => {
    const map = new Map();
    services.forEach((s) => map.set(s.id, s));
    return map;
  }, [services]);

  // branches response shapes (your branches API was { data: { branches: [] } })
  const branches = useMemo(() => {
    if (Array.isArray(branchesData?.data?.branches)) return branchesData.data.branches;
    if (Array.isArray(branchesData?.data)) return branchesData.data;
    if (Array.isArray(branchesData)) return branchesData;
    return [];
  }, [branchesData]);

  const branchesById = useMemo(() => {
    const map = new Map();
    branches.forEach((b) => map.set(b.id, b));
    return map;
  }, [branches]);

  // ---------------------------
  // Mutations (using your existing hooks)
  // ---------------------------
  const createPlan = useApiMutation(membershipCreateEndpoint, {
    onSuccess: () => {
      showToast("Membership plan created successfully", "success");
      setOpenDialog(false);
      refetchMemberships();
    },
    onError: (err) => {
      showToast(err?.response?.data?.message || "Failed to create membership plan", "error");
    },
  });

  const updatePlan = useApiUpdate((id) => membershipUpdateEndpoint(id), {
    onSuccess: () => {
      showToast("Membership plan updated successfully", "success");
      setOpenDialog(false);
      setEditPlan(null);
      refetchMemberships();
    },
    onError: (err) => {
      showToast(err?.response?.data?.message || "Failed to update membership plan", "error");
    },
  });

  const deletePlan = useApiDelete((id) => membershipDeleteEndpoint(id), {
    onSuccess: () => {
      showToast("Membership plan deleted successfully", "success");
      refetchMemberships();
    },
    onError: (err) => {
      showToast(err?.response?.data?.message || "Failed to delete membership plan", "error");
    },
  });

  // ---------------------------
  // Dialog helpers
  // ---------------------------
  const resetForm = () => {
    setFormValues({
      name: "",
      description: "",
      service_id: "",
      plan_type: "recurring",
      plan_scope: "company_wide",
      branch_id: "",
      billing_type: "monthly",
      billing_cycle_days: "",
      price: "",
      currency: "MYR",
      max_active_per_user: 1,
      is_active: true,
    });
  };

  const handleOpenDialog = (plan = null) => {
    if (plan) {
      setEditPlan(plan);
      setFormValues({
        name: plan.name || "",
        description: plan.description || "",
        service_id: plan.service_id || "",
        plan_type: plan.plan_type || "recurring",
        plan_scope: plan.plan_scope || "company_wide",
        branch_id: plan.branch_id || "",
        billing_type: plan.billing_type || "monthly",
        billing_cycle_days: plan.billing_cycle_days ?? "",
        price: plan.price ?? "",
        currency: plan.currency || "MYR",
        max_active_per_user: plan.max_active_per_user ?? 1,
        is_active: plan.is_active ?? true,
      });
    } else {
      setEditPlan(null);
      resetForm();
    }
    setOpenDialog(true);
  };

  const handleSave = async () => {
    if (!companyId) {
      showToast("companyId missing in URL", "error");
      return;
    }

    // required fields by your model
    if (!formValues.name) return showToast("Name is required", "error");
    if (!formValues.service_id) return showToast("Service is required", "error");
    if (!formValues.plan_type) return showToast("Plan type is required", "error");
    if (!formValues.plan_scope) return showToast("Plan scope is required", "error");
    if (!formValues.billing_type) return showToast("Billing type is required", "error");
    if (formValues.price === "" || formValues.price === null) return showToast("Price is required", "error");

    if (formValues.plan_scope === "branch_specific" && !formValues.branch_id) {
      return showToast("Branch is required for branch-specific plans", "error");
    }

    // Build payload exactly matching backend model fields
    const payload = {
      name: formValues.name,
      description: formValues.description || null,
      service_id: formValues.service_id,
      plan_type: formValues.plan_type,
      plan_scope: formValues.plan_scope,
      billing_type: formValues.billing_type,
      billing_cycle_days:
        formValues.billing_cycle_days === "" ? null : Number(formValues.billing_cycle_days),
      price: Number(formValues.price),
      currency: formValues.currency || "MYR",
      max_active_per_user: Number(formValues.max_active_per_user || 1),
      is_active: !!formValues.is_active,
      // branch_id is only valid when branch_specific
      branch_id: formValues.plan_scope === "branch_specific" ? formValues.branch_id : null,
    };

    if (editPlan) {
      await updatePlan.mutateAsync({ id: editPlan.id, data: payload });
    } else {
      await createPlan.mutateAsync(payload);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this membership plan?")) {
      await deletePlan.mutateAsync(id);
    }
  };

  // ---------------------------
  // UI states
  // ---------------------------
  if (membershipLoading) {
    return (
      <CompanyLayout>
        <Loading />
      </CompanyLayout>
    );
  }

  if (membershipError) {
    return (
      <CompanyLayout>
        <Container maxWidth="lg" sx={{ mt: 3 }}>
          <Alert severity="error">
            {membershipError?.response?.data?.message || "Failed to load membership plans"}
          </Alert>
        </Container>
      </CompanyLayout>
    );
  }

  return (
    <CompanyLayout>
      <Container maxWidth="lg" sx={{ mt: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h4">Membership Plans</Typography>
          <Button startIcon={<Add />} variant="contained" onClick={() => handleOpenDialog()}>
            Add Plan
          </Button>
        </Box>

        <Paper sx={{ p: 2 }}>
          {plans.length ? (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Service</TableCell>
                  <TableCell>Scope</TableCell>
                  <TableCell>Branch</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Billing</TableCell>
                  <TableCell>Price</TableCell>
                  <TableCell>Active</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {plans.map((p) => {
                  const serviceName = servicesById.get(p.service_id)?.name || p.service_id || "—";
                  const branchName = p.branch_id ? (branchesById.get(p.branch_id)?.name || p.branch_id) : "—";
                  return (
                    <TableRow key={p.id} hover>
                      <TableCell>{p.name}</TableCell>
                      <TableCell>{serviceName}</TableCell>
                      <TableCell>{p.plan_scope}</TableCell>
                      <TableCell>{branchName}</TableCell>
                      <TableCell>{p.plan_type}</TableCell>
                      <TableCell>{p.billing_type}</TableCell>
                      <TableCell>
                        {p.currency} {p.price}
                      </TableCell>
                      <TableCell>{p.is_active ? "Yes" : "No"}</TableCell>
                      <TableCell>{p.created_at ? formatDateTime(p.created_at) : "—"}</TableCell>
                      <TableCell align="right">
                        <IconButton color="primary" onClick={() => handleOpenDialog(p)}>
                          <Edit />
                        </IconButton>
                        <IconButton color="error" onClick={() => handleDelete(p.id)}>
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <Typography color="text.secondary">No membership plans found</Typography>
          )}
        </Paper>

        {/* Dialog */}
        <Dialog open={openDialog} onClose={() => setOpenDialog(false)} fullWidth maxWidth="sm">
          <DialogTitle>{editPlan ? "Edit Membership Plan" : "Add Membership Plan"}</DialogTitle>
          <DialogContent>
            <TextField
              label="Plan Name"
              fullWidth
              margin="normal"
              value={formValues.name}
              onChange={(e) => setFormValues({ ...formValues, name: e.target.value })}
            />

            <FormControl fullWidth margin="normal">
              <InputLabel>Service</InputLabel>
              <Select
                label="Service"
                value={formValues.service_id}
                onChange={(e) => setFormValues({ ...formValues, service_id: e.target.value })}
              >
                {services.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth margin="normal">
              <InputLabel>Plan Type</InputLabel>
              <Select
                label="Plan Type"
                value={formValues.plan_type}
                onChange={(e) => setFormValues({ ...formValues, plan_type: e.target.value })}
              >
                {PLAN_TYPES.map((t) => (
                  <MenuItem key={t} value={t}>
                    {t}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth margin="normal">
              <InputLabel>Plan Scope</InputLabel>
              <Select
                label="Plan Scope"
                value={formValues.plan_scope}
                onChange={(e) => {
                  const newScope = e.target.value;
                  setFormValues({
                    ...formValues,
                    plan_scope: newScope,
                    // clear branch if switching to company_wide
                    branch_id: newScope === "branch_specific" ? formValues.branch_id : "",
                  });
                }}
              >
                {PLAN_SCOPES.map((s) => (
                  <MenuItem key={s} value={s}>
                    {s}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {formValues.plan_scope === "branch_specific" && (
              <FormControl fullWidth margin="normal">
                <InputLabel>Branch</InputLabel>
                <Select
                  label="Branch"
                  value={formValues.branch_id}
                  onChange={(e) => setFormValues({ ...formValues, branch_id: e.target.value })}
                >
                  {branches.map((b) => (
                    <MenuItem key={b.id} value={b.id}>
                      {b.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            <FormControl fullWidth margin="normal">
              <InputLabel>Billing Type</InputLabel>
              <Select
                label="Billing Type"
                value={formValues.billing_type}
                onChange={(e) => setFormValues({ ...formValues, billing_type: e.target.value })}
              >
                {BILLING_TYPES.map((b) => (
                  <MenuItem key={b} value={b}>
                    {b}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Billing Cycle Days (optional)"
              fullWidth
              margin="normal"
              value={formValues.billing_cycle_days}
              onChange={(e) => setFormValues({ ...formValues, billing_cycle_days: e.target.value })}
            />

            <TextField
              label="Price"
              fullWidth
              margin="normal"
              value={formValues.price}
              onChange={(e) => setFormValues({ ...formValues, price: e.target.value })}
            />

            <TextField
              label="Currency"
              fullWidth
              margin="normal"
              value={formValues.currency}
              onChange={(e) => setFormValues({ ...formValues, currency: e.target.value.toUpperCase() })}
            />

            <TextField
              label="Max Active Per User"
              fullWidth
              margin="normal"
              value={formValues.max_active_per_user}
              onChange={(e) => setFormValues({ ...formValues, max_active_per_user: e.target.value })}
            />

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
                  checked={!!formValues.is_active}
                  onChange={(e) => setFormValues({ ...formValues, is_active: e.target.checked })}
                />
              }
              label="Active"
              sx={{ mt: 1 }}
            />
          </DialogContent>

          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={createPlan.isPending || updatePlan.isPending}
            >
              {editPlan ? "Update" : "Create"}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </CompanyLayout>
  );
};
