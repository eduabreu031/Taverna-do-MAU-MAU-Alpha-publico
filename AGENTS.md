# Regras obrigatórias para agentes — Taverna do Mau Mau

Antes de qualquer mudança de interface, ler [docs/MANUAL-IDENTIDADE-VISUAL.md](docs/MANUAL-IDENTIDADE-VISUAL.md). Esse manual prevalece sobre preferências visuais improvisadas.

- Não criar botão, ícone, modal, menu, capa, cartão, destaque de turno ou componente isolado sem reutilizar os contratos visuais existentes e verificar os **12 temas**, inclusive o Clássico.
- No cabeçalho da partida usar o componente visual normalizado em `qa/hud-design-v56.css`; NÃO recriar diâmetros, cores, bordas e ícones nos scripts de função. O seletor de tema fica independente da barra.
- Ícones de função são SVGs ou ativos explícitos, **não caracteres Unicode ambíguos** que possam ser renderizados como números (como `Ⅱ`).
- Garantir áreas clicáveis, legibilidade, responsividade em 320/360/390/430 px e landscape, sem colisão com a mesa ou a mão. Não usar seletor nativo Android para controles centrais.
- Não modificar motor offline, lógica online, timers, baralhos nem identidade de NPCs para resolver aparência.
- Toda mudança visual pede: screenshot em navegador real, teste estático da interface, inspeção em temas diferentes, validação das interações, atualização do changelog, cache PWA e verificação da publicação.
- Em caso de conflito entre estilo novo e funções existentes, preservar comportamento e adaptar aparência às convenções vigentes. Não substituir elementos que já funcionam por mockups.
