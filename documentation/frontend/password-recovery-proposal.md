# Recuperação de palavra-passe — proposta aprovada para etapa posterior

O titular aprovou o planeamento e a implementação numa etapa backend própria.
Esta entrega continua exclusivamente frontend: não altera Auth, não envia emails
e não apresenta recuperação concluída. MFA administrativo continua obrigatório.

Auditoria de 2026-11-02, branch integration/frontend-v1. Não existem rotas de
pedido/conclusão de recuperação em Auth nem no OpenAPI público. Não foi alterado
o Auth. A interface deve mostrar indisponibilidade, nunca email enviado ou
password alterada sem confirmação do serviço.

## Contratos propostos, ainda inexistentes

- POST `/auth/password-recovery/request`: `{email}`; mensagem neutra, sem confirmar
  existência da conta. Não devolver token, destinatário ou estado da conta.
- POST `/auth/password-recovery/complete`: `{token,password}`; confirmação apenas
  depois do commit, sem iniciar sessão. Confirmação de password é validação local.
- A documentação e os tipos públicos só seriam atualizados após aprovação desta
  alteração backend. A interface atual não chama estes caminhos.

## Política proposta

1. Token gerado por CSPRNG com 32 bytes, válido 15 minutos e de uso único. Guardar
   somente hash SHA-256, titular, prazo e estado; nunca token ou ligação em logs,
   auditoria, analytics, filas ou armazenamento persistente do frontend.
2. Pedido novo invalida os anteriores. Limites por IP e identificador normalizado
   com hash, respostas e tempos equivalentes para contas existentes/inexistentes.
   Nenhum endpoint de pesquisa pública de emails.
3. Validar password no servidor segundo a política Auth atual. Consumir token,
   atualizar hash bcrypt, incrementar versão de segurança, revogar todas as
   sessões/autorizações step-up e auditar na mesma transação MongoDB. Concorrência
   e reutilização devem falhar sem alteração parcial.
4. Não alterar papel, estado de suspensão, MFA, códigos de recuperação ou marcadores
   bootstrap/quórum. Um Administrador continua obrigado a MFA no login seguinte.
5. Serviço de email real configurado, credenciais fora do Git, origem HTTPS
   explícita numa lista autorizada; nunca gerar links usando Host/URL do cliente.
   Envio com token apenas em memória, sem outbox de tokens em claro. Falhas de
   entrega têm evento seguro e não podem revelar existência da conta por resposta.
   Não afirmar entrega de email; a resposta só confirma receção do pedido neutro.
6. Na ausência de fornecedor/configuração, negar o fluxo uniformemente para todos
   os emails com indisponibilidade. Mocks exclusivamente em testes.
7. Abertura Web sem referer/analytics; preferir token no fragmento e removê-lo do
   endereço imediatamente. Não autenticar através do token de recuperação.
8. Mobile: Universal Links/App Links HTTPS vinculados ao domínio oficial aprovado,
   validação de origem/caminho, token só em memória. Sem domínio/associações
   verificadas, manter a entrada por deep link desativada. Não usar um esquema
   arbitrário como prova de identidade.

## Dependências e validação

Necessários: aprovação explícita para alterar Auth/Gateway/OpenAPI; definição do
fornecedor de email e domínio; política de retenção de eventos e limites exatos;
ambiente de teste isolado autorizado. Nenhuma conta administrativa é criada por
este fluxo. Nenhum email real será enviado durante testes sem autorização.

Testar enumeração, timing/limites, hash/expiração, tokens inválidos/reutilizados,
concorrência, rollback, falha de email, password inválida, revogação de sessões e
MFA obrigatório após reset administrativo. A entrega frontend atual limita-se a
ecrãs de pedido/reset/resultado indisponíveis e ligação ao login.
