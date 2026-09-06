import re

with open('public/js/masteradmin.js', 'r', encoding='utf-8') as f:
    js = f.read()

new_build_card = """    const buildCard = (t) => {
        const dias = t.dias_restantes;
        const isBlocked = t.estado === 'suspendido' || (dias !== null && dias < 0);
        const isPending = t.estado === 'pendiente';
        const isActive = t.estado === 'activo' && !isBlocked;
        const isVenciendo = isActive && dias !== null && dias <= 7;

        // Determine classes
        let statusBadge = '';
        let statusBadgeClass = '';
        if (isBlocked) {
            statusBadge = 'Bloqueado';
            statusBadgeClass = 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800';
        } else if (isPending) {
            statusBadge = 'Pendiente';
            statusBadgeClass = 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800';
        } else if (isActive) {
            statusBadge = 'Panel en Uso';
            statusBadgeClass = 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800';
        }

        // Días restantes display
        let diasDisplay = '';
        if (!isPending) {
            const diasNum = dias !== null ? dias : 0;
            const diasColor = isBlocked ? 'text-rose-700 dark:text-rose-300' : isVenciendo ? 'text-amber-700 dark:text-amber-300' : 'text-emerald-700 dark:text-emerald-300';
            const diasBg = isBlocked ? 'bg-rose-500/10 border-rose-500/30' : isVenciendo ? 'bg-amber-500/10 border-amber-500/30' : 'bg-emerald-500/10 border-emerald-500/30';
            const fechaStr = t.fecha_vencimiento ? new Date(t.fecha_vencimiento).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' }) : '--';
            const suspendActionClass = isBlocked ? 'btn-activate text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10' : 'btn-suspend text-slate-500 hover:text-rose-600 hover:bg-rose-500/10';
            const suspendIcon = isBlocked 
                ? `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-unlock w-4 h-4"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg>`
                : `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-lock w-4 h-4"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>`;

            diasDisplay = `
                <div class="p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${diasBg} ${diasColor}">
                    <div class="flex items-center gap-2.5">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-check w-5 h-5 shrink-0"><circle cx="12" cy="12" r="10"></circle><path d="m9 12 2 2 4-4"></path></svg>
                        <div>
                            <div class="text-xs font-black">${Math.abs(diasNum)} días ${diasNum < 0 ? 'vencido' : 'restantes'}</div>
                            <div class="text-[11px] opacity-80">Vence: ${fechaStr}</div>
                        </div>
                    </div>
                    <button class="${suspendActionClass} p-2 rounded-xl transition-all cursor-pointer" data-id="${t.id}" title="${isBlocked ? 'Reactivar' : 'Pausar / Bloquear'}">
                      ${suspendIcon}
                    </button>
                </div>
            `;
        }

        const stats = t.stats || { canchas: 0, reservas: 0, clientes: 0 };
        const logoUrl = "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=200"; // Placeholder logo
        
        let actionsHtml = '';
        if (isPending) {
            actionsHtml = `<button class="btn-approve flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold transition-all shadow-md cursor-pointer flex items-center justify-center gap-2" data-id="${t.id}" data-name="${t.nombre}">✓ Aprobar</button>`;
        } else {
            actionsHtml = `
                <button class="btn-renew-one px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-900 text-sm font-bold transition-all shadow-md cursor-pointer flex items-center justify-center gap-2" data-id="${t.id}">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-zap w-4 h-4 fill-amber-500"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"></path></svg>
                  <span>+30 Días</span>
                </button>
                <div class="flex items-center gap-2 ml-auto">
                    <button class="p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950 transition-colors btn-impersonate" data-id="${t.id}" title="Portal Admin">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-lock-keyhole w-4 h-4"><circle cx="12" cy="16" r="1"></circle><rect x="3" y="10" width="18" height="12" rx="2"></rect><path d="M7 10V7a5 5 0 0 1 10 0v3"></path></svg>
                    </button>
                    <a href="/t/${t.slug}" target="_blank" class="p-2 rounded-xl text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950 transition-colors" title="Ver portal público">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-external-link w-4 h-4"><path d="M15 3h6v6"></path><path d="M10 14 21 3"></path><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path></svg>
                    </a>
                </div>
            `;
        }

        const card = document.createElement('div');
        card.className = "bg-white dark:bg-slate-800 rounded-3xl border transition-all duration-200 overflow-hidden flex flex-col justify-between shadow-xs hover:shadow-md border-indigo-500 ring-2 ring-indigo-500/30";
        if(isBlocked) card.className = "bg-white dark:bg-slate-800 rounded-3xl border transition-all duration-200 overflow-hidden flex flex-col justify-between shadow-xs hover:shadow-md border-rose-500 ring-2 ring-rose-500/30 opacity-75";
        
        card.innerHTML = `
            <div class="p-5 sm:p-6 space-y-4">
                <div class="flex items-start justify-between gap-3">
                    <div class="flex items-center space-x-3 min-w-0">
                        <img alt="${t.nombre}" class="w-11 h-11 rounded-xl object-cover ring-2 ring-slate-200 dark:ring-slate-700 shadow-sm shrink-0 bg-white dark:bg-slate-800" src="${logoUrl}">
                        <div class="space-y-1 min-w-0">
                            <div class="flex items-center gap-2 flex-wrap">
                                <span class="text-[11px] font-black uppercase tracking-wider text-slate-400 font-mono">${t.slug}</span>
                                <span class="px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${statusBadgeClass}">${statusBadge}</span>
                            </div>
                            <h3 class="text-lg font-black text-slate-900 dark:text-white leading-tight truncate">${t.nombre}</h3>
                        </div>
                    </div>
                    <div class="flex items-center gap-1 shrink-0">
                        <button class="btn-edit p-2 rounded-xl text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors cursor-pointer" data-id="${t.id}" title="Editar datos">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-pen-line w-4 h-4"><path d="M13 21h8"></path><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"></path></svg>
                        </button>
                        <button class="btn-delete-tenant p-2 rounded-xl text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer" data-id="${t.id}" data-name="${t.nombre}" title="Eliminar panel">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash2 lucide-trash-2 w-4 h-4"><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path><path d="M3 6h18"></path><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                    </div>
                </div>

                ${diasDisplay}

                <div class="space-y-2 text-xs text-slate-600 dark:text-slate-300 pt-1">
                    <div class="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-users w-3.5 h-3.5 text-indigo-500 shrink-0"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><path d="M16 3.128a4 4 0 0 1 0 7.744"></path><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><circle cx="9" cy="7" r="4"></circle></svg>
                        <span class="font-semibold text-slate-800 dark:text-slate-200">${t.nombre}</span>
                    </div>
                    ${t.telefono ? `<div class="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-phone w-3.5 h-3.5 text-emerald-500 shrink-0"><path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384"></path></svg>
                        <a href="https://wa.me/${t.telefono.replace(/\\D/g,'')}" target="_blank" class="hover:underline text-slate-700 dark:text-slate-300">${t.telefono}</a>
                    </div>` : ''}
                    ${t.ubicacion ? `<div class="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-map-pin w-3.5 h-3.5 text-slate-400 shrink-0"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"></path><circle cx="12" cy="10" r="3"></circle></svg>
                        <span class="truncate">${t.ubicacion}</span>
                    </div>` : ''}
                </div>

                <div class="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-700/60 text-center">
                    <div class="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                        <div class="text-sm font-black text-slate-900 dark:text-white font-mono">${stats.canchas}</div>
                        <div class="text-[10px] text-slate-500 uppercase font-bold">Canchas</div>
                    </div>
                    <div class="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                        <div class="text-sm font-black text-slate-900 dark:text-white font-mono">${stats.reservas}</div>
                        <div class="text-[10px] text-slate-500 uppercase font-bold">Reservas</div>
                    </div>
                    <div class="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                        <div class="text-sm font-black text-slate-900 dark:text-white font-mono">${stats.clientes}</div>
                        <div class="text-[10px] text-slate-500 uppercase font-bold">Clientes</div>
                    </div>
                </div>
            </div>
            
            <div class="p-4 bg-slate-50 dark:bg-slate-900/30 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-2 mt-auto">
                ${actionsHtml}
            </div>
        `;
        return card;
    };"""

# Replace the buildCard function using regex
pattern = r'    const buildCard = \(t\) => \{.*?\n        return card;\n    \};\n'
new_js = re.sub(pattern, lambda m: new_build_card + '\n', js, flags=re.DOTALL)

with open('public/js/masteradmin.js', 'w', encoding='utf-8') as f:
    f.write(new_js)
