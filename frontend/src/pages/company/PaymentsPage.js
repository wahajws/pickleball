import React, { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Container,
  Paper,
  Typography,
  Box,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
} from "@mui/material";
import { Add, Edit } from "@mui/icons-material";

import { CompanyLayout } from "../../components/layouts/CompanyLayout";
import { Loading } from "../../components/common/Loading";
import { useToast } from "../../components/common/Toast";
import { useApiQuery, useApiMutation, useApiUpdate } from "../../hooks/useQuery";
import { API_ENDPOINTS } from "../../config/api";
import { formatDateTime } from "../../utils/format";

const PAYMENT_STATUSES = ["pending", "paid", "failed", "refunded", "cancelled"];
const PAYMENT_METHODS = ["cash", "card", "bank_transfer", "online", "wallet", "other"];

export const PaymentsPage = () => {
  const { companyId } = useParams();
  const { showToast } = useToast();

  // Filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [fromDate, setFromDate] = useState(""); // yyyy-mm-dd
  const [toDate, setToDate] = useState(""); // yyyy-mm-dd

  // Create dialog
  const [openCreate, setOpenCreate] = useState(false);
  const [createValues, setCreateValues] = useState({
    // common fields
    amount: "",
    currency: "MYR",
    status: "paid",
    payment_method: "card",
    reference: "",
    notes: "",
    // link to booking/membership if applicable (optional)
    booking_id: "",
    membership_plan_id: "",
    customer_id: "",
  });

  // Update status dialog
  const [openUpdate, setOpenUpdate] = useState(false);
  const [editPayment, setEditPayment] = useState(null);
  const [editStatus, setEditStatus] = useState("paid");

  // -----------------------------
  // Endpoints (fallback style)
  // -----------------------------
  const baseListEndpoint =
    API_ENDPOINTS.PAYMENTS?.LIST
      ? API_ENDPOINTS.PAYMENTS.LIST(companyId)
      : API_ENDPOINTS.ADMIN?.COMPANY?.PAYMENTS
      ? API_ENDPOINTS.ADMIN.COMPANY.PAYMENTS(companyId)
      : `/admin/companies/${companyId}/payments`;

  const createEndpoint =
    API_ENDPOINTS.PAYMENTS?.CREATE
      ? API_ENDPOINTS.PAYMENTS.CREATE(companyId)
      : baseListEndpoint;

  const updateEndpoint = (paymentId) =>
    API_ENDPOINTS.PAYMENTS?.UPDATE
      ? API_ENDPOINTS.PAYMENTS.UPDATE(companyId, paymentId)
      : `${baseListEndpoint}/${paymentId}`;

  // Build query string for filters (only if backend supports)
  const listEndpoint = useMemo(() => {
    const params = new URLSearchParams();
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (fromDate) params.set("from", fromDate);
    if (toDate) params.set("to", toDate);

    const qs = params.toString();
    return qs ? `${baseListEndpoint}?${qs}` : baseListEndpoint;
  }, [baseListEndpoint, statusFilter, fromDate, toDate]);

  // -----------------------------
  // Fetch payments
  // -----------------------------
  const { data, isLoading, error, refetch } = useApiQuery(
    ["company", "payments", companyId, statusFilter, fromDate, toDate],
    listEndpoint,
    { enabled: !!companyId }
  );

  const payments = useMemo(() => {
    // handle multiple shapes like your other modules
    if (Array.isArray(data?.data?.payments)) return data.data.payments;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data)) return data;
    return [];
  }, [data]);

  // -----------------------------
  // Mutations
  // -----------------------------
  const createPayment = useApiMutation(createEndpoint, {
    onSuccess: () => {
      showToast("Payment created successfully", "success");
      setOpenCreate(false);
      refetch();
    },
    onError: (err) => {
      showToast(err?.response?.data?.message || "Failed to create payment", "error");
    },
  });

  const updatePayment = useApiUpdate((id) => updateEndpoint(id), {
    onSuccess: () => {
      showToast("Payment updated successfully", "success");
      setOpenUpdate(false);
      setEditPayment(null);
      refetch();
    },
    onError: (err) => {
      showToast(err?.response?.data?.message || "Failed to update payment", "error");
    },
  });

  // -----------------------------
  // Handlers
  // -----------------------------
  const resetCreateForm = () => {
    setCreateValues({
      amount: "",
      currency: "MYR",
      status: "paid",
      payment_method: "card",
      reference: "",
      notes: "",
      booking_id: "",
      membership_plan_id: "",
      customer_id: "",
    });
  };

  const handleOpenCreate = () => {
    resetCreateForm();
    setOpenCreate(true);
  };

  const handleCreate = async () => {
    if (!companyId) return showToast("companyId missing in URL", "error");

    if (createValues.amount === "" || Number(createValues.amount) <= 0) {
      return showToast("Amount is required", "error");
    }

    // ✅ payload (adjust names to your backend)
    const payload = {
      amount: Number(createValues.amount),
      currency: (createValues.currency || "MYR").toUpperCase(),
      status: createValues.status,
      payment_method: createValues.payment_method,
      reference: createValues.reference || null,
      notes: createValues.notes || null,

      // optional relations
      booking_id: createValues.booking_id || null,
      membership_plan_id: createValues.membership_plan_id || null,
      customer_id: createValues.customer_id || null,
    };

    await createPayment.mutateAsync(payload);
  };

  const handleOpenUpdate = (payment) => {
    setEditPayment(payment);
    setEditStatus(payment?.status || "paid");
    setOpenUpdate(true);
  };

  const handleUpdate = async () => {
    if (!editPayment?.id) return;

    const payload = { status: editStatus }; // adjust if backend expects different field
    await updatePayment.mutateAsync({ id: editPayment.id, data: payload });
  };

  // -----------------------------
  // UI states
  // -----------------------------
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
            {error?.response?.data?.message || "Failed to load payments"}
          </Alert>
        </Container>
      </CompanyLayout>
    );
  }

  return (
    <CompanyLayout>
      <Container maxWidth="lg" sx={{ mt: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h4">Payments</Typography>
          <Button startIcon={<Add />} variant="contained" onClick={handleOpenCreate}>
            Add Payment
          </Button>
        </Box>

        {/* Filters */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Box display="flex" gap={2} flexWrap="wrap" alignItems="center">
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Status</InputLabel>
              <Select
                label="Status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All</MenuItem>
                {PAYMENT_STATUSES.map((s) => (
                  <MenuItem key={s} value={s}>
                    {s}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="From"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />

            <TextField
              label="To"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />

            <Button variant="outlined" onClick={() => refetch()}>
              Apply
            </Button>

            <Button
              variant="text"
              onClick={() => {
                setStatusFilter("all");
                setFromDate("");
                setToDate("");
              }}
            >
              Clear
            </Button>
          </Box>
        </Paper>

        {/* Table */}
        <Paper sx={{ p: 2 }}>
          {payments.length ? (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Payment ID</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Booking</TableCell>
                  <TableCell>Membership</TableCell>
                  <TableCell>Method</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {payments.map((p) => (
                  <TableRow key={p.id} hover>
                    <TableCell>{String(p.id).slice(0, 8)}…</TableCell>

                    {/* customer shape varies */}
                    <TableCell>
                      {p.customer_name ||
                        p.user?.name ||
                        p.customer?.name ||
                        p.user?.email ||
                        p.customer_id ||
                        "—"}
                    </TableCell>

                    <TableCell>{p.booking_id || p.booking?.id || "—"}</TableCell>
                    <TableCell>{p.membership_plan_id || p.membership_plan?.id || "—"}</TableCell>

                    <TableCell>{p.payment_method || p.method || "—"}</TableCell>
                    <TableCell>{p.status || "—"}</TableCell>

                    <TableCell>
                      {(p.currency || "") + " "}
                      {p.amount ?? p.total_amount ?? "—"}
                    </TableCell>

                    <TableCell>{p.created_at ? formatDateTime(p.created_at) : "—"}</TableCell>

                    <TableCell align="right">
                      <IconButton color="primary" onClick={() => handleOpenUpdate(p)}>
                        <Edit />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Typography color="text.secondary">No payments found</Typography>
          )}
        </Paper>

        {/* Create Dialog */}
        <Dialog open={openCreate} onClose={() => setOpenCreate(false)} fullWidth maxWidth="sm">
          <DialogTitle>Add Payment</DialogTitle>

          <DialogContent>
            <TextField
              label="Amount"
              fullWidth
              margin="normal"
              value={createValues.amount}
              onChange={(e) => setCreateValues({ ...createValues, amount: e.target.value })}
            />

            <TextField
              label="Currency (e.g. MYR)"
              fullWidth
              margin="normal"
              value={createValues.currency}
              onChange={(e) => setCreateValues({ ...createValues, currency: e.target.value })}
            />

            <FormControl fullWidth margin="normal">
              <InputLabel>Status</InputLabel>
              <Select
                label="Status"
                value={createValues.status}
                onChange={(e) => setCreateValues({ ...createValues, status: e.target.value })}
              >
                {PAYMENT_STATUSES.map((s) => (
                  <MenuItem key={s} value={s}>
                    {s}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth margin="normal">
              <InputLabel>Payment Method</InputLabel>
              <Select
                label="Payment Method"
                value={createValues.payment_method}
                onChange={(e) => setCreateValues({ ...createValues, payment_method: e.target.value })}
              >
                {PAYMENT_METHODS.map((m) => (
                  <MenuItem key={m} value={m}>
                    {m}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Reference (optional)"
              fullWidth
              margin="normal"
              value={createValues.reference}
              onChange={(e) => setCreateValues({ ...createValues, reference: e.target.value })}
            />

            <TextField
              label="Notes (optional)"
              fullWidth
              margin="normal"
              multiline
              minRows={2}
              value={createValues.notes}
              onChange={(e) => setCreateValues({ ...createValues, notes: e.target.value })}
            />

            {/* Optional links */}
            <TextField
              label="Booking ID (optional)"
              fullWidth
              margin="normal"
              value={createValues.booking_id}
              onChange={(e) => setCreateValues({ ...createValues, booking_id: e.target.value })}
            />

            <TextField
              label="Membership Plan ID (optional)"
              fullWidth
              margin="normal"
              value={createValues.membership_plan_id}
              onChange={(e) => setCreateValues({ ...createValues, membership_plan_id: e.target.value })}
            />

            <TextField
              label="Customer ID (optional)"
              fullWidth
              margin="normal"
              value={createValues.customer_id}
              onChange={(e) => setCreateValues({ ...createValues, customer_id: e.target.value })}
            />
          </DialogContent>

          <DialogActions>
            <Button onClick={() => setOpenCreate(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleCreate} disabled={createPayment.isPending}>
              Create
            </Button>
          </DialogActions>
        </Dialog>

        {/* Update Status Dialog */}
        <Dialog open={openUpdate} onClose={() => setOpenUpdate(false)} fullWidth maxWidth="sm">
          <DialogTitle>Update Payment</DialogTitle>

          <DialogContent>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Payment: <b>{editPayment?.id}</b>
            </Typography>

            <FormControl fullWidth margin="normal">
              <InputLabel>Status</InputLabel>
              <Select
                label="Status"
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
              >
                {PAYMENT_STATUSES.map((s) => (
                  <MenuItem key={s} value={s}>
                    {s}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </DialogContent>

          <DialogActions>
            <Button onClick={() => setOpenUpdate(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleUpdate} disabled={updatePayment.isPending}>
              Save
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </CompanyLayout>
  );
};
