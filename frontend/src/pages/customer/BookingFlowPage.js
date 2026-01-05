import React, { useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  TextField,
  Grid,
  Card,
  CardContent,
  Divider,
  Chip,
  Alert,
} from '@mui/material';
import {
  SportsTennis as CourtIcon,
  People as PeopleIcon,
  LocalOffer as PromoIcon,
  CardGiftcard as GiftCardIcon,
  Receipt as SummaryIcon,
  CheckCircle as ConfirmIcon,
} from '@mui/icons-material';
import { CustomerLayout } from '../../components/layouts/CustomerLayout';
import { useApiQuery } from '../../hooks/useQuery';
import { useMutation } from '@tanstack/react-query';
import apiClient from '../../utils/apiClient';
import { API_ENDPOINTS } from '../../config/api';
import { ROUTES } from '../../utils/constants';
import { formatCurrency, formatDateTime } from '../../utils/format';
import { useToast } from '../../components/common/Toast';
import { Loading } from '../../components/common/Loading';
import TelemetryClient from '../../api/telemetryClient';

const steps = [
  'Select Court & Time',
  'Add Participants',
  'Apply Promo Code',
  'Apply Gift Card',
  'Summary',
  'Confirmation',
];

export const BookingFlowPage = () => {
  const { companyId, branchId, courtId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [activeStep, setActiveStep] = useState(0);

  // Track booking start
  React.useEffect(() => {
    TelemetryClient.sendEvent('booking.start', {
      company_id: companyId,
      branch_id: branchId,
      entity_type: 'booking',
      properties: { court_id: courtId, from: 'branch_detail' },
    });
  }, [companyId, branchId, courtId]);
  const [bookingData, setBookingData] = useState({
    courtId: courtId || '',
    date: searchParams.get('date') || new Date(),
    time: searchParams.get('time') || '',
    duration: parseInt(searchParams.get('duration')) || 60,
    participants: [],
    promoCode: '',
    giftCardId: '',
  });
  const [error, setError] = useState('');

  const { data: courtData } = useApiQuery(
    ['court', companyId, branchId, bookingData.courtId],
    API_ENDPOINTS.COURTS.DETAIL(companyId, branchId, bookingData.courtId),
    { enabled: !!bookingData.courtId }
  );

  const promoMutation = useMutation({
    mutationFn: async (code) => {
      const response = await apiClient.post(API_ENDPOINTS.PROMO_CODES.VALIDATE(companyId), { code });
      return response.data;
    },
    onSuccess: (data) => {
      setBookingData({ ...bookingData, promoDiscount: data.data.discount_amount });
      showToast('Promo code applied', 'success');
    },
    onError: (error) => {
      setError(error.response?.data?.message || 'Invalid promo code');
    },
  });

  const bookingMutation = useMutation({
    mutationFn: async (data) => {
      const response = await apiClient.post(API_ENDPOINTS.BOOKINGS.CREATE(companyId), data);
      return response.data;
    },
    onSuccess: (data) => {
      // Track booking confirmed (client-side, server also tracks)
      TelemetryClient.sendEvent('booking.confirmed', {
        company_id: companyId,
        branch_id: branchId,
        entity_type: 'booking',
        entity_id: data.data?.booking?.id,
        properties: { court_id: bookingData.courtId },
      });
      setActiveStep(5);
      showToast('Booking confirmed!', 'success');
    },
    onError: (error) => {
      if (error.response?.status === 409) {
        setError('This time slot is already booked. Please select another time.');
      } else {
        setError(error.response?.data?.message || 'Booking failed');
      }
    },
  });

  const court = courtData?.data;
  const totalAmount = (court?.hourly_rate || 0) * (bookingData.duration / 60);
  const discount = bookingData.promoDiscount || 0;
  const finalAmount = totalAmount - discount;

  const handleNext = () => {
    if (activeStep === 0 && (!bookingData.courtId || !bookingData.date || !bookingData.time)) {
      setError('Please select court, date, and time');
      return;
    }
    
    // Track step progression
    if (activeStep === 0) {
      TelemetryClient.sendEvent('booking.slot_view', {
        company_id: companyId,
        branch_id: branchId,
        entity_type: 'court',
        entity_id: bookingData.courtId,
        properties: { date: bookingData.date, time: bookingData.time },
      });
    } else if (activeStep === 4) {
      TelemetryClient.sendEvent('booking.quote_view', {
        company_id: companyId,
        branch_id: branchId,
        entity_type: 'booking',
        properties: { total_amount: finalAmount, discount: discount },
      });
    }
    
    if (activeStep === 4) {
      // Submit booking
      const startDateTime = new Date(`${bookingData.date}T${bookingData.time}`);
      bookingMutation.mutate({
        branch_id: branchId,
        court_id: bookingData.courtId,
        start_datetime: startDateTime.toISOString(),
        duration_minutes: bookingData.duration,
        participants: bookingData.participants,
        promo_code: bookingData.promoCode || null,
        gift_card_id: bookingData.giftCardId || null,
      });
    } else {
      setActiveStep((prev) => prev + 1);
      setError('');
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
    setError('');
  };

  const handlePromoApply = () => {
    if (!bookingData.promoCode) return;
    TelemetryClient.sendEvent('booking.promo_applied', {
      company_id: companyId,
      branch_id: branchId,
      entity_type: 'promo',
      properties: { promo_code: bookingData.promoCode },
    });
    promoMutation.mutate(bookingData.promoCode);
  };

  return (
    <CustomerLayout>
      <Container maxWidth="md">
        <Typography variant="h4" gutterBottom>
          Book Court
        </Typography>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <Paper sx={{ p: 3, mb: 3 }}>
          {/* Step 0: Select Court & Time */}
          {activeStep === 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Select Court & Time
              </Typography>
              {court && (
                <Card sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="h6">{court.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formatCurrency(court.hourly_rate)}/hr
                    </Typography>
                  </CardContent>
                </Card>
              )}
              <TextField
                fullWidth
                label="Date"
                type="date"
                value={bookingData.date}
                onChange={(e) => setBookingData({ ...bookingData, date: e.target.value })}
                InputLabelProps={{ shrink: true }}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Time"
                type="time"
                value={bookingData.time}
                onChange={(e) => setBookingData({ ...bookingData, time: e.target.value })}
                InputLabelProps={{ shrink: true }}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Duration (minutes)"
                type="number"
                value={bookingData.duration}
                onChange={(e) => setBookingData({ ...bookingData, duration: parseInt(e.target.value) })}
              />
            </Box>
          )}

          {/* Step 1: Add Participants */}
          {activeStep === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Add Participants (Optional)
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Add other players who will join this booking
              </Typography>
              <Button
                variant="outlined"
                onClick={() => {
                  const newParticipants = [...bookingData.participants, { name: '', email: '' }];
                  setBookingData({ ...bookingData, participants: newParticipants });
                }}
                sx={{ mt: 2 }}
              >
                Add Participant
              </Button>
              {bookingData.participants.map((p, idx) => (
                <Box key={idx} sx={{ mt: 2 }}>
                  <TextField
                    fullWidth
                    label="Name"
                    value={p.name}
                    onChange={(e) => {
                      const updated = [...bookingData.participants];
                      updated[idx].name = e.target.value;
                      setBookingData({ ...bookingData, participants: updated });
                    }}
                    sx={{ mb: 1 }}
                  />
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={p.email}
                    onChange={(e) => {
                      const updated = [...bookingData.participants];
                      updated[idx].email = e.target.value;
                      setBookingData({ ...bookingData, participants: updated });
                    }}
                  />
                </Box>
              ))}
            </Box>
          )}

          {/* Step 2: Apply Promo Code */}
          {activeStep === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Apply Promo Code (Optional)
              </Typography>
              <Box display="flex" gap={2}>
                <TextField
                  fullWidth
                  label="Promo Code"
                  value={bookingData.promoCode}
                  onChange={(e) => setBookingData({ ...bookingData, promoCode: e.target.value })}
                />
                <Button
                  variant="contained"
                  onClick={handlePromoApply}
                  disabled={!bookingData.promoCode || promoMutation.isLoading}
                >
                  Apply
                </Button>
              </Box>
              {bookingData.promoDiscount && (
                <Chip
                  label={`Discount: ${formatCurrency(bookingData.promoDiscount)}`}
                  color="success"
                  sx={{ mt: 2 }}
                />
              )}
            </Box>
          )}

          {/* Step 3: Apply Gift Card */}
          {activeStep === 3 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Apply Gift Card (Optional)
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Gift card functionality to be implemented
              </Typography>
            </Box>
          )}

          {/* Step 4: Summary */}
          {activeStep === 4 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Booking Summary
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2">Court</Typography>
                  <Typography>{court?.name}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2">Date & Time</Typography>
                  <Typography>
                    {formatDateTime(new Date(`${bookingData.date}T${bookingData.time}`))}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2">Duration</Typography>
                  <Typography>{bookingData.duration} minutes</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Divider />
                </Grid>
                <Grid item xs={6}>
                  <Typography>Subtotal</Typography>
                </Grid>
                <Grid item xs={6} textAlign="right">
                  <Typography>{formatCurrency(totalAmount)}</Typography>
                </Grid>
                {discount > 0 && (
                  <>
                    <Grid item xs={6}>
                      <Typography color="success.main">Discount</Typography>
                    </Grid>
                    <Grid item xs={6} textAlign="right">
                      <Typography color="success.main">-{formatCurrency(discount)}</Typography>
                    </Grid>
                  </>
                )}
                <Grid item xs={6}>
                  <Typography variant="h6">Total</Typography>
                </Grid>
                <Grid item xs={6} textAlign="right">
                  <Typography variant="h6">{formatCurrency(finalAmount)}</Typography>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Step 5: Confirmation */}
          {activeStep === 5 && (
            <Box textAlign="center">
              <ConfirmIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
              <Typography variant="h5" gutterBottom>
                Booking Confirmed!
              </Typography>
              <Typography variant="body1" color="text.secondary" gutterBottom>
                Your booking has been confirmed. You will receive a confirmation email shortly.
              </Typography>
              <Button
                variant="contained"
                sx={{ mt: 3 }}
                onClick={() => navigate(ROUTES.CUSTOMER.BOOKINGS)}
              >
                View My Bookings
              </Button>
            </Box>
          )}
        </Paper>

        {activeStep < 5 && (
          <Box display="flex" justifyContent="space-between">
            <Button
              disabled={activeStep === 0}
              onClick={handleBack}
            >
              Back
            </Button>
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={bookingMutation.isLoading}
            >
              {activeStep === 4 ? 'Confirm Booking' : 'Next'}
            </Button>
          </Box>
        )}
      </Container>
    </CustomerLayout>
  );
};

