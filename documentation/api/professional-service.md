# Professional Service — fase 1

> Documento da entrega da fase 1. A [fase 2 de aprovação simulada](professional-applications.md) acrescenta submissão, decisões administrativas e catálogo público aprovado. Os códigos de especialização autenticados passaram de `/professionals/catalog` para `/professionals/specializations`; `/professionals/catalog` passa a listar apenas resumos aprovados e publicados. As limitações e resultados abaixo descrevem a entrega original da fase 1.

Implementação de candidaturas privadas de Personal Trainer e Nutricionista, baseada na leitura integral de [professional-profiles](../architecture/professional-profiles.md), [profile-relationships](../architecture/profile-relationships.md) e [profile-permissions](../architecture/profile-permissions.md). Os documentos de desenho foram preservados; as decisões desta fase estão registadas abaixo.

## Decisões apresentadas antes da implementação

- Uma identidade Auth tem, no máximo, um perfil profissional comum. Capacidades são documentos separados por atividade e país; uma pessoa pode declarar PT e Nutricionista sem duplicar contas.
- Uma conta normal pode preparar a candidatura. Não altera o papel Auth nem recebe privilégios: perfil `draft` e `hidden`, capacidades `draft`, qualificações `unverified` e `publishSummary=false`.
- Não existe nesta fase submissão/revisão, aprovação, atribuição de papéis, publicação, diretório público ou elegibilidade para atos profissionais. As respostas indicam explicitamente privilégios/elegibilidade `false`. Mesmo um papel Auth `profissional` não ativa estas operações.
- Os requisitos legais continuam `pending_legal_assessment`, política `synthetic-unassessed-v1`. Não se inferem isenções, habilitações ou portabilidade entre países. Provas, cédulas oficiais e números profissionais não são recolhidos.
- O catálogo fechado `synthetic-v1` contém apenas códigos de demonstração. Não é uma taxonomia profissional aprovada nem uma forma de verificar habilitações. Regiões, fotos e catálogos oficiais adicionais continuam pendentes.
- O utilizador aprovou expressamente uma **declaração privada de horários preferidos durante a candidatura**, editável pelo titular, com dias, intervalos, modalidades online/presencial e fuso. Não representa disponibilidade operacional e não publica horários, gera vagas ou aceita reservas. O Agenda continua a ser o único proprietário da disponibilidade operacional e dos agendamentos; não foi alterado nem integrado funcionalmente.

## Dados fictícios e configuração

Só são aceites os modos `PROFESSIONAL_DATA_MODE=disabled` (por defeito) e `synthetic`. Outros valores, incluindo `real`, são rejeitados no arranque. Em modo desativado, pedidos autenticados de dados devolvem 503 `PROFESSIONAL_DATA_DISABLED`; o processo continua a responder à saúde. O modo marca o âmbito de utilização, mas não reconhece automaticamente se um texto introduzido é fictício: não introduzir dados reais.

No `.env` local ignorado pelo Git foi acrescentado apenas:

~~~dotenv
PROFESSIONAL_DATA_MODE=synthetic
~~~

As restantes configurações/credenciais existentes foram preservadas. `.env.example` mantém o valor seguro `disabled`.

O Compose fornece `MONGO_URI=mongodb://mongodb:27017/goleve_professional` (prefixo configurável), `AUTH_SERVICE_URL=http://auth-service:3001`, porta interna 3007 e modo de dados. Não fornece a chave JWT nem credenciais RabbitMQ ao Professional. O gateway já tinha `PROFESSIONAL_SERVICE_URL=http://professional-service:3007`; agora encaminha `/professionals/*` antes do parser JSON. Não há novas portas publicadas.

Mongoose foi acrescentado apenas ao workspace Professional e ao lockfile central. Os Dockerfiles existentes suportam os novos ficheiros e continuam a executar `npm ci` e compilação TypeScript por workspace; não precisaram de alterações. MongoDB é ligado e os índices inicializados antes de abrir HTTP. Nunca se usa `syncIndexes`, `dropDatabase` ou migrações destrutivas.

~~~sh
docker compose up -d --build
docker compose ps
~~~

Para reconstruir apenas os serviços desta fase, com as dependências já saudáveis:

