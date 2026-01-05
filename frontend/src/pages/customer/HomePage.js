import React from 'react';
import { CustomerLayout } from '../../components/layouts/CustomerLayout';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../utils/constants';
import { Button, Container, Typography, Box } from '@mui/material';

export const HomePage = () => {
  const navigate = useNavigate();

  // Mock data - replace with actual API call
  const featuredBranches = [
    {
      id: '1',
      name: 'Downtown Pickleball',
      address: '123 Main St, City',
      image: '/api/placeholder/400/300',
    },
    {
      id: '2',
      name: 'Sports Complex',
      address: '456 Oak Ave, City',
      image: '/api/placeholder/400/300',
    },
  ];

  return (
    <CustomerLayout>
      <Container maxWidth="lg">
        <Box sx={{ my: 8, textAlign: 'center' }}>
          <Typography variant="h2" component="h1" gutterBottom>
            Welcome to Pickleball Booking
          </Typography>
          <Typography variant="h5" color="text.secondary" gutterBottom sx={{ mb: 4 }}>
            Find and book your perfect court
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate(ROUTES.CUSTOMER.EXPLORE)}
            sx={{ px: 4, py: 1.5 }}
          >
            Explore Courts
          </Button>
        </Box>
      </Container>
    </CustomerLayout>
  );
};
