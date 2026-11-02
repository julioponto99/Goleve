# Arrancar o backend integrado e desenvolver o frontend

Ambiente paralelo, apenas dados fictícios. [Arquitetura e bloqueios](../architecture/backend-integration-v1.md),
[OpenAPI](backend-integration-v1.openapi.json), [validação](backend-integration-v1-validation.md).

## Preparação

Pré-requisitos: Docker Desktop/Compose v2, Node.js 22+, disco e memória livres.
Na raiz do repositório, na branch `feat/backend-integration-v1`:

```powershell
node scripts/integration.cjs init
node scripts/integration.cjs up
node scripts/integration.cjs status
```

`init` gera uma instância e segredos próprios em `.integration/`, verifica colisões
e guarda metadados dos recursos preexistentes. Não lê `.env`/`.secrets` principais.
Não repetir `init` para regenerar segredos: recusa substituir estado existente.
Outra porta pode ser indicada uma vez: `node scripts/integration.cjs init 64345`.
O exemplo `integration.env.example` explica as opções; não contém credenciais.

`up` constrói somente imagens do novo projeto, instala dependências dentro dos
builds com `npm ci`, inicia a stack e aguarda readiness. A primeira execução demora
mais; as seguintes usam cache e dados/identidades existentes. O inicializador não
substitui passwords ou papéis existentes. As aplicações executam como `node` em
filesystems só de leitura; Mongo/Rabbit usam apenas os seus volumes próprios.

No Windows, Docker Desktop deve ter acesso ao diretório do projeto. Em Linux,
configurar as permissões dos ficheiros de secrets para que o UID do runtime
`node` possa lê-los, preservando acesso restrito; não tornar diretórios de segredos
públicos. A chave de replicação é copiada para tmpfs com proprietário/modo próprios.

## URLs e frontend

Gateway: **http://127.0.0.1:64344**. `/health` confirma processo HTTP;
`/ready` retorna 200 apenas quando as dependências estão disponíveis, ou 503
com os nomes dos serviços indisponíveis, sem segredos/endpoints internos.

Web local: origens permitidas `http://localhost:5173` e `http://127.0.0.1:5173`.
Configurar a variável de API do frontend para o Gateway acima. Cookies não são
usados. Outros origins exigem configuração explícita em `CORS_ALLOWED_ORIGINS`
no Compose da integração e atualização apenas do Gateway paralelo.

Enviar `Authorization: Bearer <accessToken>` depois de registo/login. Guardar o
token com os controlos apropriados ao cliente; não colocar segredos de serviço
no frontend. Após 401/revogação, limpar sessão e pedir novo login. JWT anteriores
sem `sid` não são aceites. O login administrativo pode devolver desafio MFA, sem
token; não tratar essa resposta como autenticação administrativa concluída.

Criar perfil com `If-None-Match: *`; alterações usam `If-Match`/ETag quando o
contrato do proprietário o exigir. CORS permite esses cabeçalhos, Idempotency-Key
e X-Admin-Step-Up, e expõe ETag/Idempotency-Replayed/Retry-After. Não enviar headers
de contratos internos. Motivos, parâmetros e provas administrativas seguem a
[API de Administração](administration-v1.md).

Android Emulator: usar o endereço do host disponibilizado pelo emulador
(`10.0.2.2` no emulador padrão), porta configurada. iOS Simulator no mesmo host
pode usar loopback. Dispositivos físicos não alcançam esta publicação exclusiva
em loopback; exposição LAN/túnel depende de autorização e configuração separadas.
Clientes nativos sem Origin continuam sujeitos a JWT e permissões no backend.

| Serviço | Prefixo / percurso disponível | Limite explícito |
|---|---|---|
| Auth | `/auth/register`, `/auth/login`, `/auth/me`, sessões/logout | Sem administradores de desenvolvimento criados automaticamente |
| User | `/users/me`, preferências, dados físicos, histórico, objetivos | Apenas dados fictícios autorizados |
| Training | `/training/exercises`, `/plans`, `/sessions` sob `/training` | Sem acesso a planos de terceiros |
| Hydration | `/hydration/goal`, `/intakes`, `/reminders` | Recomendações não são diagnósticos |
| Performance | `/performance/goals`, `/steps`, `/measurements`, `/summary` | Persistência do próprio titular |
| Agenda | `/agenda/activities`, `/:activityId` e ações | Contrato real atual; não assumir `/agenda/me/activities` |
| Professional | `/professionals/specializations`, candidatura própria | Sem profissionais aprovados/elegíveis na base de desenvolvimento |
| Management | `/management/*` | Exige Gestor com âmbito ou Administrador com MFA/quórum conforme operação |
| Payment | `/payments` com fixtures backend e MockBank | Pagamento independente simulado; não é pagamento integrado de uma reserva |
| Notification | `/notifications`, `/preferences`, `/unread-count` sob `/notifications` | Apenas notificações internas do titular |
| Coach | `/ai-coach/*` encaminhado | 503 `AI_COACH_DISABLED` após autenticação; sem fornecedor |

Os contratos detalhados existentes estão nos documentos desta pasta. Os dois
OpenAPI administrativos são reutilizados pelo índice OpenAPI da integração;
o subconjunto operacional descrito corresponde aos percursos validados.
Criar apenas contas fictícias, por exemplo emails no domínio `example.invalid`.

## Testar, parar e recuperar

```powershell
node scripts/integration.cjs test
node scripts/integration.cjs stop
node scripts/integration.cjs start
node scripts/integration.cjs status
```

`test` cria utilizadores fictícios e dados próprios na stack paralela; os
testes administrativos limpam exclusivamente as coleções de fixtures de uma
base marcada e separada, nunca a base Auth de desenvolvimento. Para testar
recuperação, para e volta a iniciar apenas o novo RabbitMQ e o novo MongoDB.
O relatório sem tokens/passwords fica em `.integration/<id>/validation.json`.
Estes testes não usam bases/credenciais principais nem provisionam contas reais.

`stop` conserva contentores, redes, volumes, dados e secrets. `start` volta a
iniciar os mesmos componentes; pode demorar até a readiness recuperar.
`up` é usado para aplicar alterações de imagem/configuração. A CLI não oferece
comandos de remoção de volumes ou redes. Não executar `down -v`, prune, apagar
`.integration` ou substituir os secrets para tentar corrigir autenticação.

## Diagnóstico

- **Porta/memória/disco:** `init`/`up` recusam preflight insuficiente. Não parar
  serviços antigos para libertar recursos sem autorização.
- **503 `/ready`:** usar os nomes das dependências na resposta e `status`.
  RabbitMQ indisponível mantém Notification vivo mas indisponível para consumir.
- **401:** sessão inválida/expirada/revogada; novo login, sem aceitar JWT antigo.
- **403:** papel/âmbito, prova reforçada ou Origin não permitido; não criar bypass.
- **Mongo autenticado:** não substituir credenciais. O utilizador de cada serviço
  só pode ler a própria base; acesso a outra deve falhar.
- **Candidatura/Payment+Agenda/Coach bloqueados:** comportamento esperado descrito
  na arquitetura. Manter validadores; não alterar o hostname para fingir loopback.
- **Logs/configuração:** ambientes expandidos e inspeções Docker completas podem
  conter secrets; não os copiar para documentação, issues ou Git.

Nenhuma operação sobre backups ou migração principal é necessária para usar este
ambiente. A sua preparação produtiva exige uma tarefa e autorização separadas.
