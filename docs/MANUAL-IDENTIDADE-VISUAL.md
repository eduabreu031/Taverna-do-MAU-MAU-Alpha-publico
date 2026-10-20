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
