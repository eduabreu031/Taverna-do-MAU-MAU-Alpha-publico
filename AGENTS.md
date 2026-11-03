# Taverna do Mau Mau — contrato obrigatório de implementação

Antes de alterar a interface, **ler e obedecer**
`docs/MANUAL-IDENTIDADE-VISUAL.md`. A identidade visual já foi aprovada
pelo responsável do jogo; não introduzir padrões próprios.

- Reutilizar componentes e tokens de `qa/tavern-design-system-v56.css`.
- Ao criar uma nova função, avaliar a interface no contexto das telas
  existentes e de todas as paletas; aplicar a mesma linguagem do HUD
  atualizado de Pausa e Conquistas.
- Não criar botões de tamanho, geometria, ícones ou material discrepantes.
- Símbolos de função com SVG estável e rótulos acessíveis; nada de `Ⅱ`
  ou outros glifos de fonte ambíguos para representar ações.
- Não afetar motor, relógios, servidor, Worker, Beta isolada ou fluxo
  de produção ao corrigir exclusivamente aparência.
- Validar em 320/360/390/430 px, desktop e alternando temas.
- Toda alteração visual precisa passar pelo contrato
  `node qa/check-design-contract.cjs site` depois da montagem da Alpha
  e por testes de navegador/inspeção de capturas antes da publicação.
- Mudança no código da Alpha exige release/changelog, cache PWA
  atualizado e verificação de deployment antes de anunciar conclusão.
