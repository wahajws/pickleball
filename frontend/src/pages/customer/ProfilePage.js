import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  TextField,
  Button,
  Avatar,
  Grid,
  Switch,
  FormControlLabel,
  Divider,
} from '@mui/material';
import {
  PhotoCamera as CameraIcon,
} from '@mui/icons-material';
import { CustomerLayout } from '../../components/layouts/CustomerLayout';
import { useMutation } from '@tanstack/react-query';
import { API_ENDPOINTS } from '../../config/api';
import { Loading } from '../../components/common/Loading';
import { useToast } from '../../components/common/Toast';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../utils/apiClient';

export const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });
  const [notificationPrefs, setNotificationPrefs] = useState({
    email: true,
    sms: false,
    push: true,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await apiClient.patch(API_ENDPOINTS.AUTH.ME, data);
      return response.data;
    },
    onSuccess: (data) => {
      updateUser(data.data);
      showToast('Profile updated successfully', 'success');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate({
      id: user.id,
      data: formData,
    });
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('owner_type', 'user');
      formData.append('owner_id', user.id);

      const response = await apiClient.post(API_ENDPOINTS.MEDIA.UPLOAD, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const mediaId = response.data.data.id;
      updateMutation.mutate({
        id: user.id,
        data: { avatar_media_id: mediaId },
      });

      showToast('Avatar updated successfully', 'success');
    } catch (error) {
      showToast('Failed to upload avatar', 'error');
    }
  };

  const avatarUrl = user?.avatar_media_id
    ? `${process.env.REACT_APP_API_URL}/media/${user.avatar_media_id}`
    : null;

  return (
    <CustomerLayout>
      <Container maxWidth="md">
        <Typography variant="h4" gutterBottom>
          Profile
        </Typography>

        <Paper sx={{ p: 3, mb: 3 }}>
          <Box display="flex" flexDirection="column" alignItems="center" mb={3}>
            <Avatar
              src={avatarUrl}
              sx={{ width: 120, height: 120, mb: 2 }}
            >
              {user?.first_name?.[0] || 'U'}
            </Avatar>
            <input
              accept="image/*"
              style={{ display: 'none' }}
              id="avatar-upload"
              type="file"
              onChange={handleAvatarUpload}
            />
            <label htmlFor="avatar-upload">
              <Button
                variant="outlined"
                component="span"
                startIcon={<CameraIcon />}
              >
                Change Photo
              </Button>
            </label>
          </Box>

          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={updateMutation.isLoading}
                >
                  {updateMutation.isLoading ? 'Saving...' : 'Save Changes'}
                </Button>
              </Grid>
            </Grid>
          </form>
        </Paper>

        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Notification Preferences
          </Typography>
          <Divider sx={{ my: 2 }} />
          <Box>
            <FormControlLabel
              control={
                <Switch
                  checked={notificationPrefs.email}
                  onChange={(e) =>
                    setNotificationPrefs({ ...notificationPrefs, email: e.target.checked })
                  }
                />
              }
              label="Email Notifications"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={notificationPrefs.sms}
                  onChange={(e) =>
                    setNotificationPrefs({ ...notificationPrefs, sms: e.target.checked })
                  }
                />
              }
              label="SMS Notifications"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={notificationPrefs.push}
                  onChange={(e) =>
                    setNotificationPrefs({ ...notificationPrefs, push: e.target.checked })
                  }
                />
              }
              label="Push Notifications"
            />
          </Box>
        </Paper>
      </Container>
    </CustomerLayout>
  );
};

