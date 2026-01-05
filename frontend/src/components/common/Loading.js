import React from 'react';
import { Box, CircularProgress } from '@mui/material';

export const Loading = ({ fullScreen = false }) => {
  const content = (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight={fullScreen ? '100vh' : '200px'}
    >
      <CircularProgress />
    </Box>
  );

  return content;
};

export default Loading;


