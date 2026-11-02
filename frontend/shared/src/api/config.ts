export function apiOrigin(value: string | undefined, development = false): string {
  if (!value) throw new Error('A public Gateway origin is required');
  let url: URL;
  try { url = new URL(value); } catch { throw new Error('Invalid Gateway origin'); }
  if (url.username || url.password || url.search || url.hash || url.pathname !== '/') throw new Error('Gateway origin must not include credentials, path, query or fragment');
  const loopback = ['localhost','127.0.0.1','[::1]','10.0.2.2'].includes(url.hostname);
  if (url.protocol !== 'https:' && !(development && loopback && url.protocol === 'http:')) throw new Error('HTTPS is required outside explicit local development');
  return url.origin;
}
