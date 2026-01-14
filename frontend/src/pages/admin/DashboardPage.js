import React, { useMemo } from "react";
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
} from "@mui/material";
import {
  Business as BusinessIcon,
  CheckCircle as ActiveIcon,
  Cancel as SuspendedIcon,
  Store as BranchIcon,
  People as UsersIcon,
  History as HistoryIcon,
} from "@mui/icons-material";

import { useQueries } from "@tanstack/react-query";

import { AdminLayout } from "../../components/layouts/AdminLayout";
import { useApiQuery } from "../../hooks/useQuery";
import { API_BASE_URL, API_ENDPOINTS } from "../../config/api";
import { Loading } from "../../components/common/Loading";
import { formatDateTime } from "../../utils/format";

// ---------------- helpers ----------------
const toArray = (res) => {
  const arr =
    res?.data?.companies ||
    res?.data?.branches ||
    res?.data?.users ||
    res?.data?.rows ||
    res?.data?.data ||
    res?.data ||
    res;
  return Array.isArray(arr) ? arr : [];
};

const getToken = () => {
  // try common keys (adjust if your app uses different key)
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("access_token") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("authToken") ||
    ""
  );
};

const fetchJson = async (endpoint) => {
  const token = getToken();
  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE_URL}${endpoint}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  // if backend returns json error
  let body = null;
  try {
    body = await res.json();
  } catch (e) {
    // ignore
  }

  if (!res.ok) {
    const msg = body?.message || `Request failed (${res.status})`;
    throw new Error(msg);
  }

  return body;
};

export const DashboardPage = () => {
  // 1) Companies
  const { data: companiesData, isLoading: companiesLoading } = useApiQuery(
    ["admin", "companies"],
    API_ENDPOINTS.ADMIN.PLATFORM.COMPANIES
  );

  const companies = useMemo(() => toArray(companiesData), [companiesData]);

  const activeCompanies = useMemo(
    () => companies.filter((c) => String(c.status || "").toLowerCase() === "active"),
    [companies]
  );

  const suspendedCompanies = useMemo(
    () => companies.filter((c) => String(c.status || "").toLowerCase() === "suspended"),
    [companies]
  );

  // 2) Branch count aggregation (✅ correct way using useQueries)
  const branchQueries = useQueries({
    queries: companies.map((c) => {
      const endpoint = API_ENDPOINTS.BRANCHES?.LIST
        ? API_ENDPOINTS.BRANCHES.LIST(c.id)
        : `/companies/${c.id}/branches`;

      return {
        queryKey: ["admin", "company-branches", c.id],
        queryFn: () => fetchJson(endpoint),
        enabled: !!companies.length,
        staleTime: 30_000,
      };
    }),
  });

  const branchesLoading = useMemo(
    () => branchQueries.some((q) => q.isLoading),
    [branchQueries]
  );

  const totalBranches = useMemo(() => {
    let sum = 0;
    for (const q of branchQueries) {
      const arr =
        q?.data?.data?.branches ||
        q?.data?.branches ||
        q?.data?.data?.rows ||
        q?.data?.rows ||
        q?.data?.data ||
        q?.data;
      if (Array.isArray(arr)) sum += arr.length;
      else if (Array.isArray(arr?.rows)) sum += arr.rows.length;
    }
    return sum;
  }, [branchQueries]);

  // 3) Users count (keep your old behavior = 0 until endpoint exists)
  const totalUsers = 0;

  // 4) Audit logs (still disabled like your code)
  const { data: auditData, isLoading: auditLoading } = useApiQuery(
    ["admin", "audit-logs", "recent"],
    API_ENDPOINTS.ADMIN.PLATFORM.AUDIT_LOGS + "?limit=5",
    { enabled: false }
  );
  const auditLogs = useMemo(() => toArray(auditData), [auditData]);

  const recentCompanies = useMemo(() => {
    return [...companies]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5);
  }, [companies]);

  const recentSuspended = useMemo(() => {
    return [...suspendedCompanies]
      .sort(
        (a, b) =>
          new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at)
      )
      .slice(0, 5);
  }, [suspendedCompanies]);

  if (companiesLoading) {
    return (
      <AdminLayout>
        <Loading />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Container maxWidth="lg">
        <Typography variant="h4" gutterBottom>
          Platform Dashboard
        </Typography>

        {/* KPI Cards */}
        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <BusinessIcon sx={{ fontSize: 40, color: "primary.main", mr: 2 }} />
                  <Box>
                    <Typography variant="h4">{companies.length}</Typography>
                    <Typography color="text.secondary">Total Companies</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <ActiveIcon sx={{ fontSize: 40, color: "success.main", mr: 2 }} />
                  <Box>
                    <Typography variant="h4">{activeCompanies.length}</Typography>
                    <Typography color="text.secondary">Active Companies</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <SuspendedIcon sx={{ fontSize: 40, color: "error.main", mr: 2 }} />
                  <Box>
                    <Typography variant="h4">{suspendedCompanies.length}</Typography>
                    <Typography color="text.secondary">Suspended Companies</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <BranchIcon sx={{ fontSize: 40, color: "info.main", mr: 2 }} />
                  <Box>
                    <Typography variant="h4">{branchesLoading ? "…" : totalBranches}</Typography>
                    <Typography color="text.secondary">Total Branches</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <UsersIcon sx={{ fontSize: 40, color: "warning.main", mr: 2 }} />
                  <Box>
                    <Typography variant="h4">{totalUsers}</Typography>
                    <Typography color="text.secondary">Total Users</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Activity Section */}
        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Recently Created Companies
              </Typography>
              <List dense>
                {recentCompanies.length > 0 ? (
                  recentCompanies.map((company, idx) => (
                    <React.Fragment key={company.id}>
                      <ListItem>
                        <ListItemText
                          primary={company.name}
                          secondary={formatDateTime(company.created_at)}
                        />
                        <Chip
                          label={company.status}
                          size="small"
                          color={company.status === "active" ? "success" : "default"}
                        />
                      </ListItem>
                      {idx < recentCompanies.length - 1 && <Divider />}
                    </React.Fragment>
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                    No companies yet
                  </Typography>
                )}
              </List>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Recently Suspended Companies
              </Typography>
              <List dense>
                {recentSuspended.length > 0 ? (
                  recentSuspended.map((company, idx) => (
                    <div key={company.id}>
                      <ListItem>
                        <ListItemText
                          primary={company.name}
                          secondary={formatDateTime(company.updated_at || company.created_at)}
                        />
                        <Chip label="Suspended" size="small" color="error" />
                      </ListItem>
                      {idx < recentSuspended.length - 1 && <Divider />}
                    </div>
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                    No suspended companies
                  </Typography>
                )}
              </List>
            </Paper>
          </Grid>

          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Box display="flex" alignItems="center" mb={2}>
                <HistoryIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Latest Audit Log Entries</Typography>
              </Box>

              {auditLoading ? (
                <Loading />
              ) : auditLogs.length > 0 ? (
                <List dense>
                  {auditLogs.map((log, idx) => (
                    <div key={log.id}>
                      <ListItem>
                        <ListItemText
                          primary={`${log.action} - ${log.entity_type}`}
                          secondary={`${log.actor_user_id} • ${formatDateTime(log.created_at)}`}
                        />
                      </ListItem>
                      {idx < auditLogs.length - 1 && <Divider />}
                    </div>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                  No audit logs available
                </Typography>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </AdminLayout>
  );
};
