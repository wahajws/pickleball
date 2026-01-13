import React, { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Container, Grid, Card, CardContent, Typography, Box, Paper, List, ListItem, ListItemText, Divider, Button
} from "@mui/material";
import { CompanyLayout } from "../../components/layouts/CompanyLayout";
import { useApiQuery } from "../../hooks/useQuery";
import { API_ENDPOINTS } from "../../config/api";
import { Loading } from "../../components/common/Loading";
import { formatDateTime } from "../../utils/format";

const Stat = ({ title, value }) => (
  <Card>
    <CardContent>
      <Typography variant="body2" color="text.secondary">{title}</Typography>
      <Typography variant="h5" sx={{ fontWeight: 900 }}>{value ?? 0}</Typography>
    </CardContent>
  </Card>
);

export const CompanyDemoDashboardPage = () => {
  const { id: companyId } = useParams();

  const branchesEndpoint = `/companies/${companyId}/branches`; // your existing company branches route
  const courtsEndpoint = API_ENDPOINTS.ADMIN.COMPANY.COURTS(companyId);
  const trainersEndpoint = API_ENDPOINTS.ADMIN.COMPANY.TRAINERS(companyId);
  const classesEndpoint = API_ENDPOINTS.ADMIN.COMPANY.CLASSES(companyId);

  const { data: branchesRes, isLoading: bLoading } = useApiQuery(
    ["admin-demo", "branches", companyId], branchesEndpoint, { enabled: !!companyId }
  );

  const { data: courtsRes, isLoading: cLoading } = useApiQuery(
    ["admin-demo", "courts", companyId], courtsEndpoint, { enabled: !!companyId }
  );

  const { data: trainersRes, isLoading: tLoading } = useApiQuery(
    ["admin-demo", "trainers", companyId], trainersEndpoint, { enabled: !!companyId }
  );

  const { data: classesRes, isLoading: clLoading } = useApiQuery(
    ["admin-demo", "classes", companyId], classesEndpoint, { enabled: !!companyId }
  );

  const branches = Array.isArray(branchesRes?.data?.branches) ? branchesRes.data.branches : [];
  const courts = Array.isArray(courtsRes?.data?.courts) ? courtsRes.data.courts : [];
  const trainers = Array.isArray(trainersRes?.data?.trainers) ? trainersRes.data.trainers : [];
  const classes = Array.isArray(classesRes?.data?.classes) ? classesRes.data.classes : [];

  if (bLoading || cLoading || tLoading || clLoading) {
    return <CompanyLayout><Loading /></CompanyLayout>;
  }

  return (
    <CompanyLayout>
      <Container maxWidth="lg" sx={{ mt: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h4" sx={{ fontWeight: 900 }}>Dashboard</Typography>
          <Box display="flex" gap={1}>
            <Button component={Link} to={`/admin/companies/${companyId}/demo/courts`} variant="contained">
              Manage Courts
            </Button>
            <Button component={Link} to={`/admin/companies/${companyId}/demo/classes`} variant="outlined">
              Manage Classes
            </Button>
          </Box>
        </Box>

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6} md={3}><Stat title="Branches" value={branches.length} /></Grid>
          <Grid item xs={12} sm={6} md={3}><Stat title="Courts" value={courts.length} /></Grid>
          <Grid item xs={12} sm={6} md={3}><Stat title="Trainers" value={trainers.length} /></Grid>
          <Grid item xs={12} sm={6} md={3}><Stat title="Upcoming Classes" value={classes.length} /></Grid>
        </Grid>

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>Branches</Typography>
              <List dense>
                {branches.slice(0, 5).map((b, idx) => (
                  <React.Fragment key={b.id}>
                    <ListItem>
                      <ListItemText primary={b.name} secondary={b.created_at ? formatDateTime(b.created_at) : ""} />
                    </ListItem>
                    {idx < Math.min(branches.length, 5) - 1 && <Divider />}
                  </React.Fragment>
                ))}
                {!branches.length && <Typography color="text.secondary" sx={{ p: 2 }}>No branches</Typography>}
              </List>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>Upcoming Classes</Typography>
              <List dense>
                {classes.slice(0, 5).map((c, idx) => (
                  <React.Fragment key={c.id}>
                    <ListItem>
                      <ListItemText
                        primary={c.title}
                        secondary={`${c.trainer?.name || "Trainer"} • ${c.start_datetime ? formatDateTime(c.start_datetime) : ""}`}
                      />
                    </ListItem>
                    {idx < Math.min(classes.length, 5) - 1 && <Divider />}
                  </React.Fragment>
                ))}
                {!classes.length && <Typography color="text.secondary" sx={{ p: 2 }}>No classes</Typography>}
              </List>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </CompanyLayout>
  );
};
