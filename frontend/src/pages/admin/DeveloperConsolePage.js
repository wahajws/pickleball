import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Alert,
  CircularProgress,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { AdminLayout } from '../../components/layouts/AdminLayout';
import apiClient from '../../utils/apiClient';
import { useToast } from '../../components/common/Toast';

// Helper function to generate basic table config
const createBasicTableConfig = (name, endpoint, displayFields = ['id', 'created_at'], readOnly = false) => ({
  name,
  endpoint,
  displayFields,
  readOnly,
  formFields: readOnly ? [] : displayFields.map(field => ({
    name: field,
    label: field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    type: 'text'
  }))
});

// Table definitions with their endpoints and field configurations
const TABLES = {
  // Platform Admin Tables
  companies: {
    name: 'Companies',
    endpoint: '/admin/platform/companies',
    displayFields: ['name', 'slug', 'status', 'timezone', 'default_currency'],
    formFields: [
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'slug', label: 'Slug', type: 'text', required: true },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'website_url', label: 'Website URL', type: 'text' },
      { name: 'timezone', label: 'Timezone', type: 'text', defaultValue: 'UTC' },
      { name: 'default_currency', label: 'Currency', type: 'text', defaultValue: 'MYR' },
      { name: 'status', label: 'Status', type: 'select', options: ['active', 'suspended', 'deleted'], defaultValue: 'active' },
    ],
  },
  users: createBasicTableConfig('Users', '/admin/platform/users', ['email', 'first_name', 'last_name', 'status', 'created_at']),
  roles: createBasicTableConfig('Roles', '/admin/platform/roles', ['name', 'role_type', 'is_system_role']),
  permissions: createBasicTableConfig('Permissions', '/admin/platform/permissions', ['name', 'resource', 'action']),
  userRoles: createBasicTableConfig('User Roles', '/admin/platform/user-roles', ['user_id', 'role_id', 'company_id', 'branch_id']),
  rolePermissions: createBasicTableConfig('Role Permissions', '/admin/platform/role-permissions', ['role_id', 'permission_id']),
  authIdentities: createBasicTableConfig('Auth Identities', '/admin/platform/auth-identities', ['user_id', 'provider', 'email', 'is_primary']),
  authSessions: createBasicTableConfig('Auth Sessions', '/admin/platform/auth-sessions', ['user_id', 'status', 'expires_at']),
  otpCodes: createBasicTableConfig('OTP Codes', '/admin/platform/otp-codes', ['phone', 'email', 'code', 'status', 'purpose']),
  companyCustomers: createBasicTableConfig('Company Customers', '/admin/platform/company-customers', ['user_id', 'company_id', 'status']),
  
  // All Platform Admin Tables (Full CRUD Access)
  branches: createBasicTableConfig('Branches', '/admin/platform/branches', ['name', 'city', 'state', 'status']),
  branchContacts: createBasicTableConfig('Branch Contacts', '/admin/platform/branch-contacts', ['branch_id', 'contact_type', 'contact_value']),
  branchAmenities: createBasicTableConfig('Branch Amenities', '/admin/platform/branch-amenities', ['branch_id', 'name']),
  branchStaff: createBasicTableConfig('Branch Staff', '/admin/platform/branch-staff', ['branch_id', 'user_id', 'position']),
  branchBusinessHours: createBasicTableConfig('Branch Business Hours', '/admin/platform/branch-business-hours', ['branch_id', 'day_of_week', 'open_time', 'close_time']),
  branchSpecialHours: createBasicTableConfig('Branch Special Hours', '/admin/platform/branch-special-hours', ['branch_id', 'date', 'is_closed']),
  courts: createBasicTableConfig('Courts', '/admin/platform/courts', ['branch_id', 'name', 'court_number', 'status']),
  courtFeatures: createBasicTableConfig('Court Features', '/admin/platform/court-features', ['court_id', 'feature_name', 'feature_value']),
  courtRateRules: createBasicTableConfig('Court Rate Rules', '/admin/platform/court-rate-rules', ['branch_id', 'court_id', 'rate_per_hour']),
  courtTimeSlots: createBasicTableConfig('Court Time Slots', '/admin/platform/court-time-slots', ['court_id', 'slot_start_datetime', 'slot_end_datetime']),
  resourceBlocks: createBasicTableConfig('Resource Blocks', '/admin/platform/resource-blocks', ['branch_id', 'court_id', 'block_type', 'start_datetime']),
  services: createBasicTableConfig('Services', '/admin/platform/services', ['company_id', 'name', 'service_type', 'is_active']),
  serviceBranchAvailability: createBasicTableConfig('Service Branch Availability', '/admin/platform/service-branch-availability', ['service_id', 'branch_id', 'is_available']),
  membershipPlans: createBasicTableConfig('Membership Plans', '/admin/platform/membership-plans', ['company_id', 'name', 'plan_type', 'price']),
  membershipPlanBenefits: createBasicTableConfig('Membership Plan Benefits', '/admin/platform/membership-plan-benefits', ['membership_plan_id', 'benefit_type', 'benefit_value']),
  customerMemberships: createBasicTableConfig('Customer Memberships', '/admin/platform/customer-memberships', ['user_id', 'membership_plan_id', 'status']),
  membershipCycles: createBasicTableConfig('Membership Cycles', '/admin/platform/membership-cycles', ['customer_membership_id', 'cycle_number', 'total_amount']),
  membershipUsageLedger: createBasicTableConfig('Membership Usage Ledger', '/admin/platform/membership-usage-ledger', ['customer_membership_id', 'benefit_type', 'amount']),
  campaigns: createBasicTableConfig('Campaigns', '/admin/platform/campaigns', ['company_id', 'name', 'discount_type', 'is_active']),
  campaignRules: createBasicTableConfig('Campaign Rules', '/admin/platform/campaign-rules', ['campaign_id', 'rule_type', 'rule_value']),
  promoCodes: createBasicTableConfig('Promo Codes', '/admin/platform/promo-codes', ['company_id', 'code', 'is_active']),
  discountApplications: createBasicTableConfig('Discount Applications', '/admin/platform/discount-applications', ['campaign_id', 'user_id', 'discount_amount']),
  bookings: createBasicTableConfig('Bookings', '/admin/platform/bookings', ['user_id', 'company_id', 'booking_number', 'booking_status']),
  bookingItems: createBasicTableConfig('Booking Items', '/admin/platform/booking-items', ['booking_id', 'court_id', 'start_datetime', 'total_amount']),
  bookingParticipants: createBasicTableConfig('Booking Participants', '/admin/platform/booking-participants', ['booking_id', 'user_id', 'is_primary']),
  bookingChangeLog: createBasicTableConfig('Booking Change Log', '/admin/platform/booking-change-log', ['booking_id', 'change_type', 'changed_by']),
  bookingWaitlist: createBasicTableConfig('Booking Waitlist', '/admin/platform/booking-waitlist', ['user_id', 'court_id', 'status']),
  courtReservationLocks: createBasicTableConfig('Court Reservation Locks', '/admin/platform/court-reservation-locks', ['court_id', 'start_datetime', 'end_datetime']),
  payments: createBasicTableConfig('Payments', '/admin/platform/payments', ['user_id', 'amount', 'payment_status', 'payment_method']),
  paymentAttempts: createBasicTableConfig('Payment Attempts', '/admin/platform/payment-attempts', ['payment_id', 'attempt_number', 'status']),
  refunds: createBasicTableConfig('Refunds', '/admin/platform/refunds', ['payment_id', 'amount', 'refund_status']),
  invoices: createBasicTableConfig('Invoices', '/admin/platform/invoices', ['invoice_number', 'user_id', 'total_amount', 'invoice_status']),
  invoiceItems: createBasicTableConfig('Invoice Items', '/admin/platform/invoice-items', ['invoice_id', 'item_type', 'total_amount']),
  customerWalletLedger: createBasicTableConfig('Customer Wallet Ledger', '/admin/platform/customer-wallet-ledger', ['user_id', 'transaction_type', 'amount']),
  giftCards: createBasicTableConfig('Gift Cards', '/admin/platform/gift-cards', ['company_id', 'code', 'current_balance', 'status']),
  giftCardRedemptions: createBasicTableConfig('Gift Card Redemptions', '/admin/platform/gift-card-redemptions', ['gift_card_id', 'amount_used']),
  notificationTemplates: createBasicTableConfig('Notification Templates', '/admin/platform/notification-templates', ['company_id', 'template_name', 'channel', 'is_active']),
  notificationsOutbox: createBasicTableConfig('Notifications Outbox', '/admin/platform/notifications-outbox', ['user_id', 'status', 'channel']),
  notificationDeliveryLogs: createBasicTableConfig('Notification Delivery Logs', '/admin/platform/notification-delivery-logs', ['notification_id', 'status']),
  userNotificationPreferences: createBasicTableConfig('User Notification Preferences', '/admin/platform/user-notification-preferences', ['user_id', 'notification_type', 'is_enabled']),
  reviews: createBasicTableConfig('Reviews', '/admin/platform/reviews', ['user_id', 'rating', 'status']),
  supportTickets: createBasicTableConfig('Support Tickets', '/admin/platform/support-tickets', ['ticket_number', 'user_id', 'status', 'priority']),
  supportTicketMessages: createBasicTableConfig('Support Ticket Messages', '/admin/platform/support-ticket-messages', ['ticket_id', 'user_id']),
  groups: createBasicTableConfig('Groups', '/admin/platform/groups', ['company_id', 'name', 'is_active']),
  groupMembers: createBasicTableConfig('Group Members', '/admin/platform/group-members', ['group_id', 'user_id', 'role']),
  groupBookings: createBasicTableConfig('Group Bookings', '/admin/platform/group-bookings', ['group_id', 'booking_id']),
  taxRates: createBasicTableConfig('Tax Rates', '/admin/platform/tax-rates', ['company_id', 'name', 'rate_percentage']),
  mediaFiles: createBasicTableConfig('Media Files', '/admin/platform/media-files', ['owner_type', 'owner_id', 'file_name', 'content_type']),
  mediaVariants: createBasicTableConfig('Media Variants', '/admin/platform/media-variants', ['media_file_id', 'variant_type']),
  
  // Additional tables with actual endpoints
  auditLogs: {
    name: 'Audit Logs',
    endpoint: '/admin/activity',
    displayFields: ['action', 'entity_type', 'entity_id', 'created_at'],
    readOnly: true,
    formFields: [],
  },
};

