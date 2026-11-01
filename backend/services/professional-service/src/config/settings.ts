export interface ProfessionalSettings {
  authServiceUrl: string;
  dataMode: 'disabled' | 'synthetic';
  reviewMode?: 'disabled' | 'synthetic';
  reviewerIds?: readonly string[];
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
  const reviewMode = process.env.PROFESSIONAL_REVIEW_MODE || 'disabled';
  const rawIds = process.env.PROFESSIONAL_REVIEWER_IDS || '';
  const reviewerIds = rawIds ? rawIds.split(',').map((id) => id.trim()) : [];
  if (!['disabled', 'synthetic'].includes(reviewMode) || reviewerIds.length > 50
    || reviewerIds.some((id) => !/^[a-f0-9]{24}$/.test(id)) || new Set(reviewerIds).size !== reviewerIds.length
    || (reviewMode === 'synthetic' && (dataMode !== 'synthetic' || !reviewerIds.length))) {
    throw new Error('Invalid professional review configuration; administrative review is unavailable');
  }
  return { authServiceUrl: url.origin, dataMode, reviewMode: reviewMode as 'disabled' | 'synthetic', reviewerIds };
}
