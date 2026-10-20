# Integração de contas — Alpha

## Estado
Preparação iniciada; **não publicar** antes dos testes de ponta a ponta.

## Referências congeladas
- Frontend Alpha: 30eb200d4c2a5a134b6cba811f72d2a8fa166eae
- Servidor Alpha: e85703250af13964c704bf8216425c4a086b3ab4
- Backups: backup/alpha-antes-contas-2026-10-20 em ambos os repositórios.

## Condições para liberação
- Interface original, offline e PWA preservados.
- Cadastro/login/logout e recuperação sem regressões.
- Sessão validada no servidor ao criar e entrar em salas.
- WebSocket identifica jogador pela conta, não pelo nome enviado pelo cliente.
- Reconexão, troca de conta, duas abas e token inválido testados.
- Partidas 1x1 completas, sincronização, vencedor nas duas telas.
- Cenários de 2, 5 e 10 jogadores, bots, temporizadores e eliminação.
- Testes automáticos da interface, regras, servidor e integração concluídos.
- Plano de rollback validado, com cuidado para migrações de banco.
- Publicação somente após aprovação da bateria de testes.
