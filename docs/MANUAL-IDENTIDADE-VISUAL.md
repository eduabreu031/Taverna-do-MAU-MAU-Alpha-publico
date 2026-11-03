# Manual interno de design — Taverna do Mau Mau

Este documento é a referência obrigatória antes de criar componentes, menus, feedback, partidas, sala VIP e telas de administração. Ele consolida decisões do projeto e serve como checklist de QA. A versão funcional atual não pode ser substituída por arte-conceito.

## Direção artística
A Taverna é medieval, noturna, calorosa e elegante. Usar vinho, bordô, rosa-escuro, marrom de madeira e ouro envelhecido; pergaminho ou marfim nos textos. No **tema Clássico**, o feltro é vinho/bordô e não verde; nos temas alternativos, respeitar o feltro e a paleta específicos aprovados, sem impor as cores do Clássico. Referências: tecido com microfibras, luz irregular discreta, madeira usada, latão e couro. O jogo continua 2D; profundidade vem de texturas e sombras, não de perspectiva 3D pesada.

## Hierarquia
Ação principal > estado da partida > nomes/contadores > detalhes ornamentais. Manter o centro da mesa limpo: baralho, descarte, naipe ativo e jogador da vez. Não adicionar arcos decorativos ao feltro. Cartas de jogadores e bots têm escala consistente e não podem trocar identidade durante animações. Efeitos devem ser bonitos mas nunca cobrir seleções ou avisos críticos.

## Componentes
- Moldura dos menus: borda dourada suave, corpo bordô e iluminação sutil; títulos serifados, legíveis, sem exagero de caixa-alta.
- Botões: relevo e brilho contidos, estados pressionado/indisponível/foco distintos; alvos de toque de aproximadamente 44 px ou mais.
- Formulários: campos no mesmo painel, com estados de erro claros em português e sem janelas técnicas.
- Seletores: grades ou painéis próprios (0–9 bots), com seleção nas cores do tema (dourado envelhecido somente no Clássico), confirmação e opções indisponíveis identificadas. Não usar o seletor nativo do Android para escolhas centrais.
- Modais: uma camada de fundo escura, bloqueio apenas quando necessário; fechar/cancelar sempre funcional; teclado Escape e foco acessíveis.
- Ícones: poucos, coerentes com a taverna. Evitar excesso de informação no ícone do aplicativo.

## Online, offline e VIP
Menu inicial apresenta modos igualmente refinados. Offline exige máxima usabilidade na mão de cartas. Online tem sequência nítida: conta ou visitante > criar/entrar/VIP > lobby > partida > apuração > vencedor. Quando conectado ao lobby, não mostrar criação e código. Perfil sempre dentro da moldura; nunca flutuando. Na VIP, código fixo, presença (aguardando, em partida, desconectado), vitória e acesso mesmo sem o proprietário. Nenhuma lista pode revelar mão privada, senha ou token.

## Layout
Auditar larguras de 320, 360, 390, 430 px e landscape/desktop. Nunca rolagem horizontal involuntária; usar box-sizing:border-box, quebra de texto e flex wrap. Componentes próximos não podem se sobrepor: cronômetro, botões, perfil, nomes, cards e ferramentas. Botões sempre funcionais.

## Áudio e atmosfera
SFX e rádio são independentes. Narrador removido da versão atual: não reintroduzir sem aprovação; SFX e rádio seguem independentes, respeitando autoplay e a preferência do jogador.

## Critérios de aceitação
1. Testar renderização do menu inicial, offline, multiplayer, conta, visitante, lobby, VIP, bots, ajuda, histórico e vitória.
2. Confirmar navegação entre telas, teclado/toque e ausência de sobreposição em tela pequena.
3. Exigir testes automáticos de regras, autenticação e multiplayer antes da publicação.
4. Não alterar motor de jogo quando somente a interface precisar mudar.
5. A inspeção estática não prova consistência visual completa: validar capturas reais de navegador.
6. Registrar versão, atualizar cache PWA e conferir página publicada.

