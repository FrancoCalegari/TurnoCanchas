const fs = require('fs');

let content = fs.readFileSync('public/js/app.js', 'utf8');

const helperCode = `
    function parseHoraToMinutes(horaStr) {
        if (!horaStr) return 0;
        const parts = horaStr.split(':');
        return parseInt(parts[0], 10) * 60 + parseInt(parts[1] || 0, 10);
    }
    
    function checkOverlap(proposedHora, duracion, reservasCancha) {
        const pStart = parseHoraToMinutes(proposedHora);
        const pEnd = pStart + duracion;
        
        for (const r of reservasCancha) {
            const rStart = parseHoraToMinutes(r.hora);
            const rEnd = rStart + (r.duracion || 60);
            
            if (pStart < rEnd && pEnd > rStart) {
                return true;
            }
        }
        return false;
    }
`;

// Insert the helpers right before renderCourtsCards
content = content.replace('function renderCourtsCards', helperCode + '\n    function renderCourtsCards');

// Replace loop in renderCourtsCards
// Old loop starts with: for (let h = startHour; h <= endHour; h++) {
// And ends where hoursContainer.appendChild(btn); is.
// I will use regex or string split to replace it.

const regexCards = /for\s*\(let h = startHour; h <= endHour; h\+\+\) \{[\s\S]*?hoursContainer\.appendChild\(btn\);\s*\}/;

const newLoopCards = `for (let h = startHour; h <= endHour; h++) {
                for (let m = 0; m < 60; m += 30) {
                    const hourStr = \`\${h.toString().padStart(2, '0')}:\${m.toString().padStart(2, '0')}\`;
                    const pStart = h * 60 + m;
                    const pEnd = pStart + duration;
                    const closeMinutes = (endHour + 1) * 60;

                    if (pEnd > closeMinutes) continue; // No entra en el horario de cierre
                    
                    let isReserved = checkOverlap(hourStr, duration, canchaReservas);
                    
                    const isPast = isToday && (pStart <= (currentHour * 60 + now.getMinutes()));

                    const btn = document.createElement('button');
                    
                    if (isPast) {
                        btn.className = 'py-2 px-1 rounded-xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-800 text-center cursor-not-allowed opacity-50 flex flex-col items-center justify-center';
                        btn.disabled = true;
                        btn.innerHTML = \`
                            <span class="text-xs font-bold text-slate-400 line-through">\${hourStr}</span>
                            <span class="text-[9px] text-rose-500 font-semibold mt-0.5">Pasado</span>
                        \`;
                    } else if (isReserved) {
                        btn.className = 'py-2 px-1 rounded-xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-800 text-center cursor-not-allowed opacity-50 flex flex-col items-center justify-center';
                        btn.disabled = true;
                        btn.innerHTML = \`
                            <span class="text-xs font-bold text-slate-400 line-through">\${hourStr}</span>
                            <span class="text-[9px] text-rose-500 font-semibold mt-0.5">Reservado</span>
                        \`;
                    } else {
                        const price = (cancha.precioPorHora * (duration / 60));
                        btn.className = 'py-2.5 px-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-600 hover:text-white text-emerald-900 dark:text-emerald-200 border border-emerald-200/80 dark:border-emerald-800/80 text-center transition-all group cursor-pointer shadow-2xs hover:scale-105 active:scale-95 flex flex-col items-center justify-center';
                        btn.innerHTML = \`
                            <span class="text-xs font-black group-hover:text-white leading-tight">\${hourStr} hs</span>
                            <span class="text-[11px] font-extrabold text-emerald-700 dark:text-emerald-300 group-hover:text-emerald-100 my-0.5">$ \${price.toLocaleString('es-AR')}</span>
                            <span class="text-[9px] font-bold uppercase tracking-tight text-emerald-600 dark:text-emerald-400 group-hover:text-white bg-emerald-100 dark:bg-emerald-900/60 group-hover:bg-emerald-700 px-1.5 py-0.5 rounded-md transition-colors">Reservar</span>
                        \`;
                        
                        btn.addEventListener('click', (e) => handleReserva(e.currentTarget, cancha, hourStr, duration, price));
                    }
                    
                    hoursContainer.appendChild(btn);
                }
            }`;
            
content = content.replace(regexCards, newLoopCards);

