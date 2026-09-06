import re

with open('public/portal.html', 'r', encoding='utf-8') as f:
    html = f.read()

# We need to find the block starting around line 261 that looks like:
# <div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
#   <button class="w-full p-4 bg-gradient-to-r...

# The block ends before `<div class="flex bg-slate-200/80 dark:bg-slate-900 p-1 rounded-2xl max-w-xs mx-auto border border-slate-300/60 dark:border-slate-800">`

start_marker = '<div\n            class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden"\n          >'
end_marker = '<div\n            class="flex bg-slate-200/80 dark:bg-slate-900 p-1 rounded-2xl max-w-xs mx-auto border border-slate-300/60 dark:border-slate-800"'

# A more robust regex since spaces may vary
pattern = r'<div[^>]*class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden"[^>]*>.*?<span[^>]*>Ver Detalles ▼</span>\s*</button>\s*</div>'

new_html = """
          <div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
            <button onclick="document.getElementById('info-detalles-content').classList.toggle('hidden'); const txt = this.querySelector('.toggle-text'); txt.textContent = txt.textContent.includes('Ocultar') ? 'Ver Detalles ▼' : 'Ocultar ▲';" class="w-full p-4 bg-gradient-to-r from-slate-50 via-blue-50/30 to-indigo-50/20 dark:from-slate-800/80 dark:to-slate-900 flex items-center justify-between gap-3 text-left transition-colors cursor-pointer">
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-wifi w-4 h-4" aria-hidden="true"><path d="M12 20h.01"></path><path d="M2 8.82a15 15 0 0 1 20 0"></path><path d="M5 12.859a10 10 0 0 1 14 0"></path><path d="M8.5 16.429a5 5 0 0 1 7 0"></path></svg>
                </div>
                <div>
                  <h3 class="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">Información &amp; Servicios del Complejo</h3>
                  <p class="text-[11px] text-slate-500 font-medium">Hacé clic para ver detalles de los servicios, reglas y datos del complejo</p>
                </div>
              </div>
              <span class="toggle-text px-3 py-1 rounded-xl bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border border-slate-200 dark:border-slate-700 font-bold text-xs shrink-0">Ocultar ▲</span>
            </button>
            <div id="info-detalles-content" class="p-5 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4 animate-fadeIn">
              <div class="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 space-y-2.5">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2 text-blue-900 dark:text-blue-100 font-black text-xs">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-wifi w-4 h-4 text-blue-600 dark:text-blue-400" aria-hidden="true"><path d="M12 20h.01"></path><path d="M2 8.82a15 15 0 0 1 20 0"></path><path d="M5 12.859a10 10 0 0 1 14 0"></path><path d="M8.5 16.429a5 5 0 0 1 7 0"></path></svg>
                    <span>Conexión Wi-Fi Gratis</span>
                  </div>
                  <span class="px-2 py-0.5 rounded-full bg-blue-200/60 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-[10px] font-bold">Alta Velocidad</span>
                </div>
                <div class="text-xs space-y-1">
                  <p class="text-slate-600 dark:text-slate-300">Red: <strong id="info-wifi-ssid">test_Guest</strong></p>
                  <p class="text-slate-600 dark:text-slate-300 font-mono">Clave: <strong id="info-wifi-pass">canchasdeportivas</strong></p>
                </div>
                <button type="button" onclick="navigator.clipboard.writeText(document.getElementById('info-wifi-pass').innerText); alert('Contraseña copiada al portapapeles');" class="w-full py-1.5 px-3 rounded-xl bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-700 hover:bg-blue-100/50 text-blue-700 dark:text-blue-300 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-copy w-3.5 h-3.5 text-blue-600" aria-hidden="true"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg>
                  <span>Copiar Contraseña Wi-Fi</span>
                </button>
              </div>
              <div class="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 space-y-2">
                <div class="flex items-center gap-2 text-amber-900 dark:text-amber-100 font-black text-xs">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-coffee w-4 h-4 text-amber-600 dark:text-amber-400" aria-hidden="true"><path d="M10 2v2"></path><path d="M14 2v2"></path><path d="M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1"></path><path d="M6 2v2"></path></svg>
                  <span>Buffet &amp; Bar del Complejo</span>
                </div>
                <p id="info-buffet" class="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">Cafetería, bebidas frías, alquiler de paletas/pelotas y vestuarios disponibles.</p>
              </div>
              <div class="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-900/60 space-y-2.5">
                <div class="flex items-center gap-2 text-indigo-900 dark:text-indigo-100 font-black text-xs">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-text w-4 h-4 text-indigo-600 dark:text-indigo-400" aria-hidden="true"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path><path d="M14 2v4a2 2 0 0 0 2 2h4"></path><path d="M10 9H8"></path><path d="M16 13H8"></path><path d="M16 17H8"></path></svg>
                  <span>Reglamento y Ubicación</span>
                </div>
                <p id="info-reglas" class="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium line-clamp-3">Seña del 50% requerida. Cancelaciones con hasta 4 horas de anticipación. Tolerancia de 10 min.</p>
                <a id="info-ubicacion" href="https://maps.google.com/?q=-34.5453,-58.4497" target="_blank" rel="noopener noreferrer" class="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-map-pin w-3.5 h-3.5 text-amber-300" aria-hidden="true"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"></path><circle cx="12" cy="10" r="3"></circle></svg>
                  <span>Ubicación</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-external-link w-3.5 h-3.5" aria-hidden="true"><path d="M15 3h6v6"></path><path d="M10 14 21 3"></path><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path></svg>
                </a>
              </div>
            </div>
          </div>
"""

new_html = re.sub(pattern, new_html, html, flags=re.DOTALL)
with open('public/portal.html', 'w', encoding='utf-8') as f:
    f.write(new_html)

