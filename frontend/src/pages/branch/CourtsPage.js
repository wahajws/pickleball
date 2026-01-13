import React, { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
} from "@mui/material";
import { Add, Edit, Delete } from "@mui/icons-material";

import { BranchLayout } from "../../components/layouts/BranchLayout";
import { Loading } from "../../components/common/Loading";
import { useToast } from "../../components/common/Toast";
import { useApiQuery, useApiMutation, useApiUpdate, useApiDelete } from "../../hooks/useQuery";
import { formatDateTime } from "../../utils/format";

export const CourtsPage = () => {
  const { companyId, branchId } = useParams();
  const { showToast } = useToast();

  const [openDialog, setOpenDialog] = useState(false);
  const [editCourt, setEditCourt] = useState(null);

  const [formValues, setFormValues] = useState({
    name: "",
    description: "",
  });

  const courtsEndpoint = useMemo(() => {
    if (!companyId || !branchId) return "";
    return `/companies/${companyId}/branches/${branchId}/courts`;
  }, [companyId, branchId]);

  const {
    data: courtsRes,
    isLoading,
    error,
    refetch,
  } = useApiQuery(["branch", "courts", companyId, branchId], courtsEndpoint, {
    enabled: !!courtsEndpoint,
  });

  const courts = useMemo(() => {
    if (Array.isArray(courtsRes?.data?.courts)) return courtsRes.data.courts;
    if (Array.isArray(courtsRes?.data)) return courtsRes.data;
    if (Array.isArray(courtsRes)) return courtsRes;
    return [];
  }, [courtsRes]);

  const createCourt = useApiMutation(courtsEndpoint, {
    onSuccess: () => {
      showToast("Court created successfully", "success");
      setOpenDialog(false);
      setEditCourt(null);
      setFormValues({ name: "", description: "" });
      refetch();
    },
    onError: (err) => {
      showToast(err?.response?.data?.message || "Failed to create court", "error");
    },
  });

  const updateCourt = useApiUpdate((id) => `${courtsEndpoint}/${id}`, {
    onSuccess: () => {
      showToast("Court updated successfully", "success");
      setOpenDialog(false);
      setEditCourt(null);
      setFormValues({ name: "", description: "" });
      refetch();
    },
    onError: (err) => {
      showToast(err?.response?.data?.message || "Failed to update court", "error");
    },
  });

  const deleteCourt = useApiDelete((id) => `${courtsEndpoint}/${id}`, {
    onSuccess: () => {
      showToast("Court deleted successfully", "success");
      refetch();
    },
    onError: (err) => {
      showToast(err?.response?.data?.message || "Failed to delete court", "error");
    },
  });

  const handleOpenDialog = (court = null) => {
    if (court) {
      setEditCourt(court);
      setFormValues({
        name: court.name || "",
        description: court.description || "",
      });
    } else {
      setEditCourt(null);
      setFormValues({ name: "", description: "" });
    }
    setOpenDialog(true);
  };

  const handleSave = async () => {
    if (!formValues.name) return showToast("Court name is required", "error");

    const payload = {
      name: formValues.name,
      description: formValues.description || null,
    };

    if (editCourt) {
      await updateCourt.mutateAsync({ id: editCourt.id, data: payload });
    } else {
      await createCourt.mutateAsync(payload);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this court?")) {
      await deleteCourt.mutateAsync(id);
    }
  };

  if (isLoading) {
    return (
      <BranchLayout>
        <Loading />
      </BranchLayout>
    );
  }

  if (error) {
    return (
      <BranchLayout>
        <Container maxWidth="lg" sx={{ mt: 3 }}>
          <Alert severity="error">
            {error?.response?.data?.message || "Failed to load courts"}
          </Alert>
        </Container>
      </BranchLayout>
    );
  }

  return (
    <BranchLayout>
      <Container maxWidth="lg" sx={{ mt: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h4">Courts</Typography>
          <Button startIcon={<Add />} variant="contained" onClick={() => handleOpenDialog()}>
            Add Court
          </Button>
        </Box>

        <Paper sx={{ p: 2 }}>
          {courts.length ? (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {courts.map((c) => (
                  <TableRow key={c.id} hover>
                    <TableCell>{c.name}</TableCell>
                    <TableCell>{c.description || "—"}</TableCell>
                    <TableCell>{c.created_at ? formatDateTime(c.created_at) : "—"}</TableCell>
                    <TableCell align="right">
                      <IconButton color="primary" onClick={() => handleOpenDialog(c)}>
                        <Edit />
                      </IconButton>
                      <IconButton color="error" onClick={() => handleDelete(c.id)}>
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Typography color="text.secondary">No courts found</Typography>
          )}
        </Paper>

        <Dialog open={openDialog} onClose={() => setOpenDialog(false)} fullWidth maxWidth="sm">
          <DialogTitle>{editCourt ? "Edit Court" : "Add Court"}</DialogTitle>
          <DialogContent>
            <TextField
              label="Court Name"
              fullWidth
              margin="normal"
              value={formValues.name}
              onChange={(e) => setFormValues({ ...formValues, name: e.target.value })}
            />
            <TextField
              label="Description"
              fullWidth
              margin="normal"
              multiline
              minRows={2}
              value={formValues.description}
              onChange={(e) => setFormValues({ ...formValues, description: e.target.value })}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={createCourt.isPending || updateCourt.isPending}
            >
              {editCourt ? "Update" : "Create"}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </BranchLayout>
  );
};
