import React from 'react';
import { Paper, Typography, Box } from '@mui/material';

function EmptyState({ title, description, icon }) {
  return (
    <Paper sx={{ p: 6, textAlign: 'center' }}>
      {icon && <Box sx={{ mb: 2 }}>{icon}</Box>}
      <Typography variant="h6">{title}</Typography>
      {description && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {description}
        </Typography>
      )}
    </Paper>
  );
}

export default EmptyState;
