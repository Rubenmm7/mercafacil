export const MADRID_TIME_ZONE = 'Europe/Madrid';

export function formatMadridDateTime(value?: string): string {
  if (!value) return '—';
  return new Date(value).toLocaleString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: MADRID_TIME_ZONE
  });
}

export function formatMadridTime(value?: string): string {
  if (!value) return '—';
  return new Date(value).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: MADRID_TIME_ZONE
  });
}
