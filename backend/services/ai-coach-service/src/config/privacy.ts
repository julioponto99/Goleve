import { invalid, text } from './validation';
// Best-effort minimisation, not a claim of automatic anonymisation. Real data is outside this phase.
export function safeText(value: unknown, max: number): string {
  const input = text(value, max);
  if (/\bBearer\s+\S+|\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+|-----BEGIN [A-Z ]*PRIVATE KEY-----|(?:mongodb(?:\+srv)?|amqps?):\/\/|\b(?:sk-|ghp_|github_pat_)[A-Za-z0-9_-]{12,}|(?:password|passwd|palavra-passe|jwt_secret|api[_ -]?key|token)\s*[:=]\s*\S+/i.test(input)) return invalid('Credentials and authentication data are forbidden in AI content');
  return input.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[email removed]').replace(/\+?\d[\d ()-]{7,}\d/g, '[phone removed]');
}
export function wellbeingOutput(value: unknown, max: number): string {
  const result = safeText(value, max);
  if (/\b(?:diagn[oó]stic\w*|diagnos\w*|prescri\w*|prescrib\w*)\b|\b\d+(?:[.,]\d+)?\s*(?:mg|mcg|iu)\b/i.test(result)) return invalid('Clinical diagnoses, prescriptions and medication doses are outside Coach scope');
  return result;
}
