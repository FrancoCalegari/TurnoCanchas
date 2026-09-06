import re

with open('public/masteradmin.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Fix the previous span replacements by removing the span and putting id on the button
html = html.replace('<button class="', '<button id="BTN_TAB_TMP" class="')

html = re.sub(r'<button id="BTN_TAB_TMP"([^>]+)><svg([^>]+)>(.*?)<span id="btn-tab-general">General &amp; Contacto</span></button>', r'<button id="btn-tab-general"\1><svg\2>\3<span>General &amp; Contacto</span></button>', html)
html = re.sub(r'<button id="BTN_TAB_TMP"([^>]+)><svg([^>]+)>(.*?)<span id="btn-tab-credenciales">Credenciales Admin</span></button>', r'<button id="btn-tab-credenciales"\1><svg\2>\3<span>Credenciales Admin</span></button>', html)
html = re.sub(r'<button id="BTN_TAB_TMP"([^>]+)><svg([^>]+)>(.*?)<span id="btn-tab-canchas">Canchas &amp; Precios</span></button>', r'<button id="btn-tab-canchas"\1><svg\2>\3<span>Canchas &amp; Precios</span></button>', html)
html = re.sub(r'<button id="BTN_TAB_TMP"([^>]+)><svg([^>]+)>(.*?)<span id="btn-tab-cobros">Cobros &amp; Horarios</span></button>', r'<button id="btn-tab-cobros"\1><svg\2>\3<span>Cobros &amp; Horarios</span></button>', html)
html = re.sub(r'<button id="BTN_TAB_TMP"([^>]+)><svg([^>]+)>(.*?)<span id="btn-tab-licencia">Licencia 30 Días</span></button>', r'<button id="btn-tab-licencia"\1><svg\2>\3<span>Licencia 30 Días</span></button>', html)

# Cleanup any leftover TMP
html = html.replace('id="BTN_TAB_TMP" ', '')

with open('public/masteradmin.html', 'w', encoding='utf-8') as f:
    f.write(html)
