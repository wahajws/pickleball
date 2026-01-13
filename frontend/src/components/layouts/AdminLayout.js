// src/components/layouts/AdminLayout.jsx
import React, { useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Tooltip,
  Chip,
  useMediaQuery,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Business as BusinessIcon,
  History as HistoryIcon,
  Timeline as ActivityIcon,
  Analytics as BehaviourIcon,
  Code as DeveloperIcon,
  AccountCircle as AccountCircleIcon,
  Logout as LogoutIcon,

  // company-context icons
  AccountTree as BranchesIcon,
  SportsTennis as CourtsIcon,
  Person as TrainersIcon,
  School as ClassesIcon,
  EventAvailable as BookingsIcon,
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { useAuth } from "../../contexts/AuthContext";
import { ROUTES } from "../../utils/constants";

const drawerWidth = 260;

const baseMenuItems = [
  { text: "Dashboard", icon: <DashboardIcon />, path: ROUTES.ADMIN.DASHBOARD },
  { text: "Companies", icon: <BusinessIcon />, path: ROUTES.ADMIN.COMPANIES },
  { text: "User Activity", icon: <ActivityIcon />, path: ROUTES.ADMIN.ACTIVITY },
  { text: "Behaviour Logs", icon: <BehaviourIcon />, path: ROUTES.ADMIN.BEHAVIOUR },
  { text: "Audit Logs", icon: <HistoryIcon />, path: ROUTES.ADMIN.AUDIT_LOGS },
  { text: "Developer Console", icon: <DeveloperIcon />, path: ROUTES.ADMIN.DEVELOPER_CONSOLE },
];

// Helper: build company tab route without hardcoding file structure
const companyTabPath = (companyId, tab) => `/admin/companies/${companyId}?tab=${tab}`;

export const AdminLayout = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const theme = useTheme();
  const isSmDown = useMediaQuery(theme.breakpoints.down("sm"));

  const handleDrawerToggle = () => setMobileOpen((s) => !s);
  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleLogout = async () => {
    handleMenuClose();
    await logout();
    navigate(ROUTES.ADMIN.LOGIN);
  };

  const currentPath = location.pathname;
  const currentSearch = location.search || "";

  // Detect companyId from URL: /admin/companies/:companyId
  const companyIdInPath = useMemo(() => {
    const m = (location.pathname || "").match(/^\/admin\/companies\/([^/]+)/);
    return m?.[1] || null;
  }, [location.pathname]);

  // Read ?tab=xxx
  const activeTab = useMemo(() => {
    const p = new URLSearchParams(currentSearch);
    return p.get("tab") || "";
  }, [currentSearch]);

  const companyMenuItems = useMemo(() => {
    if (!companyIdInPath) return [];

    return [
      { text: "Branches", icon: <BranchesIcon />, path: companyTabPath(companyIdInPath, "branches"), tab: "branches" },
      { text: "Courts", icon: <CourtsIcon />, path: companyTabPath(companyIdInPath, "courts"), tab: "courts" },
      { text: "Trainers", icon: <TrainersIcon />, path: companyTabPath(companyIdInPath, "trainers"), tab: "trainers" },
      { text: "Classes", icon: <ClassesIcon />, path: companyTabPath(companyIdInPath, "classes"), tab: "classes" },
      { text: "Bookings", icon: <BookingsIcon />, path: companyTabPath(companyIdInPath, "bookings"), tab: "bookings" },
    ];
  }, [companyIdInPath]);

  const isSelectedBase = (itemPath) => {
    // Exact match OR nested path (so /admin/companies/123 still highlights Companies)
    if (currentPath === itemPath) return true;
    if (itemPath === ROUTES.ADMIN.COMPANIES && currentPath.startsWith("/admin/companies")) return true;
    return false;
  };

  const isSelectedCompanyTab = (tabName) => {
    // Only active inside /admin/companies/:companyId
    if (!companyIdInPath) return false;
    return activeTab === tabName;
  };

  const go = (path) => {
    navigate(path);
    if (isSmDown) setMobileOpen(false);
  };

  const drawerContent = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Drawer top header */}
      <Box
        sx={{
          bgcolor: "primary.main",
          color: "white",
          px: 2,
          height: 64,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 900, lineHeight: 1 }}>
          Platform Admin
        </Typography>
        <Typography variant="caption" sx={{ opacity: 0.9 }}>
          Pickleball Booking
        </Typography>
      </Box>

      <Divider />

      {/* Base Menu */}
      <List sx={{ px: 1, py: 1 }}>
        {baseMenuItems.map((item) => (
          <ListItemButton
            key={item.text}
            selected={isSelectedBase(item.path)}
            onClick={() => go(item.path)}
            sx={{ borderRadius: 2, mx: 1, my: 0.5 }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItemButton>
        ))}
      </List>

      {/* Company Context Menu (shows only when inside a company detail page) */}
      {companyIdInPath ? (
        <>
          <Divider />
          <Box sx={{ px: 2, pt: 1.5, pb: 0.5 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, letterSpacing: 0.5 }}>
              COMPANY SETUP
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
              Company: {companyIdInPath}
            </Typography>
          </Box>

          <List sx={{ px: 1, pb: 1 }}>
            {companyMenuItems.map((item) => (
              <ListItemButton
                key={item.text}
                selected={isSelectedCompanyTab(item.tab)}
                onClick={() => go(item.path)}
                sx={{ borderRadius: 2, mx: 1, my: 0.5 }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            ))}
          </List>
        </>
      ) : null}

      <Box sx={{ flexGrow: 1 }} />

      <Divider />
      <Box sx={{ p: 2 }}>
        <Typography variant="caption" color="text.secondary">
          Logged in as
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: 700 }}>
          {user?.email || user?.name || "Admin"}
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: "flex" }}>
      {/* Top bar */}
      <AppBar position="fixed" sx={{ zIndex: (t) => t.zIndex.drawer + 1, bgcolor: "primary.main" }}>
        <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
          {/* left */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <IconButton
              color="inherit"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ display: { xs: "inline-flex", sm: "none" } }}
            >
              <MenuIcon />
            </IconButton>

            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.1 }}>
                Pickleball Booking Platform
              </Typography>

              <Box sx={{ display: "flex", gap: 1, alignItems: "center", mt: 0.5, flexWrap: "wrap" }}>
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  Platform Admin
                </Typography>

                <Chip
                  size="small"
                  label="admin"
                  variant="outlined"
                  sx={{ color: "white", borderColor: "rgba(255,255,255,0.35)" }}
                />

                {companyIdInPath ? (
                  <Chip
                    size="small"
                    label="company context"
                    variant="outlined"
                    sx={{ color: "white", borderColor: "rgba(255,255,255,0.35)" }}
                  />
                ) : null}
              </Box>
            </Box>
          </Box>

          {/* right user menu */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="body2" sx={{ display: { xs: "none", sm: "block" } }}>
              {user?.email || user?.name || "Admin"}
            </Typography>

            <Tooltip title="Account">
              <IconButton onClick={handleMenuOpen} size="small">
                <Avatar sx={{ width: 34, height: 34 }}>
                  {user?.first_name?.[0] || user?.email?.[0] || "A"}
                </Avatar>
              </IconButton>
            </Tooltip>

            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              transformOrigin={{ horizontal: "right", vertical: "top" }}
              anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
            >
              <MenuItem disabled>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {user?.name || "Admin"}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {user?.email || ""}
                  </Typography>
                </Box>
              </MenuItem>

              <Divider />

              <MenuItem
                onClick={() => {
                  navigate(ROUTES.ADMIN.PROFILE);
                  handleMenuClose();
                }}
              >
                <ListItemIcon>
                  <AccountCircleIcon fontSize="small" />
                </ListItemIcon>
                Profile
              </MenuItem>

              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <LogoutIcon fontSize="small" />
                </ListItemIcon>
                Logout
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Drawer desktop */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", sm: "block" },
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: "border-box" },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Drawer mobile */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", sm: "none" },
          [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: "border-box" },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Main */}
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
};
