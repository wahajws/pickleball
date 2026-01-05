import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  TextField,
  InputAdornment,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  Chip,
  Button,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Switch,
  FormControlLabel,
  CircularProgress,
} from '@mui/material';
import {
  Search as SearchIcon,
  LocationOn as LocationIcon,
  MyLocation as MyLocationIcon,
  Star as StarIcon,
  CheckCircle as OpenIcon,
  Cancel as ClosedIcon,
} from '@mui/icons-material';
import { CustomerLayout } from '../../components/layouts/CustomerLayout';
import { useApiQuery } from '../../hooks/useQuery';
import { API_ENDPOINTS } from '../../config/api';
import { ROUTES } from '../../utils/constants';
import { formatCurrency } from '../../utils/format';
import { Loading } from '../../components/common/Loading';
import TelemetryClient from '../../api/telemetryClient';

export const ExplorePage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [city, setCity] = useState('');
  const [filters, setFilters] = useState({
    distance: 10,
    indoor: null,
    outdoor: null,
    priceMin: 0,
    priceMax: 100,
    openNow: false,
  });
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);

  // Track page view
  useEffect(() => {
    TelemetryClient.trackPageView(window.location.pathname);
  }, []);

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          setLocationError('Location access denied');
        }
      );
    }
  }, []);

  // Mock API call - replace with actual endpoint
  const { data, isLoading } = useApiQuery(
    ['branches', 'explore', searchTerm, city, filters],
    '/companies/branches/explore', // This endpoint needs to be created in backend
    { enabled: false } // Disable auto-fetch for now
  );

  const branches = data?.data || [];
  const nearMeBranches = userLocation ? branches.slice(0, 5) : [];

  const handleSearch = () => {
    // Track search event (debounced)
    TelemetryClient.sendEvent('explore.search', {
      properties: {
        query_length: searchTerm.length,
        city: city || null,
        filters_used: Object.keys(filters).filter(k => filters[k] !== null && filters[k] !== false && filters[k] !== 0),
        latitude: userLocation?.lat,
        longitude: userLocation?.lng,
        radius: filters.distance,
      },
    }, true); // Debounce search events
    
    // Trigger search query
    console.log('Search:', { searchTerm, city, filters });
  };

  return (
    <CustomerLayout>
      <Container maxWidth="lg" sx={{ py: 2 }}>
        {/* Search Bar */}
        <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Search"
                placeholder="Company or branch name"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="City"
                placeholder="Enter city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocationIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Button
                fullWidth
                variant="contained"
                onClick={handleSearch}
                sx={{ height: '56px' }}
              >
                Search
              </Button>
            </Grid>
          </Grid>

          {/* Filters */}
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Filters
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="caption">Distance: {filters.distance} km</Typography>
                <Slider
                  value={filters.distance}
                  onChange={(e, value) => setFilters({ ...filters, distance: value })}
                  min={1}
                  max={50}
                  step={1}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Court Type</InputLabel>
                  <Select
                    value={filters.indoor === null ? '' : filters.indoor ? 'indoor' : 'outdoor'}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFilters({
                        ...filters,
                        indoor: val === 'indoor' ? true : val === 'outdoor' ? false : null,
                        outdoor: val === 'outdoor' ? true : val === 'indoor' ? false : null,
                      });
                    }}
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="indoor">Indoor</MenuItem>
                    <MenuItem value="outdoor">Outdoor</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="caption">Price Range</Typography>
                <Box display="flex" gap={1} alignItems="center">
                  <TextField
                    size="small"
                    type="number"
                    value={filters.priceMin}
                    onChange={(e) => setFilters({ ...filters, priceMin: e.target.value })}
                    sx={{ width: 80 }}
                  />
                  <Typography>-</Typography>
                  <TextField
                    size="small"
                    type="number"
                    value={filters.priceMax}
                    onChange={(e) => setFilters({ ...filters, priceMax: e.target.value })}
                    sx={{ width: 80 }}
                  />
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={filters.openNow}
                      onChange={(e) => setFilters({ ...filters, openNow: e.target.checked })}
                    />
                  }
                  label="Open Now"
                />
              </Grid>
            </Grid>
          </Box>
        </Paper>

        {/* Near Me Section */}
        {userLocation && (
          <Box sx={{ mb: 4 }}>
            <Box display="flex" alignItems="center" mb={2}>
              <MyLocationIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h5">Near Me</Typography>
            </Box>
            {isLoading ? (
              <Loading />
            ) : nearMeBranches.length > 0 ? (
              <Grid container spacing={2}>
                {nearMeBranches.map((branch) => (
                  <Grid item xs={12} sm={6} md={4} key={branch.id}>
                    <BranchCard branch={branch} />
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography color="text.secondary">No branches found near you</Typography>
              </Paper>
            )}
          </Box>
        )}

        {/* Search Results */}
        <Box>
          <Typography variant="h5" gutterBottom>
            {searchTerm || city ? 'Search Results' : 'All Branches'}
          </Typography>
          {isLoading ? (
            <Loading />
          ) : branches.length > 0 ? (
            <Grid container spacing={3}>
              {branches.map((branch) => (
                <Grid item xs={12} sm={6} md={4} key={branch.id}>
                  <BranchCard branch={branch} />
                </Grid>
              ))}
            </Grid>
          ) : (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No branches found
              </Typography>
              <Typography color="text.secondary">
                Try adjusting your search or filters
              </Typography>
            </Paper>
          )}
        </Box>
      </Container>
    </CustomerLayout>
  );
};

const BranchCard = ({ branch }) => {
  const navigate = useNavigate();
  const isOpen = true; // Calculate based on business hours

  return (
    <Card
      sx={{
        cursor: 'pointer',
        height: '100%',
        '&:hover': { boxShadow: 4 },
      }}
      onClick={() => {
        TelemetryClient.sendEvent('branch.view', {
          company_id: branch.company_id,
          branch_id: branch.id,
          entity_type: 'branch',
          entity_id: branch.id,
        });
        navigate(ROUTES.CUSTOMER.BRANCH_DETAIL(branch.company_id, branch.id));
      }}
    >
      <CardMedia
        component="img"
        height="200"
        image={branch.image_url || '/api/placeholder/400/300'}
        alt={branch.name}
      />
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="start" mb={1}>
          <Typography variant="h6" component="h2">
            {branch.name}
          </Typography>
          <Chip
            icon={isOpen ? <OpenIcon /> : <ClosedIcon />}
            label={isOpen ? 'Open' : 'Closed'}
            color={isOpen ? 'success' : 'default'}
            size="small"
          />
        </Box>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {branch.company?.name}
        </Typography>
        <Box display="flex" alignItems="center" mb={1}>
          <LocationIcon fontSize="small" color="action" />
          <Typography variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
            {branch.address}
          </Typography>
        </Box>
        {branch.distance && (
          <Typography variant="body2" color="primary" gutterBottom>
            {branch.distance.toFixed(1)} km away
          </Typography>
        )}
        {branch.rating && (
          <Box display="flex" alignItems="center" mb={1}>
            <StarIcon fontSize="small" sx={{ color: 'warning.main', mr: 0.5 }} />
            <Typography variant="body2">{branch.rating.toFixed(1)}</Typography>
          </Box>
        )}
        <Button
          variant="contained"
          fullWidth
          sx={{ mt: 2 }}
          onClick={(e) => {
            e.stopPropagation();
            navigate(ROUTES.CUSTOMER.BRANCH_DETAIL(branch.company_id, branch.id));
          }}
        >
          View Details
        </Button>
      </CardContent>
    </Card>
  );
};

