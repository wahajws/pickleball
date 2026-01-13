// src/pages/branch/ContactsPage.js
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
  FormControlLabel,
  Switch,
} from "@mui/material";
import { Add, Edit, Delete } from "@mui/icons-material";

import { BranchLayout } from "../../components/layouts/BranchLayout";
import { Loading } from "../../components/common/Loading";
import { useToast } from "../../components/common/Toast";
import { useApiQuery, useApiMutation, useApiUpdate, useApiDelete } from "../../hooks/useQuery";
import { API_ENDPOINTS } from "../../config/api";
import { formatDateTime } from "../../utils/format";

export const ContactsPage = () => {
  const { companyId: companyIdFromUrl, branchId } = useParams();
  const { showToast } = useToast();

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }, []);

  const companyId =
    companyIdFromUrl || user?.company_id || user?.roles?.[0]?.company_id || "";

  // endpoints (fallback safe)
  const contactsEndpoint = useMemo(() => {
    if (!companyId || !branchId) return "";
    if (API_ENDPOINTS?.BRANCH?.CONTACTS?.LIST) return API_ENDPOINTS.BRANCH.CONTACTS.LIST(companyId, branchId);
    return `/companies/${companyId}/branches/${branchId}/contacts`;
  }, [companyId, branchId]);

  const createEndpoint = useMemo(() => {
    if (!contactsEndpoint) return "";
    if (API_ENDPOINTS?.BRANCH?.CONTACTS?.CREATE) return API_ENDPOINTS.BRANCH.CONTACTS.CREATE(companyId, branchId);
    return contactsEndpoint;
  }, [contactsEndpoint, companyId, branchId]);

  const updateEndpoint = (id) => {
    if (API_ENDPOINTS?.BRANCH?.CONTACTS?.UPDATE) return API_ENDPOINTS.BRANCH.CONTACTS.UPDATE(companyId, branchId, id);
    return `${contactsEndpoint}/${id}`;
  };

  const deleteEndpoint = (id) => {
    if (API_ENDPOINTS?.BRANCH?.CONTACTS?.DELETE) return API_ENDPOINTS.BRANCH.CONTACTS.DELETE(companyId, branchId, id);
    return `${contactsEndpoint}/${id}`;
  };

  // UI state
  const [openDialog, setOpenDialog] = useState(false);
  const [editContact, setEditContact] = useState(null);

  const [form, setForm] = useState({
    name: "",
    role: "",
    email: "",
    phone: "",
    is_primary: false,
    is_active: true,
  });

  const resetForm = () => {
    setForm({
      name: "",
      role: "",
      email: "",
      phone: "",
      is_primary: false,
      is_active: true,
    });
  };

  const openAdd = () => {
    setEditContact(null);
    resetForm();
    setOpenDialog(true);
  };

  const openEdit = (c) => {
    setEditContact(c);
    setForm({
      name: c?.name || "",
      role: c?.role || c?.title || "", // supports either column name
      email: c?.email || "",
      phone: c?.phone || "",
      is_primary: !!c?.is_primary,
      is_active: c?.is_active ?? true,
    });
    setOpenDialog(true);
  };

  // Queries
  const {
    data: contactsRes,
    isLoading,
    error,
    refetch,
  } = useApiQuery(["branch", "contacts", companyId, branchId], contactsEndpoint, {
    enabled: !!contactsEndpoint,
  });

  const contacts = useMemo(() => {
    if (Array.isArray(contactsRes?.data?.contacts)) return contactsRes.data.contacts;
    if (Array.isArray(contactsRes?.data)) return contactsRes.data;
    if (Array.isArray(contactsRes)) return contactsRes;
    return [];
  }, [contactsRes]);

  // Mutations
  const createContact = useApiMutation(createEndpoint, {
    onSuccess: () => {
      showToast("Contact created", "success");
      setOpenDialog(false);
      refetch();
    },
    onError: (err) => {
      showToast(err?.response?.data?.message || "Failed to create contact", "error");
    },
  });

  const updateContact = useApiUpdate((id) => updateEndpoint(id), {
    onSuccess: () => {
      showToast("Contact updated", "success");
      setOpenDialog(false);
      setEditContact(null);
      refetch();
    },
    onError: (err) => {
      showToast(err?.response?.data?.message || "Failed to update contact", "error");
    },
  });

  const deleteContact = useApiDelete((id) => deleteEndpoint(id), {
    onSuccess: () => {
      showToast("Contact deleted", "success");
      refetch();
    },
    onError: (err) => {
      showToast(err?.response?.data?.message || "Failed to delete contact", "error");
    },
  });

  const handleSave = async () => {
    if (!companyId || !branchId) return showToast("companyId/branchId missing", "error");
    if (!form.name) return showToast("Name is required", "error");

    const payload = {
      name: form.name,
      role: form.role, // if backend column is title, service will ignore role; you can rename later
      title: form.role, // send both to support either DB schema
      email: form.email || null,
      phone: form.phone || null,
      is_primary: !!form.is_primary,
      is_active: !!form.is_active,
    };

    if (editContact?.id) {
      await updateContact.mutateAsync({ id: editContact.id, data: payload });
    } else {
      await createContact.mutateAsync(payload);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this contact?")) {
      await deleteContact.mutateAsync(id);
    }
  };

  if (isLoading) {
    return (
      <BranchLayout>
        <Loading />
      </BranchLayout>
    );
  }

  return (
    <BranchLayout>
      <Container maxWidth="lg" sx={{ mt: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 900 }}>
              Contacts
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage branch contacts (front desk, manager, support, etc.)
            </Typography>
          </Box>

          <Button startIcon={<Add />} variant="contained" onClick={openAdd}>
            Add Contact
          </Button>
        </Box>

        {error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error?.response?.data?.message || "Failed to load contacts"}
          </Alert>
        ) : null}

        <Paper sx={{ p: 2 }}>
          {contacts.length ? (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Primary</TableCell>
                  <TableCell>Active</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {contacts.map((c) => (
                  <TableRow key={c.id} hover>
                    <TableCell>{c.name || "—"}</TableCell>
                    <TableCell>{c.role || c.title || "—"}</TableCell>
                    <TableCell>{c.email || "—"}</TableCell>
                    <TableCell>{c.phone || "—"}</TableCell>
                    <TableCell>{c.is_primary ? "Yes" : "No"}</TableCell>
                    <TableCell>{c.is_active === false ? "No" : "Yes"}</TableCell>
                    <TableCell>{c.created_at ? formatDateTime(c.created_at) : "—"}</TableCell>
                    <TableCell align="right">
                      <IconButton color="primary" onClick={() => openEdit(c)}>
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
            <Typography color="text.secondary">No contacts found</Typography>
          )}
        </Paper>

        {/* Dialog */}
        <Dialog open={openDialog} onClose={() => setOpenDialog(false)} fullWidth maxWidth="sm">
          <DialogTitle>{editContact ? "Edit Contact" : "Add Contact"}</DialogTitle>
          <DialogContent>
            <TextField
              label="Name"
              fullWidth
              margin="normal"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />

            <TextField
              label="Role / Title"
              fullWidth
              margin="normal"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            />

            <TextField
              label="Email"
              fullWidth
              margin="normal"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />

            <TextField
              label="Phone"
              fullWidth
              margin="normal"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={!!form.is_primary}
                  onChange={(e) => setForm({ ...form, is_primary: e.target.checked })}
                />
              }
              label="Primary Contact"
              sx={{ mt: 1 }}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={!!form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                />
              }
              label="Active"
              sx={{ mt: 1 }}
            />
          </DialogContent>

          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={createContact.isPending || updateContact.isPending}
            >
              {editContact ? "Update" : "Create"}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </BranchLayout>
  );
};
