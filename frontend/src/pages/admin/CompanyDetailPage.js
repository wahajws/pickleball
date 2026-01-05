import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Chip,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  Card,
  CardContent,
  Alert,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  FormControlLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Block as SuspendIcon,
  CheckCircle as ActivateIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Logout as ForceLogoutIcon,
  VpnKey as RegenerateKeysIcon,
  PersonAdd,
  AccountBox as ImpersonateIcon,
  PersonRemove as RemoveAdminIcon,
  LockReset as ResetPasswordIcon,
} from '@mui/icons-material';
import { AdminLayout } from '../../components/layouts/AdminLayout';
import { useApiQuery } from '../../hooks/useQuery';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../utils/apiClient';
import { API_ENDPOINTS } from '../../config/api';
import { Loading } from '../../components/common/Loading';
import { useToast } from '../../components/common/Toast';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { DangerConfirmDialog } from '../../components/admin/DangerConfirmDialog';
import { formatDateTime } from '../../utils/format';

const TabPanel = ({ children, value, index }) => (
  <div hidden={value !== index}>
    {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
  </div>
);

export const CompanyDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState(0);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, action: null });
  const [dangerDialog, setDangerDialog] = useState({ open: false, action: null });
  const [addAdminDialog, setAddAdminDialog] = useState({ open: false });
  const [adminSearch, setAdminSearch] = useState('');
  const [settings, setSettings] = useState({
    maxBranches: '',
    maxCourts: '',
    maxMonthlyBookings: '',
    subscriptionTier: 'basic',
    enableMemberships: true,
    enableGiftCards: true,
    enablePromos: true,
  });

  const { data, isLoading, error } = useApiQuery(
    ['admin', 'company', id],
    API_ENDPOINTS.ADMIN.PLATFORM.COMPANY_DETAIL(id)
  );

  // TODO: Backend needs these endpoints
  const { data: branchesData } = useApiQuery(
    ['admin', 'company', id, 'branches'],
    `/admin/companies/${id}/branches`,
    { enabled: false }
  );

  const { data: adminUsersData } = useApiQuery(
    ['admin', 'company', id, 'admin-users'],
    `/admin/platform/companies/${id}/admin-users`,
    { enabled: false }
  );

  const { data: auditLogsData } = useApiQuery(
    ['admin', 'company', id, 'audit-logs'],
    `${API_ENDPOINTS.ADMIN.PLATFORM.AUDIT_LOGS}?company_id=${id}&limit=10`,
    { enabled: false }
  );

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await apiClient.patch(
        API_ENDPOINTS.ADMIN.PLATFORM.COMPANY_DETAIL(id),
        data
      );
      return response.data;
    },
    onSuccess: () => {
      showToast('Company updated successfully', 'success');
      setConfirmDialog({ open: false, action: null });
      queryClient.invalidateQueries({ queryKey: ['admin', 'company', id] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'companies'] });
    },
    onError: (error) => {
      showToast(error.response?.data?.message || 'Failed to update company', 'error');
    },
  });

  const company = data?.data;
  const branches = branchesData?.data || [];
  const adminUsers = adminUsersData?.data || [];
  const auditLogs = auditLogsData?.data || [];

  const handleSuspend = () => {
    setConfirmDialog({ open: true, action: 'suspend' });
  };

  const handleActivate = () => {
    setConfirmDialog({ open: true, action: 'activate' });
  };

  const handleForceLogout = () => {
    // TODO: Backend needs force logout endpoint
    showToast('Force logout not yet implemented', 'info');
  };

  const handleRegenerateKeys = () => {
    // TODO: Backend needs regenerate keys endpoint
    showToast('Regenerate keys not yet implemented', 'info');
  };

  const handleImpersonate = () => {
    // TODO: Backend needs impersonation endpoint
    showToast('Impersonation not yet implemented', 'info');
  };

  const handleConfirm = () => {
    updateMutation.mutate({
      id,
      data: {
        status: confirmDialog.action === 'suspend' ? 'suspended' : 'active',
      },
    });
  };

  const handleAddAdmin = () => {
    // TODO: Backend needs add admin endpoint
    showToast('Add admin not yet implemented', 'info');
    setAddAdminDialog({ open: false });
  };

  const handleRemoveAdmin = (userId) => {
    // TODO: Backend needs remove admin endpoint
    showToast('Remove admin not yet implemented', 'info');
  };

  const handleResetAdminPassword = (userId) => {
    // TODO: Backend needs reset password endpoint
    showToast('Reset password not yet implemented', 'info');
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <Loading />
      </AdminLayout>
    );
  }

  if (error || !company) {
    return (
      <AdminLayout>
        <Container maxWidth="lg">
          <Alert severity="error" sx={{ mt: 3 }}>
            {error?.response?.status === 404
              ? 'Company not found'
              : 'Failed to load company details'}
          </Alert>
          <Button
            startIcon={<BackIcon />}
            onClick={() => navigate('/admin/companies')}
            sx={{ mt: 2 }}
          >
            Back to Companies
          </Button>
        </Container>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Container maxWidth="lg">
        {/* Header */}
        <Box display="flex" alignItems="center" mb={3}>
          <Button
            startIcon={<BackIcon />}
            onClick={() => navigate('/admin/companies')}
            sx={{ mr: 1 }}
          >
            Back
          </Button>
          <Typography variant="h4" sx={{ flexGrow: 1 }}>
            {company.name}
          </Typography>
          <Chip
            label={company.status}
            color={
              company.status === 'active'
                ? 'success'
                : company.status === 'suspended'
                ? 'error'
                : 'default'
            }
            sx={{ mr: 2 }}
          />
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={() => navigate(`/admin/companies/${id}/edit`)}
            sx={{ mr: 1 }}
          >
            Edit
          </Button>
          {company.status === 'active' ? (
            <Button
              variant="outlined"
              color="error"
              startIcon={<SuspendIcon />}
              onClick={handleSuspend}
              disabled={updateMutation.isLoading}
            >
              Suspend
            </Button>
          ) : (
            <Button
              variant="outlined"
              color="success"
              startIcon={<ActivateIcon />}
              onClick={handleActivate}
              disabled={updateMutation.isLoading}
            >
              Activate
            </Button>
          )}
        </Box>

        {/* Tabs */}
        <Paper>
          <Tabs value={tab} onChange={(e, v) => setTab(v)}>
            <Tab label="Overview" />
            <Tab label="Admin Users" />
            <Tab label="Branches" />
            <Tab label="Limits & Settings" />
            <Tab label="Security & Access" />
            <Tab label="Audit Logs" />
          </Tabs>

          {/* Tab 1: Overview */}
          <TabPanel value={tab} index={0}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Company Overview
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  <List>
                    <ListItem>
                      <ListItemText primary="Name" secondary={company.name} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Slug" secondary={company.slug} />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Status"
                        secondary={
                          <Chip
                            label={company.status}
                            color={
                              company.status === 'active'
                                ? 'success'
                                : company.status === 'suspended'
                                ? 'error'
                                : 'default'
                            }
                            size="small"
                          />
                        }
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Created"
                        secondary={formatDateTime(company.created_at)}
                      />
                    </ListItem>
                    {company.updated_at && (
                      <ListItem>
                        <ListItemText
                          primary="Last Updated"
                          secondary={formatDateTime(company.updated_at)}
                        />
                      </ListItem>
                    )}
                  </List>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Company Statistics
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="h4" color="primary">
                            {branches.length}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Branches
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={6}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="h4" color="primary">
                            —
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Total Courts
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={6}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="h4" color="primary">
                            —
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Total Users
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={6}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="h4" color="primary">
                            —
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Total Bookings
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              <Grid item xs={12}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Recent Activity
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  {auditLogs.length > 0 ? (
                    <List dense>
                      {auditLogs.map((log) => (
                        <ListItem key={log.id}>
                          <ListItemText
                            primary={`${log.action} - ${log.entity_type}`}
                            secondary={`${log.actor_user_id} • ${formatDateTime(log.created_at)}`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No recent activity
                    </Typography>
                  )}
                </Paper>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Tab 2: Admin Users */}
          <TabPanel value={tab} index={1}>
            <Paper sx={{ p: 3 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h6">Company Administrators</Typography>
                <Button
                  variant="contained"
                  startIcon={<PersonAdd />}
                  onClick={() => setAddAdminDialog({ open: true })}
                >
                  Add Admin
                </Button>
              </Box>
              <Divider sx={{ mb: 3 }} />
              {adminUsers.length > 0 ? (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Phone</TableCell>
                        <TableCell>Assigned</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {adminUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>{user.first_name} {user.last_name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{user.phone || '—'}</TableCell>
                          <TableCell>{formatDateTime(user.assigned_at)}</TableCell>
                          <TableCell align="right">
                            <IconButton
                              size="small"
                              onClick={() => handleResetAdminPassword(user.id)}
                              title="Reset Password"
                            >
                              <ResetPasswordIcon />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleRemoveAdmin(user.id)}
                              title="Remove Admin"
                            >
                              <RemoveAdminIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No administrators assigned
                </Typography>
              )}
            </Paper>

            {/* Add Admin Dialog */}
            <Dialog
              open={addAdminDialog.open}
              onClose={() => setAddAdminDialog({ open: false })}
              maxWidth="sm"
              fullWidth
            >
              <DialogTitle>Add Company Administrator</DialogTitle>
              <DialogContent>
                <TextField
                  fullWidth
                  label="Search by email or phone"
                  value={adminSearch}
                  onChange={(e) => setAdminSearch(e.target.value)}
                  sx={{ mt: 2 }}
                />
                <Alert severity="info" sx={{ mt: 2 }}>
                  TODO: Backend needs user search and role assignment endpoints
                </Alert>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setAddAdminDialog({ open: false })}>Cancel</Button>
                <Button onClick={handleAddAdmin} variant="contained" disabled>
                  Add Admin
                </Button>
              </DialogActions>
            </Dialog>
          </TabPanel>

          {/* Tab 3: Branches */}
          <TabPanel value={tab} index={2}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Branches ({branches.length})
              </Typography>
              <Divider sx={{ my: 2 }} />
              {branches.length > 0 ? (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>City</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Created</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {branches.map((branch) => (
                        <TableRow key={branch.id}>
                          <TableCell>{branch.name}</TableCell>
                          <TableCell>{branch.city || '—'}</TableCell>
                          <TableCell>
                            <Chip
                              label={branch.status || 'active'}
                              size="small"
                              color={branch.status === 'active' ? 'success' : 'default'}
                            />
                          </TableCell>
                          <TableCell>{formatDateTime(branch.created_at)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No branches found
                </Typography>
              )}
            </Paper>
          </TabPanel>

          {/* Tab 4: Limits & Settings */}
          <TabPanel value={tab} index={3}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Platform Limits & Settings
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Alert severity="info" sx={{ mb: 3 }}>
                TODO: Backend needs company settings/limits table. These settings are stored locally only.
              </Alert>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Max Branches"
                    type="number"
                    value={settings.maxBranches}
                    onChange={(e) => setSettings({ ...settings, maxBranches: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Max Courts"
                    type="number"
                    value={settings.maxCourts}
                    onChange={(e) => setSettings({ ...settings, maxCourts: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Max Monthly Bookings"
                    type="number"
                    value={settings.maxMonthlyBookings}
                    onChange={(e) => setSettings({ ...settings, maxMonthlyBookings: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Subscription Tier</InputLabel>
                    <Select
                      value={settings.subscriptionTier}
                      label="Subscription Tier"
                      onChange={(e) => setSettings({ ...settings, subscriptionTier: e.target.value })}
                    >
                      <MenuItem value="basic">Basic</MenuItem>
                      <MenuItem value="pro">Pro</MenuItem>
                      <MenuItem value="enterprise">Enterprise</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle1" gutterBottom>
                    Feature Flags
                  </Typography>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.enableMemberships}
                        onChange={(e) => setSettings({ ...settings, enableMemberships: e.target.checked })}
                      />
                    }
                    label="Enable Memberships"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.enableGiftCards}
                        onChange={(e) => setSettings({ ...settings, enableGiftCards: e.target.checked })}
                      />
                    }
                    label="Enable Gift Cards"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.enablePromos}
                        onChange={(e) => setSettings({ ...settings, enablePromos: e.target.checked })}
                      />
                    }
                    label="Enable Promo Codes"
                  />
                </Grid>
              </Grid>
            </Paper>
          </TabPanel>

          {/* Tab 5: Security & Access */}
          <TabPanel value={tab} index={4}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Security Actions
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  <Box display="flex" flexDirection="column" gap={2}>
                    <Button
                      variant="outlined"
                      startIcon={<ForceLogoutIcon />}
                      onClick={handleForceLogout}
                    >
                      Force Logout All Sessions
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<RegenerateKeysIcon />}
                      onClick={handleRegenerateKeys}
                    >
                      Regenerate API Keys
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<ImpersonateIcon />}
                      onClick={handleImpersonate}
                    >
                      Login as Company Admin
                    </Button>
                  </Box>
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    TODO: Backend needs these security endpoints
                  </Alert>
                </Paper>
              </Grid>
              <Grid item xs={12}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Status History
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="body2" color="text.secondary">
                    Status change history would appear here
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Tab 6: Audit Logs */}
          <TabPanel value={tab} index={5}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Company Audit Logs
              </Typography>
              <Divider sx={{ my: 2 }} />
              {auditLogs.length > 0 ? (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Timestamp</TableCell>
                        <TableCell>Actor</TableCell>
                        <TableCell>Action</TableCell>
                        <TableCell>Entity Type</TableCell>
                        <TableCell>Entity ID</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {auditLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell>{formatDateTime(log.created_at)}</TableCell>
                          <TableCell>{log.actor_user_id || 'System'}</TableCell>
                          <TableCell>{log.action}</TableCell>
                          <TableCell>{log.entity_type}</TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                              {log.entity_id?.substring(0, 8)}...
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No audit logs found
                </Typography>
              )}
            </Paper>
          </TabPanel>
        </Paper>

        <ConfirmDialog
          open={confirmDialog.open}
          title={confirmDialog.action === 'suspend' ? 'Suspend Company' : 'Activate Company'}
          message={
            confirmDialog.action === 'suspend'
              ? `Suspending "${company.name}" will block all logins and operations for this company. Continue?`
              : `Are you sure you want to activate "${company.name}"?`
          }
          onConfirm={handleConfirm}
          onCancel={() => setConfirmDialog({ open: false, action: null })}
          severity={confirmDialog.action === 'suspend' ? 'error' : 'warning'}
        />
      </Container>
    </AdminLayout>
  );
};
