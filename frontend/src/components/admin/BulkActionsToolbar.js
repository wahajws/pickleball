import React from 'react';
import {
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
} from '@mui/material';
import {
  Block as SuspendIcon,
  CheckCircle as ActivateIcon,
  Delete as DeleteIcon,
  Logout as ForceLogoutIcon,
  FileDownload as ExportIcon,
} from '@mui/icons-material';

export const BulkActionsToolbar = ({
  selectedCount,
  onBulkSuspend,
  onBulkActivate,
  onBulkDelete,
  onBulkForceLogout,
  onExportCSV,
  disabled = false,
}) => {
  if (selectedCount === 0) return null;

  return (
    <Toolbar
      sx={{
        bgcolor: 'primary.main',
        color: 'white',
        minHeight: '48px !important',
      }}
    >
      <Typography sx={{ flex: '1 1 100%' }}>
        {selectedCount} selected
      </Typography>
      <Box>
        {onBulkActivate && (
          <Button
            color="inherit"
            size="small"
            startIcon={<ActivateIcon />}
            onClick={onBulkActivate}
            disabled={disabled}
            sx={{ mr: 1 }}
          >
            Activate
          </Button>
        )}
        {onBulkSuspend && (
          <Button
            color="inherit"
            size="small"
            startIcon={<SuspendIcon />}
            onClick={onBulkSuspend}
            disabled={disabled}
            sx={{ mr: 1 }}
          >
            Suspend
          </Button>
        )}
        {onBulkForceLogout && (
          <Button
            color="inherit"
            size="small"
            startIcon={<ForceLogoutIcon />}
            onClick={onBulkForceLogout}
            disabled={disabled}
            sx={{ mr: 1 }}
          >
            Force Logout
          </Button>
        )}
        {onBulkDelete && (
          <Button
            color="inherit"
            size="small"
            startIcon={<DeleteIcon />}
            onClick={onBulkDelete}
            disabled={disabled}
            sx={{ mr: 1 }}
          >
            Delete
          </Button>
        )}
        {onExportCSV && (
          <Button
            color="inherit"
            size="small"
            startIcon={<ExportIcon />}
            onClick={onExportCSV}
            disabled={disabled}
          >
            Export CSV
          </Button>
        )}
      </Box>
    </Toolbar>
  );
};


