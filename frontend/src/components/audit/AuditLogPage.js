import React from 'react';
import { Paper, Typography, CircularProgress } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import Layout from '../common/Layout';
import { auditService } from '../../services/auditService';

function AuditLogPage() {
  const [logs, setLogs] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const load = async () => {
      try {
        const response = await auditService.list();
        setLogs(response.data.results || response.data);
      } catch (err) {
        // error
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const columns = [
    { field: 'created_at', headerName: 'الوقت', width: 180 },
    { field: 'actor', headerName: 'المستخدم', width: 120 },
    { field: 'action', headerName: 'الإجراء', width: 200 },
    { field: 'object_type', headerName: 'النوع', width: 120 },
    { field: 'detail', headerName: 'التفاصيل', flex: 1 },
    { field: 'severity', headerName: 'الخطورة', width: 100 },
  ];

  return (
    <Layout>
      <Typography variant="h4" sx={{ mb: 3 }}>سجل التدقيق</Typography>
      <Paper sx={{ height: 500 }}>
        {loading ? (
          <CircularProgress sx={{ mt: 10, ml: '50%' }} />
        ) : (
          <DataGrid
            rows={logs}
            columns={columns}
            pageSize={10}
            rowsPerPageOptions={[10]}
            getRowId={(row) => (row && (row.id ?? row.created_at ?? `${row.action}-${row.actor}`))}
          />
        )}
      </Paper>
    </Layout>
  );
}

export default AuditLogPage;