## Contrato obrigatório dos componentes — atualizado na Alpha 0.5.0.56

**Fonte da verdade.** Este manual é o padrão único do produto. `AGENTS.md` exige sua leitura em cada tarefa. Componentes existentes, o HUD em `qa/hud-design-v56.css` e as variáveis dos 12 temas formam o contrato executável; não criar CSS isolado que os contradiga. O antigo `docs/design-guide-v1.md` é apenas histórico.

**Botões e ícones.** No HUD do jogo, os controles de áudio/FX, rádio, histórico, relatos, ajuda, saída, pausa offline e troféu das Crônicas compartilham a mesma família: círculo, diâmetro, borda, relevo, sombra, alinhamento e tom de ícone. Não substituir as ações nem os IDs existentes. O seletor de aparência é um controle separado e NÃO deve entrar na padronização de tamanhos do HUD. Usar sempre SVG ou arte explícita para ícones; evitar caracteres especiais que possam parecer números, por exemplo `Ⅱ`. Um novo botão deve nascer usando os mesmos tokens e estados hover, active, focus-visible e disabled.

**Tokens da barra superior.** A classe visual normalizada usa `--tav-hud-surface`, `--tav-hud-edge`, `--tav-hud-ink` e `--tav-hud-glow`; cada tema deriva desses tokens a partir de `--tp-button`, `--tp-edge`, `--tp-bright` e `--tp-glow`. A camada da pausa usa `--tav-pause-panel`. A cor dourada fixa não deve aparecer por herança nos temas alternativos; a cor do jogador ativo deve sempre seguir a paleta.

**Controles distintos, aparência coesa.** Comandos de ação (MAU MAU!, OPA!!!, PASSAR/COMPRAR) continuam retangulares e coerentes com os materiais do tema. Controles utilitários do cabeçalho são circulares. Menus, modais, seleção de jogadores, apuração, vencedor, conquistas, configurações e mensagens usam superfícies, tipografia, bordas e contrastes do tema em vez de valores dourados ou rosados literais fora do Clássico. Evitar texturas diagonais nas caixas dos temas e atrás dos comandos.

**Responsividade real.** Verificar 320, 360, 390 e 430 px, portrait e landscape, assim como PC. Devem caber os **nove comandos** do HUD em uma linha quando possível, sem cortar o último ou deslocar a mesa/área inferior. Mesmo com 11+ cartas em duas linhas ou jogadores eliminados, nenhum comando pode ocultar cartas ou perder sua área de toque. Testes programáticos de dimensões são necessários, mas não substituem screenshots reais de browser.

**Pausa e conquistas.** O botão de pausa existe somente no motor offline; ele bloqueia temporizadores, bots e janela do OPA!!! sem penalidades. Crônicas abertas durante a partida offline também congelam o relógio. O online não pode ganhar pausa. Tela de pausa deve usar ícone vetorial, material temático e ação clara de continuar. Nenhuma mudança de aparência pode alterar os contratos de tempo/IA do motor.

## Critérios extras para toda nova função visual

1. Identificar primeiro qual componente existente é análogo (botão, modal, card, cabeçalho); reutilizar classe/tokens antes de criar variante.
2. Conferir o Clássico e **todos os 11 temas alternativos**. Evitar amarelo/dourado em temas alternativos e preservar a arte própria dos baralhos e personagens.
3. Avaliar foco/teclado, toque, estados disabled, contraste e área de clique. Se usar SVG, fornecer `aria-label` no botão e `aria-hidden` no ícone.
4. Executar verificações de versão, regras, QA estático e Playwright em 320/360/390/430 px; guardar captura com HUD e modal visíveis, comparando dimensões, materiais e ícones.
5. Registrar changelog, incrementar versão/cache, aguardar testes verdes do PR e conferir o deploy real. Nunca declarar atualização publicada sem confirmação da execução de Pages.

