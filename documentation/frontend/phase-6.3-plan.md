# Fase 6.3 — Auditoria e sequência dos dashboards Web

Branch `integration/frontend-v1`; auditoria iniciada com árvore limpa e um commit
local já existente. Não foi criado commit nesta tarefa. Preservar a entrega 6.1.1.

## Decisão de sequência aprovada

O controlador partilhado já implementava login, restauro, conclusão MFA e logout,
mas não existiam interfaces de autenticação, enrolment MFA ou step-up. O registo
normal também ainda não tinha adaptador de sessão. JWT fica em memória na Web;
reload exige novo login. Identidade/papel são sempre confirmados em `GET /auth/me`.

O titular aprovou **Etapa A → dependência Web 6.2 → apresentar resultados → B–E**.
Não iniciar operações de domínio dos dashboards antes dessa apresentação.
Não há autorização para criar contas administrativas ou testar escritas na base
existente. Testes de fluxos autenticados usam respostas simuladas isoladas e
serão classificados como tal; não equivalem a integração com o Auth real.

## Implementação planeada por perfil

| Etapa / perfil | Funcionalidade e contratos reais | Condições |
|---|---|---|
| A / comum | Painéis `/painel/<papel>`, shell, menus, breadcrumbs, estados e componentes existentes | Papel atual Auth; nada de seletor público de identidade; cartões ainda sem métricas ou operações |
| 6.2 / comum | `POST /auth/login`, `/auth/register`, `/auth/mfa/enroll`, `/auth/mfa/complete`, `/auth/logout`; `GET /auth/me`, `/auth/sessions`; `POST /auth/admin/step-up` | Sessão revogável; MFA antes de sessão administrativa; prova vinculada a cada operação; sem recuperação de password ou bootstrap HTTP |
| B / Utilizador | Hydration `/goal`, `/intakes`, `/intakes/daily`, `/reminders`; Training `/plans`, `/exercises`, `/sessions`; Performance `/measurements`, `/measurements/evolution`, `/steps/daily`, `/heart-rate/summary`, `/goals`; Agenda `/activities` | DTOs do proprietário; paginação page/pageSize; sem kcal/pontos/sensores inventados; medições exclusivamente Performance |
| B / serviços e IA | `/professionals/services`, `/agenda/professionals/{professionalId}/availability`, `/agenda/professional-appointments`, `/payments/appointment-payments/{id}`, `/ai-coach/capabilities` | B02–B07 mantidos; confirmação só pelo servidor, financeiro simulado, IA desativada |
| C / Profissional | `/professionals/me`, `/me/capabilities`, `/me/qualifications`, `/me/application-status`, `/me/services`; `/agenda/professional/availability-rules`, `/availability-exceptions`, `/appointments` | Perfil/candidatura não concedem elegibilidade. Estado atual, capacidade, ETag e transições validados pelos proprietários |
| D / Gestor | `/management/me`, `/services`, `/professionals`, `/appointments`, `/payments`, `/dashboard`, `/cases`, `/audit` | Papel + âmbito válido em cada operação; indicadores UTC até 31 dias; respeitar supressão e origem indisponível |
| E / Administrador | `/auth/administration/users`, `/role-requests`, `/audit`; convites `/auth/manager-invitations`; `/management/operators`, `/scopes`, `/assignments`, `/administration/*` | MFA/quórum, step-up exato, decisões independentes, último Admin protegido; sem aprovação real de credenciais ou reativação indevida |

As linhas de domínio usam prefixos relativos ao respetivo serviço. O
[índice completo](../api/backend-release-v1-endpoints.md), o
[OpenAPI](../api/backend-release-v1.openapi.json) e as rotas reais foram confrontados.
Não existem `/api`, `/quotes` público, refresh token, reset de password ou DELETE
de sessão arbitrária. Cada formulário futuro deve confrontar respostas genéricas
do OpenAPI com o controller/service do proprietário antes de definir um DTO.

## DTOs e segurança auditados

- Login: `{email,password}`. Registo: `{name,email,password}`, apenas `utilizador`.
  Email normalizado; password ≥ 8 caracteres, ≤ 72 bytes UTF-8; nome 2–100 sem controlos.
- Auth responde na raiz; `/auth/me` responde `{user}`. Não aplicar unwrap `data`
  global. Desafio MFA não é sessão, não contém permissões e não deve ser persistido.
- Enrolment: `{challenge,password}` → `{data:{secret,otpauthUri}}`.
  Conclusão: `{challenge,otp}` ou `{challenge,recoveryCode}`; recuperação apresentada
  uma vez no primeiro enrolment, sem guardar no browser.
- Step-up: password + OTP ou recuperação, ação/alvo/parâmetros exatos; token de cinco
  minutos, uso único, em `X-Admin-Step-Up`. Sem formulário genérico de comandos.
- As listagens administrativas usam cursor `before`, não page/pageSize.
  Auth mutações usam `version/reasonCode`; Management/Professional usam If-Match
  onde definido. Não descartar strings ETag, não repetir escritas incertas.
- Frontend só indica navegação. Auth e os proprietários revalidam permissões,
  sessões, MFA, âmbito e elegibilidade em cada pedido protegido.

## Design e validação

Manter tokens, Light inicial, Dark persistente, Inter, PNG oficiais e SVG existentes.
Figma oficial `dseqmbo4hzK6sFcOQl5hld`, sessão MCP
`4549a3bc-0e53-45ed-9f50-598a607391fd`: dashboard `193:2`, login
`2031:3128` / `2023:36509`, registo `2031:3085`.
O inventário anterior não contém dashboards Gestor/Admin/Profissional nem MFA;
esses layouts reutilizam os componentes aprovados. Os exemplos numéricos do Figma
nunca são dados pessoais reais ou métricas da aplicação.

Etapa A: TypeScript e quatro testes de papéis/rotas passaram antes da autenticação.
Fase 6.2: testar DTOs, sessão, concorrência, MFA, step-up, 401/403/429, indisponibilidade,
logout, expiração, navegação por perfil, Light/Dark e responsividade, com mocks.
Sem Docker, modificações em microserviços/OpenAPI, bases ou main.
Os [12 bloqueios backend](../release-v1/readiness.md) continuam abertos.

## Continuação de 2026-11-02

A autorização posterior abrange Web/Mobile, recuperação indisponível, navegação e
painéis ligados aos contratos. O estado atual e a distinção entre leituras,
escritas e funcionalidades ainda sem interface estão no
[relatório de navegação e painéis](navigation-auth-dashboards.md). As descrições
anteriores preservam o plano e o histórico da Etapa A. O Auth e a sua política MFA
não foram alterados.
