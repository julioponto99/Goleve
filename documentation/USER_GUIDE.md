# GoLeve V1 — Manual do utilizador

## 1. Introdução ao GoLeve

O GoLeve V1 é uma aplicação de gestão de atividade física e serviços de
bem-estar. A Web e o Mobile usam o API Gateway e os contratos partilhados do
projeto. Este manual descreve apenas os percursos que foram encontrados nas
interfaces atuais.

Uma operação existente no backend ou no Swagger não significa que exista um
botão equivalente na aplicação, nem que esteja disponível para todos os
perfis. As limitações abaixo são intencionais e fazem parte do estado atual.

## 2. Objetivos da plataforma

O GoLeve permite, no âmbito validado:

- autenticar utilizadores e manter sessões;
- consultar e atualizar dados pessoais;
- acompanhar treinos, hidratação e medições;
- organizar atividades numa agenda pessoal;
- consultar profissionais e serviços;
- consultar notificações internas;
- disponibilizar áreas específicas para profissionais, gestores e
  administradores, sujeitas a permissões do servidor.

Os pagamentos são exclusivamente simulados através de MockBank. O Coach IA
está desativado no ambiente atual.

## 3. Requisitos para utilização

Para a execução local, consultar [INSTALLATION.md](INSTALLATION.md). Em
resumo, é necessário:

- Node.js 22.x e npm;
- Docker Compose v2 para o backend;
- um navegador moderno para a Web;
- Expo Go/development build ou emulador para o Mobile;
- uma instalação local autorizada com Gateway em
  `http://127.0.0.1:3000`.

Não são necessárias credenciais de produção. Usar apenas identidades e
credenciais fornecidas por canal privado para a demonstração local.

## 4. Acesso à aplicação Web

Iniciar a Web a partir de `frontend/`:

```powershell
npm.cmd run dev:web
```

O endereço esperado é `http://127.0.0.1:5173`. A Web usa
`frontend/web/.env` e a variável `VITE_API_BASE_URL`. A porta Vite é estrita;
se estiver ocupada, o arranque falha em vez de interromper outro processo.

Percursos públicos encontrados:

| Percurso | Utilização |
|---|---|
| `/` | Página inicial |
| `/entrar` | Início de sessão |
| `/criar-conta` | Registo de conta normal |
| `/autenticacao/mfa` | Verificação de segurança pendente |
| `/recuperar-acesso` | Página informativa de recuperação indisponível |

Após autenticação, o utilizador é encaminhado para o painel correspondente ao
seu papel.

## 5. Acesso à aplicação Mobile

Iniciar Expo a partir de `frontend/`:

```powershell
npm.cmd run dev:mobile
```

O Mobile usa `frontend/mobile/.env` e `EXPO_PUBLIC_API_BASE_URL`.

| Ambiente | Origem do Gateway |
|---|---|
| Android Emulator | `http://10.0.2.2:3000` |
| Mesmo computador/simulador | `http://127.0.0.1:3000` |
| Dispositivo físico | Encaminhamento de desenvolvimento autorizado |

O Mobile apresenta uma barra de navegação inferior, menu, tema claro/escuro,
SecureStore para a sessão local e os mesmos contratos do Shared. Não expor
MongoDB ou RabbitMQ para resolver conectividade. A execução num dispositivo
físico não foi validada nesta versão.

## 6. Registo de conta

### Web

1. Abrir `/criar-conta`.
2. Preencher **Nome completo**.
3. Preencher **E-mail**.
4. Preencher **Palavra-passe**.
5. Preencher **Confirmar palavra-passe**.
6. Selecionar **Criar conta**.

O registo cria apenas uma conta normal de utilizador. A aplicação apresenta
mensagens de validação para campos inválidos e uma mensagem de falha quando o
Auth Service rejeita o pedido.

### Mobile

O percurso é equivalente: selecionar **Criar conta**, preencher nome, e-mail,
palavra-passe e confirmação, e tocar em **Criar conta**.

Não utilizar este percurso para criar contas de teste na base oficial sem
autorização. Para demonstrações, utilizar as identidades locais fornecidas.

## 7. Início e fim de sessão

### Iniciar sessão

1. Abrir **Iniciar sessão**.
2. Preencher **E-mail** e **Palavra-passe**.
3. Selecionar **Iniciar sessão**.

