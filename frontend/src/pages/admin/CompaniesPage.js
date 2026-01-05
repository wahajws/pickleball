import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Chip,
  Box,
  Typography,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TablePagination,
  TableSortLabel,
  Skeleton,
  Alert,
  Grid,
  Checkbox,
  Toolbar,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Block as BlockIcon,
  CheckCircle as ActivateIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { AdminLayout } from '../../components/layouts/AdminLayout';
import { useApiQuery } from '../../hooks/useQuery';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../utils/apiClient';
import { API_ENDPOINTS } from '../../config/api';
import { ROUTES } from '../../utils/constants';
import { Loading } from '../../components/common/Loading';
import { useToast } from '../../components/common/Toast';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { DangerConfirmDialog } from '../../components/admin/DangerConfirmDialog';
import { CompanyActionsMenu } from '../../components/admin/CompanyActionsMenu';
import { AdvancedFilters } from '../../components/admin/AdvancedFilters';
import { BulkActionsToolbar } from '../../components/admin/BulkActionsToolbar';
import { formatDateTime } from '../../utils/format';

export const CompaniesPage = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [confirmDialog, setConfirmDialog] = useState({ open: false, company: null, action: null });
  const [dangerDialog, setDangerDialog] = useState({ open: false, company: null, action: null });
  const [selected, setSelected] = useState(new Set());
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [advancedFilters, setAdvancedFilters] = useState({
    dateFrom: '',
    dateTo: '',
    hasBranches: 'all',
    hasBookings: 'all',
  });
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  const { data, isLoading, error } = useApiQuery(
    ['admin', 'companies'],
    API_ENDPOINTS.ADMIN.PLATFORM.COMPANIES
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
      setConfirmDialog({ open: false, company: null, action: null });
      setSelected(new Set());
      queryClient.invalidateQueries({ queryKey: ['admin', 'companies'] });
    },
    onError: (error) => {
      showToast(error.response?.data?.message || 'Failed to update company', 'error');
    },
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ ids, data }) => {
      // TODO: Backend needs bulk update endpoint
      const promises = ids.map(id =>
        apiClient.patch(API_ENDPOINTS.ADMIN.PLATFORM.COMPANY_DETAIL(id), data)
      );
      await Promise.all(promises);
      return { success: true };
    },
    onSuccess: () => {
      showToast('Companies updated successfully', 'success');
      setSelected(new Set());
      queryClient.invalidateQueries({ queryKey: ['admin', 'companies'] });
    },
    onError: (error) => {
      showToast(error.response?.data?.message || 'Failed to update companies', 'error');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const response = await apiClient.delete(API_ENDPOINTS.ADMIN.PLATFORM.COMPANY_DETAIL(id));
      return response.data;
    },
    onSuccess: () => {
      showToast('Company deleted successfully', 'success');
      setDangerDialog({ open: false, company: null, action: null });
      setSelected(new Set());
      queryClient.invalidateQueries({ queryKey: ['admin', 'companies'] });
    },
    onError: (error) => {
      showToast(error.response?.data?.message || 'Failed to delete company', 'error');
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids) => {
      // TODO: Backend needs bulk delete endpoint
      const promises = ids.map(id =>
        apiClient.delete(API_ENDPOINTS.ADMIN.PLATFORM.COMPANY_DETAIL(id))
      );
      await Promise.all(promises);
      return { success: true };
    },
    onSuccess: () => {
      showToast('Companies deleted successfully', 'success');
      setSelected(new Set());
      queryClient.invalidateQueries({ queryKey: ['admin', 'companies'] });
    },
    onError: (error) => {
      showToast(error.response?.data?.message || 'Failed to delete companies', 'error');
    },
  });

  const companies = data?.data || [];

  // Filter and sort companies
  const filteredAndSorted = useMemo(() => {
    let filtered = [...companies];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (c) =>
          c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.slug?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((c) => c.status === statusFilter);
    }

    // Advanced filters
    if (advancedFilters.dateFrom) {
      filtered = filtered.filter(
        (c) => new Date(c.created_at) >= new Date(advancedFilters.dateFrom)
      );
    }
    if (advancedFilters.dateTo) {
      filtered = filtered.filter(
        (c) => new Date(c.created_at) <= new Date(advancedFilters.dateTo + 'T23:59:59')
      );
    }
    // TODO: hasBranches and hasBookings filters need backend support
    // For now, we'll skip these filters

    // Sort
    filtered.sort((a, b) => {
      let aVal, bVal;
      switch (sortBy) {
        case 'name':
          aVal = a.name?.toLowerCase() || '';
          bVal = b.name?.toLowerCase() || '';
          break;
        case 'status':
          aVal = a.status || '';
          bVal = b.status || '';
          break;
        case 'created_at':
        default:
          aVal = new Date(a.created_at).getTime();
          bVal = new Date(b.created_at).getTime();
          break;
      }

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      } else {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
      }
    });

    return filtered;
  }, [companies, searchTerm, statusFilter, advancedFilters, sortBy, sortOrder]);

  // Pagination
  const paginatedCompanies = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredAndSorted.slice(start, start + rowsPerPage);
  }, [filteredAndSorted, page, rowsPerPage]);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelected(new Set(paginatedCompanies.map(c => c.id)));
    } else {
      setSelected(new Set());
    }
  };

  const handleSelectOne = (id) => {
    const newSelected = new Set(selected);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelected(newSelected);
  };

  const handleBulkSuspend = () => {
    setConfirmDialog({
      open: true,
      company: { ids: Array.from(selected) },
      action: 'bulk-suspend',
    });
  };

  const handleBulkActivate = () => {
    setConfirmDialog({
      open: true,
      company: { ids: Array.from(selected) },
      action: 'bulk-activate',
    });
  };

  const handleBulkDelete = () => {
    setDangerDialog({
      open: true,
      company: { ids: Array.from(selected), name: `${selected.size} companies` },
      action: 'bulk-delete',
    });
  };

  const handleBulkForceLogout = () => {
    // TODO: Backend needs bulk force logout endpoint
    showToast('Bulk force logout not yet implemented', 'info');
  };

  const handleExportCSV = () => {
    const headers = ['Name', 'Slug', 'Status', 'Created At'];
    const rows = filteredAndSorted.map(c => [
      c.name,
      c.slug,
      c.status,
      formatDateTime(c.created_at),
    ]);
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `companies-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('CSV exported successfully', 'success');
  };

  const handleSuspend = (company) => {
    setConfirmDialog({
      open: true,
      company,
      action: 'suspend',
    });
  };

  const handleActivate = (company) => {
    setConfirmDialog({
      open: true,
      company,
      action: 'activate',
    });
  };

  const handleDelete = (company) => {
    setDangerDialog({
      open: true,
      company,
      action: 'delete',
    });
  };

  const handleResetPassword = (company) => {
    // TODO: Backend needs reset company admin password endpoint
    showToast('Reset password not yet implemented', 'info');
  };

  const handleForceLogout = (company) => {
    // TODO: Backend needs force logout all sessions endpoint
    showToast('Force logout not yet implemented', 'info');
  };

  const handleRegenerateKeys = (company) => {
    // TODO: Backend needs regenerate API keys endpoint
    showToast('Regenerate keys not yet implemented', 'info');
  };

  const handleImpersonate = (company) => {
    // TODO: Backend needs impersonation endpoint
    showToast('Impersonation not yet implemented', 'info');
  };

  const handleConfirm = () => {
    const { company, action } = confirmDialog;
    if (action === 'bulk-suspend') {
      bulkUpdateMutation.mutate({
        ids: company.ids,
        data: { status: 'suspended' },
      });
    } else if (action === 'bulk-activate') {
      bulkUpdateMutation.mutate({
        ids: company.ids,
        data: { status: 'active' },
      });
    } else {
      updateMutation.mutate({
        id: company.id,
        data: {
          status: action === 'suspend' ? 'suspended' : 'active',
        },
      });
    }
  };

  const handleDangerConfirm = () => {
    const { company, action } = dangerDialog;
    if (action === 'bulk-delete') {
      bulkDeleteMutation.mutate(company.ids);
    } else {
      deleteMutation.mutate(company.id);
    }
  };

  const isAllSelected = paginatedCompanies.length > 0 && selected.size === paginatedCompanies.length;
  const isIndeterminate = selected.size > 0 && selected.size < paginatedCompanies.length;

  if (error) {
    return (
      <AdminLayout>
        <Container maxWidth="lg">
          <Alert severity="error" sx={{ mt: 3 }}>
            {error.response?.status === 403
              ? 'You do not have permission to view companies'
              : error.response?.status === 401
              ? 'Please log in again'
              : 'Failed to load companies'}
          </Alert>
        </Container>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Container maxWidth="lg">
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4">Companies</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/admin/companies/new')}
          >
            Add Company
          </Button>
        </Box>

        {/* Filters and Search */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search by name or slug..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(0);
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(0);
                  }}
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="suspended">Suspended</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="body2" color="text.secondary">
                Showing {filteredAndSorted.length} of {companies.length} companies
              </Typography>
            </Grid>
          </Grid>
        </Paper>

        {/* Advanced Filters */}
        <AdvancedFilters
          filters={advancedFilters}
          onFiltersChange={setAdvancedFilters}
          onClear={() => {
            setAdvancedFilters({
              dateFrom: '',
              dateTo: '',
              hasBranches: 'all',
              hasBookings: 'all',
            });
            setPage(0);
          }}
        />

        {/* Bulk Actions Toolbar */}
        <BulkActionsToolbar
          selectedCount={selected.size}
          onBulkSuspend={handleBulkSuspend}
          onBulkActivate={handleBulkActivate}
          onBulkDelete={handleBulkDelete}
          onBulkForceLogout={handleBulkForceLogout}
          onExportCSV={handleExportCSV}
          disabled={bulkUpdateMutation.isLoading || bulkDeleteMutation.isLoading}
        />

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={isIndeterminate}
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                  />
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortBy === 'name'}
                    direction={sortBy === 'name' ? sortOrder : 'asc'}
                    onClick={() => handleSort('name')}
                  >
                    Name
                  </TableSortLabel>
                </TableCell>
                <TableCell>Slug</TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortBy === 'status'}
                    direction={sortBy === 'status' ? sortOrder : 'asc'}
                    onClick={() => handleSort('status')}
                  >
                    Status
                  </TableSortLabel>
                </TableCell>
                <TableCell>Branches</TableCell>
                <TableCell>Users</TableCell>
                <TableCell>Bookings (30d)</TableCell>
                <TableCell>Last Activity</TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortBy === 'created_at'}
                    direction={sortBy === 'created_at' ? sortOrder : 'asc'}
                    onClick={() => handleSort('created_at')}
                  >
                    Created
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <TableRow key={idx}>
                    <TableCell padding="checkbox"><Skeleton /></TableCell>
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
              ) : paginatedCompanies.length > 0 ? (
                paginatedCompanies.map((company) => (
                  <TableRow key={company.id} hover>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selected.has(company.id)}
                        onChange={() => handleSelectOne(company.id)}
                      />
                    </TableCell>
                    <TableCell>{company.name}</TableCell>
                    <TableCell>{company.slug}</TableCell>
                    <TableCell>
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
                    </TableCell>
                    <TableCell>{company.branches_count ?? '—'}</TableCell>
                    <TableCell>{company.users_count ?? '—'}</TableCell>
                    <TableCell>{company.bookings_30d ?? '—'}</TableCell>
                    <TableCell>{company.last_activity ? formatDateTime(company.last_activity) : '—'}</TableCell>
                    <TableCell>{formatDateTime(company.created_at)}</TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => navigate(ROUTES.ADMIN.COMPANY_DETAIL(company.id))}
                        title="View Details"
                      >
                        <ViewIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => navigate(`/admin/companies/${company.id}/edit`)}
                        title="Edit"
                      >
                        <EditIcon />
                      </IconButton>
                      {company.status === 'active' ? (
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleSuspend(company)}
                          title="Suspend"
                          disabled={updateMutation.isLoading}
                        >
                          <BlockIcon />
                        </IconButton>
                      ) : (
                        <IconButton
                          size="small"
                          color="success"
                          onClick={() => handleActivate(company)}
                          title="Activate"
                          disabled={updateMutation.isLoading}
                        >
                          <ActivateIcon />
                        </IconButton>
                      )}
                      <CompanyActionsMenu
                        company={company}
                        onView={() => navigate(ROUTES.ADMIN.COMPANY_DETAIL(company.id))}
                        onEdit={() => navigate(`/admin/companies/${company.id}/edit`)}
                        onSuspend={() => handleSuspend(company)}
                        onActivate={() => handleActivate(company)}
                        onDelete={() => handleDelete(company)}
                        onResetPassword={() => handleResetPassword(company)}
                        onForceLogout={() => handleForceLogout(company)}
                        onRegenerateKeys={() => handleRegenerateKeys(company)}
                        onImpersonate={() => handleImpersonate(company)}
                      />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                    <Box>
                      <Typography color="text.secondary" gutterBottom>
                        {searchTerm || statusFilter !== 'all' || Object.values(advancedFilters).some(v => v !== '' && v !== 'all')
                          ? 'No companies match your filters'
                          : 'No companies found'}
                      </Typography>
                      {!searchTerm && statusFilter === 'all' && !Object.values(advancedFilters).some(v => v !== '' && v !== 'all') && (
                        <Button
                          variant="contained"
                          startIcon={<AddIcon />}
                          onClick={() => navigate('/admin/companies/new')}
                          sx={{ mt: 2 }}
                        >
                          Create your first company
                        </Button>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={filteredAndSorted.length}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[5, 10, 25, 50]}
          />
        </TableContainer>

        <ConfirmDialog
          open={confirmDialog.open}
          title={
            confirmDialog.action === 'suspend' || confirmDialog.action === 'bulk-suspend'
              ? 'Suspend Company' + (confirmDialog.action === 'bulk-suspend' ? 's' : '')
              : confirmDialog.action === 'activate' || confirmDialog.action === 'bulk-activate'
              ? 'Activate Company' + (confirmDialog.action === 'bulk-activate' ? 's' : '')
              : 'Confirm Action'
          }
          message={
            confirmDialog.action === 'suspend' || confirmDialog.action === 'bulk-suspend'
              ? `Suspending ${confirmDialog.action === 'bulk-suspend' ? 'these companies' : `"${confirmDialog.company?.name}"`} will block all logins and operations. Continue?`
              : confirmDialog.action === 'activate' || confirmDialog.action === 'bulk-activate'
              ? `Are you sure you want to activate ${confirmDialog.action === 'bulk-activate' ? 'these companies' : `"${confirmDialog.company?.name}"`}?`
              : 'Are you sure?'
          }
          onConfirm={handleConfirm}
          onCancel={() => setConfirmDialog({ open: false, company: null, action: null })}
          severity={confirmDialog.action === 'suspend' || confirmDialog.action === 'bulk-suspend' ? 'error' : 'warning'}
        />

        <DangerConfirmDialog
          open={dangerDialog.open}
          onClose={() => setDangerDialog({ open: false, company: null, action: null })}
          onConfirm={handleDangerConfirm}
          title={dangerDialog.action === 'bulk-delete' ? 'Delete Companies' : 'Delete Company'}
          message={
            dangerDialog.action === 'bulk-delete'
              ? `Are you sure you want to permanently delete ${dangerDialog.company?.ids?.length} companies? This action cannot be undone.`
              : `Are you sure you want to permanently delete "${dangerDialog.company?.name}"? This action cannot be undone.`
          }
          confirmText="Delete"
          requireTyping={dangerDialog.action !== 'bulk-delete'}
          typingValue={dangerDialog.company?.name || ''}
          loading={deleteMutation.isLoading || bulkDeleteMutation.isLoading}
        />
      </Container>
    </AdminLayout>
  );
};
