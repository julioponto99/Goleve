export interface ProfessionalSettings {
  authServiceUrl: string;
  dataMode: 'disabled' | 'synthetic';
}
export function loadSettings(): ProfessionalSettings {
  const url = new URL(process.env.AUTH_SERVICE_URL || 'http://127.0.0.1:3001');
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash || url.pathname !== '/') {
    throw new Error('AUTH_SERVICE_URL must be an HTTP(S) origin without credentials');
  }
  const dataMode = process.env.PROFESSIONAL_DATA_MODE || 'disabled';
  if (dataMode !== 'disabled' && dataMode !== 'synthetic') {
    throw new Error('PROFESSIONAL_DATA_MODE supports only disabled or synthetic');
  }
  return { authServiceUrl: url.origin, dataMode };
}
