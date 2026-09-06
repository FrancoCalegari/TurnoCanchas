import re

with open('public/js/masteradmin.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Make rubro_id safe
js = js.replace("rubro_id: document.getElementById('et-rubro').value", "rubro_id: (document.getElementById('et-rubro') ? document.getElementById('et-rubro').value : null)")

# Make btnCreateTenant safe
js = js.replace("btnCreateTenant.addEventListener('click', () => {", "if (btnCreateTenant) btnCreateTenant.addEventListener('click', () => {")

with open('public/js/masteradmin.js', 'w', encoding='utf-8') as f:
    f.write(js)