// Now for renderCourtsList header
const regexHeader = /for\s*\(let h = 8; h <= 22; h\+\+\) \{\s*headerHTML \+= \`<th class="p-3 text-xs font-bold text-slate-500 text-center min-w-\[70px\]">\$\{formatTime\(h\)\}<\/th>\`;\s*\}/;

const newHeader = `
        let startHourList = 8;
        let endHourList = 22;
        if (state.ajustes && state.ajustes.open_time && state.ajustes.close_time) {
            const openH = parseInt(state.ajustes.open_time.split(':')[0], 10);
            const closeH = parseInt(state.ajustes.close_time.split(':')[0], 10);
            if (!isNaN(openH)) startHourList = openH;
            if (!isNaN(closeH)) endHourList = closeH > 0 ? closeH - 1 : 23; 
        }

        for (let h = startHourList; h <= endHourList; h++) {
            for (let m = 0; m < 60; m += 30) {
                const hourStr = \`\${h.toString().padStart(2, '0')}:\${m.toString().padStart(2, '0')}\`;
                headerHTML += \`<th class="p-3 text-xs font-bold text-slate-500 text-center min-w-[70px]">\${hourStr}</th>\`;
            }
        }`;
        
content = content.replace(regexHeader, newHeader);


// Now for renderCourtsList row generation
const regexListRows = /for\s*\(let h = 8; h <= 22; h\+\+\) \{[\s\S]*?tr\.appendChild\(td\);\s*\}/;

const newLoopList = `for (let h = startHourList; h <= endHourList; h++) {
                for (let m = 0; m < 60; m += 30) {
                    const hourStr = \`\${h.toString().padStart(2, '0')}:\${m.toString().padStart(2, '0')}\`;
                    const pStart = h * 60 + m;
                    const pEnd = pStart + duration;
                    const closeMinutes = (endHourList + 1) * 60;
                    
                    const td = document.createElement('td');
                    td.className = 'p-1.5 align-middle';

                    if (pEnd > closeMinutes) {
                        td.innerHTML = \`<div class="h-11 rounded-lg bg-slate-50 dark:bg-slate-800/30 border border-slate-200/50 dark:border-slate-800 flex items-center justify-center opacity-20 cursor-not-allowed"></div>\`;
                        tr.appendChild(td);
                        continue;
                    }
                    
                    let isReserved = checkOverlap(hourStr, duration, canchaReservas);
                    const isPast = isToday && (pStart <= (currentHour * 60 + now.getMinutes()));
                    const price = (cancha.precioPorHora * (duration / 60));

                    if (isPast) {
                        td.innerHTML = \`<div class="h-11 rounded-lg bg-slate-50 dark:bg-slate-800/30 border border-slate-200/50 dark:border-slate-800 flex items-center justify-center opacity-40 cursor-not-allowed"><span class="text-[10px] text-slate-400 font-semibold line-through">\${hourStr}</span></div>\`;
                    } else if (isReserved) {
                        td.innerHTML = \`<div class="h-11 rounded-lg bg-rose-50/50 dark:bg-rose-900/10 border border-rose-200/50 dark:border-rose-800/30 flex flex-col items-center justify-center cursor-not-allowed"><span class="text-[9px] text-rose-400 font-semibold uppercase tracking-wider">Ocupado</span></div>\`;
                    } else {
                        const btn = document.createElement('button');
                        btn.className = 'w-full h-11 rounded-lg bg-emerald-50/80 dark:bg-emerald-900/20 hover:bg-emerald-500 hover:text-white text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/50 flex flex-col items-center justify-center transition-all cursor-pointer shadow-xs hover:shadow-md hover:scale-[1.02] active:scale-95 group/btn';
                        btn.innerHTML = \`<span class="text-[10px] font-bold block group-hover/btn:hidden">Libre</span><span class="text-[11px] font-black hidden group-hover/btn:block">Reservar</span>\`;
                        btn.addEventListener('click', (e) => handleReserva(e.currentTarget, cancha, hourStr, duration, price));
                        td.appendChild(btn);
                    }
                    
                    tr.appendChild(td);
                }
            }`;

content = content.replace(regexListRows, newLoopList);

fs.writeFileSync('public/js/app.js', content, 'utf8');

