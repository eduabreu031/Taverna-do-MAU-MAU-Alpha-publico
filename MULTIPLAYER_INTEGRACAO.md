# Integração multiplayer na Taverna do MAU MAU original

**Ramo de desenvolvimento:** `integracao-multiplayer-original` — NÃO É A VERSÃO PUBLICADA.

## Contrato do projeto

- A interface, cenas, cartas, retratos, animações, sons e regras são as do `site/index.html` original.
- Usar o menu **Multiplayer** que já existe; não criar outro jogo ou página principal.
- Preservar integralmente a opção offline e sua utilização sem conexão.
- Infraestrutura de salas existente: Cloudflare Worker do repositório `eduabreu031/Taverna-Multiplayer-Servidor`. Reutilizar autenticação, sala e reconexão. O servidor não deve fornecer uma nova interface ao usuário final.
- Autoridade de regras: adaptar o motor original `GameEngine` a um protocolo público/privado testado, sem usar como referência definitiva a reimplementação aproximada da Alpha.
- Somente após validação real, publicar na branch principal para distribuição automática pelo PWA aos usuários já instalados.

## Estado da migração

- [x] Ramo isolado criado para preservar o publicado.
- [x] Código original identificado em `site/index.html`; testes existentes em `qa/validar.js`.
- [x] PWA identificado com `site/sw.js`, estratégia network-first e cache offline.
- [ ] Extração auditada do HTML original completo e localização exata dos handlers do menu Multiplayer.
- [ ] Adaptador de ações/snapshots no GameEngine original.
- [ ] Conexão do menu multiplayer com serviço WebSocket e assentos reais, sem alterar offline.
- [ ] Testes de equivalência de regras + partidas em múltiplos navegadores.
- [ ] Publicação principal e verificação de atualização instalada.

**Bloqueador técnico atual:** a interface de leitura GitHub não retornou o corpo do HTML monolítico de aproximadamente 4,4 MB. Nunca modificar esse arquivo por substituição parcial nem adivinhar handlers. A migração deve usar uma cópia integral acessível via arquivo ou método de download confiável antes de qualquer alteração no HTML original.