~~~sh
docker compose up -d --no-deps --build --wait --wait-timeout 180 professional-service api-gateway
~~~

Em execução fora do Docker, definir explicitamente `MONGO_URI` para uma base Professional própria, `AUTH_SERVICE_URL`, `PROFESSIONAL_DATA_MODE` e `PORT=3007` no ambiente do processo; não reutilizar o URI Auth dos exemplos da raiz como base Professional.

## Modelos Mongoose

### Serviços para demonstração

O modo de demonstração permite ao titular criar e gerir serviços sintéticos associados a uma capacidade própria. Estes serviços não representam credenciais, preços comerciais ou verificação profissional real.

| Método | Endpoint | Regra |
|---|---|---|
| POST | `/professionals/me/services` | Criar serviço próprio |
| GET | `/professionals/me/services` | Listar serviços próprios, com `limit` e `before` |
| GET | `/professionals/me/services/:serviceId` | Consultar serviço próprio |
| PATCH | `/professionals/me/services/:serviceId` | Editar com `If-Match` |
| POST | `/professionals/me/services/:serviceId/deactivate` | Desativar com `If-Match` |
| GET | `/professionals/services` | Catálogo público de serviços ativos aprovados |

Os preços são valores EUR entre 0 e 1000, as durações são 30, 45, 60 ou 90 minutos e os buffers são inteiros entre 0 e 120 minutos. A categoria é verificada contra a capacidade, nunca aceite como prova de elegibilidade. O catálogo público só inclui serviços ativos de candidaturas `approved` com `publicationEnabled=true`; suporta `category`, `capabilityId`, `q`, `limit` e `before`.

O modelo `ProfessionalService` / `professional_services` guarda titular Auth, profissional, capacidade, categoria, nome, descrição, preço, duração, buffers, estado ativo e versão otimista. A desativação é lógica e não elimina histórico.

### Elegibilidade administrativa de demonstração

A rota interna Agenda (`POST /internal/v1/agenda/eligibility`) só pode devolver `authority=synthetic` quando `PROFESSIONAL_DEMO_ELIGIBILITY_ENABLED=true`, `PROFESSIONAL_DATA_MODE=synthetic`, `PROFESSIONAL_REVIEW_MODE=synthetic`, `PROFESSIONAL_AGENDA_CONTRACT_ENABLED=true`, `NODE_ENV` é `development` ou `test` e o modo Agenda é `isolated`. Exige ainda candidatura aprovada/publicada, capacidade não suspensa/expirada/rejeitada e pelo menos um serviço ativo correspondente. Em qualquer outro ambiente, ou perante falha de dependência, a resposta permanece inelegível/indisponível. Isto é uma aprovação administrativa sintética e não uma verificação profissional real.

Todos os documentos de negócio têm titular Auth imutável, timestamps, `schemaVersion=1`, `version` e `dataMode=synthetic`. IDs Auth são referências externas; não há `populate` nem leitura direta de bases de outros serviços. Os schemas são estritos e os DTOs usam listas explícitas de campos.

| Modelo / coleção | Dados desta fase |
|---|---|
| `ProfessionalProfile` / `professional_profiles` | Nome profissional, biografia simples, país, idiomas, contacto privado e contactos declarados para eventual publicação futura; candidatura oculta |
| `ProfessionalCapability` / `professional_capabilities` | PT ou Nutricionista, jurisdição, especializações fictícias, ano de início de experiência declarada e modalidades; sem verificação |
| `ProfessionalQualification` / `professional_qualifications` | Um diploma/certificação por documento, título, instituição declarada, datas, capacidade opcional e especializações compatíveis; sem provas ou confirmação automática |
| `ProfessionalAvailabilityDeclaration` / `professional_availability_declarations` | Uma declaração privada por perfil: dias, janelas locais, fuso e modalidades; `visibility=private`, `operational=false` |
| `ProfessionalAuditAccessRecord` / `professional_audit_records` | Intenção e conclusão de operações próprias; ator, tipo de recurso, ação, identificador/versão quando aplicável e data; sem conteúdos |

Índices únicos: perfil por Auth; capacidade por perfil/atividade/país; qualificação por titular/chave de idempotência; declaração de horários por titular e por perfil. Históricos ilimitados não são embebidos no perfil. Não foram criadas coleções de consultas, relações, planos, credenciais oficiais ou verificação.

