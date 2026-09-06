import re

with open('public/admin.html', 'r', encoding='utf-8') as f:
    html = f.read()

new_section = """
                    <!-- Sección Información y Servicios -->
                    <div class="pt-2 border-t border-slate-100 dark:border-slate-800">
                        <p class="text-xs font-black text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h.01"></path><path d="M2 8.82a15 15 0 0 1 20 0"></path><path d="M5 12.859a10 10 0 0 1 14 0"></path><path d="M8.5 16.429a5 5 0 0 1 7 0"></path></svg>
                            Información y Servicios (Portal)
                        </p>
                        <div class="grid grid-cols-2 gap-4">
                            <div class="space-y-1.5">
                                <label class="text-xs font-bold text-slate-600 dark:text-slate-400">Wi-Fi (Nombre / SSID)</label>
                                <input type="text" id="ajustes-wifi-ssid" class="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-sm" placeholder="Ej: test_Guest">
                            </div>
                            <div class="space-y-1.5">
                                <label class="text-xs font-bold text-slate-600 dark:text-slate-400">Wi-Fi (Contraseña)</label>
                                <input type="text" id="ajustes-wifi-pass" class="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-sm" placeholder="Ej: canchasdeportivas">
                            </div>
                        </div>
                        <div class="space-y-1.5 mt-4">
                            <label class="text-xs font-bold text-slate-600 dark:text-slate-400">Descripción del Buffet / Bar</label>
                            <textarea id="ajustes-buffet" rows="2" class="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-sm resize-none" placeholder="Cafetería, bebidas frías..."></textarea>
                        </div>
                        <div class="space-y-1.5 mt-4">
                            <label class="text-xs font-bold text-slate-600 dark:text-slate-400">Reglamento Breve</label>
                            <textarea id="ajustes-reglas" rows="2" class="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-sm resize-none" placeholder="Seña del 50% requerida..."></textarea>
                        </div>
                    </div>
"""

pattern = r'(                    <!-- Sección de Pagos -->)'
html = re.sub(pattern, new_section + r'\n\1', html)

with open('public/admin.html', 'w', encoding='utf-8') as f:
    f.write(html)
