import React from 'react';
import { Paper, Typography, CircularProgress } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import Layout from '../common/Layout';
import { auditService } from '../../services/auditService';
import { actionLabel, objectChip, severityChip, fmtTime } from '../../utils/auditLabels';

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
    { field: 'created_at', headerName: 'الوقت', width: 160, valueFormatter: (p) => fmtTime(p.value) },
    { field: 'actor_username', headerName: 'المستخدم', width: 140, valueGetter: (p) => p.row.actor_username || p.row.actor },
    { field: 'action', headerName: 'الإجراء', width: 210, renderCell: (params) => actionLabel(params.value) },
    { field: 'object_type', headerName: 'النوع', width: 110, renderCell: (params) => objectChip(params.value) },
    { field: 'detail', headerName: 'التفاصيل', flex: 1 },
    { field: 'severity', headerName: 'الخطورة', width: 110, renderCell: (params) => severityChip(params.value) },
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
