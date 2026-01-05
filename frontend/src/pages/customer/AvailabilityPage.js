import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Chip,
  TextField,
} from '@mui/material';
// Using native HTML5 date/time inputs to avoid date-fns compatibility issues
import {
  CheckCircle as AvailableIcon,
  Cancel as UnavailableIcon,
} from '@mui/icons-material';
import { CustomerLayout } from '../../components/layouts/CustomerLayout';
import { useApiQuery } from '../../hooks/useQuery';
import { API_ENDPOINTS } from '../../config/api';
import { Loading } from '../../components/common/Loading';

export const AvailabilityPage = () => {
  const { companyId, branchId, courtId } = useParams();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedCourt, setSelectedCourt] = useState(courtId || '');
  const [selectedTime, setSelectedTime] = useState(null);
  const [duration, setDuration] = useState(60);

  const { data: courtsData } = useApiQuery(
    ['courts', companyId, branchId],
    API_ENDPOINTS.COURTS.LIST(companyId, branchId)
  );

  const { data: availabilityData, isLoading } = useApiQuery(
    ['availability', companyId, branchId, selectedCourt, selectedDate],
    API_ENDPOINTS.AVAILABILITY.GET(companyId, branchId) + `?court_id=${selectedCourt}&date=${selectedDate.toISOString().split('T')[0]}`,
    { enabled: !!selectedCourt && !!selectedDate }
  );

  const courts = courtsData?.data || [];
  const availability = availabilityData?.data || [];
  const slots = availability.slots || [];

  const handleContinue = () => {
    if (!selectedCourt || !selectedDate || !selectedTime) {
      return;
    }
    navigate(`/book/${companyId}/${branchId}/${selectedCourt}?date=${selectedDate.toISOString()}&time=${selectedTime}&duration=${duration}`);
  };

  return (
    <CustomerLayout>
      <Container maxWidth="lg">
        <Typography variant="h4" gutterBottom>
          Check Availability
        </Typography>

        <Paper sx={{ p: 3, mb: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Select Court</InputLabel>
                <Select
                  value={selectedCourt}
                  onChange={(e) => setSelectedCourt(e.target.value)}
                >
                  {courts.map((court) => (
                    <MenuItem key={court.id} value={court.id}>
                      {court.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Select Date"
                type="date"
                value={selectedDate ? selectedDate.toISOString().split('T')[0] : ''}
                onChange={(e) => setSelectedDate(new Date(e.target.value))}
                InputLabelProps={{ shrink: true }}
                inputProps={{ min: new Date().toISOString().split('T')[0] }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Duration (minutes)</InputLabel>
                <Select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                >
                  <MenuItem value={30}>30 minutes</MenuItem>
                  <MenuItem value={60}>60 minutes</MenuItem>
                  <MenuItem value={90}>90 minutes</MenuItem>
                  <MenuItem value={120}>120 minutes</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>

        {selectedCourt && selectedDate && (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Available Time Slots
            </Typography>
            {isLoading ? (
              <Loading />
            ) : slots.length > 0 ? (
              <Grid container spacing={2}>
                {slots.map((slot) => (
                  <Grid item xs={6} sm={4} md={3} key={slot.start}>
                    <Card
                      sx={{
                        cursor: slot.available ? 'pointer' : 'not-allowed',
                        opacity: slot.available ? 1 : 0.5,
                        '&:hover': slot.available ? { boxShadow: 4 } : {},
                      }}
                      onClick={() => slot.available && setSelectedTime(slot.start)}
                    >
                      <CardContent>
                        <Box display="flex" alignItems="center" justifyContent="space-between">
                          <Typography variant="body1">
                            {new Date(slot.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </Typography>
                          {slot.available ? (
                            <AvailableIcon color="success" />
                          ) : (
                            <UnavailableIcon color="error" />
                          )}
                        </Box>
                        {!slot.available && (
                          <Typography variant="caption" color="error">
                            {slot.reason || 'Booked'}
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Box textAlign="center" py={4}>
                <Typography color="text.secondary">
                  No available slots for this date
                </Typography>
              </Box>
            )}
          </Paper>
        )}

        {selectedTime && (
          <Box mt={3} display="flex" justifyContent="flex-end">
            <Button
              variant="contained"
              size="large"
              onClick={handleContinue}
            >
              Continue Booking
            </Button>
          </Box>
        )}
      </Container>
    </CustomerLayout>
  );
};

