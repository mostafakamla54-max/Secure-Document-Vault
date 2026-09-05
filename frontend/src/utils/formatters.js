export function formatFileSize(bytes) {
  if (!bytes && bytes !== 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

export function formatDate(dateString) {
  if (!dateString) return '';
  return new Date(dateString).toLocaleString('ar');
}

export function formatBytesToHex(bytes) {
  if (!bytes) return '';
  return bytes.toString('hex');
}

export function truncate(str, length = 50) {
  if (!str) return '';
  return str.length > length ? `${str.slice(0, length)}...` : str;
}
