export const formatDate = (dateString?: string | null): string => {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return dateString;
  }
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(amount);
};

export const formatStudentName = (firstName: string, middleName?: string, lastName?: string): string => {
  const middleInitial = middleName ? ` ${middleName.charAt(0)}.` : '';
  return `${lastName || ''}, ${firstName || ''}${middleInitial}`.trim();
};

export const cn = (...classes: (string | boolean | undefined | null)[]): string => {
  return classes.filter(Boolean).join(' ');
};
