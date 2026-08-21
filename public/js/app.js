// public/js/app.js

document.addEventListener('DOMContentLoaded', () => {
    // State
    const state = {
        selectedDate: new Date(),
        canchas: [],
        reservas: [],
        filters: {
            sport: 'ALL',
            duration: '60'
        },
        viewMode: 'grid',
        clientData: null
    };

    // DOM Elements
    const datesContainer = document.getElementById('calendar-dates-container');
    const courtsGrid = document.getElementById('courts-grid');
    const sportFilter = document.getElementById('sport-filter');
    const durationFilter = document.getElementById('duration-filter');
    const btnViewList = document.getElementById('btn-view-list');
    const btnViewGrid = document.getElementById('btn-view-grid');

    // Tab Elements
    const btnTabReservar = document.getElementById('btn-tab-reservar');
    const btnTabBuscar = document.getElementById('btn-tab-buscar');
    const sectionReservar = document.getElementById('section-reservar');
    const sectionBuscar = document.getElementById('section-buscar');

    // Search Elements
    const inputBuscarReserva = document.getElementById('input-buscar-reserva');
    const btnBuscarReserva = document.getElementById('btn-buscar-reserva');
    const resultadosBuscar = document.getElementById('resultados-buscar');

    // Init
    async function init() {
        if (!datesContainer || !courtsGrid) return; // Ensure we are on the index page
        
        // Load client auth state
        const storedClient = localStorage.getItem('clientData');
        if (storedClient) {
            try {
                state.clientData = JSON.parse(storedClient);
                updateHeaderAuth();
            } catch (e) {
                console.error('Error parsing clientData', e);
            }
        }

        // Comprobar Paywall / Suscripción
        const plat = await window.API.getPlataforma();
        if (plat && (plat.estado === 'inactivo' || new Date(plat.fecha_vencimiento) < new Date())) {
            document.body.innerHTML = `
                <div class="h-screen w-full flex flex-col items-center justify-center bg-slate-50 text-slate-900 p-6">
                    <svg class="w-20 h-20 text-rose-500 mb-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg>
                    <h1 class="text-3xl font-black mb-2 tracking-tight text-center">Plataforma Suspendida</h1>
                    <p class="text-slate-500 text-center max-w-md font-medium">El servicio de reservas se encuentra inactivo temporalmente. Por favor, vuelva a intentar más tarde o comuníquese con el complejo deportivo.</p>
                </div>
            `;
            return;
        }

        // Fetch Ajustes para encabezado
        const ajustes = await window.API.getAjustes();
        if (ajustes) {
            if (ajustes.wpp_contacto) {
                const wppLink = document.getElementById('btn-whatsapp-header');
                if (wppLink) {
                    wppLink.href = `https://api.whatsapp.com/send?phone=${ajustes.wpp_contacto}&text=Hola!`;
                }
            }
            if (ajustes.ubicacion_maps) {
                const mapsLink = document.getElementById('btn-ubicacion-header');
                if (mapsLink) {
                    mapsLink.href = ajustes.ubicacion_maps;
                }
            }
            if (ajustes.logo_url) {
                const logoImg = document.getElementById('header-logo');
                if (logoImg) logoImg.src = ajustes.logo_url;
            }
            if (ajustes.hero_image_url) {
                const heroImg = document.getElementById('hero-image');
                if (heroImg) heroImg.src = ajustes.hero_image_url;
            }
            if (ajustes.hero_title) {
                const heroTitle = document.getElementById('header-title');
                if (heroTitle) heroTitle.innerText = ajustes.hero_title;
                document.title = ajustes.hero_title + ' - Reservas';
            }
            if (ajustes.nosotros_title) {
                const infoTitle = document.getElementById('info-title');
                if (infoTitle) infoTitle.innerText = ajustes.nosotros_title;
            }
            if (ajustes.canchas_title) {
                const canchasTitle = document.getElementById('canchas-title');
                if (canchasTitle) canchasTitle.innerText = ajustes.canchas_title;
            }
        }

        renderCalendar();
        setupEventListeners();
        await loadData();
    }

    // Format helpers
    function formatDateToYMD(date) {
        const d = new Date(date);
        const offset = d.getTimezoneOffset() * 60000;
        const localISOTime = (new Date(d - offset)).toISOString().split('T')[0];
        return localISOTime;
    }
    
    function formatTime(hour) {
        return `${hour.toString().padStart(2, '0')}:00`;
    }

    // Render Calendar
    function renderCalendar() {
        datesContainer.innerHTML = '';
        const today = new Date();
        const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

        for (let i = 0; i < 14; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            
            const isSelected = formatDateToYMD(date) === formatDateToYMD(state.selectedDate);
            const isToday = i === 0;
            const isTomorrow = i === 1;

            let dayLabel = diasSemana[date.getDay()];
            if (isToday) dayLabel = 'Hoy';
            if (isTomorrow) dayLabel = 'Mañana';

            const btn = document.createElement('button');
            btn.className = `shrink-0 flex flex-col items-center justify-center min-w-[72px] py-3 px-2 rounded-2xl border transition-all cursor-pointer shadow-sm ${isSelected ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20 scale-105 font-bold z-10' : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-700 hover:border-blue-400 hover:bg-blue-50/50'}`;
            
            btn.innerHTML = `
                <span class="text-[10px] font-extrabold uppercase tracking-wider ${isSelected ? 'text-blue-100' : 'text-slate-400'}">${dayLabel}</span>
                <span class="text-lg font-black my-0.5 leading-tight">${date.getDate()}</span>
                <span class="text-[10px] font-bold ${isSelected ? 'text-blue-200' : 'text-slate-400'}">${meses[date.getMonth()]}</span>
            `;

            btn.addEventListener('click', async () => {
                state.selectedDate = date;
                renderCalendar();
                await loadData();
            });

            datesContainer.appendChild(btn);
        }
    }

    // Load Data
    async function loadData() {
        courtsGrid.innerHTML = '<div class="col-span-full py-12 text-center text-slate-500 flex flex-col items-center justify-center"><svg class="animate-spin h-8 w-8 mb-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg><span class="font-bold">Cargando disponibilidad...</span></div>';
        
        try {
            const dateStr = formatDateToYMD(state.selectedDate);
            const [canchas, reservas] = await Promise.all([
                window.API.getCanchas(),
                window.API.getReservasPorFecha(dateStr)
            ]);
            
            state.canchas = canchas;
            state.reservas = reservas;
            
            renderCourts();
        } catch (error) {
            console.error('Error loading data:', error);
            courtsGrid.innerHTML = '<div class="col-span-full py-8 text-center text-rose-500 font-bold">Error al cargar la información. Intente nuevamente.</div>';
        }
    }

    // Event Listeners
    function setupEventListeners() {
        if(sportFilter) {
            sportFilter.addEventListener('change', (e) => {
                state.filters.sport = e.target.value;
                renderCourts();
            });
        }
        
        if(durationFilter) {
            durationFilter.addEventListener('change', (e) => {
                state.filters.duration = e.target.value;
                renderCourts();
            });
        }

        if(btnViewList) {
            btnViewList.addEventListener('click', () => {
                state.viewMode = 'list';
                updateViewButtons();
                renderCourts();
            });
        }

        if(btnViewGrid) {
            btnViewGrid.addEventListener('click', () => {
                state.viewMode = 'grid';
                updateViewButtons();
                renderCourts();
            });
        }

        if(btnTabReservar && btnTabBuscar) {
            btnTabReservar.addEventListener('click', () => {
                sectionReservar.classList.remove('hidden');
                sectionBuscar.classList.add('hidden');
                
                btnTabReservar.className = 'flex-1 py-2 px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm';
                btnTabBuscar.className = 'flex-1 py-2 px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white';
            });

            btnTabBuscar.addEventListener('click', () => {
                sectionBuscar.classList.remove('hidden');
                sectionReservar.classList.add('hidden');
                
                btnTabBuscar.className = 'flex-1 py-2 px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm';
                btnTabReservar.className = 'flex-1 py-2 px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white';
            
                // Auto-fill and search if logged in
                if (state.clientData && inputBuscarReserva.value === '') {
                    inputBuscarReserva.value = state.clientData.nombre;
                    handleBuscarReserva();
                }
            });
        }

        if(btnBuscarReserva) {
            btnBuscarReserva.addEventListener('click', handleBuscarReserva);
        }
        if(inputBuscarReserva) {
            inputBuscarReserva.addEventListener('keypress', (e) => {
                if(e.key === 'Enter') handleBuscarReserva();
            });
        }
    }

    async function handleBuscarReserva() {
        let searchQuery = inputBuscarReserva.value.trim();
        if(!searchQuery) {
            showAlertModal('Atención', 'Ingresá un nombre o teléfono para buscar.', 'error');
            return;
        }

        let apiParam = searchQuery;
        // Si el usuario está logueado y busca su propio nombre/email, usamos su ID interno para mayor precisión
        if (state.clientData && (searchQuery === state.clientData.nombre || searchQuery === state.clientData.email || searchQuery === state.clientData.telefono)) {
            apiParam = state.clientData.id;
        }

        btnBuscarReserva.disabled = true;
        btnBuscarReserva.innerHTML = '<svg class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>';
        
        try {
            const reservas = await window.API.getReservasByUser(apiParam);
            renderResultadosBuscar(reservas);
        } catch (error) {
            resultadosBuscar.innerHTML = '<div class="p-6 text-center text-rose-500 font-bold bg-rose-50 dark:bg-rose-900/20 rounded-2xl">Error al buscar reservas.</div>';
        } finally {
            btnBuscarReserva.disabled = false;
            btnBuscarReserva.innerText = 'Buscar';
        }
    }

    function renderResultadosBuscar(reservas) {
        if (!reservas || reservas.length === 0) {
            resultadosBuscar.innerHTML = `
                <div class="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center flex flex-col items-center">
                    <div class="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-search-x w-8 h-8"><path d="m13.5 8.5-5 5"/><path d="m8.5 8.5 5 5"/><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                    </div>
                    <h3 class="text-lg font-black text-slate-900 dark:text-white mb-2">No se encontraron reservas</h3>
                    <p class="text-sm text-slate-500 max-w-sm">No encontramos turnos asociados a este nombre/teléfono. Si creés que es un error, contactá al complejo.</p>
                </div>`;
            return;
        }

        resultadosBuscar.innerHTML = '';
        
        // Sort by date/time (newest/future first)
        reservas.sort((a, b) => new Date(`${b.fecha}T${b.hora}`) - new Date(`${a.fecha}T${a.hora}`));

        reservas.forEach(res => {
            const cancha = state.canchas.find(c => c.id === res.canchaId) || { nombre: 'Cancha Desconocida' };
            const statusColors = {
                confirmada: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
                pendiente: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
                cancelada: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400'
            };
            const colorClass = statusColors[res.estado] || 'bg-slate-100 text-slate-700';

            const card = document.createElement('div');
            card.className = 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-sm hover:shadow-md transition-shadow';
            card.innerHTML = `
                <div class="flex items-start justify-between mb-4">
                    <div>
                        <div class="flex items-center gap-2 mb-1">
                            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${colorClass}">${res.estado}</span>
                            <span class="text-xs font-bold text-slate-400">ID: ${res.id}</span>
                        </div>
                        <h4 class="text-lg font-black text-slate-900 dark:text-white">${cancha.nombre}</h4>
                    </div>
                    <div class="text-right">
                        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Total</p>
                        <p class="text-lg font-black text-blue-600 dark:text-blue-400">$${(res.precio || 0).toLocaleString('es-AR')}</p>
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <div class="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-calendar-days text-slate-400 w-4 h-4"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/></svg>
                        <div>
                            <p class="text-[10px] font-bold text-slate-400 leading-none mb-1 mt-0.5">Fecha</p>
                            <p class="text-xs font-bold text-slate-700 dark:text-slate-300">${res.fecha.split('T')[0]}</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-clock text-slate-400 w-4 h-4"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        <div>
                            <p class="text-[10px] font-bold text-slate-400 leading-none mb-1 mt-0.5">Horario</p>
                            <p class="text-xs font-bold text-slate-700 dark:text-slate-300">${res.hora} hs <span class="font-normal text-slate-400">(${res.duracion} min)</span></p>
                        </div>
                    </div>
                </div>
            `;
            resultadosBuscar.appendChild(card);
        });
    }

    function updateViewButtons() {
        if (state.viewMode === 'grid') {
            btnViewGrid.className = 'px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer bg-blue-600 text-white shadow-xs';
            btnViewList.className = 'px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white';
        } else {
            btnViewList.className = 'px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer bg-blue-600 text-white shadow-xs';
            btnViewGrid.className = 'px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white';
        }
    }

    // Render Courts
    function renderCourts() {
        courtsGrid.innerHTML = '';
        
        const filteredCanchas = state.canchas.filter(c => {
            if (state.filters.sport !== 'ALL' && c.deporte !== state.filters.sport) return false;
            return true;
        });

        if (filteredCanchas.length === 0) {
            courtsGrid.innerHTML = '<div class="col-span-full py-12 text-center text-slate-500 font-bold bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">No hay canchas disponibles para los filtros seleccionados.</div>';
            return;
        }

        if (state.viewMode === 'list') {
            renderCourtsList(filteredCanchas);
            return;
        }

        filteredCanchas.forEach(cancha => {
            const card = document.createElement('div');
            card.className = 'bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col transition-all hover:border-blue-500/50';
            
            // Filter reservas for this cancha — exclude cancelled ones
            const canchaReservas = state.reservas.filter(r =>
                r.canchaId === cancha.id &&
                (r.estado || '').toLowerCase() !== 'cancelada'
            );
            
            card.innerHTML = `
                <div class="p-5 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-3">
                    <div>
                        <span class="inline-block px-2.5 py-0.5 rounded-full ${cancha.colorTag || 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'} font-extrabold text-[10px] uppercase tracking-wider mb-1">${cancha.deporte}</span>
                        <h3 class="text-lg font-black text-slate-900 dark:text-white leading-tight">${cancha.nombre}</h3>
                        <p class="text-xs text-slate-500 mt-0.5 line-clamp-1">${cancha.descripcion}</p>
                    </div>
                    <div class="text-right shrink-0">
                        <p class="text-xs text-slate-400 font-medium">Precio base</p>
                        <p class="text-lg font-black text-emerald-600 dark:text-emerald-400">
                            $ ${cancha.precioPorHora.toLocaleString('es-AR')}
                            <span class="text-xs font-normal text-slate-400">/hr</span>
                        </p>
                    </div>
                </div>
                <div class="p-5 space-y-3 flex-1">
                    <div class="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
                        <span>Horarios Disponibles:</span>
                        <span class="text-[11px] text-slate-400 font-normal">Hacé clic para reservar</span>
                    </div>
                    <div class="grid grid-cols-3 sm:grid-cols-4 gap-2" id="grid-hours-${cancha.id}">
                        <!-- Hours injected here -->
                    </div>
                </div>
                <div class="px-5 py-3 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                    <span class="flex items-center gap-1 text-[11px]">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-clock w-3.5 h-3.5 text-slate-400"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                        Horario: 08:00 a 23:00 hs
                    </span>
                    <span class="font-semibold text-blue-600 dark:text-blue-400">Seña: ${cancha.porcentaje_sena !== undefined ? cancha.porcentaje_sena : 50}%</span>
                </div>
            `;
            
            courtsGrid.appendChild(card);
            
            // Generate hours (8 to 22)
            const hoursContainer = card.querySelector(`#grid-hours-${cancha.id}`);
            const duration = parseInt(state.filters.duration);
            
            const now = new Date();
            const isToday = formatDateToYMD(now) === formatDateToYMD(state.selectedDate);
            const currentHour = now.getHours();
            
            for (let h = 8; h <= 22; h++) {
                const hourStr = formatTime(h);
                
                // Check if reserved
                let isReserved = canchaReservas.some(r => r.hora === hourStr);
                
                // If duration is 120, we need 2 consecutive free slots
                if (duration === 120 && h < 22) {
                    const nextHourStr = formatTime(h + 1);
                    if (canchaReservas.some(r => r.hora === nextHourStr)) {
                        isReserved = true; 
                    }
                } else if (duration === 120 && h === 22) {
                    isReserved = true; // Cannot fit 2 hours at the last slot
                }
                
                const isPast = isToday && h <= currentHour;

                const btn = document.createElement('button');
                
                if (isPast) {
                    btn.className = 'py-2 px-1 rounded-xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-800 text-center cursor-not-allowed opacity-50 flex flex-col items-center justify-center';
                    btn.disabled = true;
                    btn.innerHTML = `
                        <span class="text-xs font-bold text-slate-400 line-through">${hourStr}</span>
                        <span class="text-[9px] text-rose-500 font-semibold mt-0.5">Pasado</span>
                    `;
                } else if (isReserved) {
                    btn.className = 'py-2 px-1 rounded-xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-800 text-center cursor-not-allowed opacity-50 flex flex-col items-center justify-center';
                    btn.disabled = true;
                    btn.innerHTML = `
                        <span class="text-xs font-bold text-slate-400 line-through">${hourStr}</span>
                        <span class="text-[9px] text-rose-500 font-semibold mt-0.5">Reservado</span>
                    `;
                } else {
                    const price = (cancha.precioPorHora * (duration / 60));
                    btn.className = 'py-2.5 px-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-600 hover:text-white text-emerald-900 dark:text-emerald-200 border border-emerald-200/80 dark:border-emerald-800/80 text-center transition-all group cursor-pointer shadow-2xs hover:scale-105 active:scale-95 flex flex-col items-center justify-center';
                    btn.innerHTML = `
                        <span class="text-xs font-black group-hover:text-white leading-tight">${hourStr} hs</span>
                        <span class="text-[11px] font-extrabold text-emerald-700 dark:text-emerald-300 group-hover:text-emerald-100 my-0.5">$ ${price.toLocaleString('es-AR')}</span>
                        <span class="text-[9px] font-bold uppercase tracking-tight text-emerald-600 dark:text-emerald-400 group-hover:text-white bg-emerald-100 dark:bg-emerald-900/60 group-hover:bg-emerald-700 px-1.5 py-0.5 rounded-md transition-colors">Reservar</span>
                    `;
                    
                    btn.addEventListener('click', (e) => handleReserva(e.currentTarget, cancha, hourStr, duration, price));
                }
                
                hoursContainer.appendChild(btn);
            }
        });
    }

    function renderCourtsList(filteredCanchas) {
        const tableWrapper = document.createElement('div');
        tableWrapper.className = 'col-span-full overflow-x-auto bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm';
        
        const table = document.createElement('table');
        table.className = 'w-full text-left border-collapse min-w-[900px]';
        
        // Header
        const thead = document.createElement('thead');
        let headerHTML = `<tr class="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800"><th class="p-3 text-xs font-bold text-slate-500 sticky left-0 bg-slate-50 dark:bg-slate-800/90 z-10 w-48 border-r border-slate-200/80 dark:border-slate-700">Cancha</th>`;
        for (let h = 8; h <= 22; h++) {
            headerHTML += `<th class="p-3 text-xs font-bold text-slate-500 text-center min-w-[70px]">${formatTime(h)}</th>`;
        }
        headerHTML += `</tr>`;
        thead.innerHTML = headerHTML;
        table.appendChild(thead);
        
        const tbody = document.createElement('tbody');
        const duration = parseInt(state.filters.duration);
        const now = new Date();
        const isToday = formatDateToYMD(now) === formatDateToYMD(state.selectedDate);
        const currentHour = now.getHours();

        filteredCanchas.forEach(cancha => {
            const canchaReservas = state.reservas.filter(r =>
                r.canchaId === cancha.id &&
                (r.estado || '').toLowerCase() !== 'cancelada'
            );
            const tr = document.createElement('tr');
            tr.className = 'border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50/30 dark:hover:bg-slate-800/20 group';
            
            const tdName = document.createElement('td');
            tdName.className = 'p-3 text-sm font-bold text-slate-900 dark:text-white sticky left-0 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/80 border-r border-slate-100 dark:border-slate-800 z-10 transition-colors shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] dark:shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)]';
            tdName.innerHTML = `<div class="truncate w-44" title="${cancha.nombre}">${cancha.nombre}</div><div class="text-[10px] text-slate-500 font-normal truncate">${cancha.deporte}</div>`;
            tr.appendChild(tdName);
            
            for (let h = 8; h <= 22; h++) {
                const hourStr = formatTime(h);
                let isReserved = canchaReservas.some(r => r.hora === hourStr);
                
                if (duration === 120 && h < 22) {
                    const nextHourStr = formatTime(h + 1);
                    if (canchaReservas.some(r => r.hora === nextHourStr)) {
                        isReserved = true; 
                    }
                } else if (duration === 120 && h === 22) {
                    isReserved = true;
                }
                
                const isPast = isToday && h <= currentHour;
                const price = (cancha.precioPorHora * (duration / 60));

                const td = document.createElement('td');
                td.className = 'p-1.5 align-middle';
                
                if (isPast) {
                    td.innerHTML = `<div class="h-11 rounded-lg bg-slate-50 dark:bg-slate-800/30 border border-slate-200/50 dark:border-slate-800 flex items-center justify-center opacity-40 cursor-not-allowed"><span class="text-[10px] text-slate-400 font-semibold line-through">${hourStr}</span></div>`;
                } else if (isReserved) {
                    td.innerHTML = `<div class="h-11 rounded-lg bg-rose-50/50 dark:bg-rose-900/10 border border-rose-200/50 dark:border-rose-800/30 flex flex-col items-center justify-center cursor-not-allowed"><span class="text-[9px] text-rose-400 font-semibold uppercase tracking-wider">Ocupado</span></div>`;
                } else {
                    const btn = document.createElement('button');
                    btn.className = 'w-full h-11 rounded-lg bg-emerald-50/80 dark:bg-emerald-900/20 hover:bg-emerald-500 hover:text-white text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/50 flex flex-col items-center justify-center transition-all cursor-pointer shadow-xs hover:shadow-md hover:scale-[1.02] active:scale-95';
                    btn.innerHTML = `<span class="text-[10px] font-bold block group-hover/btn:hidden">Libre</span><span class="text-[11px] font-black hidden group-hover/btn:block">Reservar</span>`;
                    // Fix hover scope by adding group/btn to button
                    btn.classList.add('group/btn');
                    btn.addEventListener('click', (e) => handleReserva(e.currentTarget, cancha, hourStr, duration, price));
                    td.appendChild(btn);
                }
                
                tr.appendChild(td);
            }
            
            tbody.appendChild(tr);
        });
        
        table.appendChild(tbody);
        tableWrapper.appendChild(table);
        courtsGrid.appendChild(tableWrapper);
    }

    // Modal Helpers
    function showConfirmModal(text, onConfirm) {
        const modal = document.getElementById('confirm-modal');
        const modalContent = document.getElementById('confirm-modal-content');
        const textEl = document.getElementById('confirm-modal-text');
        const btnCancel = document.getElementById('confirm-btn-cancel');
        const btnAccept = document.getElementById('confirm-btn-accept');

        if (!modal) {
            if(confirm(text)) onConfirm();
            return;
        }

        textEl.innerText = text;
        modal.classList.remove('hidden');
        
        // Trigger animation
        requestAnimationFrame(() => {
            modalContent.classList.remove('scale-95', 'opacity-0');
            modalContent.classList.add('scale-100', 'opacity-100');
        });

        const cleanup = () => {
            modalContent.classList.remove('scale-100', 'opacity-100');
            modalContent.classList.add('scale-95', 'opacity-0');
            setTimeout(() => {
                modal.classList.add('hidden');
            }, 300);
            btnCancel.removeEventListener('click', onCancelClick);
            btnAccept.removeEventListener('click', onAcceptClick);
        };

        const onCancelClick = () => cleanup();

        const onAcceptClick = () => {
            cleanup();
            onConfirm();
        };

        btnCancel.addEventListener('click', onCancelClick);
        btnAccept.addEventListener('click', onAcceptClick);
    }

    function showAlertModal(title, text, type = 'success') {
        const modal = document.getElementById('alert-modal');
        const modalContent = document.getElementById('alert-modal-content');
        const titleEl = document.getElementById('alert-modal-title');
        const textEl = document.getElementById('alert-modal-text');
        const iconContainer = document.getElementById('alert-modal-icon');
        const btnAccept = document.getElementById('alert-btn-accept');

        if (!modal) {
            alert(title + '\n' + text);
            return;
        }

        titleEl.innerText = title;
        textEl.innerText = text;

        if (type === 'success') {
            iconContainer.className = 'w-12 h-12 rounded-full mb-4 mx-auto flex items-center justify-center bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400';
            iconContainer.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check-circle w-6 h-6"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>';
            btnAccept.className = 'w-full py-4 text-sm font-black text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors';
        } else {
            iconContainer.className = 'w-12 h-12 rounded-full mb-4 mx-auto flex items-center justify-center bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400';
            iconContainer.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x-circle w-6 h-6"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>';
            btnAccept.className = 'w-full py-4 text-sm font-black text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors';
        }

        modal.classList.remove('hidden');
        requestAnimationFrame(() => {
            modalContent.classList.remove('scale-95', 'opacity-0');
            modalContent.classList.add('scale-100', 'opacity-100');
        });

        const cleanup = () => {
            modalContent.classList.remove('scale-100', 'opacity-100');
            modalContent.classList.add('scale-95', 'opacity-0');
            setTimeout(() => {
                modal.classList.add('hidden');
            }, 300);
            btnAccept.removeEventListener('click', onAcceptClick);
        };

        const onAcceptClick = () => cleanup();

        btnAccept.addEventListener('click', onAcceptClick);
    }

    // Reservation Handler
    function handleReserva(btn, cancha, hour, duration, price) {
        let nombreCliente = 'Cliente Web';
        let clienteId = null;

        if (state.clientData) {
            nombreCliente = state.clientData.nombre;
            clienteId = state.clientData.id;
        } else {
            const input = prompt('Por favor, ingresá tu nombre completo o teléfono para identificar la reserva:');
            if (!input) return; // User cancelled
            nombreCliente = input;
        }

        const text = `¿Confirmar reserva en ${cancha.nombre} el ${formatDateToYMD(state.selectedDate)} a las ${hour} hs por ${duration} minutos?\n\nA nombre de: ${nombreCliente}\nCosto total: $${price.toLocaleString('es-AR')}`;
        
        showConfirmModal(text, () => {
            // Show loading state
            const originalHtml = btn.innerHTML;
            btn.innerHTML = '<span class="text-xs font-bold">Procesando...</span>';
            btn.disabled = true;

            window.API.crearReserva({
                canchaId: cancha.id,
                fecha: formatDateToYMD(state.selectedDate),
                hora: hour,
                cliente: nombreCliente,
                cliente_id: clienteId,
                duracion: duration,
                precio: price
            }).then(res => {
                showAlertModal('¡Reserva confirmada con éxito!', `Tu código de reserva es: ${res.id.toUpperCase()}\nTe esperamos en el complejo.`, 'success');
                // Refresh data
                loadData();
            }).catch(err => {
                showAlertModal('Error', "Hubo un error al procesar la reserva. Intente nuevamente.", 'error');
                btn.innerHTML = originalHtml;
                btn.disabled = false;
            });
        });
    }

    function updateHeaderAuth() {
        const authSection = document.getElementById('client-auth-section');
        if (!authSection) return;

        if (state.clientData) {
            authSection.innerHTML = `
                <div class="flex items-center gap-3">
                    <div class="text-right hidden sm:block">
                        <p class="text-[10px] font-bold text-slate-400 leading-none">Bienvenido,</p>
                        <p class="text-xs font-black text-white">${state.clientData.nombre}</p>
                    </div>
                    <button onclick="window.API.clientLogout()" class="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition-all">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-log-out"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
                        <span class="hidden sm:inline">Salir</span>
                    </button>
                </div>
            `;
        }
    }

    // Start
    init();
});
