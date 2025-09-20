
export const formatDate = (isoString: string): string => {
  return new Date(isoString).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};
