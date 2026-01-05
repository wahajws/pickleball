import React from 'react';
import {
  Container,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
  Chip,
  IconButton,
} from '@mui/material';
import {
  Notifications as NotificationIcon,
  NotificationsOff as NotificationReadIcon,
  CheckCircle as MarkReadIcon,
} from '@mui/icons-material';
import { CustomerLayout } from '../../components/layouts/CustomerLayout';
import { useApiQuery } from '../../hooks/useQuery';
import { useMutation } from '@tanstack/react-query';
import apiClient from '../../utils/apiClient';
import { API_ENDPOINTS } from '../../config/api';
import { formatDateTime } from '../../utils/format';
import { Loading } from '../../components/common/Loading';
import { useToast } from '../../components/common/Toast';

export const NotificationsPage = () => {
  const { showToast } = useToast();

  // Mock - replace with actual notifications endpoint
  const { data, isLoading } = useApiQuery(
    ['notifications'],
    '/notifications', // This endpoint needs to be created
    { enabled: false }
  );

  const markReadMutation = useMutation({
    mutationFn: async (id) => {
      const response = await apiClient.post(`/notifications/${id}/read`);
      return response.data;
    },
    onSuccess: () => {
      showToast('Notification marked as read', 'success');
    },
  });

  const notifications = data?.data || [
    {
      id: '1',
      title: 'Booking Confirmed',
      message: 'Your booking for Court 1 on Jan 15 has been confirmed',
      read: false,
      created_at: new Date().toISOString(),
    },
    {
      id: '2',
      title: 'Membership Renewal',
      message: 'Your membership will expire in 7 days',
      read: false,
      created_at: new Date().toISOString(),
    },
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkRead = (id) => {
    markReadMutation.mutate(id);
  };

  if (isLoading) {
    return (
      <CustomerLayout>
        <Loading />
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <Container maxWidth="lg">
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4">
            Notifications
          </Typography>
          {unreadCount > 0 && (
            <Chip
              label={`${unreadCount} unread`}
              color="primary"
            />
          )}
        </Box>

        {notifications.length > 0 ? (
          <Paper>
            <List>
              {notifications.map((notification, idx) => (
                <ListItem
                  key={notification.id}
                  sx={{
                    bgcolor: notification.read ? 'transparent' : 'action.hover',
                    borderLeft: notification.read ? 0 : 4,
                    borderColor: 'primary.main',
                  }}
                  secondaryAction={
                    !notification.read && (
                      <IconButton
                        edge="end"
                        onClick={() => handleMarkRead(notification.id)}
                      >
                        <MarkReadIcon />
                      </IconButton>
                    )
                  }
                >
                  <ListItemIcon>
                    {notification.read ? (
                      <NotificationReadIcon color="action" />
                    ) : (
                      <NotificationIcon color="primary" />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="subtitle1">
                          {notification.title}
                        </Typography>
                        {!notification.read && (
                          <Chip label="New" size="small" color="primary" />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {notification.message}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDateTime(notification.created_at)}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        ) : (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <NotificationIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No notifications
            </Typography>
            <Typography variant="body2" color="text.secondary">
              You're all caught up!
            </Typography>
          </Paper>
        )}
      </Container>
    </CustomerLayout>
  );
};

