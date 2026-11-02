# Fase 5.11 — Proposta técnica e transição aprovada

Este plano antecede as alterações dos contratos Auth. Não executa instalação,
provisionamento ou migração. O Auth atual não tem MFA nem sessões persistidas;
não se aceitarão campos ou claims do cliente como prova de MFA.

## Dependências e mecanismo MFA

- Reutilizar Node.js `crypto` (HMAC, AES-256-GCM, aleatoriedade e comparação
  de tempo constante), bcrypt, jsonwebtoken e MongoDB/Mongoose existentes.
  Não introduzir uma dependência de rede para validar OTP.
- TOTP real conforme [RFC 6238](https://www.rfc-editor.org/rfc/rfc6238) e HOTP
  [RFC 4226](https://www.rfc-editor.org/rfc/rfc4226): HMAC-SHA1, seis dígitos,
  período de 30 segundos, janela de um passo anterior/seguinte. Validar com
  vetores oficiais, incluindo SHA-256/SHA-512 no núcleo de cálculo.
- Segredo Base32 aleatório, URI `otpauth` para aplicações autenticadoras;
  só revelar no enrolment autorizado. Cifra autenticada AES-GCM, nonce
  aleatório e AAD por conta, com chave exclusiva
  `AUTH_MFA_ENCRYPTION_KEY_FILE`, fornecida fora do Git. Falta/erro de chave
  nega operações MFA; não gerar chave automaticamente nem reutilizar JWT_SECRET.
- Persistir último contador TOTP utilizado; consumo condicional/transacional
  impede replay concorrente. Após usar um OTP, aguardar um novo período para
  outra validação ou usar um código de recuperação válido.
- Códigos de recuperação aleatórios, só hashes na base e consumo atómico.
  Rate limits persistidos para password, MFA, recuperação e step-up; erros
  genéricos e nenhuma credencial em auditoria/logs.

## Transição incompatível de autenticação

Novos JWT contêm identificador de sessão e versão de segurança da conta.
Cada pedido protegido valida assinatura/issuer/audience/expiração e consulta
sessão/conta no Auth. JWT anteriores sem sessão deixam de ser aceites quando
esta versão for implantada: clientes devem efetuar novo login. Não existe
flag de compatibilidade que contorne revogação. Campos de segurança ausentes
em contas anteriores são tratados pelo código sem migração executada.

Login de Administrador devolve um desafio restrito, não uma sessão com
privilégios. A sessão administrativa só se torna utilizável após TOTP real.
Sem MFA configurado, o desafio só permite enrolment protegido por password.
Desafio não é um Bearer `goleve-api`. Enrollment confirmado pode concluir
esse login; não existem JWT administrativos de teste aceites pelo servidor.

Step-up exige password + MFA, dura cinco minutos, é de utilização única e
liga ator/sessão/ação/alvo e parâmetros canónicos. Revalidar estado e papel
no consumo. Suspensão, alteração de papel e revogação global incrementam a
versão de segurança, revogam sessões e invalidam step-ups. Reativar nunca
restaura sessões. Uma época de papel impede restaurar atribuições de Gestor
anteriores se esse papel voltar a ser concedido.

Auth continua a ser autoridade de identidade. Atualizar também os caminhos
administrativos antigos (convites e contratos internos), que atualmente
validam apenas assinatura/papel, para não constituírem bypasses. Management
e Professional confirmarão permissões reforçadas no Auth com identidade de
serviço própria; não receberão passwords nem segredos TOTP.

## Bootstrap e quórum

CLI exclusivamente no Auth; sem endpoint HTTP. Ativação explícita,
credencial de instalação protegida, identidade nova e confirmação de
instalação. Transação sobre marcador único/governação, conta e auditoria.
Qualquer Administrador existente, mesmo suspenso, fecha o bootstrap. Nunca
usar `$set` para promover uma conta existente.

Após MFA efetivo do primeiro Administrador, uma cerimónia explícita por CLI,
com credencial de instalação e autenticação reforçada, pode emitir um único
convite excecional de 24 horas para a segunda identidade. Não reenviar nem
reabrir automaticamente se expirar. Só formar/fechar permanentemente o
quórum após MFA confirmado do segundo. Mudanças normais de papel exigem dois
administradores distintos e quórum fechado; sem autoalteração.

Recuperação não reabre bootstrap/quórum: password + código de recuperação
único no Auth. Se todos os fatores se perderem, negar acesso e exigir um
procedimento offline separado, com controlo de segurança equivalente, ainda
não executável automaticamente. Não se inventa um token mestre de recuperação.

Todas as mudanças que possam reduzir o número de Administradores ativos
tocam o mesmo documento de governação antes de contar/alterar contas, numa
transação majority. Isso evita write skew na proteção do último Administrador.
Sem auto-suspensão ou autoalteração de papel. Não apagar contas nesta fase.

## Âmbito e infraestrutura

Auth guarda contas, sessões, MFA, desafios, step-ups, papéis e auditoria
administrativa própria. Management mantém atribuições/casos; Professional
mantém candidaturas e suspensões. Sem leitura das bases alheias. Supervisão
administrativa não confere acesso a saúde, passwords ou recibos financeiros.
Elegibilidade real e reativação de serviços continuam bloqueadas sem fonte
de verificação válida; nenhuma aprovação sintética passa a ser real.

Builds/testes direcionados; testes integrados apenas no replica set temporário
após autorização. Não executar bootstrap real, migração, backups ou qualquer
alteração dos 14 componentes principais. Não declarar prontidão produtiva
sem validação integrada e revisão de segurança completas.
