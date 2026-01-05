import React, { useState, useMemo } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TablePagination,
  Skeleton,
  Alert,
  Drawer,
  IconButton,
  Divider,
} from '@mui/material';
import {
  Timeline as ActivityIcon,
  FileDownload as ExportIcon,
  Close as CloseIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { AdminLayout } from '../../components/layouts/AdminLayout';
import { useApiQuery } from '../../hooks/useQuery';
import apiClient from '../../utils/apiClient';
import { API_ENDPOINTS } from '../../config/api';
import { Loading } from '../../components/common/Loading';
import { useToast } from '../../components/common/Toast';
import { formatDateTime } from '../../utils/format';

const ACTION_OPTIONS = [
  'signup', 'login', 'logout', 'otp_request', 'otp_verify',
  'booking_created', 'booking_rescheduled', 'booking_cancelled',
  'membership_purchased', 'membership_cancelled',
  'payment_intent_created', 'payment_confirmed', 'refund_created',
  'promo_validated', 'promo_applied',
  'gift_card_purchased', 'gift_card_redeemed',
  'media_uploaded', 'media_deleted',
  'company_created', 'company_updated', 'company_suspended',
];

const ENTITY_TYPE_OPTIONS = [
  'auth', 'booking', 'membership', 'payment', 'promo', 'gift_card',
  'media', 'company', 'branch', 'user',
];

export const ActivityPage = () => {
  const { showToast } = useToast();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [filters, setFilters] = useState({
    from: '',
    to: '',
    company_id: '',
    branch_id: '',
    actor_user_id: '',
    action: [],
    entity_type: [],
    search: '',
  });
  const [detailDrawer, setDetailDrawer] = useState({ open: false, activity: null });

  // Build query params
  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    params.append('page', (page + 1).toString());
    params.append('pageSize', rowsPerPage.toString());
    if (filters.from) params.append('from', filters.from);
    if (filters.to) params.append('to', filters.to);
    if (filters.company_id) params.append('company_id', filters.company_id);
    if (filters.branch_id) params.append('branch_id', filters.branch_id);
    if (filters.actor_user_id) params.append('actor_user_id', filters.actor_user_id);
    if (filters.action.length > 0) {
      filters.action.forEach(a => params.append('action', a));
    }
    if (filters.entity_type.length > 0) {
      filters.entity_type.forEach(e => params.append('entity_type', e));
    }
    if (filters.search) params.append('search', filters.search);
    return params.toString();
  }, [page, rowsPerPage, filters]);

  const { data, isLoading, error } = useApiQuery(
    ['admin', 'activity', queryParams],
    `${API_ENDPOINTS.ADMIN.PLATFORM.ACTIVITY}?${queryParams}`
  );

  const activities = data?.data?.items || [];
  const total = data?.data?.total || 0;

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPage(0);
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.from) params.append('from', filters.from);
      if (filters.to) params.append('to', filters.to);
      if (filters.company_id) params.append('company_id', filters.company_id);
      if (filters.branch_id) params.append('branch_id', filters.branch_id);
      if (filters.actor_user_id) params.append('actor_user_id', filters.actor_user_id);
      if (filters.action.length > 0) {
        filters.action.forEach(a => params.append('action', a));
      }
      if (filters.entity_type.length > 0) {
        filters.entity_type.forEach(e => params.append('entity_type', e));
      }
      if (filters.search) params.append('search', filters.search);

      const response = await apiClient.get(
        `${API_ENDPOINTS.ADMIN.PLATFORM.ACTIVITY_EXPORT}?${params.toString()}`,
        { responseType: 'blob' }
      );

      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `activities-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Activities exported successfully', 'success');
    } catch (error) {
      showToast('Failed to export activities', 'error');
    }
  };

  const handleViewDetail = (activity) => {
    setDetailDrawer({ open: true, activity });
  };

  const getActionColor = (action) => {
    if (action.includes('created') || action === 'signup' || action === 'login') return 'success';
    if (action.includes('cancelled') || action === 'logout' || action === 'delete') return 'error';
    if (action.includes('updated') || action.includes('verify')) return 'info';
    return 'default';
  };

  if (error) {
    return (
      <AdminLayout>
        <Container maxWidth="lg">
          <Alert severity="error" sx={{ mt: 3 }}>
            {error.response?.status === 403
              ? 'You do not have permission to view activities'
              : error.response?.status === 401
              ? 'Please log in again'
              : 'Failed to load activities'}
          </Alert>
        </Container>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Container maxWidth="lg">
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
          <Box display="flex" alignItems="center" gap={1}>
            <ActivityIcon sx={{ fontSize: 32 }} />
            <Typography variant="h4">User Activity</Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<ExportIcon />}
            onClick={handleExport}
            disabled={isLoading}
          >
            Export CSV
          </Button>
        </Box>

        {/* Filters */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                size="small"
                label="Date From"
                type="date"
                value={filters.from}
                onChange={(e) => handleFilterChange('from', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                size="small"
                label="Date To"
                type="date"
                value={filters.to}
                onChange={(e) => handleFilterChange('to', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                size="small"
                label="Company ID"
                value={filters.company_id}
                onChange={(e) => handleFilterChange('company_id', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                size="small"
                label="Branch ID"
                value={filters.branch_id}
                onChange={(e) => handleFilterChange('branch_id', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                label="Search (Actor Email or Entity ID)"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Actions</InputLabel>
                <Select
                  multiple
                  value={filters.action}
                  label="Actions"
                  onChange={(e) => handleFilterChange('action', e.target.value)}
                  renderValue={(selected) => selected.join(', ')}
                >
                  {ACTION_OPTIONS.map(action => (
                    <MenuItem key={action} value={action}>{action}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Entity Types</InputLabel>
                <Select
                  multiple
                  value={filters.entity_type}
                  label="Entity Types"
                  onChange={(e) => handleFilterChange('entity_type', e.target.value)}
                  renderValue={(selected) => selected.join(', ')}
                >
                  {ENTITY_TYPE_OPTIONS.map(type => (
                    <MenuItem key={type} value={type}>{type}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Time</TableCell>
                <TableCell>Actor</TableCell>
                <TableCell>Company</TableCell>
                <TableCell>Branch</TableCell>
                <TableCell>Action</TableCell>
                <TableCell>Entity Type</TableCell>
                <TableCell>Entity ID</TableCell>
                <TableCell>IP Address</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 10 }).map((_, idx) => (
                  <TableRow key={idx}>
                    <TableCell><Skeleton /></TableCell>
                    <TableCell><Skeleton /></TableCell>
                    <TableCell><Skeleton /></TableCell>
                    <TableCell><Skeleton /></TableCell>
                    <TableCell><Skeleton /></TableCell>
                    <TableCell><Skeleton /></TableCell>
                    <TableCell><Skeleton /></TableCell>
                    <TableCell><Skeleton /></TableCell>
                    <TableCell><Skeleton /></TableCell>
                  </TableRow>
                ))
              ) : activities.length > 0 ? (
                activities.map((activity) => (
                  <TableRow key={activity.id} hover>
                    <TableCell>{formatDateTime(activity.created_at)}</TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">{activity.actor_name}</Typography>
                        {activity.actor_email && (
                          <Typography variant="caption" color="text.secondary">
                            {activity.actor_email}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {activity.company_id ? (
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                          {activity.company_id.substring(0, 8)}...
                        </Typography>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell>
                      {activity.branch_id ? (
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                          {activity.branch_id.substring(0, 8)}...
                        </Typography>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={activity.action}
                        size="small"
                        color={getActionColor(activity.action)}
                      />
                    </TableCell>
                    <TableCell>{activity.entity_type}</TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                        {activity.entity_id?.substring(0, 8)}...
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {activity.ip_address || '—'}
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        startIcon={<ViewIcon />}
                        onClick={() => handleViewDetail(activity)}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">No activities found</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={total}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[10, 25, 50, 100]}
          />
        </TableContainer>

        {/* Detail Drawer */}
        <Drawer
          anchor="right"
          open={detailDrawer.open}
          onClose={() => setDetailDrawer({ open: false, activity: null })}
          PaperProps={{ sx: { width: { xs: '100%', sm: 600 } } }}
        >
          <Box sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Activity Details</Typography>
              <IconButton onClick={() => setDetailDrawer({ open: false, activity: null })}>
                <CloseIcon />
              </IconButton>
            </Box>
            <Divider sx={{ mb: 3 }} />
            {detailDrawer.activity && (
              <Box>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Time</Typography>
                    <Typography variant="body1">{formatDateTime(detailDrawer.activity.created_at)}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Actor</Typography>
                    <Typography variant="body1">{detailDrawer.activity.actor_name}</Typography>
                    {detailDrawer.activity.actor_email && (
                      <Typography variant="body2" color="text.secondary">
                        {detailDrawer.activity.actor_email}
                      </Typography>
                    )}
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Action</Typography>
                    <Chip
                      label={detailDrawer.activity.action}
                      size="small"
                      color={getActionColor(detailDrawer.activity.action)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Entity Type</Typography>
                    <Typography variant="body1">{detailDrawer.activity.entity_type}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Entity ID</Typography>
                    <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                      {detailDrawer.activity.entity_id}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">IP Address</Typography>
                    <Typography variant="body1">{detailDrawer.activity.ip_address || '—'}</Typography>
                  </Grid>
                  {detailDrawer.activity.user_agent && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">User Agent</Typography>
                      <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                        {detailDrawer.activity.user_agent}
                      </Typography>
                    </Grid>
                  )}
                  {detailDrawer.activity.metadata && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Metadata
                      </Typography>
                      <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50', maxHeight: 400, overflow: 'auto' }}>
                        <pre style={{ margin: 0, fontSize: '0.875rem' }}>
                          {JSON.stringify(detailDrawer.activity.metadata, null, 2)}
                        </pre>
                      </Paper>
                    </Grid>
                  )}
                  {detailDrawer.activity.before_snapshot && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Before Snapshot
                      </Typography>
                      <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50', maxHeight: 300, overflow: 'auto' }}>
                        <pre style={{ margin: 0, fontSize: '0.875rem' }}>
                          {JSON.stringify(detailDrawer.activity.before_snapshot, null, 2)}
                        </pre>
                      </Paper>
                    </Grid>
                  )}
                  {detailDrawer.activity.after_snapshot && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        After Snapshot
                      </Typography>
                      <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50', maxHeight: 300, overflow: 'auto' }}>
                        <pre style={{ margin: 0, fontSize: '0.875rem' }}>
                          {JSON.stringify(detailDrawer.activity.after_snapshot, null, 2)}
                        </pre>
                      </Paper>
                    </Grid>
                  )}
                </Grid>
              </Box>
            )}
          </Box>
        </Drawer>
      </Container>
    </AdminLayout>
  );
};


