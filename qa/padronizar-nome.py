#!/usr/bin/env python3
"""Padroniza o nome público da Taverna sem modificar regras ou cartas."""
from pathlib import Path
import re
import sys

root = Path(sys.argv[1] if len(sys.argv) > 1 else "site")
p = root / "index.html"
data = p.read_text(encoding="utf-8")
data, count = re.subn(r"taverna das sombras", "Taverna do MAU MAU", data, flags=re.IGNORECASE)
p.write_text(data, encoding="utf-8")
print(f"Nome oficial padronizado em {count} ocorrências do HTML")
