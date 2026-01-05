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
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  TablePagination,
  TableSortLabel,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  Grid,
} from '@mui/material';
import {
  History as HistoryIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { AdminLayout } from '../../components/layouts/AdminLayout';
import { useApiQuery } from '../../hooks/useQuery';
import { API_ENDPOINTS } from '../../config/api';
import { Loading } from '../../components/common/Loading';
import { formatDateTime } from '../../utils/format';

export const AuditLogsPage = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [entityTypeFilter, setEntityTypeFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedLog, setSelectedLog] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  // Build query params
  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    params.append('page', (page + 1).toString());
    params.append('limit', rowsPerPage.toString());
    params.append('sort', sortBy);
    params.append('order', sortOrder);
    if (entityTypeFilter !== 'all') {
      params.append('entity_type', entityTypeFilter);
    }
    if (dateFrom) {
      params.append('date_from', dateFrom);
    }
    if (dateTo) {
      params.append('date_to', dateTo);
    }
    return params.toString();
  }, [page, rowsPerPage, entityTypeFilter, dateFrom, dateTo, sortBy, sortOrder]);

  const { data, isLoading, error } = useApiQuery(
    ['admin', 'audit-logs', queryParams],
    `${API_ENDPOINTS.ADMIN.PLATFORM.AUDIT_LOGS}?${queryParams}`,
    { enabled: false } // Disable until endpoint exists - using mock data
  );

  // Mock data for now
  const auditLogs = data?.data || [];
  const totalCount = data?.pagination?.total || auditLogs.length;

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleViewDetail = (log) => {
    setSelectedLog(log);
    setDetailDialogOpen(true);
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'create':
        return 'success';
      case 'update':
        return 'info';
      case 'delete':
        return 'error';
      case 'login':
      case 'logout':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <AdminLayout>
      <Container maxWidth="lg">
        <Box display="flex" alignItems="center" mb={3}>
          <HistoryIcon sx={{ mr: 1, fontSize: 32 }} />
          <Typography variant="h4">Audit Logs</Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error.response?.status === 403
              ? 'You do not have permission to view audit logs'
              : 'Failed to load audit logs'}
          </Alert>
        )}

        {/* Filters */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Entity Type</InputLabel>
                <Select
                  value={entityTypeFilter}
                  label="Entity Type"
                  onChange={(e) => {
                    setEntityTypeFilter(e.target.value);
                    setPage(0);
                  }}
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="company">Company</MenuItem>
                  <MenuItem value="branch">Branch</MenuItem>
                  <MenuItem value="user">User</MenuItem>
                  <MenuItem value="booking">Booking</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                size="small"
                label="Date From"
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setPage(0);
                }}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                size="small"
                label="Date To"
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setPage(0);
                }}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="body2" color="text.secondary">
                {totalCount} total entries
              </Typography>
            </Grid>
          </Grid>
        </Paper>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  <TableSortLabel
                    active={sortBy === 'created_at'}
                    direction={sortBy === 'created_at' ? sortOrder : 'desc'}
                    onClick={() => handleSort('created_at')}
                  >
                    Timestamp
                  </TableSortLabel>
                </TableCell>
                <TableCell>Actor</TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortBy === 'action'}
                    direction={sortBy === 'action' ? sortOrder : 'asc'}
                    onClick={() => handleSort('action')}
                  >
                    Action
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortBy === 'entity_type'}
                    direction={sortBy === 'entity_type' ? sortOrder : 'asc'}
                    onClick={() => handleSort('entity_type')}
                  >
                    Entity Type
                  </TableSortLabel>
                </TableCell>
                <TableCell>Entity ID</TableCell>
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
                  </TableRow>
                ))
              ) : auditLogs.length > 0 ? (
                auditLogs.map((log) => (
                  <TableRow key={log.id} hover>
                    <TableCell>{formatDateTime(log.created_at)}</TableCell>
                    <TableCell>{log.actor_user_id || 'System'}</TableCell>
                    <TableCell>
                      <Chip
                        label={log.action}
                        size="small"
                        color={getActionColor(log.action)}
                      />
                    </TableCell>
                    <TableCell>{log.entity_type}</TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {log.entity_id?.substring(0, 8)}...
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        startIcon={<ViewIcon />}
                        onClick={() => handleViewDetail(log)}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">No audit logs found</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={totalCount}
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

        {/* Detail Dialog */}
        <Dialog
          open={detailDialogOpen}
          onClose={() => setDetailDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Audit Log Details</DialogTitle>
          <DialogContent>
            {selectedLog && (
              <Box>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Actor
                    </Typography>
                    <Typography variant="body1">{selectedLog.actor_user_id || 'System'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Action
                    </Typography>
                    <Chip
                      label={selectedLog.action}
                      size="small"
                      color={getActionColor(selectedLog.action)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Entity Type
                    </Typography>
                    <Typography variant="body1">{selectedLog.entity_type}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Entity ID
                    </Typography>
                    <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                      {selectedLog.entity_id}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Timestamp
                    </Typography>
                    <Typography variant="body1">{formatDateTime(selectedLog.created_at)}</Typography>
                  </Grid>
                  {selectedLog.before_snapshot && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Before
                      </Typography>
                      <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                        <pre style={{ margin: 0, fontSize: '0.875rem' }}>
                          {JSON.stringify(selectedLog.before_snapshot, null, 2)}
                        </pre>
                      </Paper>
                    </Grid>
                  )}
                  {selectedLog.after_snapshot && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        After
                      </Typography>
                      <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                        <pre style={{ margin: 0, fontSize: '0.875rem' }}>
                          {JSON.stringify(selectedLog.after_snapshot, null, 2)}
                        </pre>
                      </Paper>
                    </Grid>
                  )}
                  {selectedLog.metadata && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Metadata
                      </Typography>
                      <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                        <pre style={{ margin: 0, fontSize: '0.875rem' }}>
                          {JSON.stringify(selectedLog.metadata, null, 2)}
                        </pre>
                      </Paper>
                    </Grid>
                  )}
                </Grid>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </Container>
    </AdminLayout>
  );
};


