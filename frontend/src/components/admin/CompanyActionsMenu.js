import React, { useState } from 'react';
import {
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Block as SuspendIcon,
  CheckCircle as ActivateIcon,
  Delete as DeleteIcon,
  LockReset as ResetPasswordIcon,
  Logout as ForceLogoutIcon,
  VpnKey as RegenerateKeysIcon,
  PersonAdd as ImpersonateIcon,
} from '@mui/icons-material';

export const CompanyActionsMenu = ({
  company,
  onView,
  onEdit,
  onSuspend,
  onActivate,
  onDelete,
  onResetPassword,
  onForceLogout,
  onRegenerateKeys,
  onImpersonate,
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleAction = (action) => {
    handleClose();
    action();
  };

  return (
    <>
      <IconButton
        size="small"
        onClick={handleClick}
        aria-label="more actions"
      >
        <MoreVertIcon />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        onClick={(e) => e.stopPropagation()}
      >
        {onView && (
          <MenuItem onClick={() => handleAction(onView)}>
            <ListItemIcon>
              <ViewIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>View Details</ListItemText>
          </MenuItem>
        )}
        {onEdit && (
          <MenuItem onClick={() => handleAction(onEdit)}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Edit Company</ListItemText>
          </MenuItem>
        )}
        <Divider />
        {company.status === 'active' ? (
          onSuspend && (
            <MenuItem onClick={() => handleAction(onSuspend)}>
              <ListItemIcon>
                <SuspendIcon fontSize="small" color="error" />
              </ListItemIcon>
              <ListItemText>Suspend</ListItemText>
            </MenuItem>
          )
        ) : (
          onActivate && (
            <MenuItem onClick={() => handleAction(onActivate)}>
              <ListItemIcon>
                <ActivateIcon fontSize="small" color="success" />
              </ListItemIcon>
              <ListItemText>Activate</ListItemText>
            </MenuItem>
          )
        )}
        {onDelete && (
          <MenuItem onClick={() => handleAction(onDelete)}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>Delete</ListItemText>
          </MenuItem>
        )}
        <Divider />
        {onResetPassword && (
          <MenuItem onClick={() => handleAction(onResetPassword)}>
            <ListItemIcon>
              <ResetPasswordIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Reset Admin Password</ListItemText>
          </MenuItem>
        )}
        {onForceLogout && (
          <MenuItem onClick={() => handleAction(onForceLogout)}>
            <ListItemIcon>
              <ForceLogoutIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Force Logout All Sessions</ListItemText>
          </MenuItem>
        )}
        {onRegenerateKeys && (
          <MenuItem onClick={() => handleAction(onRegenerateKeys)}>
            <ListItemIcon>
              <RegenerateKeysIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Regenerate API Keys</ListItemText>
          </MenuItem>
        )}
        {onImpersonate && (
          <MenuItem onClick={() => handleAction(onImpersonate)}>
            <ListItemIcon>
              <ImpersonateIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Impersonate Admin</ListItemText>
          </MenuItem>
        )}
      </Menu>
    </>
  );
};


