# Instalação e recuperação administrativa V1

Procedimento para uma instalação futura autorizada. **Não executar sobre o
ambiente principal nesta fase.** A [arquitetura](administration-v1.md) define
os controlos; [API](../api/administration-v1.md) descreve MFA e step-up.

## Pré-condições

Operador de instalação autorizado, terminal privado, MongoDB replica set do
Auth, TLS/ACL adequados e runtime compilado. Confirmar explicitamente o destino
antes de qualquer operação. Proteger ficheiros com ACL do sistema operativo;
não os colocar no Git, imagens, argumentos de shell, logs ou ficheiros Compose.

| Configuração | Finalidade |
|---|---|
| `MONGO_URI` | Base exclusiva do Auth, com suporte transacional |
| `JWT_SECRET` | Segredo de assinatura existente, adequado ao ambiente |
| `AUTH_MFA_ENCRYPTION_KEY_FILE` | Ficheiro protegido com chave aleatória própria, 32 bytes em hexadecimal |
| `AUTH_INSTALLATION_CREDENTIAL_FILE` | Outra credencial aleatória de 32 bytes em hexadecimal, ficheiro protegido |
| `AUTH_BOOTSTRAP_ENABLED` | `true` apenas na cerimónia explícita; ausência/qualquer outro valor desativa |
| `MANAGEMENT_CONTRACT_ENABLED` e chaves/origens por par | Contratos da Fase 5.10; em produção exigem HTTPS |

A CLI não carrega `.env` automaticamente. As credenciais de instalação e MFA
não são a chave JWT nem as credenciais dos contratos internos.

## Primeiro Administrador e quórum

1. Preparar configuração explícita num contexto controlado. Obter aprovação
   humana e registar a identificação da instalação e motivo estruturado.
2. A partir do workspace Auth compilado, executar `node dist/administration/cli.js bootstrap`.
   Enviar JSON pelo **stdin privado**, nunca argumentos de linha de comandos:
   `name`, `email`, `password`, `installationCredential`, `installationId`
   (8–64 caracteres alfanuméricos, `_` ou `-`) e `reasonCode`.
   Não guardar esse JSON no repositório nem em histórico de terminal.
3. A CLI valida a credencial contra o ficheiro e grava conta nova, auditoria e
   marcador permanente na mesma transação. Qualquer Administrador existente,
   mesmo suspenso, fecha a via de bootstrap. Nunca promove contas existentes.
4. Login retorna desafio, não JWT. Efetuar enrolment com password, ler a URI
   `otpauth` num dispositivo privado e confirmar o TOTP real. Guardar os códigos
   de recuperação apresentados uma vez num cofre separado.
5. O primeiro Administrador ainda não dispõe da administração normal. Obter
   step-up `quorum.invite`, alvo `platform`, parâmetros `{email}` normalizados.
   Executar `node dist/administration/cli.js quorum-invite`, enviando pelo stdin
   `authorization` (Bearer completo), `email`, `installationCredential` e
   `stepUpToken`. O token de convite retornado é um segredo de utilização única;
   transmitir por canal privado ao destinatário, sem o registar em logs.
6. O segundo aceita o convite em 24 horas, define a própria password e conclui
   MFA real. Só então o marcador de quórum é fechado permanentemente.
7. Desativar `AUTH_BOOTSTRAP_ENABLED` e retirar a credencial de instalação do
   runtime normal. Não apagar o marcador da base. Guardar evidência de auditoria.

Só existe um convite excecional. Expiração, conta parcial, falha ou recuperação
não autorizam reemissão automática nem reabertura do bootstrap. Um novo processo
de reparação deve ser aprovado e auditado separadamente; não alterar a base para
contornar a proteção. A concorrência é serializada pelo marcador comum.

## Recuperação

Password e código de recuperação substituem o OTP nas operações MFA/step-up
previstas. Cada código só pode ser usado uma vez, incluindo sob concorrência.
Login ainda exige password; um código isolado não concede uma sessão.
Não existe chave mestra, flag de MFA falso ou conta predefinida.

Perder o dispositivo sem códigos válidos bloqueia o acesso desse Administrador.
Outro Administrador mantém apenas as operações normais autorizadas; não há reset
MFA implementado. Perder todos os fatores ou deixar a cerimónia inicial incompleta
é um bloqueador operacional: recuperação offline exige política aprovada,
verificação independente de identidade/autoridade, controlo de duas pessoas,
auditoria e revogação de acessos. **Esse procedimento não está automatizado nem
autorizado a alterar dados nesta fase.** Nunca apagar marcadores ou promover
contas diretamente para recuperar acesso.

Não rodar a chave de cifragem sem um plano específico de recifragem e recuperação.
A perda dessa chave impede validar os fatores guardados.
