#!/usr/bin/env python3
"""Impede publicar alterações de interface sem uma versão e changelog posteriores."""
from pathlib import Path
import json, re, subprocess

root=Path(__file__).resolve().parents[1]
manifest=root/'qa'/'alpha-releases.json'
release=json.loads(manifest.read_text(encoding='utf-8'))
current=release['current']
assert re.fullmatch(r'alpha-\d+\.\d+\.\d+\.\d+',current), 'Versão inválida'
assert release['entries'] and release['entries'][0]['id']==current, 'O changelog precisa começar pela versão atual'
assert release['entries'][0]['label']==current.removeprefix('alpha-')+'-alpha'
assert len({x['id'] for x in release['entries']})==len(release['entries']), 'Entradas duplicadas'
assert all(x.get('title') and x.get('date') and x.get('items') for x in release['entries'])
assert all(re.fullmatch(r'\d{4}-\d{2}-\d{2}',x['date']) for x in release['entries'])

latest=subprocess.check_output(
 ['git','log','-1','--format=%H','--','qa/alpha-releases.json'],cwd=root,text=True).strip()
assert latest, 'Não foi possível encontrar a última atualização do changelog'
modified=subprocess.check_output(
 ['git','diff','--name-only',latest,'HEAD'],cwd=root,text=True).splitlines()
exclude={'qa/validar.js','qa/check-release-current.py'}
app_changes=[path for path in modified if path.startswith('site/') or
 (path.startswith('qa/') and path not in exclude and
  not path.startswith('qa/inspect-') and
  path.endswith(('.py','.js','.css','.json')))]
assert not app_changes, (
 'Existem alterações publicáveis desde a última versão sem registrar novo lançamento em '
 'qa/alpha-releases.json: '+', '.join(app_changes[:20]))
print('RELEASE_GUARD_OK:',current,'changelog e código estão sincronizados')
