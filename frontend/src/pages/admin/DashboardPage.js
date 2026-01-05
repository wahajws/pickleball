import React from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
} from '@mui/material';
import {
  Business as BusinessIcon,
  CheckCircle as ActiveIcon,
  Cancel as SuspendedIcon,
  Store as BranchIcon,
  People as UsersIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import { AdminLayout } from '../../components/layouts/AdminLayout';
import { useApiQuery } from '../../hooks/useQuery';
import { API_ENDPOINTS } from '../../config/api';
import { Loading } from '../../components/common/Loading';
import { formatDateTime } from '../../utils/format';

export const DashboardPage = () => {
  const { data: companiesData, isLoading: companiesLoading } = useApiQuery(
    ['admin', 'companies'],
    API_ENDPOINTS.ADMIN.PLATFORM.COMPANIES
  );

  // Mock audit logs - replace with actual endpoint when available
  const { data: auditData, isLoading: auditLoading } = useApiQuery(
    ['admin', 'audit-logs', 'recent'],
    API_ENDPOINTS.ADMIN.PLATFORM.AUDIT_LOGS + '?limit=5',
    { enabled: false } // Disable until endpoint exists
  );

  const companies = companiesData?.data || [];
  const activeCompanies = companies.filter((c) => c.status === 'active');
  const suspendedCompanies = companies.filter((c) => c.status === 'suspended');
  
  // Calculate aggregated stats (mock - would need backend aggregation)
  const totalBranches = 0; // Would need backend endpoint
  const totalUsers = 0; // Would need backend endpoint
  
  const recentCompanies = [...companies]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);
  
  const recentSuspended = suspendedCompanies
    .sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at))
    .slice(0, 5);

  const auditLogs = auditData?.data || [];

  if (companiesLoading) {
    return (
      <AdminLayout>
        <Loading />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Container maxWidth="lg">
        <Typography variant="h4" gutterBottom>
          Platform Dashboard
        </Typography>

        {/* KPI Cards */}
        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <BusinessIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                  <Box>
                    <Typography variant="h4">{companies.length}</Typography>
                    <Typography color="text.secondary">Total Companies</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <ActiveIcon sx={{ fontSize: 40, color: 'success.main', mr: 2 }} />
                  <Box>
                    <Typography variant="h4">{activeCompanies.length}</Typography>
                    <Typography color="text.secondary">Active Companies</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <SuspendedIcon sx={{ fontSize: 40, color: 'error.main', mr: 2 }} />
                  <Box>
                    <Typography variant="h4">{suspendedCompanies.length}</Typography>
                    <Typography color="text.secondary">Suspended Companies</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <BranchIcon sx={{ fontSize: 40, color: 'info.main', mr: 2 }} />
                  <Box>
                    <Typography variant="h4">{totalBranches}</Typography>
                    <Typography color="text.secondary">Total Branches</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <UsersIcon sx={{ fontSize: 40, color: 'warning.main', mr: 2 }} />
                  <Box>
                    <Typography variant="h4">{totalUsers}</Typography>
                    <Typography color="text.secondary">Total Users</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Activity Section */}
        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Recently Created Companies
              </Typography>
              <List dense>
                {recentCompanies.length > 0 ? (
                  recentCompanies.map((company, idx) => (
                    <React.Fragment key={company.id}>
                      <ListItem>
                        <ListItemText
                          primary={company.name}
                          secondary={formatDateTime(company.created_at)}
                        />
                        <Chip
                          label={company.status}
                          size="small"
                          color={company.status === 'active' ? 'success' : 'default'}
                        />
                      </ListItem>
                      {idx < recentCompanies.length - 1 && <Divider />}
                    </React.Fragment>
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                    No companies yet
                  </Typography>
                )}
              </List>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Recently Suspended Companies
              </Typography>
              <List dense>
                {recentSuspended.length > 0 ? (
                  recentSuspended.map((company, idx) => (
                    <div key={company.id}>
                      <ListItem>
                        <ListItemText
                          primary={company.name}
                          secondary={formatDateTime(company.updated_at || company.created_at)}
                        />
                        <Chip label="Suspended" size="small" color="error" />
                      </ListItem>
                      {idx < recentSuspended.length - 1 && <Divider />}
                    </div>
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                    No suspended companies
                  </Typography>
                )}
              </List>
            </Paper>
          </Grid>

          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Box display="flex" alignItems="center" mb={2}>
                <HistoryIcon sx={{ mr: 1 }} />
                <Typography variant="h6">
                  Latest Audit Log Entries
                </Typography>
              </Box>
              {auditLoading ? (
                <Loading />
              ) : auditLogs.length > 0 ? (
                <List dense>
                  {auditLogs.map((log, idx) => (
                    <div key={log.id}>
                      <ListItem>
                        <ListItemText
                          primary={`${log.action} - ${log.entity_type}`}
                          secondary={`${log.actor_user_id} • ${formatDateTime(log.created_at)}`}
                        />
                      </ListItem>
                      {idx < auditLogs.length - 1 && <Divider />}
                    </div>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                  No audit logs available
                </Typography>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </AdminLayout>
  );
};
