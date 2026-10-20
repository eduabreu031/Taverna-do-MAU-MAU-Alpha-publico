# Relatos e versoes da Taverna do MAU MAU — Alpha publica

## Alpha v93: envio sem conta
Ao tocar no icone 🐞, o jogador escolhe **bug ou sugestao**, escreve **nome/apelido** (qualquer nome) e **mensagem**. O site envia diretamente para `POST https://taverna-multiplayer-servidor.edulopes941.workers.dev/api/feedback`, sem cadastro, sem e-mail, sem GitHub e sem token no HTML. Mensagens aprovadas sao guardadas no Durable Object reservado de feedback, separado das salas do jogo. O retorno HTTP 202 significa *mensagem armazenada*, nao "Issue publicada".

Somente `id`, `at`, `type`, `name`, `message` e `version` sao guardados. A Cloudflare recebe dados normais de conexao para operar e aplicar protecao contra spam, mas enderecos IP nao sao guardados na mensagem; o limitador por IP fica apenas na memoria transitoria do Worker. Nao pedir senha, telefone, e-mail, nome real, codigo de sala nem dados de cartas privadas. O jogador e avisado de que seu relato podera aparecer publicamente.

Regras anti-spam: honeypot de formulario, 3 envios/hora por IP (em memoria, melhor esforco), limite global de 35 por hora e 120 por dia. A caixa armazena ate 350 relatos e retira itens com mais de 21 dias. Como o feed publico e legivel antes da publicacao no GitHub, nao usar esse canal para conteudo privado.

## Importacao automatica para Issues

Workflow: `.github/workflows/importar-relatos.yml`, periodico a cada cinco minutos (GitHub pode atrasar execucoes) e com despacho manual. Usa **apenas o GITHUB_TOKEN automatico da propria Action**, com permissao `issues: write`. O servidor Cloudflare NAO precisa guardar token do GitHub.

A Action:
1. Consulta `GET /api/feedback/feed`.
2. Compara identificadores `<!-- alpha-feedback-id:<id> -->` com Issues ja importadas, inclusive fechadas.
3. Cria Issues com origem, tipo, apelido, versao e mensagem, etiquetadas para triagem.
4. Na execucao seguinte, ignora IDs ja importados. A importacao nao e instantanea.

Nenhum login ou passo externo e exigido do jogador.

## Como consultar os relatos comigo no ChatGPT
Diga: "Consulte as Issues do repositorio eduabreu031/Taverna-do-MAU-MAU-Alpha-publico e me traga os bugs e sugestoes dos jogadores. Agrupe por prioridade, contexto, reproducibilidade e risco. Mostre alternativas interativas para eu escolher o que corrigir ou incluir."

- Todos os relatos: https://github.com/eduabreu031/Taverna-do-MAU-MAU-Alpha-publico/issues
- Bugs: https://github.com/eduabreu031/Taverna-do-MAU-MAU-Alpha-publico/issues?q=is%3Aissue+label%3A%22tipo%3A+bug%22
- Sugestoes: https://github.com/eduabreu031/Taverna-do-MAU-MAU-Alpha-publico/issues?q=is%3Aissue+label%3A%22tipo%3A+sugestao%22

## Cada nova versao
Alterar `qa/alpha-releases.json`: incrementar o ID `alpha-vNN`, registrar notas reais e atualizar a chave PWA no script `qa/apply-alpha-v92.py`. O modal aparece uma vez por versao por perfil de navegador e pode ser reaberto com o botao 📜 no menu inicial.

### Como restaurar se houver problema
Antes da v93: `restore/pre-alpha-feedback-site-2026-10-19` (site) e `restore/pre-alpha-feedback-server-2026-10-19` (servidor). Restaurar apenas codigo GitHub nao desfaz dados ja salvos em Durable Objects.
