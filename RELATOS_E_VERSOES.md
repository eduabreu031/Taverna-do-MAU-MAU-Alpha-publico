# Relatos da Taverna do MAU MAU — Alpha publica

## Destino
Todos os relatos que o jogador **concluir no GitHub** pelo formulario da Alpha viram *Issues* publicas neste repositorio:
https://github.com/eduabreu031/Taverna-do-MAU-MAU-Alpha-publico/issues

O formulario dentro do jogo coleta tipo, categoria, versao, titulo, descricao, passos, comportamento esperado e horario. Diagnostico de navegador e tamanho da janela e enviado **apenas com consentimento**. Nao coleta dados de cartas privadas, codigos de sala, tokens, contas ou historico da partida.

**Limitacao importante**: GitHub exige login para publicar a Issue. Sem backend com credenciais armazenadas de forma segura, o jogo estatico no GitHub Pages nao pode abrir Issues de forma anonima. O botao "Continuar no GitHub" apenas abre a tela preenchida; o relato so e enviado quando o usuario confirmar a publicacao no GitHub. O botao "Copiar relato" permite salvar/compartilhar o texto de quem nao tem conta. Nunca colocar token GitHub no HTML/JS.

## Como classificar
O workflow `.github/workflows/triagem-relatos.yml` aplica etiquetas automaticamente a Issues com prefixos de titulo:
- `[Bug]` -> `tipo: bug`, `triagem-pendente`, `alpha-publica`, `origem: jogo`.
- `[Sugestão]` -> `tipo: sugestao`, `triagem-pendente`, `alpha-publica`, `origem: jogo`.

Busca pratica:
- Bugs: https://github.com/eduabreu031/Taverna-do-MAU-MAU-Alpha-publico/issues?q=is%3Aissue+label%3A%22tipo%3A+bug%22
- Sugestoes: https://github.com/eduabreu031/Taverna-do-MAU-MAU-Alpha-publico/issues?q=is%3Aissue+label%3A%22tipo%3A+sugestao%22
- Relatos a analisar: https://github.com/eduabreu031/Taverna-do-MAU-MAU-Alpha-publico/issues?q=is%3Aissue+label%3Atriagem-pendente

No ChatGPT, para buscar um inventario com contexto: "Consulte as Issues do repositorio eduabreu031/Taverna-do-MAU-MAU-Alpha-publico. Liste bugs e sugestoes da Alpha, agrupando por gravidade, area, versao, reproducibilidade e risco de correcao. Sugira solucoes sem implementa-las ate eu escolher. Mostre opcoes de priorizacao interativas."

## Publicacao de nova versao
1. Atualizar `qa/alpha-releases.json`: adicionar nova entrada no inicio, mudar `current` para ID novo, anotar somente alteracoes realmente liberadas.
2. Atualizar `qa/apply-alpha-v92.py` para reconhecer o ID atual e mudar `const CACHE` (chave PWA).
3. Testar e publicar pelo fluxo de GitHub Actions; conferir site antes de anunciar. A chave `taverna-alpha:ultima-versao-lida` no localStorage impede repetir o aviso para a mesma versao no mesmo navegador/perfil.
4. O changelog nunca aparece durante uma partida. O botão 📜 no menu reabre o historico.
