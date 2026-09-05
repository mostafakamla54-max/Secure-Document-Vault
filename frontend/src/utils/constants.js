export const categories = [
  { value: 'general', label: 'عام' },
  { value: 'personal', label: 'شخصي' },
  { value: 'financial', label: 'مالي' },
  { value: 'legal', label: 'قانوني' },
  { value: 'medical', label: 'طبي' },
  { value: 'education', label: 'تعليمي' },
  { value: 'work', label: 'عملي' },
  { value: 'other', label: 'أخرى' },
];

export const importanceLevels = [
  { value: 'low', label: 'منخفضة' },
  { value: 'normal', label: 'عادية' },
  { value: 'high', label: 'عالية' },
  { value: 'critical', label: 'حرجة' },
];

export const permissionLevels = [
  { value: 'view', label: 'عرض' },
  { value: 'edit', label: 'تحرير' },
  { value: 'comment', label: 'تعليق' },
  { value: 'full', label: 'صلاحية كاملة' },
];

export function getCategoryLabel(value) {
  return categories.find((c) => c.value === value)?.label || value;
}

export function getImportanceLabel(value) {
  return importanceLevels.find((i) => i.value === value)?.label || value;
}
