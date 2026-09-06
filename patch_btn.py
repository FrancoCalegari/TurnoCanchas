import re

with open('public/masteradmin.html', 'r', encoding='utf-8') as f:
    html = f.read()

pattern = r'(<button class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700[^>]+>)'
html = re.sub(pattern, r'\1'.replace('<button', '<button id="btn-create-tenant"'), html)

with open('public/masteradmin.html', 'w', encoding='utf-8') as f:
    f.write(html)