Os contactos em `publicContacts` são apenas uma declaração privada para eventual publicação futura. Não existe endpoint público, verificação de contacto ou opt-in de publicação nesta fase. `contactsPublicationStatus=unpublished` é controlado pelo servidor. `privateContactEmail` não altera nem replica automaticamente o email de login.

Os campos implementados P1 fictícios são guardados na base privada, sem prometer cifra de aplicação para todos os textos/contactos. Não se recolhem os números de credencial ou conteúdos clínicos que exigiriam os envelopes específicos do desenho. Gestão de chaves, TLS, ACLs e proteção de volumes/backups para dados reais continuam a exigir aprovação própria.

## Autenticação, autorização e estados

Cada pedido `/professionals/*`, incluindo o catálogo e chamadas diretas ao contentor, exige Bearer JWT. A identidade e o papel atuais são obtidos através do `/auth/me` existente, com timeout, sem cache positiva ou redirecionamentos. Não se distribui o segredo HS256, não se guardam tokens nem nome/email Auth desnecessários. O Auth mantém a validação de assinatura, expiração, algoritmo, issuer, audience e conta atual.

Todas as consultas usam o titular autenticado e referências locais coerentes de perfil/capacidade. Não há exceção de gestor/administrador para ler candidaturas alheias. Cabeçalhos de identidade e papéis enviados pelo cliente não dão acesso. IDs de outro candidato devolvem 404. Os tipos PT/Nutricionista são atividades declaradas e não papéis de autenticação.

Só candidaturas `draft` podem ser editadas nesta fase; capacidades editáveis têm estado `draft`; qualificações editáveis estão `unverified` e sem publicação. Não se reescrevem registos aprovados/suspensos por PATCH. Leituras próprias continuam disponíveis para consultar o estado. Os estados futuros constam dos schemas, mas não há comandos desta fase que os ativem. Novos fluxos de aprovação terão de validar todas as condições do desenho e a consistência entre documentos, sem inferir elegibilidade destes DTOs.

Respostas têm `Cache-Control: no-store` e `X-Professional-Data-Mode`. Erros e logs técnicos não incluem corpos, contactos, JWT ou mensagens brutas do driver. Autenticação inválida dá 401; Auth/MongoDB/auditoria indisponível dá 503; proxy sem upstream dá 502.

## Endpoints

Base local pelo gateway: `http://127.0.0.1:3000`. Sucesso de dados: `{ "data": ... }`; erro: `{ "error": { "code": "...", "message": "..." } }`.

| Métodos | Caminho | Operação |
|---|---|---|
| GET | `/professionals/catalog` | Catálogo fictício autenticado, sem exigir perfil criado |
| GET / PUT / PATCH | `/professionals/me` | Consultar / criar / editar candidatura própria |
| GET / POST | `/professionals/me/capabilities` | Listar / declarar atividades próprias |
| GET / PATCH | `/professionals/me/capabilities/:capabilityId` | Consultar / editar declaração de atividade |
| GET / POST | `/professionals/me/qualifications` | Listar / declarar qualificações próprias |
| GET / PATCH | `/professionals/me/qualifications/:qualificationId` | Consultar / editar qualificação própria |
| GET / PUT / PATCH | `/professionals/me/availability-declaration` | Consultar / criar / editar horários preferidos privados |
| GET | `/health` (diretamente no serviço) | Saúde pública com ping MongoDB e modo de dados, 200/503 |

Criar primeiro o perfil; GET nunca o cria implicitamente. PUT é criação apenas, exige `If-None-Match: *` e devolve 201; uma segunda criação dá 412. GET e alterações de documentos devolvem ETag forte `"<id>:<version>"`. PATCH exige `If-Match` desse recurso e usa comparação/incremento atómico de versão no documento; ausência dá 428, versão desatualizada ou de outro recurso dá 412.

