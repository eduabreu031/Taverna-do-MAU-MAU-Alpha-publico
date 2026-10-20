# Proposta para aplicativo administrativo — Taverna do Mau Mau

Esta proposta é posterior à estabilização da Alpha. Não instalar nem publicar outro aplicativo até homologar o multiplayer.

## Recomendação para o escopo atual
Começar por uma rota protegida `/admin` no mesmo PWA, disponível apenas à conta cuja identidade imutável esteja vinculada ao registro de administrador no servidor. Depois, se fizer sentido, transformar essa rota em um PWA separado, compartilhando APIs e autenticação.

## Funções por fases
1. **Moderação da VIP:** consultar online/aguardando/em partida, remover participantes no lobby, alterar senha de acesso VIP (separada da senha da conta), ver histórico de moderação.
2. **Controle de salas:** monitorar salas ativas sem expor mãos ou identidades privadas; capacidade, conexão, erros e reconexões; encerramento administrativo com confirmação.
3. **Eventos festivos:** tema de Halloween/Natal/festa da Taverna, paleta e adereços autorizados, programação de início/fim, prévia visual e retorno imediato ao tema padrão.
4. **Operações e testes:** estado dos Workers, versões, erros agregados, métricas sem dados privados, rollback documentado.

## Modelo seguro de temas
Temas seriam manifestos versionados no servidor, com conjunto fechado de tokens CSS permitidos (cores, textura, ícones e iluminação) e um ID de tema. Não permitir edição de HTML/CSS/JS arbitrário pelo painel: isso criaria risco de execução de código e quebraria a jogabilidade. Temas nunca mudam regras, cartas, cartas ocultas, hitboxes, timers ou permissões.

## Proteções
Toda ação administrativa deve ser validada no Worker por ID de conta e função, com trilha de auditoria e mecanismos de confirmação/rollback. Não confiar no rótulo de administrador enviado pelo navegador. Nunca publicar senhas, tokens ou dados de sessão em artefatos ou repositórios. Diferenciar administradores do sistema de anfitriões de salas normais.

## Prioridade
Antes de iniciar esse painel: concluir CI de stress de criação e reconexão de salas, bots em 2/5/10 jogadores, VIP, autenticação e inspeção visual online/offline.
