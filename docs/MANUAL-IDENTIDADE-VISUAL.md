# Manual interno de design — Taverna do Mau Mau

Este documento é a referência obrigatória antes de criar componentes, menus, feedback, partidas, sala VIP e telas de administração. Ele consolida decisões do projeto e serve como checklist de QA. A versão funcional atual não pode ser substituída por arte-conceito.

## Direção artística
A Taverna é medieval, noturna, calorosa e elegante. Usar vinho, bordô, rosa-escuro, marrom de madeira e ouro envelhecido; pergaminho ou marfim nos textos. Jamais usar verde para o feltro. Referências: tecido com microfibras, luz irregular discreta, madeira usada, latão e couro. O jogo continua 2D; profundidade vem de texturas e sombras, não de perspectiva 3D pesada.

## Hierarquia
Ação principal > estado da partida > nomes/contadores > detalhes ornamentais. Manter o centro da mesa limpo: baralho, descarte, naipe ativo e jogador da vez. Não adicionar arcos decorativos ao feltro. Cartas de jogadores e bots têm escala consistente e não podem trocar identidade durante animações. Efeitos devem ser bonitos mas nunca cobrir seleções ou avisos críticos.

## Componentes
- Moldura dos menus: borda dourada suave, corpo bordô e iluminação sutil; títulos serifados, legíveis, sem exagero de caixa-alta.
- Botões: relevo e brilho contidos, estados pressionado/indisponível/foco distintos; alvos de toque de aproximadamente 44 px ou mais.
- Formulários: campos no mesmo painel, com estados de erro claros em português e sem janelas técnicas.
- Seletores: grades ou painéis próprios (0–9 bots), com seleção dourada, confirmação e opções indisponíveis identificadas. Não usar o seletor nativo do Android para escolhas centrais.
- Modais: uma camada de fundo escura, bloqueio apenas quando necessário; fechar/cancelar sempre funcional; teclado Escape e foco acessíveis.
- Ícones: poucos, coerentes com a taverna. Evitar excesso de informação no ícone do aplicativo.

## Online, offline e VIP
Menu inicial apresenta modos igualmente refinados. Offline exige máxima usabilidade na mão de cartas. Online tem sequência nítida: conta ou visitante > criar/entrar/VIP > lobby > partida > apuração > vencedor. Quando conectado ao lobby, não mostrar criação e código. Perfil sempre dentro da moldura; nunca flutuando. Na VIP, código fixo, presença (aguardando, em partida, desconectado), vitória e acesso mesmo sem o proprietário. Nenhuma lista pode revelar mão privada, senha ou token.

## Layout
Auditar larguras de 320, 360, 390, 430 px e landscape/desktop. Nunca rolagem horizontal involuntária; usar box-sizing:border-box, quebra de texto e flex wrap. Componentes próximos não podem se sobrepor: cronômetro, botões, perfil, nomes, cards e ferramentas. Botões sempre funcionais.

## Áudio e atmosfera
SFX e rádio são independentes. Narração medieval grave e pontual, sem atrapalhar concentração; respeito a autoplay e preferência do jogador.

## Critérios de aceitação
1. Testar renderização do menu inicial, offline, multiplayer, conta, visitante, lobby, VIP, bots, ajuda, histórico e vitória.
2. Confirmar navegação entre telas, teclado/toque e ausência de sobreposição em tela pequena.
3. Exigir testes automáticos de regras, autenticação e multiplayer antes da publicação.
4. Não alterar motor de jogo quando somente a interface precisar mudar.
5. A inspeção estática não prova consistência visual completa: validar capturas reais de navegador.
6. Registrar versão, atualizar cache PWA e conferir página publicada.


## Contrato de componentes (consolidado em 0.5.0.56)
Esta seção é normativa para toda nova funcionalidade, novo botão, menu, pop-up,
tela, painel, modal, notificação e mudança de layout na **Alpha** e em seus
desdobramentos. O produto publicado é a referência de aparência; não criar
um componente visual paralelo para uma função nova.

### Fonte única e reutilização
- O CSS `qa/tavern-design-system-v56.css` define os tokens
  `--tav-ui-*` e `--tav-hud-*`; cores alternativas vêm de
  `--tp-*` e `--tm-*`, nunca de tons fixos inventados para cada tela.
- Usar `.tav-ui-panel`, `.tav-ui-button` e `.tav-ui-icon-button`
  para novas superfícies. Reutilizar os modais `tav-native-*` existentes
  quando o fluxo já for atendido por eles; não criar novos diálogos nativos.
- O cabeçalho da partida é **um único componente visual**, mesmo quando
  funções são instaladas por scripts diferentes. Todos os ícones devem ter
  o mesmo invólucro circular, proporção, material, contorno, hierarquia e
  estilo de símbolo. A linguagem aprovada dos ícones de Pausa e Conquistas
  orienta os demais; evitar misturar ornamentos antigos e pictogramas crus.
- Para símbolos funcionais (pausar, sair, conquistas, áudio), usar SVG
  semântico e acessível quando possível, não caracteres Unicode de aparência
  variável como `Ⅱ`. Preservar `title`, `aria-label`, foco e ação.
