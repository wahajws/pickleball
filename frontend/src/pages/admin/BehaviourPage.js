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
  Analytics as BehaviourIcon,
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

const EVENT_OPTIONS = [
  'auth.signup',
  'auth.login',
  'auth.logout',
  'auth.otp_request',
  'auth.otp_verify',
  'profile.updated',
  'explore.search',
  'branch.view',
  'court.view',
  'gallery.view',
  'booking.start',
  'booking.slot_view',
  'booking.quote_view',
  'booking.promo_applied',
  'booking.giftcard_applied',
  'booking.confirmed',
  'booking.cancelled',
  'booking.rescheduled',
  'booking.failed',
  'membership.list_view',
  'membership.plan_view',
  'membership.purchase_started',
  'membership.purchase_completed',
  'membership.cancelled',
  'payment.intent_created',
  'payment.confirmed',
  'payment.failed',
  'refund.created',
  'notification.opened',
  'support.ticket_created',
  'media.uploaded',
  'media.deleted',
];

const DEVICE_OPTIONS = ['mobile', 'tablet', 'desktop', 'unknown'];

export const BehaviourPage = () => {
  const { showToast } = useToast();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  
  // Default to last 7 days
  const defaultFrom = new Date();
  defaultFrom.setDate(defaultFrom.getDate() - 7);
  const defaultTo = new Date();
  
  const [filters, setFilters] = useState({
    from: defaultFrom.toISOString().split('T')[0],
    to: defaultTo.toISOString().split('T')[0],
    company_id: '',
    branch_id: '',
    actor_user_id: '',
    event_name: [],
    device_type: '',
    search: '',
  });
  const [detailDrawer, setDetailDrawer] = useState({ open: false, event: null });

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
    if (filters.event_name.length > 0) {
      filters.event_name.forEach(e => params.append('event_name', e));
    }
    if (filters.device_type) params.append('device_type', filters.device_type);
    if (filters.search) params.append('search', filters.search);
    return params.toString();
  }, [page, rowsPerPage, filters]);

  const { data, isLoading, error } = useApiQuery(
    ['admin', 'behaviour', queryParams],
    `${API_ENDPOINTS.ADMIN.PLATFORM.BEHAVIOUR}?${queryParams}`
  );

  const events = data?.data?.items || [];
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
      if (filters.event_name.length > 0) {
        filters.event_name.forEach(e => params.append('event_name', e));
      }
      if (filters.device_type) params.append('device_type', filters.device_type);
      if (filters.search) params.append('search', filters.search);

      const response = await apiClient.get(
        `${API_ENDPOINTS.ADMIN.PLATFORM.BEHAVIOUR_EXPORT}?${params.toString()}`,
        { responseType: 'blob' }
      );

      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `behaviour-events-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Behaviour events exported successfully', 'success');
    } catch (error) {
      showToast('Failed to export behaviour events', 'error');
    }
  };

  const handleViewDetail = (event) => {
    setDetailDrawer({ open: true, event });
  };

  const getEventColor = (eventName) => {
    if (eventName.startsWith('auth.')) return 'primary';
    if (eventName.startsWith('booking.')) return 'success';
    if (eventName.startsWith('payment.')) return 'info';
    if (eventName.startsWith('membership.')) return 'warning';
    return 'default';
  };

  if (error) {
    return (
      <AdminLayout>
        <Container maxWidth="lg">
          <Alert severity="error" sx={{ mt: 3 }}>
            {error.response?.status === 403
              ? 'You do not have permission to view behaviour logs'
              : error.response?.status === 401
              ? 'Please log in again'
              : 'Failed to load behaviour events'}
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
            <BehaviourIcon sx={{ fontSize: 32 }} />
            <Typography variant="h4">Behaviour Logs</Typography>
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
                label="Search (User Email, Entity ID, Page Path)"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Events</InputLabel>
                <Select
                  multiple
                  value={filters.event_name}
                  label="Events"
                  onChange={(e) => handleFilterChange('event_name', e.target.value)}
                  renderValue={(selected) => selected.join(', ')}
                >
                  {EVENT_OPTIONS.map(event => (
                    <MenuItem key={event} value={event}>{event}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Device Type</InputLabel>
                <Select
                  value={filters.device_type}
                  label="Device Type"
                  onChange={(e) => handleFilterChange('device_type', e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  {DEVICE_OPTIONS.map(device => (
                    <MenuItem key={device} value={device}>{device}</MenuItem>
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
                <TableCell>User</TableCell>
                <TableCell>Event</TableCell>
                <TableCell>Company</TableCell>
                <TableCell>Branch</TableCell>
                <TableCell>Page/Route</TableCell>
                <TableCell>Device</TableCell>
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
                  </TableRow>
                ))
              ) : events.length > 0 ? (
                events.map((event) => (
                  <TableRow key={event.id} hover>
                    <TableCell>{formatDateTime(event.created_at)}</TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">{event.actor_name}</Typography>
                        {event.actor_email && (
                          <Typography variant="caption" color="text.secondary">
                            {event.actor_email}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={event.event_name}
                        size="small"
                        color={getEventColor(event.event_name)}
                      />
                    </TableCell>
                    <TableCell>
                      {event.company_id ? (
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                          {event.company_id.substring(0, 8)}...
                        </Typography>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell>
                      {event.branch_id ? (
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                          {event.branch_id.substring(0, 8)}...
                        </Typography>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell>
                      {event.page_path ? (
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                          {event.page_path}
                        </Typography>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip label={event.device_type} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        startIcon={<ViewIcon />}
                        onClick={() => handleViewDetail(event)}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">No behaviour events found</Typography>
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
          onClose={() => setDetailDrawer({ open: false, event: null })}
          PaperProps={{ sx: { width: { xs: '100%', sm: 600 } } }}
        >
          <Box sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Event Details</Typography>
              <IconButton onClick={() => setDetailDrawer({ open: false, event: null })}>
                <CloseIcon />
              </IconButton>
            </Box>
            <Divider sx={{ mb: 3 }} />
            {detailDrawer.event && (
              <Box>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Time</Typography>
                    <Typography variant="body1">{formatDateTime(detailDrawer.event.created_at)}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">User</Typography>
                    <Typography variant="body1">{detailDrawer.event.actor_name}</Typography>
                    {detailDrawer.event.actor_email && (
                      <Typography variant="body2" color="text.secondary">
                        {detailDrawer.event.actor_email}
                      </Typography>
                    )}
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Event</Typography>
                    <Chip
                      label={detailDrawer.event.event_name}
                      size="small"
                      color={getEventColor(detailDrawer.event.event_name)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Device</Typography>
                    <Chip label={detailDrawer.event.device_type} size="small" variant="outlined" />
                  </Grid>
                  {detailDrawer.event.page_path && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">Page Path</Typography>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {detailDrawer.event.page_path}
                      </Typography>
                    </Grid>
                  )}
                  {detailDrawer.event.referrer && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">Referrer</Typography>
                      <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                        {detailDrawer.event.referrer}
                      </Typography>
                    </Grid>
                  )}
                  {detailDrawer.event.session_id && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">Session ID</Typography>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                        {detailDrawer.event.session_id}
                      </Typography>
                    </Grid>
                  )}
                  {detailDrawer.event.properties && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Properties
                      </Typography>
                      <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50', maxHeight: 400, overflow: 'auto' }}>
                        <pre style={{ margin: 0, fontSize: '0.875rem' }}>
                          {JSON.stringify(detailDrawer.event.properties, null, 2)}
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


