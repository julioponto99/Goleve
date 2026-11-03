# Preparação do acesso administrativo

Auditoria por leitura em 2026-11-02. Não foram criadas contas, lidos ficheiros de
chaves, executados comandos de bootstrap ou modificados dados.

O procedimento oficial mantém-se em
[Instalação administrativa](../architecture/administration-v1-installation.md).
O Auth usa CLI, transações e um marcador permanente: não existe bootstrap HTTP.
Qualquer Administrador já existente, incluindo suspenso, impede reutilização.

Antes de executar, o operador autorizado deve confirmar a instância/replica set,
responsáveis, ausência de conta administrativa prévia e autorização de criação.
Gerir credencial de instalação e chave de cifragem MFA fora do Git. Introduzir
os novos dados apenas pelo canal de entrada previsto na CLI; não colocar
passwords/tokens em argumentos de shell, histórico, screenshots ou tickets.

A primeira conta ainda tem de iniciar sessão, configurar TOTP real e guardar os
códigos apresentados uma única vez. A Web e o Mobile não concedem acesso pelo
desafio pendente. Formação do quórum exige MFA e step-up do primeiro, credencial
de instalação, um convite excecional único para o segundo e MFA deste segundo.
Só depois o quórum fica formado permanentemente. Desativar a ativação explícita
de instalação após a cerimónia; não apagar marcadores para recuperar acesso.

Sem quórum, consultas/operações que o exijam continuam bloqueadas. Alterar papel,
suspender ou revogar acessos usa os endpoints existentes, com motivo, versão,
MFA/step-up e aprovação independente quando aplicável. A recuperação de password
planeada não substitui estes requisitos. Ver [revisão MFA](mfa-policy-review.md).

Recuperação administrativa de instalação deve seguir controlos equivalentes e
aprovação operacional separada. Não existe botão de criação administrativa
pública nem mecanismo frontend para reparar o bootstrap. Nenhum comando deste
procedimento foi executado nesta entrega.
