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
        clientData: null,
        ajustes: null
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
            state.ajustes = ajustes;
            if (ajustes.wpp_contacto) {
                const wppMsg = ajustes.wpp_mensaje
                    ? encodeURIComponent(ajustes.wpp_mensaje)
                    : 'Hola!';
                const wppUrl = `https://api.whatsapp.com/send?phone=${ajustes.wpp_contacto}&text=${wppMsg}`;

                const wppLink = document.getElementById('btn-whatsapp-header');
                if (wppLink) wppLink.href = wppUrl;

                const wppFloat = document.getElementById('btn-whatsapp-flotante');
                if (wppFloat) wppFloat.href = wppUrl;
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
                
                // Update favicon
                let favicon = document.querySelector('link[rel="icon"]');
                if (!favicon) {
                    favicon = document.createElement('link');
                    favicon.rel = 'icon';
                    document.head.appendChild(favicon);
                }
                favicon.href = ajustes.logo_url;
            }
            if (ajustes.hero_image_url) {
                const heroImg = document.getElementById('hero-image');
                if (heroImg) heroImg.src = ajustes.hero_image_url;
            }
            if (ajustes.hero_image_url_2) {
                const heroImg2 = document.getElementById('hero-image-2');
                if (heroImg2) heroImg2.src = ajustes.hero_image_url_2;
            }
            if (ajustes.hero_image_url_3) {
                const heroImg3 = document.getElementById('hero-image-3');
                if (heroImg3) heroImg3.src = ajustes.hero_image_url_3;
            }
            if (ajustes.nombre_complejo) {
                const headerTitle = document.getElementById('header-title');
                if (headerTitle) headerTitle.innerText = ajustes.nombre_complejo;
                document.title = ajustes.nombre_complejo + ' - Reservas';
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
        setupCarousel();
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
                <div class="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                    ${res.estado !== 'cancelada' ? `
                    <button class="btn-cancelar-reserva px-4 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/30 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-bold transition-colors flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                        Cancelar
                    </button>
                    ` : ''}
                    <button onclick="window.openClientMessageModal('${res.id}')" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-message-circle"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>
                        Reprogramar / Consulta
                    </button>
                </div>
            `;
            
            const btnCancelar = card.querySelector('.btn-cancelar-reserva');
            if (btnCancelar) {
                btnCancelar.addEventListener('click', async () => {
                    const devolver = state.ajustes?.devolver_sena === 'si';
                    const warningHtml = devolver 
                        ? `<br><br><span class="text-emerald-600 font-bold block bg-emerald-50 dark:bg-emerald-900/30 p-3 rounded-lg border border-emerald-200 dark:border-emerald-800">El dinero abonado por la seña se te devolverá en breve.</span>` 
                        : `<br><br><span class="text-rose-600 font-bold block bg-rose-50 dark:bg-rose-900/30 p-3 rounded-lg border border-rose-200 dark:border-rose-800">Atención: El dinero abonado en concepto de seña no es reembolsable.</span>`;
                        
                    showConfirmModal(`¿Estás seguro de cancelar la reserva en ${cancha.nombre} el ${res.fecha.split('T')[0]} a las ${res.hora} hs?` + warningHtml, async () => {
                        btnCancelar.disabled = true;
                        btnCancelar.textContent = 'Cancelando...';
                        try {
                            await window.API.cancelarReservaCliente(res.id);
                            // Refresh search results
                            document.getElementById('buscar-form').dispatchEvent(new Event('submit'));
                        } catch (err) {
                            showAlertModal('Error', err.message || 'No se pudo cancelar la reserva', 'error');
                            btnCancelar.disabled = false;
                            btnCancelar.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg> Cancelar`;
                        }
                    });
                });
            }
            
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
            const matchSport = state.filters.sport === 'ALL' || c.deporte.toUpperCase() === state.filters.sport.toUpperCase();
            return matchSport;
        });

        const countServicios = document.getElementById('count-servicios');
        if (countServicios) countServicios.innerText = filteredCanchas.length;

        if (filteredCanchas.length === 0) {
            courtsGrid.innerHTML = '<div class="col-span-full py-12 text-center text-slate-500 font-bold bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">No hay servicios disponibles para los filtros seleccionados.</div>';
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
                        Horario: ${state.ajustes?.open_time || '08:00'} a ${state.ajustes?.close_time || '23:00'} hs
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
            
            // Generate hours dynamically
            let startHour = 8;
            let endHour = 22; // 22 is the last block if it closes at 23
            
            if (state.ajustes && state.ajustes.open_time && state.ajustes.close_time) {
                const openH = parseInt(state.ajustes.open_time.split(':')[0], 10);
                const closeH = parseInt(state.ajustes.close_time.split(':')[0], 10);
                if (!isNaN(openH)) startHour = openH;
                if (!isNaN(closeH)) endHour = closeH > 0 ? closeH - 1 : 23; 
            }
            
            for (let h = startHour; h <= endHour; h++) {
                const hourStr = formatTime(h);
                
                // Check if reserved
                let isReserved = canchaReservas.some(r => r.hora === hourStr);
                
                // If duration is 120, we need 2 consecutive free slots
                if (duration === 120 && h < endHour) {
                    const nextHourStr = formatTime(h + 1);
                    if (canchaReservas.some(r => r.hora === nextHourStr)) {
                        isReserved = true; 
                    }
                } else if (duration === 120 && h === endHour) {
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
        courtsGrid.innerHTML = `
        <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
                <thead>
                    <tr class="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800"><th class="p-3 text-xs font-bold text-slate-500 sticky left-0 bg-slate-50 dark:bg-slate-800/90 z-10 w-48 border-r border-slate-200/80 dark:border-slate-700">Servicio</th>`;
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

        textEl.innerHTML = text;
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

    window.openClientMessageModal = (reservaId) => {
        const modal = document.getElementById('client-message-modal');
        const modalContent = document.getElementById('client-message-modal-content');
        document.getElementById('client-message-reserva-id').value = reservaId;
        
        modal.classList.remove('hidden');
        requestAnimationFrame(() => {
            modalContent.classList.remove('scale-95', 'opacity-0');
            modalContent.classList.add('scale-100', 'opacity-100');
        });
    };

    window.closeClientMessageModal = () => {
        const modal = document.getElementById('client-message-modal');
        const modalContent = document.getElementById('client-message-modal-content');
        
        modalContent.classList.remove('scale-100', 'opacity-100');
        modalContent.classList.add('scale-95', 'opacity-0');
        setTimeout(() => {
            modal.classList.add('hidden');
            document.getElementById('client-message-form').reset();
        }, 300);
    };

    const formClientMessage = document.getElementById('client-message-form');
    if (formClientMessage) {
        formClientMessage.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.querySelector('button[form="client-message-form"]');
            if (btn) {
                btn.disabled = true;
                btn.innerHTML = 'Enviando...';
            }
            
            try {
                const reservaId = document.getElementById('client-message-reserva-id').value;
                const asunto = document.getElementById('client-message-asunto').value;
                const texto = document.getElementById('client-message-texto').value;
                
                let clienteId = state.clientData ? state.clientData.id : null;
                
                await window.API.createMensaje({
                    cliente_id: clienteId,
                    reserva_id: reservaId,
                    asunto: asunto,
                    mensaje: texto
                });
                
                window.closeClientMessageModal();
                showAlertModal('Mensaje Enviado', 'El complejo recibirá tu mensaje a la brevedad.', 'success');
            } catch (err) {
                showAlertModal('Error', 'No se pudo enviar el mensaje', 'error');
            } finally {
                if (btn) {
                    btn.disabled = false;
                    btn.innerHTML = `Enviar Mensaje <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>`;
                }
            }
        });
    }

    // ==========================================
    // MODAL: PAGO MERCADOPAGO (cliente)
    // ==========================================
    function openMPModal({ cancha, hour, duration, price, nombreCliente, clienteId }) {
        const mpAlias = state.ajustes?.mercadopago_alias || '';
        const porcentajeSena = cancha.porcentaje_sena !== undefined ? parseFloat(cancha.porcentaje_sena) : 50;
        const montoSena = Math.round(price * (porcentajeSena / 100));

        const modal = document.getElementById('modal-mp-pago');
        if (!modal) {
            // Fallback if modal doesn't exist
            window.API.crearReserva({
                canchaId: cancha.id,
                fecha: formatDateToYMD(state.selectedDate),
                hora: hour,
                cliente: nombreCliente,
                cliente_id: clienteId,
                duracion: duration,
                precio: price
            }).then(res => {
                showAlertModal('¡Reserva creada!', `Código: ${res.id.toUpperCase()}`, 'success');
                loadData();
            }).catch(() => showAlertModal('Error', 'No se pudo crear la reserva.', 'error'));
            return;
        }

        // Fill data
        const aliasEl = document.getElementById('mp-alias-display');
        const montoEl = document.getElementById('mp-monto-display');
        const montoTotalEl = document.getElementById('mp-monto-total');
        const canchaInfoEl = document.getElementById('mp-cancha-info');
        const fileInput = document.getElementById('mp-comprobante-file');
        const fileNameEl = document.getElementById('mp-comprobante-name');
        const btnConfirmar = document.getElementById('btn-mp-confirmar');
        const btnCopyAlias = document.getElementById('btn-copy-alias');
        const uploadArea = document.getElementById('mp-upload-area');

        if (aliasEl) aliasEl.innerText = mpAlias || '(no configurado)';
        if (montoEl) montoEl.innerText = '$' + montoSena.toLocaleString('es-AR');
        if (montoTotalEl) montoTotalEl.innerText = '$' + price.toLocaleString('es-AR');
        if (canchaInfoEl) canchaInfoEl.innerText = `${cancha.nombre} — ${formatDateToYMD(state.selectedDate)} a las ${hour} hs`;
        if (fileInput) fileInput.value = '';
        if (fileNameEl) fileNameEl.innerText = 'Ningún archivo seleccionado';
        if (btnConfirmar) btnConfirmar.disabled = true;

        // Show/hide alias section
        const mpSection = document.getElementById('mp-alias-section');
        if (mpSection) mpSection.classList.toggle('hidden', !mpAlias);

        // Open
        const modalContent = document.getElementById('modal-mp-pago-content');
        modal.classList.remove('hidden');
        requestAnimationFrame(() => {
            if (modalContent) {
                modalContent.classList.remove('scale-95', 'opacity-0');
                modalContent.classList.add('scale-100', 'opacity-100');
            }
        });

        const closeModal = () => {
            if (modalContent) {
                modalContent.classList.remove('scale-100', 'opacity-100');
                modalContent.classList.add('scale-95', 'opacity-0');
            }
            setTimeout(() => modal.classList.add('hidden'), 300);
        };

        // Copy alias
        if (btnCopyAlias) {
            btnCopyAlias.onclick = () => {
                if (mpAlias) {
                    navigator.clipboard.writeText(mpAlias).then(() => {
                        btnCopyAlias.innerText = '✅';
                        setTimeout(() => { btnCopyAlias.innerText = '📋'; }, 1500);
                    });
                }
            };
        }

        // File select
        if (fileInput) {
            fileInput.onchange = () => {
                const file = fileInput.files[0];
                if (fileNameEl) fileNameEl.innerText = file ? file.name : 'Ningún archivo seleccionado';
                if (btnConfirmar) btnConfirmar.disabled = !file;
            };
        }
        if (uploadArea) uploadArea.onclick = () => fileInput && fileInput.click();

        // Cancel
        const btnCancelar = document.getElementById('btn-mp-cancelar');
        if (btnCancelar) btnCancelar.onclick = () => closeModal();
        modal.onclick = (e) => { if (e.target === modal) closeModal(); };

        // Confirm
        if (btnConfirmar) {
            btnConfirmar.onclick = async () => {
                const file = fileInput ? fileInput.files[0] : null;
                if (!file) {
                    showAlertModal('Atención', 'Debés subir el comprobante antes de confirmar.', 'error');
                    return;
                }
                btnConfirmar.disabled = true;
                btnConfirmar.innerHTML = '<span class="text-sm">Procesando...</span>';
                try {
                    const reserva = await window.API.crearReserva({
                        canchaId: cancha.id,
                        fecha: formatDateToYMD(state.selectedDate),
                        hora: hour,
                        cliente: nombreCliente,
                        cliente_id: clienteId,
                        duracion: duration,
                        precio: price
                    });
                    await window.API.uploadComprobante(reserva.id, file);
                    closeModal();
                    showAlertModal(
                        '¡Comprobante enviado!',
                        `Reserva #${String(reserva.id).toUpperCase()} recibida. El complejo verificará tu pago y confirmará el turno pronto.`,
                        'success'
                    );
                    loadData();
                } catch (err) {
                    showAlertModal('Error', err.message || 'No se pudo procesar la reserva.', 'error');
                    btnConfirmar.disabled = false;
                    btnConfirmar.innerHTML = 'Confirmar Reserva';
                }
            };
        }
    }

    // Reservation Handler
    function handleReserva(btn, cancha, hour, duration, price) {
        const now = new Date();
        const selDate = new Date(state.selectedDate);
        selDate.setHours(parseInt(hour.split(':')[0]), parseInt(hour.split(':')[1]), 0, 0);

        if (selDate < now) {
            alert('No puedes reservar en un horario pasado.');
            return;
        }

        let nombreCliente = 'Cliente Web';
        let clienteId = null;

        if (state.clientData) {
            nombreCliente = state.clientData.nombre;
            clienteId = state.clientData.id;
        } else {
            window.openRegisterModal();
            showAlertModal('Atención', 'Por favor, creá una cuenta rápida o iniciá sesión para poder reservar.', 'warning');
            return;
        }

        const mpAlias = state.ajustes?.mercadopago_alias || '';

        if (mpAlias) {
            // MercadoPago flow: show payment modal
            openMPModal({ cancha, hour, duration, price, nombreCliente, clienteId });
        } else {
            // Standard flow (no MP alias configured)
            const text = `¿Confirmar reserva en ${cancha.nombre} el ${formatDateToYMD(state.selectedDate)} a las ${hour} hs por ${duration} minutos?\n\nA nombre de: ${nombreCliente}\nCosto total: $${price.toLocaleString('es-AR')}`;
            showConfirmModal(text, () => {
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
                    loadData();
                }).catch(() => {
                    showAlertModal('Error', 'Hubo un error al procesar la reserva. Intente nuevamente.', 'error');
                    btn.innerHTML = originalHtml;
                    btn.disabled = false;
                });
            });
        }
    }


    function updateHeaderAuth() {
        const authSection = document.getElementById('client-auth-section');
        if (!authSection) return;

        if (state.clientData) {
            // Estado: logueado
            authSection.innerHTML = `
                <span class="hidden sm:block text-sm font-bold text-slate-700 dark:text-slate-300 truncate max-w-[120px]">${state.clientData.nombre}</span>
                <button onclick="window.openMisReservas()" class="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-black flex items-center gap-1.5 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/></svg>
                    Mis Reservas
                </button>
                <button onclick="window.API.clientLogout()" class="px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs font-bold hover:bg-rose-50 dark:hover:bg-rose-900/20 flex items-center gap-1.5 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
                    <span class="hidden sm:inline">Salir</span>
                </button>
            `;
        } else {
            // Estado: deslogueado
            authSection.innerHTML = `
                <button onclick="window.openRegisterModal()" class="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Registrarse</button>
                <button onclick="window.openLoginModal()" class="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-md shadow-blue-500/25 transition-colors flex items-center gap-1.5">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m10 17 5-5-5-5"/><path d="M15 12H3"/><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/></svg>
                    Iniciar Sesión
                </button>
            `;
        }
    }

    function setupCarousel() {
        let currentSlide = 0;
        const totalSlides = 3;
        const prevBtn = document.getElementById('carousel-prev');
        const nextBtn = document.getElementById('carousel-next');
        const indicator = document.getElementById('carousel-indicator');
        
        const slides = [
            document.getElementById('carousel-slide-1'),
            document.getElementById('carousel-slide-2'),
            document.getElementById('carousel-slide-3')
        ];
        
        const dots = [
            document.getElementById('carousel-dot-1'),
            document.getElementById('carousel-dot-2'),
            document.getElementById('carousel-dot-3')
        ];

        function updateSlide(index) {
            slides.forEach((slide, i) => {
                if (!slide) return;
                if (i === index) {
                    slide.classList.remove('opacity-0', 'z-0', 'pointer-events-none');
                    slide.classList.add('opacity-100', 'z-10');
                } else {
                    slide.classList.remove('opacity-100', 'z-10');
                    slide.classList.add('opacity-0', 'z-0', 'pointer-events-none');
                }
            });

            dots.forEach((dot, i) => {
                if (!dot) return;
                if (i === index) {
                    dot.className = 'transition-all rounded-full cursor-pointer w-6 h-2 bg-blue-500 shadow-sm';
                } else {
                    dot.className = 'transition-all rounded-full cursor-pointer w-2 h-2 bg-white/50 hover:bg-white/80';
                }
            });

            if (indicator) {
                indicator.innerText = `Instalaciones del Complejo (${index + 1}/${totalSlides})`;
            }
            
            currentSlide = index;
        }

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                let newIndex = currentSlide - 1;
                if (newIndex < 0) newIndex = totalSlides - 1;
                updateSlide(newIndex);
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                let newIndex = currentSlide + 1;
                if (newIndex >= totalSlides) newIndex = 0;
                updateSlide(newIndex);
            });
        }

        dots.forEach((dot, i) => {
            if (dot) {
                dot.addEventListener('click', () => {
                    updateSlide(i);
                });
            }
        });

        // Initialize first slide
        updateSlide(0);
        
        // Auto-advance every 5 seconds
        setInterval(() => {
            let newIndex = currentSlide + 1;
            if (newIndex >= totalSlides) newIndex = 0;
            updateSlide(newIndex);
        }, 5000);
    }

    // ===== AUTH MODALS =====
    function _openModal(id, contentId, isBottomSheet = false) {
        const modal = document.getElementById(id);
        const content = document.getElementById(contentId);
        if (!modal || !content) return;
        modal.classList.remove('hidden');
        requestAnimationFrame(() => {
            if (isBottomSheet) {
                content.classList.remove('translate-y-full');
                content.classList.remove('sm:scale-95', 'sm:opacity-0');
                content.classList.add('sm:scale-100', 'sm:opacity-100');
            } else {
                content.classList.remove('scale-95', 'opacity-0');
                content.classList.add('scale-100', 'opacity-100');
            }
        });
    }

    function _closeModal(id, contentId, isBottomSheet = false, cb = null) {
        const modal = document.getElementById(id);
        const content = document.getElementById(contentId);
        if (!modal || !content) return;
        if (isBottomSheet) {
            content.classList.add('translate-y-full');
            content.classList.add('sm:scale-95', 'sm:opacity-0');
            content.classList.remove('sm:scale-100', 'sm:opacity-100');
        } else {
            content.classList.remove('scale-100', 'opacity-100');
            content.classList.add('scale-95', 'opacity-0');
        }
        setTimeout(() => {
            modal.classList.add('hidden');
            if (cb) cb();
        }, 300);
    }

    window.openLoginModal = () => _openModal('modal-login', 'modal-login-content');
    window.closeLoginModal = () => _closeModal('modal-login', 'modal-login-content', false, () => {
        document.getElementById('form-login').reset();
        document.getElementById('login-error').classList.add('hidden');
    });

    window.openRegisterModal = () => _openModal('modal-register', 'modal-register-content');
    window.closeRegisterModal = () => _closeModal('modal-register', 'modal-register-content', false, () => {
        document.getElementById('form-register').reset();
        document.getElementById('register-error').classList.add('hidden');
    });

    window.openMisReservas = () => {
        _openModal('modal-mis-reservas', 'modal-mis-reservas-content', true);
        loadMisReservas();
    };
    window.closeMisReservas = () => _closeModal('modal-mis-reservas', 'modal-mis-reservas-content', true);

    window.openTerminosModal = () => {
        _openModal('modal-terminos', 'modal-terminos-content', false);
    };
    window.closeTerminosModal = () => {
        _closeModal('modal-terminos', 'modal-terminos-content', false);
    };

    // Login form submit
    const formLogin = document.getElementById('form-login');
    if (formLogin) {
        formLogin.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('btn-login-submit');
            const errEl = document.getElementById('login-error');
            btn.disabled = true;
            btn.textContent = 'Ingresando...';
            errEl.classList.add('hidden');

            try {
                const email = document.getElementById('login-email').value.trim();
                const password = document.getElementById('login-password').value;
                const data = await window.API.clientLogin(email, password);
                state.clientData = data.user;
                window.closeLoginModal();
                updateHeaderAuth();
                showAlertModal('¡Bienvenido!', `Hola ${data.user.nombre}, ya podés ver tus reservas.`, 'success');
            } catch (err) {
                errEl.textContent = err.message || 'Error al iniciar sesión';
                errEl.classList.remove('hidden');
            } finally {
                btn.disabled = false;
                btn.textContent = 'Ingresar';
            }
        });
    }

    // Register form submit
    const formRegister = document.getElementById('form-register');
    if (formRegister) {
        formRegister.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('btn-register-submit');
            const errEl = document.getElementById('register-error');
            btn.disabled = true;
            btn.textContent = 'Creando cuenta...';
            errEl.classList.add('hidden');

            try {
                const emailInput = document.getElementById('reg-email').value.trim();
                const passInput = document.getElementById('reg-password').value;
                
                await window.API.clientRegister({
                    nombre: document.getElementById('reg-nombre').value.trim(),
                    email: emailInput,
                    telefono: document.getElementById('reg-telefono').value.trim(),
                    password: passInput,
                    acepta_terminos: document.getElementById('reg-terminos').checked
                });
                
                // Auto-login
                const data = await window.API.clientLogin(emailInput, passInput);
                state.clientData = data.user;
                updateHeaderAuth();
                
                window.closeRegisterModal();
                showAlertModal('¡Cuenta creada!', 'Iniciaste sesión automáticamente. Ya podés confirmar tu reserva.', 'success');
            } catch (err) {
                errEl.textContent = err.message || 'Error al registrarse';
                errEl.classList.remove('hidden');
            } finally {
                btn.disabled = false;
                btn.textContent = 'Crear cuenta';
            }
        });
    }

    // ===== MIS RESERVAS PANEL =====
    async function loadMisReservas() {
        const container = document.getElementById('lista-mis-reservas');
        if (!container) return;

        container.innerHTML = `
            <div class="flex flex-col items-center justify-center py-12 text-slate-400">
                <svg class="animate-spin h-8 w-8 mb-3 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                <p class="text-sm font-bold">Cargando reservas...</p>
            </div>`;

        if (!state.clientData) {
            container.innerHTML = `<p class="text-center text-slate-500 py-8 text-sm">Debes iniciar sesión para ver tus reservas.</p>`;
            return;
        }

        try {
            const reservas = await window.API.getReservasByUser(state.clientData.id);

            if (!reservas || reservas.length === 0) {
                container.innerHTML = `
                    <div class="flex flex-col items-center py-12 text-slate-400">
                        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="mb-3"><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/></svg>
                        <p class="text-sm font-bold">No tenés reservas todavía</p>
                        <p class="text-xs mt-1">Hacé tu primera reserva desde la grilla de horarios</p>
                    </div>`;
                return;
            }

            // Sort: future first
            reservas.sort((a, b) => new Date(`${b.fecha}T${b.hora}`) - new Date(`${a.fecha}T${a.hora}`));

            const statusConfig = {
                confirmada:           { bg: 'bg-emerald-100 dark:bg-emerald-900/40', text: 'text-emerald-700 dark:text-emerald-400', label: 'Confirmada' },
                'por confirmar':      { bg: 'bg-amber-100 dark:bg-amber-900/40',   text: 'text-amber-700 dark:text-amber-400',   label: 'Por confirmar' },
                pendiente:            { bg: 'bg-amber-100 dark:bg-amber-900/40',   text: 'text-amber-700 dark:text-amber-400',   label: 'Pendiente' },
                cancelada:            { bg: 'bg-rose-100 dark:bg-rose-900/40',     text: 'text-rose-700 dark:text-rose-400',     label: 'Cancelada' },
                reprogramada:         { bg: 'bg-purple-100 dark:bg-purple-900/40', text: 'text-purple-700 dark:text-purple-400', label: 'Reprogramada' },
                reprogramar_solicitado: { bg: 'bg-indigo-100 dark:bg-indigo-900/40', text: 'text-indigo-700 dark:text-indigo-400', label: 'Reprog. solicitada' }
            };

            container.innerHTML = '';

            reservas.forEach(res => {
                const cancha = state.canchas.find(c => c.id === res.canchaId) || { nombre: `Cancha #${res.canchaId}` };
                const sc = statusConfig[res.estado] || { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-400', label: res.estado };
                const fechaStr = res.fecha ? String(res.fecha).split('T')[0] : '-';
                const isFuture = new Date(`${fechaStr}T${res.hora}`) > new Date();
                const isCancelada = res.estado === 'cancelada';

                const card = document.createElement('div');
                card.className = 'bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-2xl p-4 shadow-sm';
                card.innerHTML = `
                    <div class="flex items-start justify-between mb-3">
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center gap-2 mb-1">
                                <span class="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${sc.bg} ${sc.text}">${sc.label}</span>
                                <span class="text-[10px] font-bold text-slate-400">#${res.id}</span>
                            </div>
                            <h4 class="text-sm font-black text-slate-900 dark:text-white truncate">${cancha.nombre}</h4>
                        </div>
                        <div class="text-right shrink-0 ml-3">
                            <p class="text-xs font-black text-emerald-600 dark:text-emerald-400">$${(res.precio || 0).toLocaleString('es-AR')}</p>
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-2 p-2.5 bg-slate-50 dark:bg-slate-900/50 rounded-xl text-xs mb-3">
                        <div>
                            <p class="text-[10px] font-bold text-slate-400 mb-0.5">Fecha</p>
                            <p class="font-bold text-slate-700 dark:text-slate-300">${fechaStr}</p>
                        </div>
                        <div>
                            <p class="text-[10px] font-bold text-slate-400 mb-0.5">Horario</p>
                            <p class="font-bold text-slate-700 dark:text-slate-300">${res.hora} hs <span class="font-normal text-slate-400">(${res.duracion || 60}min)</span></p>
                        </div>
                    </div>
                    ${!isCancelada ? `
                    <div class="flex gap-2">
                        ${isFuture ? `
                        <button
                            class="btn-cancelar-reserva flex-1 py-2 rounded-xl border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs font-bold hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors flex items-center justify-center gap-1.5"
                            data-id="${res.id}"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                            Cancelar
                        </button>` : ''}
                        <button
                            class="btn-reprogramar-reserva flex-1 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors flex items-center justify-center gap-1.5"
                            data-id="${res.id}"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>
                            Reprogramar
                        </button>
                    </div>` : `<p class="text-center text-xs text-slate-400 pt-1">Reserva cancelada</p>`}
                `;

                // Cancelar
                const btnCancelar = card.querySelector('.btn-cancelar-reserva');
                if (btnCancelar) {
                    btnCancelar.addEventListener('click', async () => {
                        const devolver = state.ajustes?.devolver_sena === 'si';
                        const warningHtml = devolver 
                            ? `<br><br><span class="text-emerald-600 font-bold block bg-emerald-50 dark:bg-emerald-900/30 p-3 rounded-lg border border-emerald-200 dark:border-emerald-800">El dinero abonado por la seña se te devolverá en breve.</span>` 
                            : `<br><br><span class="text-rose-600 font-bold block bg-rose-50 dark:bg-rose-900/30 p-3 rounded-lg border border-rose-200 dark:border-rose-800">Atención: El dinero abonado en concepto de seña no es reembolsable.</span>`;
                            
                        showConfirmModal(`¿Estás seguro de cancelar la reserva en ${cancha.nombre} el ${fechaStr} a las ${res.hora} hs?` + warningHtml, async () => {
                            btnCancelar.disabled = true;
                            btnCancelar.textContent = 'Cancelando...';
                            try {
                                await window.API.cancelarReservaCliente(res.id);
                                loadMisReservas();
                            } catch (err) {
                                showAlertModal('Error', err.message || 'No se pudo cancelar la reserva', 'error');
                                btnCancelar.disabled = false;
                                btnCancelar.textContent = 'Cancelar';
                            }
                        });
                    });
                }

                // Reprogramar → abre modal de mensaje
                const btnReprogramar = card.querySelector('.btn-reprogramar-reserva');
                if (btnReprogramar) {
                    btnReprogramar.addEventListener('click', () => {
                        window.closeMisReservas();
                        setTimeout(() => {
                            if (window.openClientMessageModal) {
                                window.openClientMessageModal(res.id);
                                // Pre-select asunto
                                const sel = document.getElementById('client-message-asunto');
                                if (sel) sel.value = 'Reprogramar Turno';
                            }
                        }, 350);
                    });
                }

                container.appendChild(card);
            });
        } catch (err) {
            container.innerHTML = `<p class="text-center text-rose-500 font-bold py-8 text-sm">Error al cargar las reservas.</p>`;
        }
    }

    // Start
    init();
});