POST de capacidades devolve 201 ou 409 se já existir atividade/país no perfil. A atividade e a jurisdição são imutáveis: uma nova jurisdição exige outra capacidade, sem herdar verificação. POST de qualificações exige `Idempotency-Key` (1–128 caracteres `A-Z a-z 0-9 . _ -`). Pedidos concorrentes idênticos devolvem um só documento, 201/200, com `Idempotency-Replayed: true` na repetição. Reutilização para outro conteúdo dá 409. A chave é isolada por titular; uma repetição posterior a PATCH devolve a representação atual desse documento. O vínculo de uma qualificação a uma capacidade é imutável.

Listas aceitam `limit` 1–100 (20 por defeito) e `before=<id>` devolvido na página anterior. São ordenadas por ID decrescente e devolvem `data.items`/`data.nextBefore`. O limite de paginação não pode alterar o filtro de titular. Não se aceitam filtros ou operadores MongoDB livres.

## Corpos fictícios de exemplo

PUT `/professionals/me`, com Bearer e `If-None-Match: *`:

~~~json
{
  "professionalName": "Candidato fictício",
  "countryCode": "PT",
  "languages": ["pt-PT"],
  "biography": "Biografia exclusivamente fictícia.",
  "privateContactEmail": "candidato@example.invalid",
  "publicContacts": { "email": "contacto@example.invalid" }
}
~~~

POST `/professionals/me/capabilities`:

~~~json
{
  "kind": "personal_trainer",
  "jurisdictionCountry": "PT",
  "serviceModes": ["online", "in_person"],
  "experienceStartYear": 2020,
  "specializations": ["synthetic_pt_strength"]
}
~~~

Para a segunda atividade, `kind=nutritionist`; especializações fictícias: `synthetic_nutrition_general` e `synthetic_nutrition_sport`. PT também admite `synthetic_pt_mobility`. Listas são limitadas e rejeitam códigos de outra atividade. Experiência é declarada por ano passado/presente, sem inferir duração exata ou verificação.

POST `/professionals/me/qualifications`, com `Idempotency-Key: synthetic-qualification-001`:

~~~json
{
  "capabilityId": "<ID-da-capacidade-propria>",
  "qualificationType": "certification",
  "title": "Certificação fictícia",
  "issuerName": "Instituição fictícia",
  "awardedOn": "2020-01-01",
  "specializationCodes": ["synthetic_pt_strength"]
}
~~~

`qualificationType`: `degree`, `certification` ou `continuing_education`. A capacidade é opcional para qualificações gerais sem especializações. Datas são calendários válidos `YYYY-MM-DD`; a atribuição não pode estar no futuro e a expiração não precede a atribuição. Um título declarado não prova habilitação.

PUT `/professionals/me/availability-declaration`, com `If-None-Match: *`:

~~~json
{
  "timeZone": "Europe/Lisbon",
  "preferredWeekdays": [1, 3],
  "windows": [
    { "weekday": 1, "startMinute": 540, "endMinute": 720 },
    { "weekday": 3, "startMinute": 900, "endMinute": 1020 }
  ],
  "serviceModes": ["in_person", "online"]
}
~~~

Dias: 0 domingo a 6 sábado. Até 14 janelas, minutos locais 0–1439, intervalo positivo dentro do mesmo dia. Dias selecionados e janelas devem corresponder; janelas do mesmo dia não se sobrepõem. A modalidade é presencial, online ou ambas como duas entradas distintas. Fuso IANA explícito. Estes limites validam uma declaração e não resolvem DST, concorrência de reservas ou disponibilidade real. PATCH pode alterar o fuso/modalidades; se alterar dias/janelas, o conjunto final tem de continuar coerente.

Validações rejeitam campos desconhecidos, HTML/controlos em texto simples, dados de autenticação, estados de revisão/publicação, números oficiais e referências de terceiros. Corpos JSON limitados a 16 KiB. Campos opcionais suportados podem ser limpos com `null` no PATCH; campos obrigatórios e listas não aceitam essa limpeza. Não existem DELETEs.

## Auditoria, limites e questões pendentes

A intenção de operação é persistida antes da execução; a conclusão antes da resposta. Se a auditoria inicial falhar, não há alteração nem entrega. Os registos têm apenas metadados de candidatura fictícia; falhas de autenticação/validação anteriores ao serviço não geram esta auditoria de negócio.

