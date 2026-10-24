# Taverna do Mau Mau — aparência e eventos (v0.5.0.10-alpha)

## Contrato do recurso

**Paleta pessoal:** escolha do jogador em `Aparência`, aplicada localmente em toda a interface e preservada entre aberturas do PWA. Quatro opções: `classic`, `neon-blue`, `neon-green`, `neon-pink`. `classic` é a ausência de estilo adicional e permanece idêntico ao produto original.

**Evento sazonal:** faixa de tempo configurada pelo administrador em `qa/theme-schedule.json`, com início/fim absolutos e fuso America/Sao_Paulo. Define o atributo `data-tav-event`. Não escreve a preferência pessoal. O evento de ensaio `neon-test` permanece nas datas originais (15h50 às 17h50, 24/10/2026); sem preferência prévia, continua exibindo o azul apenas nessa janela para preservar o teste anterior. Preferências explícitas sempre prevalecem. Ao terminar, o azul temporário sai, mas a paleta escolhida manualmente fica.

**Persistência:** `localStorage['taverna:appearance:palette:v1']`, por navegador/dispositivo, sem serviço remoto; não confundir com sincronização de perfil entre celulares. Falha no armazenamento não impede jogar ou selecionar cor na sessão atual.

**Independência:** nunca atualizar GameEngine, cartas, sua identidade, valores, naipes, websocket, relógios, bots, salas, áudio, wins ou efeitos de turno por meio do sistema de temas. Retirar atributo CSS não faz rollback de nenhuma versão.

## Checklist de cobertura visual

Marcar todos os grupos no CSS de `qa/theme-player-palettes.css`. Os itens em negrito são os que foram identificados como exceções nas três capturas de 24/10:

- [x] Boas-vindas: fundo, moldura, letreiro, modos offline e multiplayer, **cabeçalho Central da Taverna**, botões de novidades, relato de bugs, campo de nome, marca da versão
- [x] Login e conta: **cartão do administrador**, **Trocar conta**, modal de entrar/criar conta, campos, remover usuário
- [x] Multiplayer: fundo, cartões de salas, Sala VIP, código, conectar, avisos, lobby e botões de retorno
- [x] Offline: livro, capa, páginas, heróis, inputs, seleção de personagens, confirmações
- [x] Mesa: moldura de madeira, feltro, sombras ambiente, barra superior, **área inferior da mão**, **MAU MAU / OPA!!! / PASSAR**, contador de cartas, nomes e painéis dos bots
- [x] Ferramentas: sons, rádio, histórico, regras, indicadores e botões sem afetar sua semântica
- [x] Submenus: regras, changelog, formulário de bug, escolha de bots, convites/solicitações VIP, senha VIP, administração VIP, central administrativa/observação das mesas
- [x] Multiplayer em andamento: menu de emojis, voto de expulsão, abandonar partida, diálogo de fim, notícias e mensagens
- [x] Partes sensíveis: não alterar faces/versos das cartas, cores dos naipes, retratos/imagens, timers e funcionamento de botões
- [x] Dimensões: manter layouts existentes; apenas cores, bordas, iluminação, sombras

## Testes e aceite

- [ ] Quatro paletas alteram realmente superfícies de fundo em celular e desktop (Chromium)
- [ ] Trocar no menu e durante jogo sem reinício/reload; salvar e restaurar depois de recarregar
- [ ] Fundo e barra da mesa em todas as orientações; sem recorte/colisão crítica dos botões
- [ ] Menu de Aparência funciona sobre boas-vindas, menu offline, lobby e mesa
- [ ] Eventos do administrador ativam/expiram no horário definido sem mudar escolha local
- [ ] Clássico reverte os estilos extras sem restaurar uma versão anterior do JS
- [ ] Testes gerais offline/online, integridade e publicação GitHub Pages
- [ ] Revisão real em Android (iOS sujeito aos testes dos participantes)

**Regra de publicação:** atualizar `qa/alpha-releases.json` para qualquer mudança funcional/visual, garantindo changelog e versão do PWA.
