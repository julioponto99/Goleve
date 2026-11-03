type OpenApiDocument = {
  paths: Record<string, Record<string, unknown>>;
  components?: Record<string, Record<string, unknown>>;
  [key: string]: unknown;
};

const essentialOperations = [
  'POST /auth/register',
  'POST /auth/login',
  'GET /auth/me',
  'POST /auth/logout',
  'GET /users/me',
  'PATCH /users/me',
  'GET /training/exercises',
  'GET /training/plans',
  'GET /training/sessions',
  'POST /training/sessions',
  'POST /training/sessions/{sessionId}/exercises',
  'GET /hydration/goal',
  'GET /hydration/intakes',
  'POST /hydration/intakes',
  'GET /performance/goals',
  'GET /performance/measurements',
  'GET /performance/measurements/evolution',
  'GET /performance/summary',
  'GET /agenda/activities',
  'POST /agenda/activities',
  'GET /agenda/professional-appointments',
  'POST /agenda/professional-appointments',
  'GET /agenda/professionals/{professionalId}/availability',
  'GET /professionals/catalog',
  'GET /professionals/services',
  'GET /payments',
  'POST /payments',
  'GET /payments/{paymentId}',
  'GET /notifications',
  'GET /notifications/unread-count',
] as const;

const essentialTags: Record<string, string> = {
  auth: 'Autenticação',
  user: 'Perfil',
  training: 'Treinos',
  hydration: 'Hidratação',
  performance: 'Desempenho',
  agenda: 'Agenda',
  professional: 'Profissionais',
  payment: 'Pagamentos',
  notification: 'Notificações',
};

const essentialSummaries: Record<string, string> = {
  'POST /auth/register': 'Criar conta fictícia',
  'POST /auth/login': 'Iniciar sessão',
  'GET /auth/me': 'Consultar sessão atual',
  'POST /auth/logout': 'Terminar sessão',
  'GET /users/me': 'Consultar perfil',
  'PATCH /users/me': 'Atualizar perfil',
  'GET /training/exercises': 'Consultar exercícios',
  'GET /training/plans': 'Consultar planos de treino',
  'GET /training/sessions': 'Consultar sessões de treino',
  'POST /training/sessions': 'Criar sessão de treino',
  'POST /training/sessions/{sessionId}/exercises': 'Registar exercício realizado',
  'GET /hydration/goal': 'Consultar meta de hidratação',
  'GET /hydration/intakes': 'Consultar consumo de água',
  'POST /hydration/intakes': 'Registar consumo de água',
  'GET /performance/goals': 'Consultar objetivos de desempenho',
  'GET /performance/measurements': 'Consultar medições de desempenho',
  'GET /performance/measurements/evolution': 'Consultar evolução física',
  'GET /performance/summary': 'Consultar resumo de desempenho',
  'GET /agenda/activities': 'Consultar agenda pessoal',
  'POST /agenda/activities': 'Adicionar atividade à agenda',
  'GET /agenda/professional-appointments': 'Consultar marcações profissionais',
  'POST /agenda/professional-appointments': 'Realizar marcação profissional',
  'GET /agenda/professionals/{professionalId}/availability': 'Consultar disponibilidade profissional',
  'GET /professionals/catalog': 'Pesquisar profissionais',
  'GET /professionals/services': 'Consultar serviços',
  'GET /payments': 'Consultar pagamentos fictícios',
  'POST /payments': 'Criar pagamento fictício MockBank',
  'GET /payments/{paymentId}': 'Consultar pagamento fictício',
  'GET /notifications': 'Consultar notificações',
  'GET /notifications/unread-count': 'Consultar notificações não lidas',
};

function pointerPart(value: string) {
  return value.replace(/~1/g, '/').replace(/~0/g, '~');
}

function collectReferences(value: unknown, references: Set<string>) {
  if (Array.isArray(value)) {
    value.forEach(item => collectReferences(item, references));
    return;
  }
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    if (key === '$ref' && typeof child === 'string' && child.startsWith('#/components/')) references.add(child);
    collectReferences(child, references);
  }
}

export function createEssentialDocument(source: OpenApiDocument): OpenApiDocument {
  const available = new Set(
    Object.entries(source.paths).flatMap(([path, methods]) =>
      Object.keys(methods).map(method => method.toUpperCase() + ' ' + path),
    ),
  );
  const missing = essentialOperations.filter(operation => !available.has(operation));
  if (missing.length) throw new Error('Essential Swagger operation missing from complete contract: ' + missing.join(', '));

  const paths: OpenApiDocument['paths'] = {};
  for (const operation of essentialOperations) {
    const [method, ...pathParts] = operation.split(' ');
    const path = pathParts.join(' ');
    paths[path] ??= {};
    const documentOperation = structuredClone(source.paths[path][method.toLowerCase()]) as Record<string, unknown>;
    const key = method + ' ' + path;
    documentOperation.summary = essentialSummaries[key] ?? documentOperation.summary;
    if (Array.isArray(documentOperation.tags)) documentOperation.tags = documentOperation.tags.map(tag => essentialTags[tag] ?? tag);
    paths[path][method.toLowerCase()] = documentOperation;
  }

  const references = new Set<string>();
  collectReferences(paths, references);
  const components: Record<string, Record<string, unknown>> = {};
  while (references.size) {
    const reference = references.values().next().value as string;
    references.delete(reference);
    const [, , group, name] = reference.split('/');
    if (!source.components?.[group]?.[name] || components[group]?.[name]) continue;
    components[group] ??= {};
    components[group][name] = structuredClone(source.components[group][name]);
    collectReferences(source.components[group][name], references);
  }

  return {
    ...source,
    paths,
    components,
    info: {
      ...(source.info as Record<string, unknown>),
      title: 'GoLeve V1 — Essential API Explorer',
      description: 'Operações funcionais para demonstração e testes locais. O contrato técnico completo permanece disponível em /api-docs.',
    },
    tags: Object.entries(essentialTags).map(([name]) => ({ name: essentialTags[name] })),
  };
}

export function essentialOperationList() {
  return essentialOperations.map(operation => {
    const [method, ...pathParts] = operation.split(' ');
    return { method: method.toLowerCase(), path: pathParts.join(' ') };
  });
}
