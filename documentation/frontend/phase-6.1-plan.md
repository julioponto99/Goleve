# Fase 6.1 — Plano de implementação sujeito a aprovação

> Registo histórico da análise. As decisões funcionais e a implementação exclusiva
> das fundações foram posteriormente aprovadas pelo titular. Performance é o
> proprietário das medições/histórico; User é o proprietário de perfil/preferências.
> Ver o [estado de implementação](phase-6.1-foundations.md) e o
> [diagnóstico dos verificadores](strict-checks-diagnosis.md). As validações da
> análise abaixo mantêm o seu âmbito e não substituem os testes da implementação.

Branch confirmada: `integration/frontend-v1`, HEAD `0426760`.
Esta entrega contém análise/documentação. Não cria aplicações, componentes,
fixtures, dependências, novas rotas, contas ou infraestrutura.

Consultar o [inventário real](figma-inventory.md) e a
[matriz de compatibilidade](figma-backend-matrix.md).
Os protótipos anteriores deixam de ser a referência principal.

## Diagnóstico e decisões propostas

O Figma evidencia o percurso pessoal/autónomo em Light/Dark: 22 famílias Web e
24 Mobile. Não fornece os ecrãs necessários aos fluxos positivos de MFA/step-up,
profissional, Gestor, Administrador ou pagamento. A arquitetura backend prevalece;
esses ecrãs não foram inventados nesta análise.

Antes dos componentes, aprovar as adaptações da matriz, em especial:

1. Proprietário dos dados corporais visíveis: proposta de usar Performance para
   medições/gráficos kg/cm e User para perfil/preferências; sem dupla escrita.
   Esta é uma proposta de consumo frontend, não resolve a convergência de domínio.
2. Marcar treino como atividade pessoal independente: recolher fim e ambiente e
   não prometer ligação planId/sessão inexistente na Agenda.
3. Sugestão Hydration com campos/regras reais, sem aplicar 35 ml/kg universal,
   sem equivalência inventada entre três níveis e booleano active.
4. Adição de exercício via catálogo/ID existente ou formulário ampliado com os
   metadados obrigatórios; não criar exercício incompleto.
5. Manter recuperação de acesso, kcal, gamificação, push, sensores e diagnóstico
   indisponíveis; Coach desativado. Apresentar dados vazios, erros e bloqueios reais.
6. Confirmar recurso de logo Mobile, diferenças de cores e ajustes de legibilidade;
   corrigir navegação Light→Dark no código futuro sem editar o Figma agora.
7. Aprovar separadamente os desenhos em falta para fases privilegiadas, mantendo
   MFA, step-up, âmbito, elegibilidade e as dependências de ambiente.

Não é necessário alterar regras backend para avançar com as partes suportadas.
Não propor abertura de portas ou desativação de guardas como forma de desbloquear UI.

## Arquitetura técnica proposta

Manter os workspaces atuais em `backend/` intactos. A estrutura preferida pelo
utilizador pode ser um workspace npm independente em `frontend/`, com lockfile próprio:

```text
frontend/
  package.json                 # futuro: workspaces web, mobile, shared
  package-lock.json
  web/                         # React + TypeScript + Vite
  mobile/                      # React Native + Expo + TypeScript
  shared/
    contracts/                 # tipos públicos derivados/revistos do OpenAPI
    api/                       # transporte, erros, ETag, idempotência por contrato
    auth/                      # contratos de sessão e armazenamento injetado
    validation/                # formato/conversões, sem autoridade de negócio
    design/                    # tokens semânticos e referências de assets
```

A árvore é proposta; nenhuma destas pastas foi criada. Shared pode ser um único
pacote com exports por área inicialmente, evitando criar um workspace por pasta.
Não alterar rootDir/outDir do backend nem fazer aplicações estenderem tsconfig
de um microserviço. Usar configuração de bundler própria em Web/Mobile e strict.
Partilhar DTOs, transporte e tokens; layouts DOM e React Native permanecem próprios.

