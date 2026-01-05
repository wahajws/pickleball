import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Tabs,
  Tab,
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/common/Toast';
import { ROUTES } from '../../utils/constants';
import { CustomerLayout } from '../../components/layouts/CustomerLayout';

export const SignupPage = () => {
  const [tab, setTab] = useState(0);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [otpData, setOtpData] = useState({
    identifier: '',
    code: '',
  });
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup, requestOtp, verifyOtp } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handlePasswordSignup = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    const result = await signup({
      first_name: formData.first_name,
      last_name: formData.last_name,
      email: formData.email,
      phone: formData.phone,
      password: formData.password,
    });

    if (result.success) {
      showToast('Account created successfully', 'success');
      navigate(ROUTES.CUSTOMER.LOGIN);
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  const handleRequestOtp = async () => {
    setError('');
    setLoading(true);

    const result = await requestOtp(otpData.identifier, 'signup');

    if (result.success) {
      setOtpSent(true);
      showToast('OTP sent successfully', 'success');
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await verifyOtp(otpData.identifier, otpData.code, 'signup');

    if (result.success) {
      showToast('Account created successfully', 'success');
      navigate(ROUTES.CUSTOMER.BOOKINGS);
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  return (
    <CustomerLayout>
      <Container maxWidth="sm">
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            py: 4,
          }}
        >
          <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
            <Typography variant="h4" component="h1" gutterBottom align="center">
              Create Account
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
              Sign up to start booking courts
            </Typography>

            <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mb: 3 }}>
              <Tab label="Email & Password" />
              <Tab label="Phone OTP" />
            </Tabs>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {tab === 0 ? (
              <form onSubmit={handlePasswordSignup}>
                <TextField
                  fullWidth
                  label="First Name"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  margin="normal"
                  required
                  autoFocus
                />
                <TextField
                  fullWidth
                  label="Last Name"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  margin="normal"
                  required
                />
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  margin="normal"
                  required
                />
                <TextField
                  fullWidth
                  label="Phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  margin="normal"
                />
                <TextField
                  fullWidth
                  label="Password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  margin="normal"
                  required
                />
                <TextField
                  fullWidth
                  label="Confirm Password"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  margin="normal"
                  required
                />
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{ mt: 3, mb: 2 }}
                  disabled={loading}
                >
                  {loading ? 'Creating account...' : 'Sign Up'}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  value={otpData.identifier}
                  onChange={(e) => setOtpData({ ...otpData, identifier: e.target.value })}
                  margin="normal"
                  required
                  autoFocus
                  disabled={otpSent}
                  placeholder="+1234567890"
                />
                {!otpSent ? (
                  <Button
                    fullWidth
                    variant="contained"
                    sx={{ mt: 2, mb: 2 }}
                    onClick={handleRequestOtp}
                    disabled={loading || !otpData.identifier}
                  >
                    {loading ? 'Sending...' : 'Send OTP'}
                  </Button>
                ) : (
                  <>
                    <TextField
                      fullWidth
                      label="OTP Code"
                      value={otpData.code}
                      onChange={(e) => setOtpData({ ...otpData, code: e.target.value })}
                      margin="normal"
                      required
                      inputProps={{ maxLength: 6 }}
                    />
                    {process.env.REACT_APP_OTP_DEBUG === 'true' && (
                      <Alert severity="info" sx={{ mb: 2 }}>
                        Debug: OTP is always "123456" in development
                      </Alert>
                    )}
                    <Button
                      type="submit"
                      fullWidth
                      variant="contained"
                      sx={{ mt: 2, mb: 2 }}
                      disabled={loading}
                    >
                      {loading ? 'Verifying...' : 'Verify & Sign Up'}
                    </Button>
                    <Button
                      fullWidth
                      variant="text"
                      onClick={() => {
                        setOtpSent(false);
                        setOtpData({ ...otpData, code: '' });
                      }}
                    >
                      Change Phone Number
                    </Button>
                  </>
                )}
              </form>
            )}

            <Box textAlign="center" mt={2}>
              <Typography variant="body2">
                Already have an account?{' '}
                <Link to={ROUTES.CUSTOMER.LOGIN} style={{ textDecoration: 'none' }}>
                  Sign in
                </Link>
              </Typography>
            </Box>
          </Paper>
        </Box>
      </Container>
    </CustomerLayout>
  );
};


