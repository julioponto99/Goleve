# MFA — estado atual e revisão futura

Aprovação de planeamento recebida em 2026-11-02; nenhuma alteração ao Auth foi
autorizada nesta entrega. O frontend continua a cumprir a política atual.

## Política efetivamente implementada

- O registo público cria apenas `utilizador`. O login normal não exige TOTP
  para esse papel. Não existe ativação opcional de MFA pelo utilizador comum.
- Administradores recebem um desafio; enrolamento e verificação TOTP reais são
  obrigatórios antes da emissão da sessão administrativa. Recovery codes não
  são recuperação de palavra-passe.
- Step-up exige password e segundo fator, vincula sessão/ação/alvo/parâmetros,
  expira em cinco minutos e é consumido uma vez no servidor.
- Bootstrap, segundo Administrador/quórum e autorizações internas dependem dessa
  garantia. As interfaces não podem substituir a verificação nem fabricar sessão.

## Pretensão futura, ainda sem implementação

MFA inicialmente inativo nas contas em que a política o permita, com ativação
posterior. O comportamento normal dos utilizadores já corresponde à primeira
parte; a ativação voluntária ainda precisa de contrato backend próprio.

Recomendação: preservar MFA obrigatório para Administradores e acrescentar
enrolamento voluntário aos restantes papéis, com reautenticação, confirmação
TOTP, recovery codes de uso único e revogação de sessões. Uma flag de frontend
nunca deve decidir a política. Configuração explícita no Auth deverá negar
combinações inválidas e ter testes de transição/revogação.

Tornar MFA opcional para Administradores exige outra decisão de segurança:
altera bootstrap/quórum, sessões administrativas, step-up e verificação entre
serviços. Aumenta o risco de tomada de conta por password e compromete a
independência das aprovações. Não será feito por uma simples flag nem por
fallback para password. Antes de implementar, propor política equivalente de
autenticação reforçada, recuperação, implantação e migração de sessões para
aprovação específica. Não alterar dados existentes nesta etapa.

A recuperação de password aprovada para etapa posterior preservará MFA, papéis,
estado da conta e marcadores de bootstrap. Continuam pendentes fornecedor de
email, domínio, contratos finais, implementação e testes isolados autorizados.
