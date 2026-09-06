import re

with open('public/masteradmin.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Make sure we add id="btn-tab-licencia"
html = re.sub(r'(<button[^>]*>.*?)(<span(?: id="btn-tab-licencia")?>Licencia 30 Días</span>)(</button>)', 
              lambda m: ('<button id="btn-tab-licencia"' + m.group(1).replace('<button', '').replace('id="btn-tab-licencia"', '') + m.group(2).replace(' id="btn-tab-licencia"', '') + m.group(3)), 
              html, flags=re.DOTALL)

with open('public/masteradmin.html', 'w', encoding='utf-8') as f:
    f.write(html)
