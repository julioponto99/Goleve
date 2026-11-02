# Fase 6.1 — Inventário dos protótipos oficiais

Análise de 2026-11-02, branch `integration/frontend-v1`, código `0426760`.
Apenas análise; componentes e aplicações aguardam aprovação.

Fonte oficial: [ficheiro Figma](https://www.figma.com/design/dseqmbo4hzK6sFcOQl5hld/GoLeve?node-id=0-1),
file key `dseqmbo4hzK6sFcOQl5hld`. As referências anteriores deixam de ser a fonte
principal da Fase 6. Páginas [Web 0:1](https://www.figma.com/design/dseqmbo4hzK6sFcOQl5hld/GoLeve?node-id=0-1)
e [Mobile 16:42](https://www.figma.com/design/dseqmbo4hzK6sFcOQl5hld/GoLeve?node-id=16-42).

## Evidência e alcance

Foram lidos por Figma MCP os metadados das duas páginas, todos os frames de primeiro
nível, textos, ligações de protótipo, componentes e coleções de variáveis.
`get_design_context` foi obtido para os dashboards Web Dark `193:2` e Mobile Dark
`19:270`, com screenshots; foi ainda inspecionada a imagem Web Light `2031:3174`.
Os IDs de página, passados diretamente a `get_design_context`, devolveram ausência
de seleção; a leitura dos frames individuais funcionou. Isto não é falha de acesso.

Inventário final: **44 frames Web + 48 frames Mobile = 92**, agrupados em **24 famílias**:
22 Web e 24 Mobile, todas com variantes Light/Dark. Há ainda dois component sets e
dois componentes autónomos Mobile de primeiro nível, que não são ecrãs.
As sete famílias de detalhe de treino são conteúdos distintos, não sete recursos
ou endpoints diferentes. Modais/menu contam como frames, não como páginas de aplicação.

O [inventário JSON](figma-inventory.json) preserva nome exato, ID, plataforma,
tema, dimensões e destinos de navegação de cada frame. A análise cobre a estrutura
dos 92 frames; não representa uma verificação visual individual, de acessibilidade
ou de funcionamento HTTP dos 92 estados. Não foram exportados assets nem copiados
dados de exemplo pessoais do Figma para fixtures. Code Connect não foi configurado,
conforme escolha do utilizador.

## Ecrãs e variantes

IDs em cada célula: **Light / Dark**. E01–E24 são identificadores desta análise,
não nomes de rotas frontend já implementadas.

| ID | Família | Web Light / Dark | Mobile Light / Dark |
|---|---|---|---|
| E01 | Entrada / Splash | `2031:3164` / `2023:36498` | `88:42` / `90:42` |
| E02 | Login | `2031:3128` / `2023:36509` | `89:42` / `90:51` |
| E03 | Registo | `2031:3085` / `2023:36545` | `118:42` / `120:42` |
| E04 | Recuperar palavra-passe | `2031:3052` / `2023:36588` | `118:64` / `120:64` |
| E05 | Dashboard | `2031:3174` / `193:2` | `19:602` / `19:270` |
| E06 | Treinos | `2031:2879` / `2023:36620` | `87:621` / `87:42` |
| E07 | Agenda / Marcar treino | `2031:2677` / `2023:36780` | `2017:1516` / `2017:1600` |
| E08 | Sessão / Treino em curso | `2031:2540` / `2023:36968` | `2017:1416` / `2017:1466` |
| E09 | Histórico de treinos | `2031:2393` / `2023:37096` | `136:160` / `136:80` |
| E10 | Detalhe Treino A | `2031:2258` / `2023:37230` | `136:122` / `136:42` |
| E11 | Detalhe Treino B | `2031:2128` / `2023:37356` | `2017:1164` / `2017:1213` |
| E12 | Detalhe Força / Corpo inteiro / Hoje | `2031:1992` / `2023:37477` | `2017:1054` / `2017:1109` |
| E13 | Detalhe Pernas e glúteos | `2031:1862` / `2023:37604` | `2017:956` / `2017:1005` |
| E14 | Detalhe Peito e costas | `2031:1732` / `2023:37725` | `2017:858` / `2017:907` |
| E15 | Detalhe Cardio e mobilidade | `2031:1596` / `2023:37846` | `2017:748` / `2017:803` |
| E16 | Detalhe Corpo inteiro / QUI | `2031:1460` / `2023:37973` | `2017:638` / `2017:693` |
| E17 | Medidas e evolução | `2031:1344` / `2023:38100` | `87:684` / `87:653` |
| E18 | Registar medidas | `2031:1191` / `2023:38207` | `2017:1262` / `2017:1339` |
| E19 | Gestão de hidratação | `2031:999` / `2023:38350` | `138:109` / `138:50` |
| E20 | Coach IA | `2031:888` / `2023:38533` | `87:739` / `87:715` |
| E21 | Perfil pessoal | `2031:780` / `2023:38629` | `244:605` / `244:360` |
| E22 | Editar perfil (dados corporais) | `2031:640` / `2023:38727` | `2017:1684` / `2017:1752` |
| E23 | Menu lateral Mobile | — | `244:646` / `244:401` |
| E24 | Adicionar exercício Mobile | — | `4011:682` / `4011:642` |

Não foram encontrados ecrãs dedicados de catálogo profissional, candidatura,
acompanhamento, disponibilidade profissional, reserva com PT/nutricionista,
pagamento, caixa de notificações, Gestor, Administrador, MFA ou step-up.
Os respetivos módulos backend existem em diferentes condições de disponibilidade;
a ausência de desenho não significa ausência de código. Ver a [matriz](figma-backend-matrix.md).

## Layouts e navegação

Web: largura 1440 px; alturas 1000, 1009, 1035 e 1100 px. Na shell estruturada,
sidebar de 240 px, área principal de 1200 px, cabeçalho de 82 px e margens internas
de 38 px. Há cards, grelhas, tabelas de histórico, botões de ação e modais centrados.
Grande parte usa Auto Layout; o dashboard Light tem muitas camadas posicionadas
diretamente e não define, por si só, uma grelha responsiva.

Mobile: frames 402 × 874 px. Dashboard com scroll vertical: conteúdo medido em
1541,5 px Dark e 1554,5 px Light; barra inferior de quatro destinos, 378 × 54 px,
e componente visual de status bar 402 × 62 px. Cabeçalho, menu lateral, regresso,
cards e modais são próprios deste formato. Em React Native, a barra de estado
deve ser a do sistema, com safe areas; não reproduzir bateria/hora fictícias.
Os frames de 402 px não comprovam adaptação a todos os Android/iPhone.

Destinos principais Web: Início, Treinos, Medidas, Hidratação, Coach IA, Histórico,
Perfil e terminar sessão. Mobile: Início, Treinos, Medidas, Coach IA na barra;
hidratação pelo widget, perfil/sair pelo menu. A família E24 só aparece no Mobile.
As operações de adicionar/remover exercícios surgem em detalhes Mobile; não foi
encontrado um formulário Web equivalente.

Há um fluxo inicial Web em `2023:36498` e dois Mobile em `88:42` / `90:42`.
Os splash Mobile têm transição por timeout para login. Os demais percursos usam
cliques, navegação e overlays; não comprovam autenticação, gravação ou envio de email.
Foram encontrados 47 nós Web e 366 Mobile com reações, incluindo nós sem ação
executável e reações herdadas de instâncias; estes números não são operações backend.

Lacunas do protótipo observadas:

- Todos os 22 frames Web Light têm zero nós com reações. No Dark, apenas parte dos
  ecrãs está ligada; vários botões desenhados ainda não têm reação.
- Na barra Mobile Light, ícones herdados apontam para Dark enquanto áreas de toque
  sobrepostas apontam para Light. Exemplo: `I178:134;178:89` aponta para `87:653`,
  mas a área correspondente aponta para `87:684`. Implementar navegação por destino
  lógico preservando tema; não copiar essas ligações inconsistentes.
- Todos os cinco cartões do histórico Mobile apontam para o mesmo detalhe ilustrativo.
  A aplicação deverá consultar o ID da sessão realmente selecionada.
- Guardar medidas/perfil, confirmar agenda e criar exercício fecham ou trocam frame;
  não há evidência de persistência no protótipo. Na aplicação, só mostrar sucesso
  depois da resposta do proprietário.
- No detalhe Treino A Mobile constam “6 exercícios / 24 séries”, mas estão listados
  cinco exercícios; a Web indica cinco / 16. Totais devem vir dos registos reais.

## Componentes, estilos e temas

Componentes Figma efetivamente encontrados no Mobile:

| Recurso | IDs | Variantes |
|---|---|---|
| Barra de navegação Escuro | `178:82` | Início, Treinos, Medidas, Coach IA |
| Barra de navegação Claro | `178:123` | Os mesmos quatro destinos |
| Barra de estado Escuro / Claro | `226:140` / `226:151` | Componentes autónomos |

Há oito componentes de variante dentro dos dois sets e os dois componentes de
status bar: dez componentes e dois sets no total. A página Web não contém
componentes locais, embora tenha padrões visuais repetidos. Botão, campo, card,
badge, progresso, modal, tabela e shell são **candidatos** a componentes de código,
não uma biblioteca Figma completa já existente.

Tipografia: Inter Regular/Medium/Semi Bold/Bold na Web; Mobile acrescenta Black e
ícones em Font Awesome 6 Free Solid/Regular. A Web inclui ícones em frames/SVG.
Validar licença e obter os assets/fontes exatos apenas durante implementação
aprovada. Não trocar arbitrariamente a identidade gráfica nem usar URLs temporárias
do MCP em runtime. Splash/login Mobile têm o placeholder “COLOCAR LOGO”;
o recurso final precisa de confirmação.

| Papel visual observado | Dark | Light / variação |
|---|---|---|
| Fundo Web | `#0B1220` | `#E8EDF2` |
| Superfície Web | `#162235` | `#F8FAFC` |
| Texto principal Web | `#F3F6FB` | `#022D69` |
| Texto secundário Web | `#A6B2C2` | `#617187` |
| Destaque | `#D7FF00` | O mesmo destaque e texto verde `#3D7A00` |
| Hidratação | `#06B6D4` | `#209AAF` / `#087A93` |
| Mobile | Também usa `#CCFF00`, `#FFFFFF`, `#182B45` e outros tons | Não uniformizar sem revisão visual |

Amostras são valores observados, não um contrato de tokens aprovado. Na Web
repetem-se gaps 10/12/14/16/20/24 px e raios 10/12/16 px, além de pills.
Existem textos de 8–11 px e dimensões fracionárias no Mobile: legibilidade,
contraste, aumento de texto, teclado e alvos de toque devem ser testados, não
assumidos acessíveis por reproduzir o Figma.

Coleções locais: `goleve.netlify.app` (1 variável) e `html.to.design` (90).
Ambas têm apenas “Mode 1”. **Light/Dark está representado em frames duplicados,
não em modos semânticos dessas coleções.** A implementação proposta criará tokens
semânticos partilhados, mantendo as diferenças que estiverem efetivamente no design.

## Continuação

Consultar a [matriz completa e DTOs](figma-backend-matrix.md) e o
[plano de implementação e validação](phase-6.1-plan.md).
Nenhum componente ou aplicação foi criado nesta análise.