A compatibilidade foi confrontada com as fontes oficiais em 2026-11-02:

- A [matriz Expo](https://docs.expo.dev/versions/latest/) associa SDK 58 a
  React Native 0.88, React 19.3.0 e Node mínimo 22.13.x.
- O [Vite](https://vite.dev/guide/) requer Node 20.19+ / 22.12+.
  O Node 22.14.0 observado no host satisfaz os dois mínimos documentados.
- O [suporte Expo a monorepos](https://docs.expo.dev/guides/monorepos/) contempla
  npm workspaces e configuração Metro automática com expo/metro-config.
- Fixar patches e versões TypeScript/codegen compatíveis ao preparar as aplicações,
  após aprovação. Não instalar todos os pacotes com latest nem presumir que peers
  do gerador OpenAPI coincidem com os do template Expo. Se divergirem, isolar a
  ferramenta de geração em workspace de tooling, sem forçar resolução global.

Isto valida requisitos documentados, não uma compilação de aplicações inexistentes.
Não foram instaladas dependências nem ensaiados Android/iOS nesta entrega.

## Contratos e cliente API

Gerar tipos só a partir da especificação pública validada; resolver referências
locais antes da geração. Há respostas genéricas/2XX: rever DTOs dos proprietários
e usar adaptadores/type guards explícitos para os módulos consumidos. Não afirmar
que o OpenAPI atual permite um SDK estrito completo sem revisão.

O cliente deve:

- Receber base URL pública por ambiente e usar o Gateway, sem prefixo /api.
- Injetar Bearer só nos pedidos previstos, preservar sid/sv e validar a sessão
  através de Auth; decodificar JWT não é autorização.
- Preservar envelopes Auth na raiz e data nos demais contratos; tratar 204 e
  respostas não JSON, timeout, cancelamento e erros de rede.
- Manter ETag e versões conforme proprietário. Idempotency-Key é header em alguns
  módulos e campo no corpo Hydration/Performance; não unificar inventando contrato.
- Não repetir automaticamente escritas após timeout. Cobrança incerta deve bloquear
  novas tentativas e apresentar o estado devolvido, sem presumir aprovação.
- Invalidar caches de dados pessoais ao terminar/trocar sessão; separar por titular.
- Não registar tokens, mensagens IA, passwords, MFA, provas step-up ou dados sensíveis.
- Usar estados parciais por origem no dashboard; não substituir falhas por zeros.
- Usar polling moderado para Notification e pausar quando a aplicação não está
  ativa; não introduzir websocket, email, SMS ou push externo.

## Autenticação e permissões

Web: token em memória nesta integração inicial; reload pode exigir novo login.
Não há refresh token/cookie HttpOnly/BFF no contrato atual. Não criar persistência
em localStorage nem inventar renovação silenciosa.

Mobile: adaptador de armazenamento protegido, por exemplo
[Expo SecureStore](https://docs.expo.dev/versions/latest/sdk/securestore/), com
revalidação Auth ao restaurar e limpeza de sessão inválida. Testar falhas do
armazenamento e comportamento após reinstalação; não persistir fatores MFA,
passwords ou step-up.

Login administrativo com challenge ainda não é sessão privilegiada. Os ecrãs MFA
precisarão de enrolment real, confirmação e apresentação única dos códigos de
recuperação. Step-up fica vinculado à sessão, ação, alvo e parâmetros exatos,
válido cinco minutos e uma utilização. Não guardar nem reutilizar após conflito.

Rotas de UI podem limitar navegação pelo perfil atual, mas o proprietário continua
a validar todas as operações. Gestor precisa de âmbito atual; Administrador não
concede elegibilidade profissional. Não criar registo público privilegiado ou
contas/fixtures administrativas na instalação normal.

## Design system e plataformas

Depois de aprovação, extrair tokens de cor/spacing/tipografia/raios observados
para nomes semânticos, suportando Light/Dark e preferência system. Não homogeneizar
diferenças do Figma sem revisão. Componentes candidatos: Button, TextField, Card,
Badge, Progress, Dialog, Empty/Error/UnavailableState, PageShell e navegação.
São propostas, não componentes já existentes no repositório.

Na Web: shell responsiva com sidebar, cabeçalho e grelhas; Mobile: stacks/tabs,
menu, safe areas, teclado e scroll. Não escalar uma imagem de 1440 px nem usar
screenshots de Figma como implementação. Obter assets estáticos exatos apenas
na fase autorizada, sem URLs temporárias em runtime.

Validar foco/teclado, labels, estados desativados, contraste, texto ampliado,
alvos de toque e redução de movimento. Não copiar texto de 8 px sem avaliar
legibilidade. Não desenhar status bar fictícia por cima da barra do sistema.

## Ambiente Web / Android / iPhone

Variáveis públicas propostas: VITE_API_BASE_URL e EXPO_PUBLIC_API_BASE_URL.
Não incluem segredos; o frontend nunca recebe credenciais técnicas de serviço,
MongoDB/RabbitMQ, JWT_SECRET, chaves MFA ou de cifragem.

Web no host: Gateway em http://127.0.0.1:64344 e origin Vite local autorizada.
Android Emulator padrão pode usar o alias 10.0.2.2 conforme o
[guia existente](../release-v1/frontend.md); testar no emulador real.
Dispositivos físicos/Mac remoto não alcançam o loopback do Windows: solução de
rede/TLS/túnel requer aprovação própria. Não abrir o listener nesta tarefa.
Validação iPhone/iOS Simulator requer Mac/Xcode; não foi realizada no Windows.

Swagger permanece leitura/Try it out desligado na stack paralela. O frontend
usará pedidos autenticados reais quando a implementação for autorizada; não
precisa de ativar Try it out nem de expor APIs internas.

## Entregas verificáveis, por ordem

| Fase | Implementar depois da aprovação correspondente | Aceitação |
|---|---|---|
| 6.1 fundações | Workspaces Web/Mobile/shared, tipos revistos, cliente e erros, tokens Light/Dark e shell mínima | TypeScript/build Web; Metro/export de validação Mobile; arranque local; sem serviços backend novos, segredos ou operações fictícias disfarçadas |
| 6.2 autenticação | E01–E03, sessão/logout, navegação protegida e fluxo MFA autorizado quando houver desenho | Contratos normais/challenge/401/403; tokens protegidos, revogação e ausência de refresh inventado; E04 permanece indisponível |
| 6.3 percurso autónomo | E05/E06/E08–E19/E21/E22/E24, começando por Hydration/Training/Performance e perfil | Dados reais das APIs com contas fictícias; isolamento, versões, validação, gráficos completos e falhas parciais; kcal/pontos sem suporte não fingidos |
| 6.4 serviços profissionais | Novos desenhos aprovados, catálogo, disponibilidade, reservas e pagamentos simulados | Desbloqueios B02–B07 legítimos; estado accepted real, sem bypass e sem repetição de cobranças incertas |
| 6.5 profissional | Novos desenhos de candidatura, serviços e operação autorizada | Capacidades e elegibilidade atuais; disponibilidade preferida distinta da operacional |
| 6.6 Gestor/Admin | Novos desenhos de convites/âmbitos/admin/MFA/step-up | Desbloqueios B08–B10, aprovação independente, auditoria e isolamento de âmbitos |
| 6.7 validação | Testes funcionais Web, Android e iPhone, contrato, acessibilidade e E2E | Relatórios distinguem completo/parcial/bloqueado; sem declaração automática de prontidão para produção |

A agenda pessoal E07 pode integrar 6.3 sem esperar por reservas profissionais,
depois de aprovada a adaptação de campos e a independência do plano Training.
A aplicação funciona sem IA, ginásio, PT ou nutricionista.

## Validações executadas nesta análise

| Verificação | Resultado real |
|---|---|
| Branch / árvore de trabalho no início | integration/frontend-v1, HEAD 0426760, limpa |
| Figma MCP | Acesso ao novo ficheiro, 92 frames e componentes/temas/navegação inventariados; nenhuma edição |
| Rotas Express ↔ OpenAPI | Comparação semântica passou: 215 operações, 170 caminhos, 11 serviços; 1289 referências resolvidas pelo validador |
| Matriz ↔ rotas | 91 referências, 86 combinações método/caminho distintas: todas existem nas rotas extraídas; 42 interações documentadas |
| Cobertura Figma e ligações documentais | 92 IDs únicos, 24 famílias e pares Light/Dark completos; 28 ligações locais verificadas, sem destino em falta |
| Segurança e whitespace dos documentos novos | Quatro ficheiros inspecionados; sem chaves privadas, JWT, credenciais em URI ou outros segredos identificados; sem espaços finais |
| git diff --check | Passou; os quatro ficheiros novos também foram verificados explicitamente, pois ainda são untracked |
| node scripts/release-contracts.cjs | Falhou no check estrito por bytes: ficheiros gerados no working tree usam CRLF, gerador produz LF |
| node scripts/gateway-swagger.cjs | Falhou no check estrito: CRLF/LF e hash calculado sobre bytes das fontes, distinto entre checkout Windows e artefacto gerado |
| Investigação sem escrever ficheiros | OpenAPI parseado igual ao gerado; contrato das 215 rotas igual excluindo snippets handler. Quatro snippets têm diferenças de truncagem/CRLF; índice normalizado e documento Swagger parseado coincidem |
| Builds, testes funcionais, HTTP e Docker | Não executados: esta entrega é de análise, sem aplicações criadas ou alterações de runtime |

Os quatro snippets são POST /agenda/professional-appointments/{id}/service,
POST /auth/manager-invitations, POST /auth/manager-invitations/accept e
GET /management/dashboard. O gerador trunca texto do handler; CRLF muda o ponto de
corte. Métodos, caminhos, DTOs, headers, permissões declaradas e fontes não divergiram.

Recomendação técnica separada: estabilizar fins de linha dos ficheiros gerados/
fontes e/ou normalizar comparações/hash/snippets no gerador, com revisão própria.
Não foi aplicado --write nem alterado o gerador nesta análise. Os checks estritos
continuam a falhar neste checkout; o sucesso semântico não os substitui.

## Bloqueios preservados

Continuam abertos os [12 casos da prontidão](../release-v1/readiness.md):
B01 inventário histórico; B02 aceitação elegível; B03 reagendamento; B04
cancelamento aceite; B05 concorrência PT/nutricionista; B06 expiração/notificação;
B07 Payment+Agenda; B08 convite/âmbito Gestor; B09 decisões/dashboard; B10
supervisão profissional; R01 recuperação RabbitMQ e R02 recuperação MongoDB
na última regressão. Nenhum foi reclassificado ou resolvido nesta análise.
O resultado histórico 80 aprovados / 0 falhados / 12 bloqueados não é um novo teste.

Pendências adicionais: decisões de dados corporais e adaptações dos formulários,
logo Mobile, desenhos privilegiados, contratos de resposta genéricos, estabilidade
dos checks em Windows, conectividade física Mobile e ensaios em dispositivos.
Prontidão de produção continua dependente da revisão de segurança, políticas de
dados reais, autoridade profissional e restantes requisitos do backend.

## Alterações desta entrega e ponto de aprovação

Apenas novos documentos em documentation/frontend/:
inventário Markdown/JSON, matriz de compatibilidade e este plano.
Não foram alterados código de negócio, configuração de ambiente, segredos,
workspaces ou infraestrutura. Nenhum commit, push ou merge foi executado.

**Aguardar aprovação das adaptações e das fundações antes de criar aplicações ou
desenvolver componentes.** O âmbito seguinte é apenas fundações 6.1; não iniciar
6.2–6.7 simultaneamente.
