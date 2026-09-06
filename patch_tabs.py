import re

with open('public/masteradmin.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Add IDs to buttons
html = html.replace('<span>General &amp; Contacto</span></button>', '<span id="btn-tab-general">General &amp; Contacto</span></button>')
html = html.replace('<span>Credenciales Admin</span></button>', '<span id="btn-tab-credenciales">Credenciales Admin</span></button>')
html = html.replace('<span>Canchas &amp; Precios (4)</span></button>', '<span id="btn-tab-canchas">Canchas &amp; Precios</span></button>')
html = html.replace('<span>Cobros &amp; Horarios</span></button>', '<span id="btn-tab-cobros">Cobros &amp; Horarios</span></button>')
html = html.replace('<span>Licencia 30 Días</span></button>', '<span id="btn-tab-licencia">Licencia 30 Días</span></button>')

# Wrap existing form and new forms
# The existing form ends before:
#     <!-- Modal: Rubro -->
#     <div id="modal-rubro" 

with open('/home/gowther/.gemini/antigravity-ide/brain/8181f84d-2356-4999-b54a-483d139a5f38/scratch/credenciales.html', 'r') as fc:
    cred_html = fc.read().strip()
with open('/home/gowther/.gemini/antigravity-ide/brain/8181f84d-2356-4999-b54a-483d139a5f38/scratch/canchas.html', 'r') as fc:
    canchas_html = fc.read().strip()
with open('/home/gowther/.gemini/antigravity-ide/brain/8181f84d-2356-4999-b54a-483d139a5f38/scratch/cobros.html', 'r') as fc:
    cobros_html = fc.read().strip()
with open('/home/gowther/.gemini/antigravity-ide/brain/8181f84d-2356-4999-b54a-483d139a5f38/scratch/licencia.html', 'r') as fc:
    licencia_html = fc.read().strip()

# Add hidden class to the new forms
cred_html = cred_html.replace('<form class="p-6', '<form id="form-tab-credenciales" class="p-6 hidden')
canchas_html = canchas_html.replace('<form class="p-6', '<form id="form-tab-canchas" class="p-6 hidden')
cobros_html = cobros_html.replace('<form class="p-6', '<form id="form-tab-cobros" class="p-6 hidden')
licencia_html = licencia_html.replace('<form class="p-6', '<form id="form-tab-licencia" class="p-6 hidden')

new_forms = f"{cred_html}\n{canchas_html}\n{cobros_html}\n{licencia_html}\n"

# The existing form ends right before `    <!-- Modal: Rubro -->` or `</div></div>` which closes the modal content and background.
# Let's find `</form>\n</div>\n</div>` which ends the modal.
pattern = r'</form>\n</div>\n</div>'
match = re.search(pattern, html)
if match:
    html = html[:match.start()] + '</form>\n' + new_forms + '</div>\n</div>' + html[match.end():]
else:
    print("Could not find end of modal")

with open('public/masteradmin.html', 'w', encoding='utf-8') as f:
    f.write(html)
