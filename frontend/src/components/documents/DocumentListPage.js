import React from 'react';
import {
  Typography, TextField, MenuItem, Box, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  InputLabel, FormControl, Select, Alert, CircularProgress, LinearProgress, Chip, Tab, Tabs,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';
import Layout from '../common/Layout';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDocuments, uploadDocument, deleteDocument } from '../../store/slices/documentSlice';
import { documentService } from '../../services/documentService';
import ShareModal from '../sharing/ShareModal';
import EncryptedContentModal from './EncryptedContentModal';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DownloadIcon from '@mui/icons-material/Download';
import ShareIcon from '@mui/icons-material/Share';
import LinkIcon from '@mui/icons-material/Link';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import DescriptionIcon from '@mui/icons-material/Description';
import ImageIcon from '@mui/icons-material/Image';
import AudioIcon from '@mui/icons-material/Audiotrack';
import VideoIcon from '@mui/icons-material/VideoLibrary';
import TableIcon from '@mui/icons-material/TableChart';
import SlideshowIcon from '@mui/icons-material/Slideshow';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import LockIcon from '@mui/icons-material/Lock';

function typeIcon(ext, mime) {
  const e = (ext || '').toLowerCase();
  const m = (mime || '').toLowerCase();
  if (m.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(e)) return <ImageIcon style={{ color: '#4a90d9' }} />;
  if (m.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'flac'].includes(e)) return <AudioIcon style={{ color: '#ff9ff3' }} />;
  if (m.startsWith('video/') || ['mp4', 'avi', 'mkv', 'mov'].includes(e)) return <VideoIcon style={{ color: '#ff9a56' }} />;
  if (['xls', 'xlsx', 'csv'].includes(e)) return <TableIcon style={{ color: '#2ecc71' }} />;
  if (['ppt', 'pptx'].includes(e)) return <SlideshowIcon style={{ color: '#ff9a56' }} />;
  if (['pdf'].includes(e)) return <DescriptionIcon style={{ color: '#e74c3c' }} />;
  if (['doc', 'docx', 'txt'].includes(e)) return <DescriptionIcon style={{ color: '#4a90d9' }} />;
  if (e === 'link' || m === 'link') return <LinkIcon style={{ color: '#00b894' }} />;
  return <InsertDriveFileIcon style={{ color: '#a5b4fc' }} />;
}

const ACCEPT_TYPES = '.pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.txt,.md,.rtf,.odt,.png,.jpg,.jpeg,.gif,.svg,.webp,.heic,.bmp,.mp3,.wav,.ogg,.flac,.aac,.m4a,.mp4,.avi,.mkv,.mov,.webm';

function formatSize(bytes) {
  if (!bytes) return '-';
  const kb = bytes / 1024;
  if (kb < 1) return `${bytes} B`;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
}

function DocumentListPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, loading } = useSelector((state) => state.documents);
  const [filters, setFilters] = React.useState({ category: '', search: '' });
  const [open, setOpen] = React.useState(false);
  const [uploadStatus, setUploadStatus] = React.useState('');
  const [statusMsg, setStatusMsg] = React.useState('');
  const [uploading, setUploading] = React.useState(false);
  const [mode, setMode] = React.useState('file');
  const [uploadForm, setUploadForm] = React.useState({ file: null, title: '', category: 'general', importance: 'normal', description: '' });
  const [shareDoc, setShareDoc] = React.useState(null);
  const [encDocId, setEncDocId] = React.useState(null);
  const [uploadProgress, setUploadProgress] = React.useState(0);

  React.useEffect(() => {
    dispatch(fetchDocuments(filters));
  }, [dispatch, filters]);

  const onDrop = React.useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      const f = acceptedFiles[0];
      setUploadForm((prev) => ({ ...prev, file: f, title: prev.title || f.name.replace(/\.[^.]+$/, '') }));
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, multiple: false, accept: ACCEPT_TYPES });

  const handlePickFile = (e) => {
    const f = e.target.files && e.target.files[0];
    if (f) {
      setUploadForm((prev) => ({ ...prev, file: f, title: prev.title || f.name.replace(/\.[^.]+$/, '') }));
    }
    e.target.value = '';
  };

  const handleUpload = async () => {
    setUploading(true);
    setUploadStatus('');
    setStatusMsg('');
    setUploadProgress(0);
    try {
      const payload = { ...uploadForm };
      if (mode === 'link') {
        let url = payload.title.trim();
        if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
        payload.link = url;
        payload.file = null;
        payload.title = payload.title.trim() || url;
        payload.description = payload.description || url;
      }
      const result = await dispatch(uploadDocument({ data: payload, onUploadProgress: (e) => {
        if (e.total) setUploadProgress(Math.round((e.loaded * 100) / e.total));
      } }));
      if (result.type === 'documents/upload/fulfilled') {
        const createdId = result.payload && (result.payload.id ?? result.payload.id);
        setUploadStatus('success');
        setUploadProgress(100);
        setStatusMsg(mode === 'file' ? '✅ تم رفع الوثيقة وتشفيرها بـ AES-256-GCM' : '✅ تم حفظ الرابط وتشفيره');
        setTimeout(() => {
          setOpen(false);
          setUploadStatus('');
          setStatusMsg('');
          setUploadForm({ file: null, title: '', category: 'general', importance: 'normal', description: '' });
          setUploadProgress(0);
          if (createdId) setEncDocId(createdId);
        }, 700);
      } else {
        setUploadStatus('error');
        setStatusMsg('⚠️ حدث خطأ أثناء الرفع');
      }
    } catch (err) {
      setUploadStatus('error');
      setStatusMsg('⚠️ حدث خطأ أثناء الرفع');
    } finally {
      setUploading(false);
      setUploadProgress((p) => (p === 100 ? p : 0));
    }
  };

  const handleDelete = async (row) => {
    if (window.confirm(`هل أنت متأكد من حذف "${row.title}"؟`)) {
      const result = await dispatch(deleteDocument(row.id));
      if (result.type === 'documents/delete/fulfilled') {
        setStatusMsg('🗑️ تم حذف الوثيقة');
        setTimeout(() => setStatusMsg(''), 2000);
      }
    }
  };

  const handleDownload = async (row) => {
    try {
      const response = await documentService.download(row.id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', row.original_filename || row.title);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setStatusMsg('⚠️ تعذر تحميل الملف');
      setTimeout(() => setStatusMsg(''), 2000);
    }
  };

  const columns = [
    {
      field: 'title',
      headerName: 'الوثيقة',
      flex: 1.4,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {typeIcon(params.row.original_extension, params.row.mime_type)}
          <Box>
            <Typography sx={{ color: '#2d3748', fontWeight: 600 }}>{params.row.title}</Typography>
            {params.row.original_filename && params.row.original_filename !== params.row.title && (
              <Typography variant="caption" sx={{ color: '#a0aec0' }}>{params.row.original_filename}</Typography>
            )}
          </Box>
        </Box>
      ),
    },
    { field: 'category', headerName: 'التصنيف', width: 110 },
    { field: 'importance', headerName: 'الأهمية', width: 100 },
    { field: 'file_size', headerName: 'الحجم', width: 100, valueFormatter: (p) => formatSize(p.value) },
    {
      field: 'encrypted',
      headerName: 'الحالة',
      width: 90,
      renderCell: () => <Chip size="small" label="🔐 مشفر" sx={{ color: '#b7791f', borderColor: '#f1c40f', background: '#fffbeb', fontSize: 11, fontWeight: 700 }} variant="outlined" />,
    },
    {
      field: 'actions',
      headerName: 'إجراءات',
      width: 300,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Button size="small" onClick={() => navigate(`/documents/${params.row.id}`)} startIcon={<VisibilityIcon />} sx={{ color: '#4a90d9', fontWeight: 700 }}>عرض</Button>
          <Button size="small" onClick={() => setEncDocId(params.row.id)} startIcon={<LockIcon />} sx={{ color: '#b7791f', fontWeight: 700 }}>النص المشفر</Button>
          {(params.row.original_extension !== 'link') && (
            <Button size="small" onClick={() => handleDownload(params.row)} startIcon={<DownloadIcon />} sx={{ color: '#2ecc71', fontWeight: 700 }}>تحميل</Button>
          )}
          <Button size="small" onClick={() => setShareDoc(params.row)} startIcon={<ShareIcon />} sx={{ color: '#7c6df0', fontWeight: 700 }}>مشاركة</Button>
          <Button size="small" color="error" onClick={() => handleDelete(params.row)} startIcon={<DeleteIcon />}>حذف</Button>
        </Box>
      ),
    },
  ];

  return (
    <Layout>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" className="page-title">📄 وثائقي</Typography>
        <Button variant="contained" className="btn-primary btn-pulse" startIcon={<UploadFileIcon />} onClick={() => setOpen(true)} sx={{ width: { xs: '100%', sm: 'auto' }, justifyContent: 'center' }}>
          رفع ملف / رابط
        </Button>
      </Box>

      {statusMsg && (
        <Alert severity={uploadStatus === 'success' ? 'success' : 'info'} sx={{ mb: 2, borderRadius: 3 }}>{statusMsg}</Alert>
      )}

      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', background: '#fff', p: 2, borderRadius: 3, boxShadow: '0 2px 12px rgba(74,144,217,0.1)', border: '1px solid #edf2f7' }}>
        <TextField label="بحث" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} sx={{ minWidth: 220 }} />
        <FormControl sx={{ minWidth: 180 }}>
          <InputLabel>التصنيف</InputLabel>
          <Select value={filters.category} label="التصنيف" onChange={(e) => setFilters({ ...filters, category: e.target.value })}>
            <MenuItem value="">الكل</MenuItem>
            <MenuItem value="general">عام</MenuItem>
            <MenuItem value="personal">شخصي</MenuItem>
            <MenuItem value="financial">مالي</MenuItem>
            <MenuItem value="legal">قانوني</MenuItem>
            <MenuItem value="technical">تقني</MenuItem>
            <MenuItem value="medical">طبي</MenuItem>
            <MenuItem value="contract">عقد</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Box sx={{ height: 460, width: '100%', background: '#fff', borderRadius: 3, p: 1, boxShadow: '0 2px 12px rgba(74,144,217,0.08)', border: '1px solid #edf2f7' }}>
        <DataGrid
          rows={items}
          columns={columns}
          loading={loading}
          pageSize={5}
          rowsPerPageOptions={[5, 10, 25]}
          getRowId={(row) => (row && (row.id ?? row.title ?? `${row.created_at}-${row.file_size}`))}
          sx={{
            border: 'none',
            color: '#2d3748',
            '& .MuiDataGrid-columnHeaders': { color: '#4a90d9', fontWeight: 700, background: '#f0f8ff' },
            '& .MuiDataGrid-cell': { color: '#2d3748', outline: 'none' },
            '& .MuiDataGrid-row:hover': { background: '#f0f8ff' },
            '& .MuiTablePagination-root': { color: '#2d3748' },
            '& .MuiDataGrid-menuIcon button': { color: '#718096' },
            '& .MuiDataGrid-sortIcon': { color: '#718096' },
            '& .MuiDataGrid-columnSeparator': { color: '#edf2f7' },
          }}
        />
      </Box>
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ background: '#fff', color: '#4a90d9', fontWeight: 700, pb: 0 }}>
          📤 رفع ملف أو رابط
        </DialogTitle>
        <DialogContent sx={{ background: '#fff', pt: 2, pb: 1 }}>
          <Tabs value={mode} onChange={(e, v) => setMode(v)} sx={{ mb: 2, '& .MuiTab-root': { color: '#718096', fontWeight: 700 }, '& .Mui-selected': { color: '#4a90d9' }, '& .MuiTabs-indicator': { background: '#4a90d9' } }}>
            <Tab value="file" label="📎 ملف" icon={<UploadFileIcon />} />
            <Tab value="link" label="🔗 رابط" icon={<LinkIcon />} />
          </Tabs>

          {mode === 'file' ? (
            <>
              <Box className="sv-upload-sources" sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1.5, mb: 2 }}>
                <Button component="label" variant="outlined" startIcon={<CameraAltIcon />} sx={{ flex: 1, fontWeight: 700, minHeight: { xs: 48, sm: 44 } }}>
                  📷 كاميرا الجهاز
                  <input type="file" hidden accept="image/*,video/*" capture="environment" onChange={handlePickFile} />
                </Button>
                <Button component="label" variant="outlined" startIcon={<PhotoLibraryIcon />} sx={{ flex: 1, fontWeight: 700, minHeight: { xs: 48, sm: 44 } }}>
                  🖼️ المعرض
                  <input type="file" hidden accept="image/*,video/*" onChange={handlePickFile} />
                </Button>
                <Button component="label" variant="outlined" startIcon={<FolderOpenIcon />} sx={{ flex: 1, fontWeight: 700, minHeight: { xs: 48, sm: 44 } }}>
                  📁 مدير الملفات
                  <input type="file" hidden accept={ACCEPT_TYPES} onChange={handlePickFile} />
                </Button>
              </Box>
            <Box {...getRootProps()} sx={{
              border: `2px dashed ${isDragActive ? '#4a90d9' : '#cbd5e0'}`,
              borderRadius: 3, p: 4, textAlign: 'center', mb: 2, cursor: 'pointer',
              transition: 'all 0.3s ease',
              background: isDragActive ? '#f0f8ff' : '#ffffff',
            }}>
              <input {...getInputProps({ accept: ACCEPT_TYPES })} />
              <Typography sx={{ fontSize: 44 }}>📁</Typography>
              <Typography sx={{ color: '#2d3748', fontWeight: 600 }}>
                {uploadForm.file ? uploadForm.file.name : 'اسحب الملف هنا أو انقر للاختيار'}
              </Typography>
              {!uploadForm.file && (
                <Typography variant="caption" sx={{ color: '#a0aec0' }}>
                  المدعوم: PDF, DOC, DOCX, XLS, XLSX, PPT, TXT, PNG, JPG, MP3, MP4, CSV...
                </Typography>
              )}
              {uploadForm.file && (
                <Box sx={{ mt: 1 }}>
                  <Chip size="small" label={`${formatSize(uploadForm.file.size)}`} sx={{ mr: 1, color: '#4a90d9', fontWeight: 700 }} />
                  <Chip size="small" label="🔐 ستُشفَّر بـ AES-256-GCM" sx={{ color: '#b7791f', borderColor: '#f1c40f', background: '#fffbeb', fontSize: 11, fontWeight: 700 }} variant="outlined" />
                </Box>
              )}
            </Box>
            </>
          ) : (
            <TextField
              label="رابط الموقع (مثال: https://whatsapp.com)"
              placeholder="https://..."
              value={uploadForm.title}
              fullWidth
              sx={{ mb: 2 }}
              onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
            />
          )}

          {uploading && (
            <Box sx={{ mb: 2 }}>
              <LinearProgress variant={uploadProgress > 0 ? 'determinate' : 'indeterminate'} value={uploadProgress} sx={{ height: 10, borderRadius: 5, '& .MuiLinearProgress-bar': { background: 'linear-gradient(90deg,#00d2ff,#3a7bd5)' } }} />
              <Typography variant="caption" sx={{ color: 'rgba(45,55,72,0.6)', mt: 0.5, display: 'block', textAlign: 'center', fontWeight: 700 }}>
                {uploadProgress > 0 ? `جاري الرفع والتشفير الآمن... ${uploadProgress}%` : 'جاري الرفع والتشفير الآمن...'}
              </Typography>
            </Box>
          )}

          {uploadStatus === 'success' && <Alert severity="success" sx={{ mb: 2, borderRadius: 3 }}>{statusMsg}</Alert>}
          {uploadStatus === 'error' && <Alert severity="error" sx={{ mb: 2, borderRadius: 3 }}>{statusMsg}</Alert>}

          {!uploadForm.title && mode === 'file' && (
            <TextField label="العنوان" value={uploadForm.title} fullWidth sx={{ mb: 2 }} onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })} />
          )}
          {mode === 'link' && (
            <TextField label="الوصف (اختياري)" value={uploadForm.description} fullWidth multiline rows={2} sx={{ mb: 2 }} onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })} />
          )}
          {mode === 'file' && (
            <TextField label="الوصف (اختياري)" value={uploadForm.description} fullWidth multiline rows={2} sx={{ mb: 2 }} onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })} />
          )}

          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel>التصنيف</InputLabel>
              <Select value={uploadForm.category} label="التصنيف" onChange={(e) => setUploadForm({ ...uploadForm, category: e.target.value })}>
                <MenuItem value="general">عام</MenuItem>
                <MenuItem value="personal">شخصي</MenuItem>
                <MenuItem value="financial">مالي</MenuItem>
                <MenuItem value="legal">قانوني</MenuItem>
                <MenuItem value="technical">تقني</MenuItem>
                <MenuItem value="medical">طبي</MenuItem>
                <MenuItem value="contract">عقد</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>الأهمية</InputLabel>
              <Select value={uploadForm.importance} label="الأهمية" onChange={(e) => setUploadForm({ ...uploadForm, importance: e.target.value })}>
                <MenuItem value="low">منخفضة</MenuItem>
                <MenuItem value="normal">عادية</MenuItem>
                <MenuItem value="high">عالية</MenuItem>
                <MenuItem value="critical">حرجة</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Typography variant="caption" sx={{ display: 'block', mt: 2, color: '#b7791f', textAlign: 'center', fontWeight: 700 }}>
            ⚡ ارفع من أي جهاز (جوال/تابلت/لابتوب) — الحجم الأقصى 20MB
          </Typography>
          <Typography variant="caption" sx={{ display: 'block', mt: 1, color: '#b7791f', textAlign: 'center', fontWeight: 700 }}>
            🔒 سيتم تشفير المحتوى بحماية AES-256-GCM قبل التخزين
          </Typography>
        </DialogContent>
        <DialogActions sx={{ background: '#fff' }}>
          <Button onClick={() => setOpen(false)} sx={{ color: '#718096' }}>إلغاء</Button>
          <Button variant="contained" className="btn-primary" onClick={handleUpload} disabled={uploading || (mode === 'file' ? (!uploadForm.file || !uploadForm.title) : (!uploadForm.title))}>
            {uploading ? <CircularProgress size={20} color="inherit" /> : '📤 رفع وتشفير'}
          </Button>
        </DialogActions>
      </Dialog>

      <ShareModal open={!!shareDoc} onClose={() => setShareDoc(null)} document={shareDoc} />
      <EncryptedContentModal docId={encDocId} open={!!encDocId} onClose={() => setEncDocId(null)} />
    </Layout>
  );
}

export default DocumentListPage;