MongoDB permanece standalone: não há atomicidade entre dados de negócio e auditoria em coleções separadas. Uma falha após escrita pode deixar uma intenção sem conclusão ou devolver 503 com dados já persistidos; o cliente deve reler o recurso/reutilizar a chave quando aplicável. Não se prometem outbox, entrega de eventos ou trilho auditável de produção. Não foi escolhido um TTL ou prazo de retenção arbitrário.

Antes de ativar dados reais/privilégios: aprovar catálogos e requisitos por jurisdição/modalidade, workflow de papéis no Auth, revisores/atribuições/segregação de funções, MFA, credenciais e provas, armazenamento/antivírus, proteção/gestão de chaves, retenção e políticas de privacidade. Não há consultas, associações a clientes, planos alimentares, pagamentos ou consentimentos IA nesta fase.

## Testes e ficheiros

A suite Professional cobre validação e schemas, qualificação/atividade cruzadas, titularidade entre duas contas, JWT via Auth real, campos privilegiados, concorrência de versões e idempotência, declarações privadas, ausência de funcionalidades excluídas, falhas de Auth/DB/auditoria/proxy e respostas/logs sem conteúdos. Usa bases aleatórias separadas num MongoDB temporário em tmpfs; não usa dados persistentes do projeto como fixtures.

Repetição a partir da raiz (PowerShell), com uma instância de testes dedicada:

~~~powershell
$env:TEST_MONGO_URI = 'mongodb://127.0.0.1:<porta-temporaria>'
npm --prefix backend test --workspace=@goleve/professional-service
npm --prefix backend test --workspace=@goleve/user-service
npm --prefix backend test --workspace=@goleve/auth-service
~~~

Sem `TEST_MONGO_URI`, a integração é explicitamente ignorada. Não confundir testes unitários com prova de integração completa.

Ficheiros desta fase:

- `backend/services/professional-service/src/`: `app.ts`, `server.ts`, `config/{catalog,countries,database,errors,http,settings,validation}.ts`, `models/{common,index,professional-profile.model,professional-capability.model,professional-qualification.model,availability-declaration.model,audit-access.model}.ts`, `controllers/professional.controller.ts`, `routes/professional.routes.ts`, `services/professional.service.ts`, `middlewares/{auth.middleware,error.middleware}.ts`.
- `backend/services/professional-service/package.json` e `tests/{validation,security,integration}.test.cjs`.
- `backend/api-gateway/src/app.ts`, `routes/professional.routes.ts`, `services/professional-proxy.service.ts`.
- `backend/package-lock.json`, `compose.yaml`, `.env.example`, `README.md` e este documento; apenas configuração de modo fictício acrescentada ao `.env` local ignorado.

Resultados finais:

| Validação | Resultado |
|---|---|
| Professional: validação, segurança e integração real com Auth/gateway/MongoDB temporário | 66 testes aprovados; 0 falhas; 0 ignorados |
| User Service: regressão | 90 testes aprovados; 0 falhas; 0 ignorados |
| Auth Service: regressão | 85 testes aprovados; 0 falhas; 0 ignorados |
| Total | **241 testes aprovados** |
| TypeScript | Professional, gateway, User e Auth compilados com sucesso |
| Build Docker / arranque com espera de saúde | Professional e gateway concluídos com sucesso |
| Serviços Compose configurados | **14 running/healthy** |
| Smoke test dentro do Professional Docker | MongoDB ligado, modo fictício, HTTP 401 sem JWT tanto direto como pelo gateway; sem JWT_SECRET/RABBITMQ_URL no ambiente do Professional |
| Preservação | 146 ficheiros protegidos inalterados; restantes contentores não recriados; volume `goleve_mongo_data` preservado |
| Git e segredos | `git diff --check` sem erros; `.env` e `.secrets/` ignorados; sem segredos locais nos ficheiros candidatos |

Durante a implementação foram corrigidos um validador booleano incompatível com os tipos Mongoose e uma fixture JWT que não incluía issuer/audience. As execuções finais acima passaram integralmente. O aviso de depreciação `DEP0060` da dependência de proxy existente não impediu os testes; o Compose assinalou dois contentores antigos já existentes, que foram preservados. Não ficaram erros de build ou testes pendentes.

Foram criados/alterados 33 ficheiros versionáveis, limitados ao âmbito indicado; o `.env` local continua fora do Git. Não foram executados commit ou push.
