import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Tabs,
  Tab,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  Paper,
} from '@mui/material';
import {
  CalendarToday as DateIcon,
  SportsTennis as CourtIcon,
  LocationOn as LocationIcon,
  Cancel as CancelIcon,
  Edit as RescheduleIcon,
} from '@mui/icons-material';
import { CustomerLayout } from '../../components/layouts/CustomerLayout';
import { useApiQuery } from '../../hooks/useQuery';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../utils/apiClient';
import { API_ENDPOINTS } from '../../config/api';
import { ROUTES } from '../../utils/constants';
import { formatCurrency, formatDateTime } from '../../utils/format';
import { Loading } from '../../components/common/Loading';
import { useToast } from '../../components/common/Toast';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { useAuth } from '../../contexts/AuthContext';

const TabPanel = ({ children, value, index }) => (
  <div hidden={value !== index}>
    {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
  </div>
);

export const MyBookingsPage = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState(0);
  const [cancelDialog, setCancelDialog] = useState({ open: false, booking: null });

  // Get user's company subscriptions to fetch bookings
  const { data: companiesData, isLoading: companiesLoading } = useApiQuery(
    ['my-companies'],
    API_ENDPOINTS.COMPANIES.MY_COMPANIES
  );

  // API returns { companies: [...] } or could be just an array
  const companies = Array.isArray(companiesData?.data) 
    ? companiesData.data 
    : (companiesData?.data?.companies || []);
  const companyIds = companies.map(c => c.company_id || c.id);

  // Fetch bookings for all subscribed companies
  const { data: bookingsData, isLoading } = useApiQuery(
    ['bookings', 'my-bookings', companyIds],
    companyIds.length > 0 ? API_ENDPOINTS.BOOKINGS.LIST(companyIds[0]) : null,
    { enabled: companyIds.length > 0 }
  );

  const cancelMutation = useMutation({
    mutationFn: async ({ companyId, bookingId }) => {
      const response = await apiClient.post(
        API_ENDPOINTS.BOOKINGS.CANCEL(companyId, bookingId)
      );
      return response.data;
    },
    onSuccess: () => {
      showToast('Booking cancelled', 'success');
      setCancelDialog({ open: false, booking: null });
      queryClient.invalidateQueries({ queryKey: ['bookings', 'my-bookings'] });
    },
  });

  const bookings = bookingsData?.data || [];
  const now = new Date();

  const upcoming = bookings.filter(b => new Date(b.start_datetime) > now && b.status !== 'cancelled');
  const past = bookings.filter(b => new Date(b.start_datetime) <= now || b.status === 'completed');
  const cancelled = bookings.filter(b => b.status === 'cancelled');

  const handleCancel = (booking) => {
    setCancelDialog({ open: true, booking });
  };

  const handleConfirmCancel = () => {
    const { booking } = cancelDialog;
    cancelMutation.mutate({ companyId: booking.company_id, bookingId: booking.id });
  };

  if (isLoading || companiesLoading) {
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
          My Bookings
        </Typography>

        <Paper sx={{ mt: 3 }}>
          <Tabs value={tab} onChange={(e, v) => setTab(v)}>
            <Tab label={`Upcoming (${upcoming.length})`} />
            <Tab label={`Past (${past.length})`} />
            <Tab label={`Cancelled (${cancelled.length})`} />
          </Tabs>

          <TabPanel value={tab} index={0}>
            {upcoming.length > 0 ? (
              <Grid container spacing={2}>
                {upcoming.map((booking) => (
                  <Grid item xs={12} key={booking.id}>
                    <BookingCard
                      booking={booking}
                      onCancel={() => handleCancel(booking)}
                      onReschedule={() => navigate(`/bookings/${booking.id}/reschedule`)}
                      onView={() => navigate(ROUTES.CUSTOMER.BOOKING_DETAIL(booking.id))}
                    />
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Box textAlign="center" py={4}>
                <Typography color="text.secondary">No upcoming bookings</Typography>
                <Button
                  variant="contained"
                  sx={{ mt: 2 }}
                  onClick={() => navigate(ROUTES.CUSTOMER.HOME)}
                >
                  Explore Courts
                </Button>
              </Box>
            )}
          </TabPanel>

          <TabPanel value={tab} index={1}>
            {past.length > 0 ? (
              <Grid container spacing={2}>
                {past.map((booking) => (
                  <Grid item xs={12} key={booking.id}>
                    <BookingCard
                      booking={booking}
                      onView={() => navigate(ROUTES.CUSTOMER.BOOKING_DETAIL(booking.id))}
                    />
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Box textAlign="center" py={4}>
                <Typography color="text.secondary">No past bookings</Typography>
              </Box>
            )}
          </TabPanel>

          <TabPanel value={tab} index={2}>
            {cancelled.length > 0 ? (
              <Grid container spacing={2}>
                {cancelled.map((booking) => (
                  <Grid item xs={12} key={booking.id}>
                    <BookingCard
                      booking={booking}
                      onView={() => navigate(ROUTES.CUSTOMER.BOOKING_DETAIL(booking.id))}
                    />
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Box textAlign="center" py={4}>
                <Typography color="text.secondary">No cancelled bookings</Typography>
              </Box>
            )}
          </TabPanel>
        </Paper>

        <ConfirmDialog
          open={cancelDialog.open}
          title="Cancel Booking"
          message={`Are you sure you want to cancel this booking? This action cannot be undone.`}
          onConfirm={handleConfirmCancel}
          onCancel={() => setCancelDialog({ open: false, booking: null })}
          severity="error"
        />
      </Container>
    </CustomerLayout>
  );
};

const BookingCard = ({ booking, onCancel, onReschedule, onView }) => {
  const canCancel = booking.status === 'confirmed' && new Date(booking.start_datetime) > new Date();
  const canReschedule = booking.status === 'confirmed' && new Date(booking.start_datetime) > new Date();

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
          <Box>
            <Typography variant="h6" gutterBottom>
              {booking.branch?.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {booking.court?.name || 'Court'}
            </Typography>
          </Box>
          <Chip
            label={booking.status}
            color={
              booking.status === 'confirmed' ? 'success' :
              booking.status === 'cancelled' ? 'error' : 'default'
            }
          />
        </Box>

        <Box display="flex" gap={2} mb={2} flexWrap="wrap">
          <Box display="flex" alignItems="center" gap={1}>
            <DateIcon fontSize="small" color="action" />
            <Typography variant="body2">
              {formatDateTime(booking.start_datetime)}
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            <LocationIcon fontSize="small" color="action" />
            <Typography variant="body2">
              {booking.branch?.address}
            </Typography>
          </Box>
        </Box>

        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" color="primary">
            {formatCurrency(booking.total_amount)}
          </Typography>
          <Box display="flex" gap={1}>
            {canCancel && (
              <Button
                size="small"
                color="error"
                startIcon={<CancelIcon />}
                onClick={onCancel}
              >
                Cancel
              </Button>
            )}
            {canReschedule && (
              <Button
                size="small"
                variant="outlined"
                startIcon={<RescheduleIcon />}
                onClick={onReschedule}
              >
                Reschedule
              </Button>
            )}
            <Button
              size="small"
              variant="outlined"
              onClick={onView}
            >
              View Details
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

