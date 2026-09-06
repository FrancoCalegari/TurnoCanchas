import re

with open('public/masteradmin.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Restore spans to normal
html = html.replace('<span id="btn-tab-general">General &amp; Contacto</span>', '<span>General &amp; Contacto</span>')
html = html.replace('<span id="btn-tab-credenciales">Credenciales Admin</span>', '<span>Credenciales Admin</span>')
html = html.replace('<span id="btn-tab-canchas">Canchas &amp; Precios</span>', '<span>Canchas &amp; Precios (4)</span>')
html = html.replace('<span id="btn-tab-cobros">Cobros &amp; Horarios</span>', '<span>Cobros &amp; Horarios</span>')
html = html.replace('<span id="btn-tab-licencia">Licencia 30 Días</span>', '<span>Licencia 30 Días</span>')

# Add ids to buttons
html = html.replace('<button class="px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 bg-indigo-600 text-white shadow-md shadow-indigo-600/30 scale-100" type="button">\n<svg aria-hidden="true" class="lucide lucide-building2',
                    '<button id="btn-tab-general" class="px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 bg-indigo-600 text-white shadow-md shadow-indigo-600/30 scale-100" type="button">\n<svg aria-hidden="true" class="lucide lucide-building2')

html = html.replace('<button class="px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 text-slate-300 hover:bg-slate-800/80 hover:text-white" type="button">\n<svg aria-hidden="true" class="lucide lucide-key-round',
                    '<button id="btn-tab-credenciales" class="px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 text-slate-300 hover:bg-slate-800/80 hover:text-white" type="button">\n<svg aria-hidden="true" class="lucide lucide-key-round')

html = html.replace('<button class="px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 text-slate-300 hover:bg-slate-800/80 hover:text-white" type="button">\n<svg aria-hidden="true" class="lucide lucide-layers',
                    '<button id="btn-tab-canchas" class="px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 text-slate-300 hover:bg-slate-800/80 hover:text-white" type="button">\n<svg aria-hidden="true" class="lucide lucide-layers')

html = html.replace('<button class="px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 text-slate-300 hover:bg-slate-800/80 hover:text-white" type="button">\n<svg aria-hidden="true" class="lucide lucide-credit-card',
                    '<button id="btn-tab-cobros" class="px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 text-slate-300 hover:bg-slate-800/80 hover:text-white" type="button">\n<svg aria-hidden="true" class="lucide lucide-credit-card')

html = html.replace('<button class="px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 text-slate-300 hover:bg-slate-800/80 hover:text-white" type="button">\n<svg aria-hidden="true" class="lucide lucide-zap',
                    '<button id="btn-tab-licencia" class="px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 text-slate-300 hover:bg-slate-800/80 hover:text-white" type="button">\n<svg aria-hidden="true" class="lucide lucide-zap')

with open('public/masteradmin.html', 'w', encoding='utf-8') as f:
    f.write(html)