function DeveloperConsolePage() {
  const { tableName } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [selectedTable, setSelectedTable] = useState(tableName || 'companies');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [formData, setFormData] = useState({});
  const [companyId, setCompanyId] = useState('');
  const [branchId, setBranchId] = useState('');
  const [planId, setPlanId] = useState('');

  const tableConfig = TABLES[selectedTable];

  useEffect(() => {
    if (tableName && tableName !== selectedTable) {
      setSelectedTable(tableName);
    }
  }, [tableName]);

  useEffect(() => {
    if (selectedTable) {
      loadData();
    }
  }, [selectedTable, companyId, branchId]);

  const buildEndpoint = () => {
    let endpoint = tableConfig.endpoint;
    if (tableConfig.requiresCompany && companyId) {
      endpoint = endpoint.replace(':companyId', companyId);
    }
    if (tableConfig.requiresBranch && branchId) {
      endpoint = endpoint.replace(':branchId', branchId);
    }
    if (tableConfig.requiresPlan && planId) {
      endpoint = endpoint.replace(':planId', planId);
    }
    return endpoint;
  };

  const loadData = async () => {
    if (tableConfig.requiresCompany && !companyId) {
      setData([]);
      return;
    }
    if (tableConfig.requiresBranch && !branchId) {
      setData([]);
      return;
    }
    if (tableConfig.requiresPlan && !planId) {
      setData([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const endpoint = buildEndpoint();
      const response = await apiClient.get(endpoint);
      setData(Array.isArray(response.data.data) ? response.data.data : []);
    } catch (err) {
      if (err.response?.status === 404) {
        setError(`Endpoint not found: ${buildEndpoint()}. This table may not have a backend endpoint yet.`);
      } else {
        setError(err.response?.data?.message || err.message || 'Failed to load data');
      }
      setData([]);
      // Don't show toast for 404s - it's expected for some tables
      if (err.response?.status !== 404) {
        showToast('Error loading data', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingRecord(null);
    const initialData = {};
    tableConfig.formFields.forEach(field => {
      initialData[field.name] = field.defaultValue !== undefined ? field.defaultValue : '';
    });
    setFormData(initialData);
    setDialogOpen(true);
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    setFormData(record);
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this record?')) {
      return;
    }

    try {
      const endpoint = `${buildEndpoint()}/${id}`;
      await apiClient.delete(endpoint);
      showToast('Record deleted successfully', 'success');
      loadData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete record', 'error');
    }
  };

  const handleSave = async () => {
    try {
      const endpoint = buildEndpoint();
      if (editingRecord) {
        await apiClient.patch(`${endpoint}/${editingRecord.id}`, formData);
        showToast('Record updated successfully', 'success');
      } else {
        await apiClient.post(endpoint, formData);
        showToast('Record created successfully', 'success');
      }
      setDialogOpen(false);
      loadData();
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to save record';
      showToast(errorMsg, 'error');
    }
  };

  const renderFormField = (field) => {
    const value = formData[field.name] || field.defaultValue || '';

    switch (field.type) {
      case 'textarea':
        return (
          <TextField
            key={field.name}
            fullWidth
            label={field.label}
            name={field.name}
            value={value}
            onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
            multiline
            rows={4}
            required={field.required}
            sx={{ mb: 2 }}
          />
        );
      case 'select':
        return (
          <FormControl fullWidth key={field.name} sx={{ mb: 2 }} required={field.required}>
            <InputLabel>{field.label}</InputLabel>
            <Select
              value={value}
              label={field.label}
              onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
            >
              {field.options?.map(option => (
                <MenuItem key={option} value={option}>{option}</MenuItem>
              ))}
            </Select>
          </FormControl>
        );
      case 'checkbox':
        return (
          <FormControlLabel
            key={field.name}
            control={
              <Checkbox
                checked={value || false}
                onChange={(e) => setFormData({ ...formData, [field.name]: e.target.checked })}
              />
            }
            label={field.label}
            sx={{ mb: 2 }}
          />
        );
      case 'number':
        return (
          <TextField
            key={field.name}
            fullWidth
            type="number"
            label={field.label}
            name={field.name}
            value={value}
            onChange={(e) => setFormData({ ...formData, [field.name]: parseFloat(e.target.value) || 0 })}
            required={field.required}
            sx={{ mb: 2 }}
          />
        );
      default:
        return (
          <TextField
            key={field.name}
            fullWidth
            type={field.type || 'text'}
            label={field.label}
            name={field.name}
            value={value}
            onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
            required={field.required}
            sx={{ mb: 2 }}
          />
        );
    }
  };

  const formatValue = (value) => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  return (
    <AdminLayout>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', mb: 3 }}>
          <Typography variant="h4" sx={{ flexGrow: 1 }}>
            Developer Console
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreate}
            disabled={loading || tableConfig.readOnly || (tableConfig.requiresCompany && !companyId) || (tableConfig.requiresBranch && !branchId) || (tableConfig.requiresPlan && !planId)}
          >
            Add New
          </Button>
          <IconButton onClick={loadData} disabled={loading} sx={{ ml: 1 }}>
            <RefreshIcon />
          </IconButton>
        </Box>

        {/* Table Selector */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Select Table</InputLabel>
                <Select
                  value={selectedTable}
                  label="Select Table"
                  onChange={(e) => {
                    setSelectedTable(e.target.value);
                    navigate(`/admin/developer-console/${e.target.value}`);
                  }}
                >
                  {Object.keys(TABLES).map(key => (
                    <MenuItem key={key} value={key}>
                      {TABLES[key].name}
                      {TABLES[key].readOnly && ' (Read Only)'}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            {tableConfig.requiresCompany && (
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="Company ID"
                  value={companyId}
                  onChange={(e) => setCompanyId(e.target.value)}
                  placeholder="Required"
                />
              </Grid>
            )}
            {tableConfig.requiresBranch && (
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="Branch ID"
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
                  placeholder="Required"
                />
              </Grid>
            )}
            {tableConfig.requiresPlan && (
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="Plan ID"
                  value={planId}
                  onChange={(e) => setPlanId(e.target.value)}
                  placeholder="Required"
                />
              </Grid>
            )}
          </Grid>
        </Paper>

        {/* Data Table */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        )}

        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  {tableConfig.displayFields.map(field => (
                    <TableCell key={field}>
                      <strong>{field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</strong>
                    </TableCell>
                  ))}
                  <TableCell><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={tableConfig.displayFields.length + 1} align="center">
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={tableConfig.displayFields.length + 1} align="center">
                      No records found
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((row) => (
                    <TableRow key={row.id} hover>
                      {tableConfig.displayFields.map(field => (
                        <TableCell key={field}>
                          {formatValue(row[field])}
                        </TableCell>
                      ))}
                      <TableCell>
                        {!tableConfig.readOnly && (
                          <>
                            <IconButton
                              size="small"
                              onClick={() => handleEdit(row)}
                              color="primary"
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleDelete(row.id)}
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            {editingRecord ? `Edit ${tableConfig.name}` : `Create New ${tableConfig.name}`}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              {tableConfig.formFields.map(field => renderFormField(field))}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} variant="contained" color="primary">
              {editingRecord ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </AdminLayout>
  );
}

export default DeveloperConsolePage;
