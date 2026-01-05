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

export const LoginPage = () => {
  const [tab, setTab] = useState(0);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, requestOtp, verifyOtp } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(identifier, password);

    if (result.success) {
      showToast('Login successful', 'success');
      navigate(ROUTES.CUSTOMER.BOOKINGS);
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  const handleRequestOtp = async () => {
    setError('');
    setLoading(true);

    const result = await requestOtp(identifier, 'login');

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

    const result = await verifyOtp(identifier, otpCode, 'login');

    if (result.success) {
      showToast('Login successful', 'success');
      navigate(ROUTES.CUSTOMER.BOOKINGS);
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            Welcome Back
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
            Sign in to your account
          </Typography>

          <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mb: 3 }}>
            <Tab label="Password" />
            <Tab label="OTP" />
          </Tabs>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {tab === 0 ? (
            <form onSubmit={handlePasswordLogin}>
              <TextField
                fullWidth
                label="Email or Phone"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                margin="normal"
                required
                autoFocus
              />
              <TextField
                fullWidth
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp}>
              <TextField
                fullWidth
                label="Email or Phone"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                margin="normal"
                required
                autoFocus
                disabled={otpSent}
              />
              {!otpSent ? (
                <Button
                  fullWidth
                  variant="contained"
                  sx={{ mt: 2, mb: 2 }}
                  onClick={handleRequestOtp}
                  disabled={loading || !identifier}
                >
                  {loading ? 'Sending...' : 'Send OTP'}
                </Button>
              ) : (
                <>
                  <TextField
                    fullWidth
                    label="OTP Code"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    margin="normal"
                    required
                    inputProps={{ maxLength: 6 }}
                  />
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    sx={{ mt: 2, mb: 2 }}
                    disabled={loading}
                  >
                    {loading ? 'Verifying...' : 'Verify & Sign In'}
                  </Button>
                  <Button
                    fullWidth
                    variant="text"
                    onClick={() => {
                      setOtpSent(false);
                      setOtpCode('');
                    }}
                  >
                    Change Phone/Email
                  </Button>
                </>
              )}
            </form>
          )}

          <Box textAlign="center" mt={2}>
            <Typography variant="body2">
              Don't have an account?{' '}
              <Link to={ROUTES.CUSTOMER.SIGNUP} style={{ textDecoration: 'none' }}>
                Sign up
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};


