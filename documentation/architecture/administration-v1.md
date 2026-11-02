# Administração V1 — Fase 5.11

Implementação permanente, sem flag de demonstração. A proposta e a transição
incompatível de autenticação estão em [administration-v1-transition.md](administration-v1-transition.md).
[API](../api/administration-v1.md), [OpenAPI](../api/administration-v1.openapi.json)
e [procedimento de instalação/recuperação](administration-v1-installation.md).

## Responsabilidades e persistência

| Proprietário | Dados e operações |
|---|---|
| Auth | Identidade, estado da conta, papel único, sessões revogáveis, MFA, desafios, step-ups, bootstrap/quórum, pedidos de alteração de papel e auditoria administrativa |
| Management | Perfis de Gestor, âmbitos canónicos, atribuições/aprovação independente, casos e auditoria existentes; agregação da supervisão administrativa |
| Professional | Candidaturas, serviços, suspensão administrativa e histórico de decisões próprios |
| User | Perfil pessoal; nenhuma duplicação em Management/Auth nem acesso administrativo a dados de saúde |
| Agenda / Payment | Reservas e estados financeiros permanecem nos proprietários e nos contratos de âmbito da Fase 5.10 |
| Gateway | Proxies `/auth` e `/management` existentes; nenhuma exposição dos contratos `/internal` |

Novas coleções Auth: `auth_sessions`, `auth_mfa`, `auth_challenges`,
`auth_admin_stepups`, `auth_admin_governance`, `auth_initial_admin_invite`,
`auth_role_requests`, `auth_administration_audit`, `auth_security_limits`.
Professional acrescenta `professional_administration_audit` e marcadores de
suspensão nos seus próprios documentos. Não há acesso às bases alheias.

## Matriz efetiva

| Operação | Utilizador / Profissional | Gestor | Administrador |
|---|---|---|---|
| Perfil e sessões próprios | Sim | Sim | Após MFA |
| Gestão operacional existente | Não | Apenas atribuição atual, permissão e âmbito válidos | Sem privilégio operacional implícito |
| Listar identidades, estados e histórico administrativo mínimo | Não | Não | MFA + sessão atual + quórum formado |
| Suspender, reativar conta ou revogar acessos | Não | Não | Step-up exato, motivo, versão; sem auto-operação |
| Alterar papel | Não | Não | Pedido e decisão por administradores distintos; nenhum deles é o alvo |
| Convites de Gestor e governação de âmbitos | Não | Não | MFA/quórum e step-up nas mutações; aprovação independente preservada |
| Consultar candidaturas/serviços profissionais mínimos | Não | Só o contrato operacional do seu âmbito | MFA/quórum, contrato interno e DTO mínimo |
| Suspensão administrativa profissional/serviço | Não | Não | Step-up, motivo, versão e auditoria atómica |
| Aprovar credenciais reais ou levantar suspensão administrativa | Não | Não | Bloqueado sem autoridade/política real; não implementado nesta fase |
| Alterar configurações globais / dados de saúde | Não | Não | Não concedido por estes endpoints |

Um único papel global por conta. Conceder `profissional` não verifica
credenciais; conceder `gestor` não atribui âmbitos. Pedidos de papel guardam
versão do alvo e versão de segurança do requerente; mudanças ou revogação
invalidam decisões pendentes incompatíveis. Restaurar um papel não restaura
sessões nem atribuições antigas. A época `roleVersion` também avança em
suspensão, reativação e revogação global: é uma época de autorização.

## Autenticação reforçada

JWT HS256 com issuer/audience existentes, `sid` imprevisível e `sv`. O Auth
consulta sessão e estado atual em cada pedido protegido. Os outros serviços
continuam a confirmar identidade no Auth. Tokens anteriores sem sessão são
recusados; implantação futura exige novo login, sem migração executada.

Administradores recebem inicialmente um desafio de dez minutos. Password
válida não concede Bearer administrativo: é obrigatório concluir MFA real.
TOTP de 30 segundos/seis dígitos, janela ±1, contador monotónico e consumo
atómico; segredo cifrado com AES-256-GCM/AAD e chave própria externa.
Códigos de recuperação aleatórios são apresentados uma vez, guardados como
hash e consumidos atomicamente. Existem limites persistidos de tentativas.

Step-up requer password e TOTP/código de recuperação. Expira em cinco
minutos; o hash da prova liga conta, sessão, ação, alvo e parâmetros
canónicos. É de uso único e perde validade quando a sessão é revogada.
Uma prova para outro endpoint, corpo, versão ou sessão é recusada.

## Consistência e limites

Auth exige replica set para mutações de segurança transacionais. O documento
comum de governação serializa bootstrap/quórum e alterações que possam reduzir
administradores. Conta, sessão, decisão e auditoria locais são atómicos.
Falha da auditoria reverte a mutação. Sem auto-suspensão/autoalteração de papel;
contagem do último Administrador ativo exige MFA efetivamente configurado.

Management e Professional usam os contratos técnicos existentes, chaves por
par, audiência por destino, validade de 15 segundos, nonce e vínculo ao corpo
e Bearer. O Auth revalida MFA, sessão, papel, quórum e step-up. Falha de uma
dependência nega acesso. Não existem transações distribuídas: uma prova pode
ficar consumida no Auth se a mutação remota falhar; consultar estado e emitir
nova prova, sem repetir automaticamente a operação.

Suspensão profissional grava estado e auditoria na mesma transação.
Catálogos e elegibilidade Agenda excluem perfis suspensos. Suspensões não
cancelam reservas nem reembolsam pagamentos. Gestores não levantam uma
suspensão administrativa. A revisão sintética antiga requer autorização
administrativa reforçada e continua proibida em produção.

Auditoria guarda ator, ação, recurso, UTC, resultado, motivo estruturado e
correlação; não recebe password, Bearer, OTP, segredo ou corpo arbitrário.
Não há endpoints de alteração/eliminação de auditoria. ACL da base, retenção
institucional e exportação imutável exigem configuração operacional futura.

## Dependências restantes

- Instalação controlada de replica set, chaves externas e contratos técnicos;
  não executada no ambiente principal nesta fase.
- Autoridade real de verificação profissional e política de reativação.
- Recuperação offline em caso de perda de todos os fatores e rotação de MFA/
  chaves não são automatizadas; não existe reset que contorne MFA.
- Revisão de segurança e validação integrada de implantação antes de produção.

Não se declara prontidão para produção. Nenhum Administrador real foi
provisionado e não foram executadas migrações.
