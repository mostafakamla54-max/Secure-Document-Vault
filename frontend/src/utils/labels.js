import React from 'react';
import DescriptionIcon from '@mui/icons-material/Description';
import ImageIcon from '@mui/icons-material/Image';
import AudioIcon from '@mui/icons-material/Audiotrack';
import VideoIcon from '@mui/icons-material/VideoLibrary';
import TableIcon from '@mui/icons-material/TableChart';
import SlideshowIcon from '@mui/icons-material/Slideshow';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import LinkIcon from '@mui/icons-material/Link';

export const CATEGORY_LABELS = {
  general: 'عام',
  personal: 'شخصي',
  financial: 'مالي',
  legal: 'قانوني',
  medical: 'طبي',
  education: 'تعليمي',
  work: 'عمل',
  other: 'أخرى',
  technical: 'تقني',
  contract: 'عقد',
};

export const IMPORTANCE_LABELS = {
  low: 'منخفضة',
  normal: 'عادية',
  high: 'عالية',
  critical: 'حرجة',
};

export function categoryLabel(value) {
  return CATEGORY_LABELS[value] || value || 'عام';
}

export function importanceLabel(value) {
  return IMPORTANCE_LABELS[value] || value || 'عادية';
}

export function typeIcon(ext, mime) {
  const e = (ext || '').toLowerCase();
  const m = (mime || '').toLowerCase();
  if (m.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'bmp', 'heic'].includes(e)) return <ImageIcon style={{ color: '#4a90d9' }} />;
  if (m.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a'].includes(e)) return <AudioIcon style={{ color: '#ff9ff3' }} />;
  if (m.startsWith('video/') || ['mp4', 'avi', 'mkv', 'mov', 'webm'].includes(e)) return <VideoIcon style={{ color: '#ff9a56' }} />;
  if (['xls', 'xlsx', 'csv'].includes(e)) return <TableIcon style={{ color: '#2ecc71' }} />;
  if (['ppt', 'pptx'].includes(e)) return <SlideshowIcon style={{ color: '#ff9a56' }} />;
  if (['pdf'].includes(e)) return <DescriptionIcon style={{ color: '#e74c3c' }} />;
  if (['doc', 'docx', 'txt', 'md', 'rtf', 'odt', 'html'].includes(e)) return <DescriptionIcon style={{ color: '#4a90d9' }} />;
  if (e === 'link' || m === 'link') return <LinkIcon style={{ color: '#00b894' }} />;
  return <InsertDriveFileIcon style={{ color: '#a5b4fc' }} />;
}

export function formatShortDate(dateString) {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${String(d.getFullYear()).slice(2)}`;
}

export function displayTitle(doc) {
  if (!doc) return '';
  const title = (doc.title || '').trim();
  const file = (doc.original_filename || '').trim();
  if (title) return title;
  if (file) return file;
  return 'وثيقة بدون اسم';
}