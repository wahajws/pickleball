import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Alert,
} from '@mui/material';

export const DangerConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  requireTyping = false,
  typingValue = '',
  loading = false,
}) => {
  const [typedValue, setTypedValue] = useState('');

  const handleConfirm = () => {
    if (!requireTyping || typedValue === typingValue) {
      onConfirm();
      setTypedValue('');
    }
  };

  const handleClose = () => {
    setTypedValue('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Alert severity="error" sx={{ mb: 2 }}>
          {message}
        </Alert>
        {requireTyping && (
          <>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Type <strong>{typingValue}</strong> to confirm:
            </Typography>
            <TextField
              fullWidth
              value={typedValue}
              onChange={(e) => setTypedValue(e.target.value)}
              placeholder={typingValue}
              disabled={loading}
            />
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          color="error"
          variant="contained"
          disabled={loading || (requireTyping && typedValue !== typingValue)}
        >
          {loading ? 'Processing...' : confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};


