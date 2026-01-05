import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider,
  Paper,
  Tabs,
  Tab,
} from '@mui/material';
import {
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
  CardMembership as MembershipIcon,
} from '@mui/icons-material';
import { CustomerLayout } from '../../components/layouts/CustomerLayout';
import { useApiQuery } from '../../hooks/useQuery';
import { useMutation } from '@tanstack/react-query';
import apiClient from '../../utils/apiClient';
import { API_ENDPOINTS } from '../../config/api';
import { formatCurrency } from '../../utils/format';
import { Loading } from '../../components/common/Loading';
import { useToast } from '../../components/common/Toast';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { useAuth } from '../../contexts/AuthContext';
import TelemetryClient from '../../api/telemetryClient';

const TabPanel = ({ children, value, index }) => (
  <div hidden={value !== index}>
    {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
  </div>
);

export const MembershipsPage = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useAuth();
  const [tab, setTab] = useState(0);
  const [cancelDialog, setCancelDialog] = useState({ open: false, membership: null });

  // Track membership list view
  useEffect(() => {
    TelemetryClient.sendEvent('membership.list_view', {
      properties: {},
    });
  }, []);

  // Get user's company subscriptions
  const { data: companiesData } = useApiQuery(
    ['my-companies'],
    API_ENDPOINTS.COMPANIES.MY_COMPANIES
  );

  // API returns { companies: [...] }
  const companies = Array.isArray(companiesData?.data) 
    ? companiesData.data 
    : (companiesData?.data?.companies || []);
  const companyIds = companies.map(c => c.company_id || c.id);

  // Fetch active memberships
  const { data: membershipsData, isLoading: membershipsLoading } = useApiQuery(
    ['memberships', 'my-memberships', companyIds],
    companyIds.length > 0 ? API_ENDPOINTS.MEMBERSHIPS.MY_MEMBERSHIPS(companyIds[0]) : null,
    { enabled: companyIds.length > 0 }
  );

  // Fetch available plans (from first subscribed company for now)
  const { data: plansData, isLoading: plansLoading } = useApiQuery(
    ['membership-plans', companyIds[0]],
    companyIds.length > 0 ? API_ENDPOINTS.MEMBERSHIPS.PLANS(companyIds[0]) : null,
    { enabled: companyIds.length > 0 }
  );

  const cancelMutation = useMutation({
    mutationFn: async ({ companyId, membershipId }) => {
      const response = await apiClient.post(
        API_ENDPOINTS.MEMBERSHIPS.CANCEL(companyId, membershipId)
      );
      return response.data;
    },
    onSuccess: () => {
      showToast('Membership cancelled', 'success');
      setCancelDialog({ open: false, membership: null });
    },
  });

  const activeMemberships = membershipsData?.data || [];
  const availablePlans = plansData?.data || [];

  const handleCancel = (membership) => {
    setCancelDialog({ open: true, membership });
  };

  const handleConfirmCancel = () => {
    const { membership } = cancelDialog;
    cancelMutation.mutate({
      companyId: membership.company_id,
      membershipId: membership.id,
    });
  };

  if (membershipsLoading || plansLoading) {
    return (
      <CustomerLayout>
        <Loading />
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <Container maxWidth="lg">
        <Typography variant="h4" gutterBottom>
          Memberships
        </Typography>

        <Paper sx={{ mt: 3 }}>
          <Tabs value={tab} onChange={(e, v) => setTab(v)}>
            <Tab label={`Active (${activeMemberships.length})`} />
            <Tab label={`Available Plans (${availablePlans.length})`} />
          </Tabs>

          <TabPanel value={tab} index={0}>
            {activeMemberships.length > 0 ? (
              <Grid container spacing={3}>
                {activeMemberships.map((membership) => (
                  <Grid item xs={12} md={6} key={membership.id}>
                    <Card>
                      <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                          <Box>
                            <Typography variant="h6">
                              {membership.membership_plan?.name}
                            </Typography>
                            <Chip
                              label={membership.status}
                              color={membership.status === 'active' ? 'success' : 'default'}
                              size="small"
                              sx={{ mt: 1 }}
                            />
                          </Box>
                          <ActiveIcon color="success" />
                        </Box>

                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {membership.membership_plan?.billing_type} • {membership.membership_plan?.plan_scope}
                        </Typography>

                        <Box mt={2}>
                          <Typography variant="caption" color="text.secondary">
                            Start: {new Date(membership.start_date).toLocaleDateString()}
                          </Typography>
                          <br />
                          <Typography variant="caption" color="text.secondary">
                            End: {new Date(membership.end_date).toLocaleDateString()}
                          </Typography>
                        </Box>

                        <Box mt={2} display="flex" gap={1}>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => navigate(`/memberships/${membership.id}`)}
                          >
                            View Details
                          </Button>
                          {membership.status === 'active' && (
                            <Button
                              variant="outlined"
                              color="error"
                              size="small"
                              onClick={() => handleCancel(membership)}
                            >
                              Cancel
                            </Button>
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Box textAlign="center" py={4}>
                <MembershipIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No Active Memberships
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Browse available plans to get started
                </Typography>
                <Button
                  variant="contained"
                  sx={{ mt: 2 }}
                  onClick={() => setTab(1)}
                >
                  View Plans
                </Button>
              </Box>
            )}
          </TabPanel>

          <TabPanel value={tab} index={1}>
            {availablePlans.length > 0 ? (
              <Grid container spacing={3}>
                {availablePlans.map((plan) => (
                  <Grid item xs={12} md={6} key={plan.id}>
                    <Card>
                      <CardContent>
                        <Typography variant="h5" gutterBottom>
                          {plan.name}
                        </Typography>
                        <Typography variant="h4" color="primary" gutterBottom>
                          {formatCurrency(plan.price)}
                        </Typography>
                        <Chip
                          label={plan.billing_type}
                          size="small"
                          sx={{ mb: 2 }}
                        />
                        <Chip
                          label={plan.plan_scope}
                          size="small"
                          color="secondary"
                          sx={{ mb: 2, ml: 1 }}
                        />

                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {plan.description}
                        </Typography>

                        <Divider sx={{ my: 2 }} />

                        <Typography variant="subtitle2" gutterBottom>
                          Benefits:
                        </Typography>
                        <List dense>
                          {plan.benefits?.map((benefit, idx) => (
                            <ListItem key={idx} sx={{ py: 0 }}>
                              <ListItemText
                                primary={benefit.benefit_description}
                                primaryTypographyProps={{ variant: 'body2' }}
                              />
                            </ListItem>
                          ))}
                        </List>

                        <Button
                          variant="contained"
                          fullWidth
                          sx={{ mt: 2 }}
                          onClick={() => {
                            TelemetryClient.sendEvent('membership.plan_view', {
                              company_id: plan.company_id,
                              entity_type: 'membership_plan',
                              entity_id: plan.id,
                              properties: { plan_name: plan.name, price: plan.price },
                            });
                            TelemetryClient.sendEvent('membership.purchase_started', {
                              company_id: plan.company_id,
                              entity_type: 'membership_plan',
                              entity_id: plan.id,
                              properties: { plan_name: plan.name },
                            });
                            navigate(`/memberships/purchase/${plan.id}`);
                          }}
                        >
                          Purchase Plan
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Box textAlign="center" py={4}>
                <Typography color="text.secondary">No membership plans available</Typography>
              </Box>
            )}
          </TabPanel>
        </Paper>

        <ConfirmDialog
          open={cancelDialog.open}
          title="Cancel Membership"
          message={`Are you sure you want to cancel this membership?`}
          onConfirm={handleConfirmCancel}
          onCancel={() => setCancelDialog({ open: false, membership: null })}
          severity="error"
        />
      </Container>
    </CustomerLayout>
  );
};