- Não mudar o comportamento do motor, servidor, contagem, cartas ou
  matchmaking ao padronizar a aparência.
- A pausa só funciona no offline; abrir Crônicas no offline pode suspender
  o relógio. O online nunca recebe botão de pausa funcional.

### Material, temas e proporções
- Clássico: vinho/bordô, marfim e rosa suave com relevo discreto; dourado
  envelhecido é ornamento e **não** halo universal de turno ou destaque que
  vaze para outras paletas.
- Paletas alternativas: as 11 paletas `neon-*` (inclusive Noite,
  Sombria, Brisa Aero e Âmbar) derivam borda, superfície, texto e brilhos
  do tema ativo. Nenhuma sobreposição dourada residual.
- Botões de ação textual: altura alvo de ~44 px; botões de HUD podem ser
  compactados no celular para comportar os nove controles na mesma área,
  sem recortes ou sobreposições. Tamanhos de ícones, espaçamento, raio,
  gradiente e foco devem coincidir.
- Mão com 11+ cartas, zonas de eliminados, área inferior e botões devem
  continuar adaptativos; nenhuma alteração cosmética deve romper o layout
  de 320, 360, 390, 430 px, paisagem ou desktop.

### Regra de aprovação para cada alteração
1. Antes de criar UI, identificar componente e token já aprovados e
   verificar o tema Clássico e ao menos duas paletas alternativas.
2. Revisar também o mesmo componente em todas as telas onde aparece.
3. Reusar estilos e padrões; justificativas de exceção visual devem
   constar no PR antes de alterar os contratos.
4. Executar `node qa/check-design-contract.cjs site` **após** a
   montagem da página no CI e o teste de navegador da pausa/HUD.
5. Conferir screenshots de celular, desktop e seleção de temas: teste
   estático não substitui inspeção de renderização.
6. Registrar versão/changelog, atualizar cache PWA e só então publicar
   a versão estável na Alpha. Não tocar na Beta isolada ou no Worker.

Mudanças de identidade visual só ocorrem por decisão expressa do
responsável pelo jogo. Esta é a referência permanente; instruções para
agentes estão em `AGENTS.md` e `.github/copilot-instructions.md`.


## Padrão de acabamento de cartas e pictogramas (0.5.0.57)
- Todos os **11 temas alternativos** possuem um verso exclusivo baseado no SVG
  original e refinado em \`qa/build-card-opaque-backs.py\`: moldura dupla,
  cantoneiras, filigranas, filetes de material e motivos secundários próprios.
  Preservar o emblema central e a direção artística de cada tema. **Não**
  reaproveitar o verso clássico nem substituir versões por simples recoloração.
- Os efeitos de papel, ouro, cerâmica, vidro, madeira, metal e couro devem
  sugerir material sem sacrificar leitura em escala reduzida. O verso móvel é
  derivado do SVG em WebP RGB sem transparência para compatibilidade Android.
- Ícones do topo **não podem receber** filtro global \`brightness(0)\` ou
  \`saturate(0)\`: esses filtros apagam seus detalhes e os transformam em
  silhuetas, além de prejudicar o contraste em temas claros. Preservar
  gradientes, traçados originais e contornos. O tema Porcelana usa símbolos
  escuros; o Aero também exige boa distinção.
- Nunca alterar o tamanho da área interativa, a ordem dos botões, a semântica
  de áudio e histórico, eventos de pausa ou a identidade das cartas ao
  aplicar refinamento. Os outros componentes mantêm seu contrato v56.
- Na publicação, exigir \`python3 qa/test-art-v57.py site\` após gerar as
  imagens; verificar capturas reais e inspecionar estética de todos os temas.

## Fidelidade às prévias aprovadas (padrão obrigatório v0.5.0.58)
- Os quatro baralhos Azul, Verde, Rosa e Porcelana **reproduzem a imagem aprovada**, extraída de suas prévias para a arte real e não a reinterpretam com geometrias mais simples. As fontes ficam em `qa/premium-preview-art-v58.b64` e o gerador em `qa/build-premium-preview-v58.py`.
- Os outros sete versos utilizam acabamento comparável (molduras ricas, material, emblema autoral com volume) e mantêm cores/identidade próprias; todos são WebP RGB, carregados pela mesma variável `--tg-deck-image` do jogo.
- A comparação automática `qa/test-premium-preview-v58.py` verifica a correspondência dos quatro versos aprovados e a distinção dos onze; exige 480 × 672 pixels, sem transparência, e limite de 135 KB por arquivo.
- Pausa e troféu usam símbolos próprios em SVG com linhas internas e metais temáticos, nunca uma regra global que preencha também caminhos `fill="none"`. Isto corrige a causa da silhueta, não só as cores aparentes.
- Em uma revisão visual com proposta expressamente aprovada, a fidelidade à referência é requisito; não substituí-la por ornamentação nova sem autorização. A interface, regras, eventos, acertos e acessibilidade devem permanecer os mesmos.
