export function handleApiError(error, setErrors) {
  const detail = error?.response?.data;
  if (setErrors && detail?.errors) {
    setErrors(detail.errors);
    return detail.message;
  }
  if (setErrors && typeof detail === 'object') {
    setErrors(detail);
    return 'يرجى مراجعة الحقول';
  }
  return detail?.message || 'حدث خطأ غير متوقع';
}

export function getErrorMessage(error) {
  return error?.response?.data?.detail || error?.message || 'حدث خطأ';
}

export function isSuccess(data) {
  return data?.success === true;
}
