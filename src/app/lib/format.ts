export const currency = (value: number | string | null | undefined) =>
  `Rp ${(Number(value ?? 0)).toLocaleString('id-ID')}`;

export const formatDateId = (value: string | Date | null | undefined) => {
  if (!value) {
    return '-';
  }

  const date = value instanceof Date ? value : new Date(value);

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

export const formatMonthId = (value: string) => {
  const date = new Date(`${value}-01T00:00:00.000Z`);

  return new Intl.DateTimeFormat('id-ID', {
    month: 'long',
    year: 'numeric',
  }).format(date);
};
