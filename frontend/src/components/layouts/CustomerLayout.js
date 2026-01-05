import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Box,
  Avatar,
  Menu,
  MenuItem,
  BottomNavigation,
  BottomNavigationAction,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Explore as ExploreIcon,
  BookOnline as BookingIcon,
  CardMembership as MembershipIcon,
  AccountBalanceWallet as WalletIcon,
  Person as PersonIcon,
  Menu as MenuIcon,
  Logout as LogoutIcon,
  AccountCircle as AccountCircleIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { ROUTES } from '../../utils/constants';

const bottomNavItems = [
  { label: 'Explore', icon: <ExploreIcon />, path: ROUTES.CUSTOMER.EXPLORE },
  { label: 'Bookings', icon: <BookingIcon />, path: ROUTES.CUSTOMER.BOOKINGS },
  { label: 'Memberships', icon: <MembershipIcon />, path: ROUTES.CUSTOMER.MEMBERSHIPS },
  { label: 'Wallet', icon: <WalletIcon />, path: ROUTES.CUSTOMER.WALLET },
  { label: 'Profile', icon: <PersonIcon />, path: ROUTES.CUSTOMER.PROFILE },
];

export const CustomerLayout = ({ children, showBottomNav = true }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user, isAuthenticated, logout } = useAuth();

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.CUSTOMER.HOME);
  };

  const getBottomNavValue = () => {
    const currentPath = location.pathname;
    const index = bottomNavItems.findIndex(item => currentPath.startsWith(item.path));
    return index >= 0 ? index : 0;
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Top Navigation Bar (Desktop) */}
      <AppBar position="static" sx={{ display: { xs: 'none', md: 'block' } }}>
        <Toolbar sx={{ maxWidth: '1200px', width: '100%', mx: 'auto' }}>
          <Typography
            variant="h6"
            component="div"
            sx={{ flexGrow: 1, cursor: 'pointer' }}
            onClick={() => navigate(ROUTES.CUSTOMER.HOME)}
          >
            Pickleball Booking
          </Typography>
          {isAuthenticated ? (
            <>
              {bottomNavItems.map((item) => (
                <Button
                  key={item.path}
                  color="inherit"
                  onClick={() => navigate(item.path)}
                  sx={{
                    mx: 1,
                    borderBottom: location.pathname.startsWith(item.path) ? 2 : 0,
                    borderColor: 'white',
                  }}
                >
                  {item.label}
                </Button>
              ))}
              <IconButton onClick={handleMenuOpen} sx={{ p: 0, ml: 2 }}>
                <Avatar sx={{ width: 32, height: 32 }}>
                  {user?.first_name?.[0] || 'U'}
                </Avatar>
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
              >
                <MenuItem onClick={() => { navigate(ROUTES.CUSTOMER.PROFILE); handleMenuClose(); }}>
                  <AccountCircleIcon fontSize="small" sx={{ mr: 1 }} />
                  Profile
                </MenuItem>
                <MenuItem onClick={handleLogout}>
                  <LogoutIcon fontSize="small" sx={{ mr: 1 }} />
                  Logout
                </MenuItem>
              </Menu>
            </>
          ) : (
            <>
              <Button color="inherit" onClick={() => navigate(ROUTES.CUSTOMER.LOGIN)}>
                Login
              </Button>
              <Button color="inherit" onClick={() => navigate(ROUTES.CUSTOMER.SIGNUP)}>
                Sign Up
              </Button>
            </>
          )}
        </Toolbar>
      </AppBar>

      {/* Mobile Top Bar */}
      <AppBar position="static" sx={{ display: { xs: 'block', md: 'none' } }}>
        <Toolbar>
          <Typography
            variant="h6"
            component="div"
            sx={{ flexGrow: 1, cursor: 'pointer' }}
            onClick={() => navigate(ROUTES.CUSTOMER.HOME)}
          >
            Pickleball Booking
          </Typography>
          {isAuthenticated && (
            <IconButton onClick={handleMenuOpen} sx={{ p: 0 }}>
              <Avatar sx={{ width: 32, height: 32 }}>
                {user?.first_name?.[0] || 'U'}
              </Avatar>
            </IconButton>
          )}
          {!isAuthenticated && (
            <>
              <Button color="inherit" size="small" onClick={() => navigate(ROUTES.CUSTOMER.LOGIN)}>
                Login
              </Button>
            </>
          )}
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={() => { navigate(ROUTES.CUSTOMER.PROFILE); handleMenuClose(); }}>
              <AccountCircleIcon fontSize="small" sx={{ mr: 1 }} />
              Profile
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <LogoutIcon fontSize="small" sx={{ mr: 1 }} />
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: '100%',
          maxWidth: { xs: '100%', md: '1200px' },
          mx: 'auto',
          px: { xs: 2, sm: 3 },
          py: 3,
          pb: { xs: showBottomNav && isAuthenticated ? 10 : 3, md: 3 },
        }}
      >
        {children}
      </Box>

      {/* Bottom Navigation (Mobile, Logged-in only) */}
      {isAuthenticated && showBottomNav && isMobile && (
        <BottomNavigation
          value={getBottomNavValue()}
          onChange={(event, newValue) => {
            navigate(bottomNavItems[newValue].path);
          }}
          showLabels
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            borderTop: 1,
            borderColor: 'divider',
          }}
        >
          {bottomNavItems.map((item) => (
            <BottomNavigationAction
              key={item.path}
              label={item.label}
              icon={item.icon}
            />
          ))}
        </BottomNavigation>
      )}
    </Box>
  );
};
