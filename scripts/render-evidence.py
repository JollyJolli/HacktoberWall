"""Rebuild static evidence from the read-only archive and pinned Git history.
Never writes to 2024/. GitHub totals live in the separately dated impact snapshot.
"""
from pathlib import Path
from collections import Counter
import subprocess, json, html
ROOT = Path(__file__).resolve().parents[1]
revision = 'd2f9198'
names = json.loads((ROOT / '2024/src/data/contributors.json').read_text(encoding='utf-8-sig'))
dates = subprocess.check_output(['git','log',revision,'--format=%as'], cwd=ROOT, text=True).splitlines()
counts = Counter(dates)
daily = [{'date':f'2024-10-{day:02d}','commits':counts[f'2024-10-{day:02d}']} for day in range(1,32)]
page = ROOT / 'index.html'
text = page.read_text(encoding='utf-8-sig')
# Named boundaries make subsequent updates deterministic.
import re
def region(marker, content):
    global text
    pattern = rf'<!-- {marker} -->(?:[\s\S]*?<!-- /{marker} -->)?'
    text = re.sub(pattern, lambda _: f'<!-- {marker} -->\n{content}\n<!-- /{marker} -->', text)
region('ARCHIVE_NAMES', '\n'.join(f'<span class="name-tile">{html.escape(n["name"])}</span>' for n in names))
region('COMMIT_BARS', '\n'.join(f'<span class="commit-bar" style="--count:{d["commits"]};--day:{i}" title="{d["date"]}: {d["commits"]} commits"></span>' for i,d in enumerate(daily)))
region('COMMIT_ROWS', '\n'.join(f'<tr><th scope="row">{d["date"]}</th><td>{d["commits"]}</td></tr>' for d in daily))
page.write_text(text,encoding='utf-8')
impact_path = ROOT / 'assets/impact.json'
impact = json.loads(impact_path.read_text(encoding='utf-8-sig')) if impact_path.exists() else {}
impact['archive'] = {'source':'2024/src/data/contributors.json','entries':len(names),'note':'Entries, not verified unique people; includes post-2024 additions.'}
impact['history'] = {'revision':revision,'commits':len(dates),'october2024Commits':sum(d['commits'] for d in daily),'method':'git log d2f9198 --format=%as; author dates, including merges','daily':daily}
impact_path.write_text(json.dumps(impact,indent=2)+'\n',encoding='utf-8')
print(f'Rendered {len(names)} archive entries and {sum(d["commits"] for d in daily)} October commits.')