O JWT é mantido em memória na Web. Um reload pode exigir novo login. No Mobile,
a sessão é guardada através do armazenamento seguro do dispositivo.

### MFA

Quando o Auth Service exigir MFA, a aplicação abre **Verificação de segurança**.
O segundo fator deve ser concluído antes de abrir o painel privilegiado. O
administrador continua sujeito a MFA; abrir diretamente a URL não concede
acesso.

### Terminar sessão

Na Web, abrir **Conta → Segurança** e terminar a sessão, ou utilizar a ação de
logout disponibilizada pelo shell. No Mobile, abrir o menu/área de segurança e
terminar sessão. A aplicação regressa ao login e tenta revogar a sessão no
servidor.

Se a revogação remota não puder ser confirmada, a interface avisa o utilizador;
não deve ser interpretado como prova de que o servidor recebeu o logout.

## 8. Recuperação de acesso, quando disponível

A recuperação de palavra-passe **não está disponível** nesta versão. A Web e o
Mobile apresentam a área informativa, mas os botões de envio/alteração estão
desativados. Não existe contrato backend aprovado para concluir este fluxo.

Não introduzir passwords em tickets, screenshots ou URLs.

## 9. Navegação e dashboard

Após autenticação, a aplicação mostra o painel do papel validado:

| Papel | Painel |
|---|---|
| Utilizador | Hidratação, treinos, medições, agenda, serviços e limitações de Coach IA |
| Profissional | Perfil, serviços/ofertas, disponibilidade e reservas recebidas |
| Gestor | Âmbitos, serviços, reservas, indicadores e casos de gestão |
| Administrador | Utilizadores/papéis, aprovações, gestores/âmbitos, supervisão e auditoria |

Na Web, a navegação usa header/sidebar responsivos. No Mobile, usa menu e barra
inferior. Os itens privados são filtrados pelo papel local, mas a autorização
final é sempre feita pelo backend.

O botão **Verificar ligação** consulta o health endpoint do Gateway. Uma
mensagem de ligação indisponível significa que a Web/Mobile não conseguiu
contactar o Gateway; não diagnostica por si só cada microserviço.

O tema claro/escuro pode ser alternado. A Web guarda apenas a preferência de
tema no navegador; o token não é guardado no localStorage.

## 10. Gestão do perfil

Disponível para todos os papéis autenticados, através de **Perfil** ou
**Conta → Definições**, conforme o cliente.

### Campos e ações

| Campo/ação | Web | Mobile |
|---|---|---|
| Nome de apresentação | Campo obrigatório; **Guardar perfil** | Campo; **Guardar perfil** |
| E-mail de contacto e país | Apresentados quando fornecidos pelo serviço | Apresentados pelo recurso, quando disponíveis |
| Preferências | Área de definições | Tema e sessão no dispositivo |
| Atualizar | Ação de guardar com controlo de concorrência | Ação de guardar |

O backend protege a atualização com `ETag`/`If-Match`. Um conflito de versão ou
erro de validação é apresentado como erro; atualizar a página e repetir sem
confirmar o conteúdo pode perder alterações.

## 11. Gestão de treinos

Disponível principalmente para o papel **Utilizador**, em **Treinos**.

### Consultar

O painel apresenta:

- **Planos de treino** — estado, ambiente e descrição;
- **Exercícios** — categoria, grupo muscular, equipamento e descrição;
- **Sessões de treino** — estado, início, conclusão e ambiente.

Usar **Atualizar**, **Anterior**, **Seguinte** ou **Carregar página seguinte**
quando esses controlos aparecem.

### Criar

Na área de ações pessoais da Web:

1. Introduzir **Título do plano**.
2. Selecionar **Casa**, **Ginásio** ou **Exterior**.
3. Selecionar **Criar plano vazio**.
4. Opcionalmente selecionar **Criar sessão pessoal**.

No Mobile, a área equivalente apresenta **Título**, os botões de ambiente,
**Criar plano vazio** e **Criar sessão pessoal**.

As ações de uma sessão dependem do estado devolvido pelo serviço, por exemplo
iniciar, pausar, retomar, concluir ou cancelar. O frontend não apresenta
prescrição clínica. Um erro de autorização, estado ou serviço é mostrado na
área do recurso.

