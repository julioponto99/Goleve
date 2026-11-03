interface UiSettings {
  tryItOut: boolean;
  operations: Array<{ method: string; path: string }>;
  specUrl: string;
}

// Self-contained function: served as a local JS asset, without inline scripts/CDNs.
export function initializeSwaggerUi(settings: UiSettings) {
  const browser = globalThis as unknown as {
    location: { href: string; origin: string };
    SwaggerUIBundle: (options: Record<string, unknown>) => unknown;
    ui: unknown;
  };
  const operations = settings.operations.map(operation => ({
    method: operation.method.toUpperCase(),
    path: new RegExp('^' + operation.path.split('/').map(part =>
      /^\{[^}]+\}$/.test(part) ? '[^/]+' : part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    ).join('/') + '$'),
  }));
  browser.ui = browser.SwaggerUIBundle({
    url: settings.specUrl,
    dom_id: '#swagger-ui',
    layout: 'BaseLayout',
    deepLinking: true,
    docExpansion: 'none',
    tagsSorter: 'alpha',
    operationsSorter: 'alpha',
    defaultModelsExpandDepth: -1,
    supportedSubmitMethods: settings.tryItOut ? ['get', 'post', 'put', 'patch', 'delete'] : [],
    tryItOutEnabled: settings.tryItOut,
    persistAuthorization: false,
    queryConfigEnabled: false,
    validatorUrl: null,
    withCredentials: false,
    showMutatedRequest: false,
    useUnsafeMarkdown: false,
    requestInterceptor: (request: { url: string; method?: string; credentials?: string; headers?: Record<string, string> }) => {
      const url = new URL(request.url, browser.location.href);
      const method = (request.method || 'GET').toUpperCase();
      if (url.origin !== browser.location.origin || url.username || url.password) throw new Error('Swagger requests must stay on the current Gateway');
      if (method === 'GET' && url.pathname === new URL(settings.specUrl, browser.location.href).pathname) {
        request.credentials = 'omit';
        for (const key of Object.keys(request.headers || {})) if (key.toLowerCase() === 'authorization') delete request.headers![key];
        return request;
      }
      const decoded = decodeURIComponent(url.pathname);
      if (!settings.tryItOut || decoded.split('/').some(part => ['internal', '.', '..'].includes(part.toLowerCase()))
        || !operations.some(operation => operation.method === method && operation.path.test(decoded))) {
        throw new Error('Try it out is disabled or the operation is not in the public contract');
      }
      request.credentials = 'omit';
      return request;
    },
  });
}
