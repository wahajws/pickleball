import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Tabs,
  Tab,
  Card,
  CardContent,
  CardMedia,
  Button,
  Grid,
  Chip,
  IconButton,
  Paper,
  List,
  ListItem,
  ListItemText,
  Avatar,
} from '@mui/material';
import {
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  SportsTennis as CourtIcon,
  PhotoLibrary as GalleryIcon,
  Star as StarIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
} from '@mui/icons-material';
import { CustomerLayout } from '../../components/layouts/CustomerLayout';
import { useApiQuery, useApiMutation } from '../../hooks/useQuery';
import { API_ENDPOINTS } from '../../config/api';
import { ROUTES } from '../../utils/constants';
import { formatCurrency } from '../../utils/format';
import { Loading } from '../../components/common/Loading';
import { useToast } from '../../components/common/Toast';
import { useAuth } from '../../contexts/AuthContext';
import TelemetryClient from '../../api/telemetryClient';

const TabPanel = ({ children, value, index }) => (
  <div hidden={value !== index}>
    {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
  </div>
);

export const BranchDetailPage = () => {
  const { companyId, branchId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { isAuthenticated } = useAuth();
  const [tab, setTab] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);

  const { data: branchData, isLoading } = useApiQuery(
    ['branch', companyId, branchId],
    API_ENDPOINTS.BRANCHES.DETAIL(companyId, branchId)
  );

  const { data: courtsData } = useApiQuery(
    ['courts', companyId, branchId],
    API_ENDPOINTS.COURTS.LIST(companyId, branchId),
    { enabled: tab === 0 }
  );

  const { data: membershipsData } = useApiQuery(
    ['memberships', companyId],
    API_ENDPOINTS.MEMBERSHIPS.PLANS(companyId),
    { enabled: tab === 2 }
  );

  const { data: reviewsData } = useApiQuery(
    ['reviews', companyId],
    API_ENDPOINTS.REVIEWS.LIST(companyId),
    { enabled: tab === 4 }
  );

  const followMutation = useApiMutation(
    API_ENDPOINTS.COMPANIES.SUBSCRIBE(companyId),
    {
      onSuccess: () => {
        setIsFollowing(true);
        showToast('Now following this company', 'success');
      },
    }
  );

  const branch = branchData?.data;
  const courts = courtsData?.data || [];
  const memberships = membershipsData?.data || [];
  const reviews = reviewsData?.data || [];
  const contacts = branch?.contacts || [];

  const handleFollow = () => {
    if (!isAuthenticated) {
      navigate(ROUTES.CUSTOMER.LOGIN);
      return;
    }
    followMutation.mutate({});
  };

  if (isLoading) {
    return (
      <CustomerLayout>
        <Loading />
      </CustomerLayout>
    );
  }

  if (!branch) {
    return (
      <CustomerLayout>
        <Container>
          <Typography>Branch not found</Typography>
        </Container>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <Container maxWidth="lg">
        {/* Header */}
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
            <Box>
              <Typography variant="h4" gutterBottom>
                {branch.name}
              </Typography>
              <Typography variant="body1" color="text.secondary" gutterBottom>
                {branch.company?.name}
              </Typography>
              <Box display="flex" alignItems="center" mt={1}>
                <LocationIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                <Typography variant="body2">{branch.address}</Typography>
              </Box>
            </Box>
            <Box>
              {contacts.find(c => c.contact_type === 'phone') && (
                <Button
                  variant="outlined"
                  startIcon={<PhoneIcon />}
                  href={`tel:${contacts.find(c => c.contact_type === 'phone').contact_value}`}
                  sx={{ mr: 1 }}
                >
                  Call
                </Button>
              )}
              <IconButton
                color={isFollowing ? 'error' : 'default'}
                onClick={handleFollow}
              >
                {isFollowing ? <FavoriteIcon /> : <FavoriteBorderIcon />}
              </IconButton>
            </Box>
          </Box>
        </Paper>

        {/* Tabs */}
        <Paper>
          <Tabs value={tab} onChange={(e, v) => setTab(v)}>
            <Tab label="Courts" />
            <Tab label="Availability" />
            <Tab label="Memberships" />
            <Tab label="Gallery" />
            <Tab label="Reviews" />
          </Tabs>

          <TabPanel value={tab} index={0}>
            <Grid container spacing={2}>
              {courts.map((court) => (
                <Grid item xs={12} sm={6} md={4} key={court.id}>
                  <Card>
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography variant="h6">{court.name}</Typography>
                        <Chip
                          label={court.surface_type}
                          size="small"
                          color={court.surface_type === 'indoor' ? 'primary' : 'default'}
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {court.description}
                      </Typography>
                      <Box display="flex" gap={1} flexWrap="wrap" my={1}>
                        {court.features?.map((feature, idx) => (
                          <Chip key={idx} label={feature.feature_name} size="small" />
                        ))}
                      </Box>
                      <Typography variant="h6" color="primary" gutterBottom>
                        {formatCurrency(court.hourly_rate)}/hr
                      </Typography>
                      <Button
                        variant="contained"
                        fullWidth
                        onClick={() => navigate(`/book/${companyId}/${branchId}/${court.id}`)}
                      >
                        Book Now
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </TabPanel>

          <TabPanel value={tab} index={1}>
            <Box textAlign="center" py={4}>
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate(`/book/${companyId}/${branchId}`)}
              >
                View Availability & Book
              </Button>
            </Box>
          </TabPanel>

          <TabPanel value={tab} index={2}>
            <Grid container spacing={2}>
              {memberships.map((plan) => (
                <Grid item xs={12} md={6} key={plan.id}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {plan.name}
                      </Typography>
                      <Typography variant="h4" color="primary" gutterBottom>
                        {formatCurrency(plan.price)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {plan.billing_type} • {plan.plan_scope}
                      </Typography>
                      <List dense>
                        {plan.benefits?.map((benefit, idx) => (
                          <ListItem key={idx}>
                            <ListItemText primary={benefit.benefit_description} />
                          </ListItem>
                        ))}
                      </List>
                      <Button
                        variant="contained"
                        fullWidth
                        sx={{ mt: 2 }}
                        onClick={() => navigate(`/memberships/purchase/${plan.id}`)}
                      >
                        Purchase
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </TabPanel>

          <TabPanel value={tab} index={3}>
            <Grid container spacing={2}>
              {branch.media?.map((media) => (
                <Grid item xs={12} sm={6} md={4} key={media.id}>
                  <Card>
                    <CardMedia
                      component="img"
                      height="200"
                      image={`${process.env.REACT_APP_API_URL}/media/${media.id}`}
                      alt="Gallery"
                    />
                  </Card>
                </Grid>
              ))}
            </Grid>
          </TabPanel>

          <TabPanel value={tab} index={4}>
            <List>
              {reviews.map((review) => (
                <ListItem key={review.id} divider>
                  <Avatar sx={{ mr: 2 }}>
                    {review.user?.first_name?.[0] || 'U'}
                  </Avatar>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="subtitle1">
                          {review.user?.first_name} {review.user?.last_name}
                        </Typography>
                        <Box display="flex">
                          {[...Array(5)].map((_, i) => (
                            <StarIcon
                              key={i}
                              fontSize="small"
                              sx={{
                                color: i < review.rating ? 'warning.main' : 'action.disabled',
                              }}
                            />
                          ))}
                        </Box>
                      </Box>
                    }
                    secondary={review.comment}
                  />
                </ListItem>
              ))}
            </List>
          </TabPanel>
        </Paper>
      </Container>
    </CustomerLayout>
  );
};