## 12. Hidratação

Disponível para **Utilizador**, em **Hidratação**.

### Consultar

O painel mostra a meta diária, o consumo de hoje e o histórico, com quantidade,
hora, fuso horário e paginação quando fornecidos pelo serviço.

### Registar

Na Web:

1. Preencher **Consumo (ml)**.
2. Selecionar **Registar consumo**.

Para a meta:

1. Preencher **Meta diária (ml)**.
2. Selecionar **Guardar meta**.

No Mobile, o campo é **Quantidade (ml)** e as ações são **Registar consumo** e
**Guardar como meta diária**.

O consumo usa uma chave de idempotência gerada pela aplicação. Se o resultado
ficar incerto, a interface bloqueia nova repetição e recomenda consultar o
histórico antes de tentar novamente.

## 13. Medições e desempenho

Disponível para **Utilizador**, em **Medidas**.

### Registar uma medição

Na Web, escolher o tipo:

- Peso (kg);
- Altura (cm);
- Cintura (cm);
- Anca (cm);
- Peito (cm);
- Braço (cm);
- Coxa (cm);
- Outra (cm).

Preencher **Valor medido** e selecionar **Guardar medição**. O Mobile apresenta
diretamente Peso, Altura e Cintura.

### Consultar

O painel apresenta medições recentes, unidade, valor e data, além de evolução
e resumo quando o serviço devolve esses recursos. O frontend não fornece
interpretação clínica. A convergência completa entre medições User e
Performance continua limitada.

## 14. Agenda e marcações

### Agenda pessoal

Disponível para **Utilizador**, em **Agenda**.

Na Web:

1. Preencher **Título da atividade**.
2. Escolher **Atividade pessoal** ou **Treino pessoal**.
3. Escolher o ambiente quando for treino.
4. Preencher **Início** e **Fim**.
5. Escolher **Planeada** ou **Concluída (registo passado)**.
6. Selecionar **Criar atividade**.

No Mobile, introduzir **Título**, **Início (ISO com fuso horário)** e
**Fim (ISO com fuso horário)**, e selecionar **Criar atividade pessoal**.

O serviço valida datas, estados e sobreposições. A aplicação pode guardar a
atividade com um aviso de sobreposição.

### Marcações profissionais

O utilizador pode consultar **As minhas reservas**, pesquisar disponibilidade e
iniciar um pedido quando os módulos estão visíveis. O fluxo exige
profissional, capacidade, serviço, modo, instantes e idempotência conforme o
contrato.

Este percurso é **parcial**: a aceitação positiva requer elegibilidade
profissional real validada pelo backend. A interface não deve ser interpretada
como confirmação de uma reserva apenas porque mostra o formulário.

## 15. Pesquisa de profissionais

Disponível para **Utilizador**, na área **Serviços profissionais/Profissionais**.
O catálogo apresenta os resultados devolvidos pelo Professional Service e
permite pesquisa quando o campo **Pesquisar** está disponível.

Os filtros de serviço podem incluir pesquisa textual, categoria, capacidade,
limite e cursor. Resultados vazios mostram **Sem registos**. Catálogo e
pesquisa não concedem elegibilidade nem autorização para reservar.

## 16. Serviços profissionais

O recurso **Serviços e ofertas** apresenta, quando disponível:

- categoria;
- preço em EUR;
- duração em minutos;
- estado ativo.

Para profissionais, **Perfil profissional**, **Serviços e ofertas**,
**Disponibilidade** e **Agenda profissional** são áreas distintas. O papel
profissional não é concedido pela interface; candidatura, verificação,
ativação e autorização são decisões do backend.

As áreas de gestor e administrador mostram serviços, âmbitos, profissionais,
casos e auditoria apenas quando o papel e os âmbitos atuais permitem. Algumas
ações administrativas exigem MFA/step-up e aprovação independente.

## 17. Pagamentos simulados

**Pagamentos simulados** é uma área do utilizador para consultar estados,
valor em cêntimos, moeda, serviço, confirmação e eventual necessidade de
reconciliação.

O Payment Service usa MockBank:

- não movimenta dinheiro real;
- não é um fornecedor bancário;
- não confirma pagamento de uma marcação aceite;
- não oferece reconciliação financeira real;
- pedidos com resultado incerto não devem ser repetidos sem consulta do
  histórico.

Os fluxos de pagamento associados a reservas continuam parciais. Não executar
testes de pagamento contra dados oficiais sem autorização específica.

## 18. Notificações

Disponível para utilizadores autenticados, em **Notificações**.

O ecrã lista notificações internas, permite paginação e filtro de não lidas
quando aplicável. Em cada notificação disponível, selecionar **Marcar como
 lida**. O contador de não lidas aparece no recurso correspondente.

As notificações dependem dos eventos RabbitMQ consumidos pelo Notification
Service. Email, SMS e push externos não estão disponíveis.

## 19. Perfis e permissões

| Perfil | Funcionalidades de interface | Limitações |
|---|---|---|
| Utilizador | Perfil, treinos, hidratação, medições, agenda pessoal, catálogo, reservas e notificações | Reservas profissionais e pagamentos associados são condicionais |
| Profissional | Perfil profissional, capacidades, qualificações, serviços, disponibilidade e agenda | Elegibilidade e ativação são verificadas no servidor |
| Gestor | Âmbitos, serviços, reservas autorizadas, indicadores e casos | Só âmbitos aprovados, atuais e não expirados |
| Administrador | Utilizadores/papéis, aprovações, gestores, âmbitos, supervisão e auditoria | MFA, step-up, aprovação independente e políticas administrativas |

Ver um item no menu não substitui a autorização. Um `403` significa que o
perfil ou contexto atual não permite a operação.

## 20. Segurança e privacidade

- Não partilhar passwords, JWT ou chaves.
- A Web mantém o JWT em memória; o Mobile usa armazenamento seguro.
- Não usar URLs com tokens.
- MFA e step-up não devem ser desativados.
- O Gateway bloqueia rotas internas e destinos externos indevidos.
- CORS deve permanecer restrito a origens autorizadas.
- Dados pessoais, medições e notificações só devem ser consultados na conta
  correspondente.
- O ambiente local-demo usa dados fictícios e não deve ser exposto publicamente.

## 21. Resolução de problemas comuns

| Problema | Ação recomendada |
|---|---|
| Página de login sem ligação | Confirmar Gateway em `127.0.0.1:3000` e `VITE_API_BASE_URL`/`EXPO_PUBLIC_API_BASE_URL` |
| “Ligação indisponível” | Consultar `GET /health`, estado dos contentores e logs do Gateway |
| `401` | Iniciar sessão novamente e confirmar o JWT/sessão |
| `403` | Confirmar papel, âmbito, MFA/step-up e autorização do recurso |
| Área vazia | Usar **Atualizar**; o serviço pode não ter registos para a conta |
| Resultado incerto | Não repetir a escrita; consultar histórico e reconciliar |
| Web perde sessão após reload | Comportamento esperado do token em memória |
| Android não liga | Usar `10.0.2.2:3000` no emulador; não expor bases de dados |
| Recuperação indisponível | Funcionalidade ainda não implementada no contrato aprovado |
| Coach IA indisponível | Capacidade desativada por defeito nesta versão |

## 22. Limitações conhecidas

1. A recuperação de palavra-passe não está disponível.
2. O Coach IA está desativado.
3. Marcações profissionais aceites dependem de elegibilidade real.
4. Pagamentos são apenas MockBank.
5. Não existem integrações externas de email, SMS ou push.
6. A execução Mobile em dispositivo físico não foi validada.
7. Alguns percursos administrativos positivos continuam condicionais.
8. A interface não cobre todas as operações documentadas no backend.
9. A base local MongoDB tem um único membro e não representa alta
   disponibilidade.

## 23. Conclusão

As aplicações Web e Mobile permitem utilizar os percursos pessoais
efetivamente ligados aos serviços, com autenticação, filtros, ações de escrita,
paginação e mensagens de erro. As áreas profissionais, de gestão e
administração são apresentadas segundo o papel, mas continuam sujeitas às
decisões e pré-condições do backend.

Para detalhes de instalação, consultar [INSTALLATION.md](INSTALLATION.md); para
contratos e códigos HTTP, consultar [API.md](API.md); para arquitetura,
consultar [ARCHITECTURE.md](ARCHITECTURE.md); e para o estado e limitações,
consultar [PROJECT_STATUS.md](PROJECT_STATUS.md).
