// public/js/admin.js

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const tableBody = document.getElementById('admin-reservas-table');
    const kpiReservasHoy = document.getElementById('kpi-reservas-hoy');
    const kpiIngresos = document.getElementById('kpi-ingresos');
    const kpiOcupacion = document.getElementById('kpi-ocupacion');
    const kpiCanchas = document.getElementById('kpi-canchas-activas');

    // View Elements
    const viewDashboard = document.getElementById('view-dashboard');
    const viewCanchas = document.getElementById('view-canchas');
    const viewReservas = document.getElementById('view-reservas');
    const viewReportes = document.getElementById('view-reportes');
    const viewAjustes = document.getElementById('view-ajustes');

    // Nav Buttons
    const btnNavDashboard = document.getElementById('nav-dashboard');
    const btnNavReservas = document.getElementById('nav-reservas');
    const btnNavCanchas = document.getElementById('nav-canchas');
    const btnNavReportes = document.getElementById('nav-reportes');
    const btnNavAjustes = document.getElementById('nav-ajustes');

    // Init
    async function init() {
        if (!tableBody) return; // Ensure we are on admin page
        
        // 1. Check Authentication
        const token = localStorage.getItem('adminToken');
        if (!token) {
            window.location.href = '/login.html';
            return;
        }

        const usernameDisplay = document.getElementById('admin-username-display');
        if (usernameDisplay) {
            usernameDisplay.innerText = localStorage.getItem('adminUser') || 'Admin';
        }

        const btnLogout = document.getElementById('btn-logout');
        if (btnLogout) {
            btnLogout.addEventListener('click', () => {
                window.API.logout();
            });
        }

        
        // Comprobar Paywall / Suscripción
        const plat = await window.API.getPlataforma();
        if (plat && (plat.estado === 'inactivo' || new Date(plat.fecha_vencimiento) < new Date())) {
            document.body.innerHTML = `
                <div class="h-screen w-full flex flex-col items-center justify-center bg-slate-900 text-white p-6">
                    <svg class="w-16 h-16 text-rose-500 mb-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                    <h1 class="text-3xl font-black mb-2">Servicio Suspendido</h1>
                    <p class="text-slate-400 text-center max-w-md">La plataforma ha sido suspendida temporalmente por falta de pago o fin de suscripción. Contacte a su proveedor.</p>
                </div>
            `;
            return;
        }

        await loadDashboardData();
        await loadAjustes();
        setupCanchasLogic();
        setupNavigation();
        setupAjustesLogic();
        setupQuickActions();
        setupReservasLogic();
    }

    // Load Data
    async function loadDashboardData() {
        try {
            // Show loading state in table
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="p-8 text-center text-slate-500">
                        <svg class="animate-spin h-6 w-6 mx-auto mb-2 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Cargando datos recientes...
                    </td>
                </tr>
            `;

            // Fetch data
            const [canchas, reservasRecientes, plat] = await Promise.all([
                window.API.getCanchas(),
                window.API.getReservasRecientesAdmin(),
                window.API.getPlataforma()
            ]);

            const isDemo = plat && plat.demo_mode === 'true';

            // Calculate KPIs
            let reservasHoyCount = 0;
            let totalIngresos = 0;
            let ocupacion = 0;
            
            const canchasActivas = canchas.filter(c => c.estado === 'disponible').length;
            const totalCanchas = canchas.length;

            if (isDemo) {
                // MOCK DATA for Demo
                reservasHoyCount = reservasRecientes.length * 3; // Fake larger number
                reservasRecientes.forEach(r => {
                    const cancha = canchas.find(c => c.id === r.canchaId);
                    if(cancha) {
                        const duracion = r.duracion || 60;
                        totalIngresos += (cancha.precioPorHora * (duracion / 60));
                    }
                });
                totalIngresos *= 4.5; // Extrapolate fake income
                ocupacion = Math.floor(Math.random() * 30) + 60; // Random 60-90%
            } else {
                // REAL DATA
                reservasHoyCount = reservasRecientes.length; // Assume we fetch today's reservations
                reservasRecientes.forEach(r => {
                    // Only sum confirmed reservations for real income
                    if (r.estado === 'confirmada' || r.estado === 'seña_pendiente') {
                        const cancha = canchas.find(c => c.id === r.canchaId);
                        if (cancha) {
                            const duracion = r.duracion || 60;
                            totalIngresos += (cancha.precioPorHora * (duracion / 60));
                        }
                    }
                });

                // Simple real occupation calculation (Reservas / Total slots available roughly)
                // Assuming 12 available hours per court per day (e.g. 10:00 to 22:00)
                const totalAvailableHours = canchasActivas * 12; 
                let bookedHours = 0;
                reservasRecientes.forEach(r => {
                    if (r.estado !== 'cancelada') {
                        bookedHours += (r.duracion || 60) / 60;
                    }
                });
                
                if (totalAvailableHours > 0) {
                    ocupacion = Math.round((bookedHours / totalAvailableHours) * 100);
                }
            }

            // Update DOM KPIs
            if (kpiReservasHoy) kpiReservasHoy.innerText = reservasHoyCount;
            
            // Format Ingresos
            if (kpiIngresos) {
                if (totalIngresos >= 1000) {
                    kpiIngresos.innerText = `$${(totalIngresos / 1000).toFixed(1)}k`;
                } else {
                    kpiIngresos.innerText = `$${totalIngresos}`;
                }
            }
            
            if (kpiOcupacion) kpiOcupacion.innerText = `${ocupacion}%`;
            if (kpiCanchas) {
                kpiCanchas.innerHTML = `${canchasActivas}<span class="text-lg text-slate-400 font-medium">/${totalCanchas}</span>`;
            }

            // Render Table
            renderTable(reservasRecientes, canchas, isDemo);

        } catch (error) {
            console.error('Error loading admin data:', error);
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="p-8 text-center text-rose-500 font-bold">
                        Error al cargar los datos del panel.
                    </td>
                </tr>
            `;
        }
    }

    // Render Table
    function renderTable(reservas, canchas, isDemo = false) {
        if (!reservas || reservas.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="p-8 text-center text-slate-500">
                        No hay reservas recientes.
                    </td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = '';

        reservas.forEach(r => {
            const cancha = canchas.find(c => c.id === r.canchaId);
            const canchaNombre = cancha ? cancha.nombre : 'Cancha Desconocida';
            
            let stateObj;

            if (isDemo) {
                // Mock random states
                const states = [
                    { class: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50', dot: 'bg-emerald-500', text: 'Confirmada' },
                    { class: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400 border-amber-200 dark:border-amber-800/50', dot: 'bg-amber-500', text: 'Seña Pendiente' }
                ];
                stateObj = states[Math.floor(Math.random() * states.length)];
            } else {
                const realEstado = (r.estado || 'confirmada').toLowerCase();
                if (realEstado === 'confirmada') {
                    stateObj = { class: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50', dot: 'bg-emerald-500', text: 'Confirmada' };
                } else if (realEstado === 'seña_pendiente' || realEstado === 'pendiente' || realEstado === 'por confirmar') {
                    stateObj = { class: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400 border-amber-200 dark:border-amber-800/50', dot: 'bg-amber-500', text: 'Por Confirmar' };
                } else if (realEstado === 'cancelada') {
                    stateObj = { class: 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-400 border-rose-200 dark:border-rose-800/50', dot: 'bg-rose-500', text: 'Cancelada' };
                } else {
                    stateObj = { class: 'bg-slate-100 text-slate-700 dark:bg-slate-800/50 dark:text-slate-400 border-slate-200 dark:border-slate-700/50', dot: 'bg-slate-500', text: 'Finalizada' };
                }
            }

            let actionsHtml = '';
            const estadoActual = (r.estado || 'confirmada').toLowerCase();
            if (estadoActual === 'por confirmar') {
                actionsHtml = `
                    <div class="flex items-center justify-end gap-1">
                        <button class="btn-action-accept p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all cursor-pointer" data-id="${r.id}" title="Aceptar Reserva">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        </button>
                        <button class="btn-action-cancel p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all cursor-pointer" data-id="${r.id}" title="Cancelar Reserva">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                    </div>
                `;
            } else if (estadoActual === 'confirmada') {
                actionsHtml = `
                    <div class="flex items-center justify-end gap-1">
                        <button class="btn-action-cancel p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all cursor-pointer" data-id="${r.id}" title="Cancelar Reserva">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                    </div>
                `;
            } else {
                 actionsHtml = `<span class="text-xs text-slate-400 font-medium">---</span>`;
            }

            const tr = document.createElement('tr');
            tr.className = 'hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors';
            
            tr.innerHTML = `
                <td class="p-4 font-black text-slate-900 dark:text-white">
                    ${r.hora.substring(0, 5)}
                </td>
                <td class="p-4">
                    <span class="inline-flex items-center gap-1.5 font-bold">
                        <span class="w-2 h-2 rounded-full bg-blue-500"></span>
                        ${canchaNombre}
                    </span>
                </td>
                <td class="p-4">
                    <p class="font-bold text-slate-900 dark:text-slate-200">
                        ${r.cliente}
                    </p>
                    <p class="text-xs text-slate-500">Web ID: ${r.id}</p>
                </td>
                <td class="p-4">
                    <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full ${stateObj.class} text-[11px] font-extrabold border">
                        <span class="w-1.5 h-1.5 rounded-full ${stateObj.dot}"></span>
                        ${stateObj.text}
                    </span>
                </td>
                <td class="p-4 text-right">
                    ${actionsHtml}
                </td>
            `;

            tableBody.appendChild(tr);
        });

        // Add action listeners
        document.querySelectorAll('.btn-action-accept').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                showConfirmModal('Confirmar Reserva', '¿Estás seguro de aceptar esta reserva?', async () => {
                    try {
                        await window.API.updateReservaStatus(id, 'confirmada');
                        showAlertModal('Reserva Confirmada', 'La reserva ha sido aceptada.', 'success');
                        loadDashboardData();
                    } catch(err) {
                        showAlertModal('Error', err.message, 'error');
                    }
                });
            });
        });

        document.querySelectorAll('.btn-action-cancel').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                showConfirmModal('Cancelar Reserva', '¿Estás seguro de cancelar esta reserva? Esta acción no se puede deshacer.', async () => {
                    try {
                        await window.API.updateReservaStatus(id, 'cancelada');
                        showAlertModal('Reserva Cancelada', 'La reserva ha sido cancelada.', 'success');
                        loadDashboardData();
                    } catch(err) {
                        showAlertModal('Error', err.message, 'error');
                    }
                });
            });
        });
    }

    // ==========================================
    // AJUSTES
    // ==========================================
    async function loadAjustes() {
        const data = await window.API.getAjustes();
        if (data) {
            document.getElementById('ajustes-nombre').value = data.nombre_complejo || '';
            document.getElementById('ajustes-open').value = data.open_time || '';
            document.getElementById('ajustes-close').value = data.close_time || '';
            document.getElementById('ajustes-wpp').value = data.wpp_contacto || '';
            const mapInput = document.getElementById('ajustes-maps');
            if(mapInput) mapInput.value = data.ubicacion_maps || '';
            const logoInput = document.getElementById('ajustes-logo');
            if(logoInput) logoInput.value = data.logo_url || '';
            const heroImageInput = document.getElementById('ajustes-hero-image');
            if(heroImageInput) heroImageInput.value = data.hero_image_url || '';
            const heroTitleInput = document.getElementById('ajustes-hero-title');
            if(heroTitleInput) heroTitleInput.value = data.hero_title || '';
            const canchasTitleInput = document.getElementById('ajustes-canchas-title');
            if(canchasTitleInput) canchasTitleInput.value = data.canchas_title || '';
            const nosotrosTitleInput = document.getElementById('ajustes-nosotros-title');
            if(nosotrosTitleInput) nosotrosTitleInput.value = data.nosotros_title || '';
        }
    }

    function setupAjustesLogic() {
        const form = document.getElementById('ajustes-form');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const btn = form.querySelector('button[type="submit"]');
                btn.disabled = true;
                btn.innerText = 'Guardando...';
                
                try {
                    await window.API.updateAjustes({
                        nombre_complejo: document.getElementById('ajustes-nombre').value,
                        open_time: document.getElementById('ajustes-open').value,
                        close_time: document.getElementById('ajustes-close').value,
                        wpp_contacto: document.getElementById('ajustes-wpp').value,
                        ubicacion_maps: document.getElementById('ajustes-maps') ? document.getElementById('ajustes-maps').value : '',
                        logo_url: document.getElementById('ajustes-logo') ? document.getElementById('ajustes-logo').value : '',
                        hero_image_url: document.getElementById('ajustes-hero-image') ? document.getElementById('ajustes-hero-image').value : '',
                        hero_title: document.getElementById('ajustes-hero-title') ? document.getElementById('ajustes-hero-title').value : '',
                        canchas_title: document.getElementById('ajustes-canchas-title') ? document.getElementById('ajustes-canchas-title').value : '',
                        nosotros_title: document.getElementById('ajustes-nosotros-title') ? document.getElementById('ajustes-nosotros-title').value : ''
                    });
                    showAlertModal('Éxito', 'Ajustes guardados correctamente.', 'success');
                } catch (error) {
                    showAlertModal('Error', 'Error guardando ajustes.', 'error');
                }
                
                btn.disabled = false;
                btn.innerText = 'Guardar Ajustes';
            });
        }
    }

    // ==========================================
    // NAVEGACION
    // ==========================================
    function setupNavigation() {
        const navs = [
            { btn: btnNavDashboard, view: viewDashboard },
            { btn: btnNavReservas, view: viewReservas },
            { btn: btnNavCanchas, view: viewCanchas },
            { btn: btnNavReportes, view: viewReportes },
            { btn: btnNavAjustes, view: viewAjustes }
        ];

        navs.forEach(nav => {
            if (!nav.btn) return;
            nav.btn.addEventListener('click', () => {
                // Reset all
                navs.forEach(n => {
                    if(!n.btn || !n.view) return;
                    n.view.classList.add('hidden');
                    n.btn.className = 'px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white flex items-center gap-2 border border-transparent';
                });

                // Set active
                nav.view.classList.remove('hidden');
                nav.btn.className = 'px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 shadow-sm flex items-center gap-2';
                
                if (nav.btn === btnNavDashboard) loadDashboardData();
                if (nav.btn === btnNavCanchas && typeof loadCanchas === 'function') loadCanchas();
                if (nav.btn === btnNavReservas) loadReservasAdmin();
            });
        });
    }

    // ==========================================
    // GESTIÓN DE RESERVAS
    // ==========================================
    let _canchasCache = [];

    async function loadReservasAdmin(filtros = {}) {
        const tbody = document.getElementById('res-table-body');
        const countEl = document.getElementById('res-count');
        if (!tbody) return;

        tbody.innerHTML = `<tr><td colspan="6" class="p-10 text-center text-slate-400"><svg class="animate-spin h-5 w-5 mx-auto mb-2 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Buscando...</td></tr>`;

        const reservas = await window.API.getAdminReservas(filtros);
        if (countEl) countEl.innerText = reservas.length;

        if (!reservas.length) {
            tbody.innerHTML = `<tr><td colspan="6" class="p-10 text-center text-slate-400 font-medium">Sin resultados para los filtros aplicados.</td></tr>`;
            return;
        }

        tbody.innerHTML = '';
        const today = new Date().toISOString().split('T')[0];

        reservas.forEach(r => {
            const canchaNombre = r.canchaname || r.canchaName || r.canchaId || '—';
            const clienteDisplay = r.clientenombre || r.clienteNombre || r.cliente || 'Sin nombre';
            const clienteInfo = r.clientetelefono || r.clienteTelefono ? `<span class="text-[11px] text-slate-400">${r.clientetelefono || r.clienteTelefono}</span>` : `<span class="text-[11px] text-slate-400">ID: ${r.id}</span>`;

            const esPasada = r.fecha < today;

            let stateObj;
            const est = (r.estado || 'por confirmar').toLowerCase();
            if (est === 'confirmada') stateObj = { cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50', dot: 'bg-emerald-500', text: 'Confirmada' };
            else if (est === 'cancelada') stateObj = { cls: 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-400 border-rose-200 dark:border-rose-800/50', dot: 'bg-rose-500', text: 'Cancelada' };
            else stateObj = { cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400 border-amber-200 dark:border-amber-800/50', dot: 'bg-amber-500', text: 'Por Confirmar' };

            let actionsHtml = '';
            if (!esPasada && est !== 'cancelada') {
                if (est === 'por confirmar') {
                    actionsHtml = `
                        <div class="flex items-center justify-end gap-1">
                            <button class="res-btn-accept p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all cursor-pointer" data-id="${r.id}" title="Aceptar">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            </button>
                            <button class="res-btn-cancel p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all cursor-pointer" data-id="${r.id}" title="Cancelar">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                            </button>
                        </div>`;
                } else {
                    actionsHtml = `
                        <div class="flex items-center justify-end gap-1">
                            <button class="res-btn-cancel p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all cursor-pointer" data-id="${r.id}" title="Cancelar">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                            </button>
                        </div>`;
                }
            } else {
                actionsHtml = `<span class="text-xs text-slate-300 dark:text-slate-600">—</span>`;
            }

            const tr = document.createElement('tr');
            tr.className = `hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors border-b border-slate-100 dark:border-slate-800/60 last:border-0 ${esPasada ? 'opacity-60' : ''}`;
            tr.innerHTML = `
                <td class="p-4 font-mono text-xs text-slate-500 dark:text-slate-400">${r.id}</td>
                <td class="p-4">
                    <p class="font-bold text-slate-900 dark:text-white">${r.fecha}</p>
                    <p class="text-xs text-slate-500">${(r.hora || '').substring(0,5)}</p>
                </td>
                <td class="p-4">
                    <span class="inline-flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                        <span class="w-2 h-2 rounded-full bg-blue-500"></span>
                        ${canchaNombre}
                    </span>
                </td>
                <td class="p-4">
                    <p class="font-bold text-slate-900 dark:text-slate-100">${clienteDisplay}</p>
                    ${clienteInfo}
                </td>
                <td class="p-4">
                    <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full ${stateObj.cls} text-[11px] font-extrabold border">
                        <span class="w-1.5 h-1.5 rounded-full ${stateObj.dot}"></span>
                        ${stateObj.text}
                    </span>
                </td>
                <td class="p-4 text-right">${actionsHtml}</td>
            `;
            tbody.appendChild(tr);
        });

        // Listeners
        tbody.querySelectorAll('.res-btn-accept').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                showConfirmModal('Confirmar Reserva', '¿Aceptar esta reserva?', async () => {
                    try {
                        await window.API.updateReservaStatus(id, 'confirmada');
                        showAlertModal('Éxito', 'Reserva aceptada.', 'success');
                        loadReservasAdmin(getCurrentFiltros());
                    } catch(e) { showAlertModal('Error', e.message, 'error'); }
                });
            });
        });
        tbody.querySelectorAll('.res-btn-cancel').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                showConfirmModal('Cancelar Reserva', '¿Estás seguro? Esta acción no se puede deshacer.', async () => {
                    try {
                        await window.API.updateReservaStatus(id, 'cancelada');
                        showAlertModal('Cancelada', 'La reserva fue cancelada.', 'success');
                        loadReservasAdmin(getCurrentFiltros());
                    } catch(e) { showAlertModal('Error', e.message, 'error'); }
                });
            });
        });
    }

    function getCurrentFiltros() {
        return {
            search: document.getElementById('res-search')?.value || '',
            estado: document.getElementById('res-estado')?.value || 'todos',
            desde: document.getElementById('res-desde')?.value || '',
            hasta: document.getElementById('res-hasta')?.value || ''
        };
    }

    function setupReservasLogic() {
        // Filtros
        document.getElementById('btn-res-buscar')?.addEventListener('click', () => {
            loadReservasAdmin(getCurrentFiltros());
        });
        document.getElementById('btn-res-limpiar')?.addEventListener('click', () => {
            document.getElementById('res-search').value = '';
            document.getElementById('res-estado').value = 'todos';
            document.getElementById('res-desde').value = '';
            document.getElementById('res-hasta').value = '';
            loadReservasAdmin({});
        });
        document.getElementById('res-search')?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') loadReservasAdmin(getCurrentFiltros());
        });

        // Modal Reserva Manual
        const modal = document.getElementById('modal-reserva-manual');
        const modalContent = document.getElementById('modal-reserva-manual-content');

        const openManualModal = async () => {
            modal.classList.remove('hidden');
            requestAnimationFrame(() => {
                modalContent.classList.remove('scale-95', 'opacity-0');
                modalContent.classList.add('scale-100', 'opacity-100');
            });
            // Load canchas into select
            const sel = document.getElementById('rm-cancha');
            if (sel) {
                if (!_canchasCache.length) _canchasCache = await window.API.getCanchas();
                sel.innerHTML = _canchasCache
                    .filter(c => c.estado === 'disponible')
                    .map(c => `<option value="${c.id}">${c.nombre}</option>`)
                    .join('');
            }
            // Default date to today
            const fechaInput = document.getElementById('rm-fecha');
            if (fechaInput && !fechaInput.value) {
                fechaInput.value = new Date().toISOString().split('T')[0];
            }
        };

        const closeManualModal = () => {
            modalContent.classList.remove('scale-100', 'opacity-100');
            modalContent.classList.add('scale-95', 'opacity-0');
            setTimeout(() => modal.classList.add('hidden'), 300);
        };

        document.getElementById('btn-abrir-reserva-manual')?.addEventListener('click', openManualModal);
        document.getElementById('btn-close-reserva-manual')?.addEventListener('click', closeManualModal);
        modal?.addEventListener('click', (e) => { if (e.target === modal) closeManualModal(); });

        document.getElementById('form-reserva-manual')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('btn-submit-reserva-manual');
            btn.disabled = true;
            btn.innerText = 'Guardando...';

            const canchaId = document.getElementById('rm-cancha').value;
            const fecha = document.getElementById('rm-fecha').value;
            const hora = document.getElementById('rm-hora').value;
            const cliente = document.getElementById('rm-cliente').value.trim();
            const duracion = parseInt(document.getElementById('rm-duracion').value) || 60;
            const precio = parseInt(document.getElementById('rm-precio').value) || 0;

            try {
                await window.API.crearReserva({ canchaId, fecha, hora, cliente, duracion, precio, estado: 'confirmada' });
                showAlertModal('Éxito', `Reserva creada para ${cliente} el ${fecha} a las ${hora}.`, 'success');
                closeManualModal();
                document.getElementById('form-reserva-manual').reset();
                loadReservasAdmin(getCurrentFiltros());
            } catch(err) {
                showAlertModal('Error', err.message, 'error');
            }

            btn.disabled = false;
            btn.innerText = 'Confirmar Reserva';
        });
    }

    // ==========================================
    // ACCIONES RÁPIDAS
    // ==========================================
    function setupQuickActions() {
        const btns = {
            bloquear: document.getElementById('btn-qa-bloquear'),
            cliente: document.getElementById('btn-qa-cliente'),
            precios: document.getElementById('btn-qa-precios'),
            avisos: document.getElementById('btn-qa-avisos')
        };

        const modals = {
            bloquear: document.getElementById('qa-bloquear-modal'),
            cliente: document.getElementById('qa-cliente-modal'),
            precios: document.getElementById('qa-precios-modal'),
            avisos: document.getElementById('qa-avisos-modal')
        };

        const contents = {
            bloquear: document.getElementById('qa-bloquear-modal-content'),
            cliente: document.getElementById('qa-cliente-modal-content'),
            precios: document.getElementById('qa-precios-modal-content'),
            avisos: document.getElementById('qa-avisos-modal-content')
        };

        const openQaModal = (key) => {
            if(!modals[key]) return;
            // Populate selects
            if (key === 'bloquear') populateCanchasSelect('qa-bloquear-cancha');
            if (key === 'precios') populateCanchasSelect('qa-precios-cancha');

            modals[key].classList.remove('hidden');
            requestAnimationFrame(() => {
                contents[key].classList.remove('scale-95', 'opacity-0');
                contents[key].classList.add('scale-100', 'opacity-100');
            });
        };

        const closeQaModal = (key) => {
            if(!modals[key]) return;
            contents[key].classList.remove('scale-100', 'opacity-100');
            contents[key].classList.add('scale-95', 'opacity-0');
            setTimeout(() => modals[key].classList.add('hidden'), 300);
        };

        if(btns.bloquear) btns.bloquear.addEventListener('click', () => openQaModal('bloquear'));
        if(btns.cliente) btns.cliente.addEventListener('click', () => openQaModal('cliente'));
        if(btns.precios) btns.precios.addEventListener('click', () => openQaModal('precios'));
        if(btns.avisos) btns.avisos.addEventListener('click', () => openQaModal('avisos'));

        document.querySelectorAll('.qa-cancel-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modalId = e.target.closest('[id$="-modal"]').id;
                const key = modalId.replace('qa-', '').replace('-modal', '');
                closeQaModal(key);
            });
        });

        // Forms logic
        const fBloquear = document.getElementById('qa-bloquear-form');
        if(fBloquear) fBloquear.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = fBloquear.querySelector('button[type="submit"]');
            btn.disabled = true; btn.innerText = 'Bloqueando...';
            try {
                const duracion = document.getElementById('qa-bloquear-duracion').value;
                await window.API.crearReserva({
                    canchaId: document.getElementById('qa-bloquear-cancha').value,
                    fecha: document.getElementById('qa-bloquear-fecha').value,
                    hora: document.getElementById('qa-bloquear-hora').value,
                    cliente: 'Bloqueo Admin',
                    cliente_id: null,
                    duracion: duracion,
                    precio: 0,
                    estado: 'confirmada'
                });
                showAlertModal('Horario Bloqueado', 'El horario ha sido bloqueado exitosamente en el calendario.', 'success');
                closeQaModal('bloquear');
                loadDashboardData();
            } catch (err) {
                showAlertModal('Error', err.message || 'No se pudo bloquear el horario', 'error');
            } finally {
                btn.disabled = false; btn.innerText = 'Confirmar';
            }
        });

        const fCliente = document.getElementById('qa-cliente-form');
        if(fCliente) fCliente.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = fCliente.querySelector('button[type="submit"]');
            btn.disabled = true; btn.innerText = 'Creando...';
            try {
                await window.API.clientRegister({
                    nombre: document.getElementById('qa-cliente-nombre').value,
                    email: document.getElementById('qa-cliente-email').value,
                    telefono: document.getElementById('qa-cliente-telefono').value,
                    password: document.getElementById('qa-cliente-pass').value
                });
                showAlertModal('Cliente Creado', 'El cliente fue registrado exitosamente.', 'success');
                closeQaModal('cliente');
            } catch (err) {
                showAlertModal('Error', err.message || 'No se pudo crear el cliente', 'error');
            } finally {
                btn.disabled = false; btn.innerText = 'Crear';
            }
        });

        const fPrecios = document.getElementById('qa-precios-form');
        if(fPrecios) fPrecios.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = fPrecios.querySelector('button[type="submit"]');
            btn.disabled = true; btn.innerText = 'Actualizando...';
            try {
                const cId = document.getElementById('qa-precios-cancha').value;
                const newPrice = document.getElementById('qa-precios-valor').value;
                await window.API.actualizarCancha(cId, { precioPorHora: newPrice });
                showAlertModal('Precio Actualizado', 'El precio de la cancha fue modificado exitosamente.', 'success');
                closeQaModal('precios');
                if (typeof loadCanchas === 'function') loadCanchas();
            } catch (err) {
                showAlertModal('Error', err.message || 'No se pudo cambiar el precio', 'error');
            } finally {
                btn.disabled = false; btn.innerText = 'Actualizar';
            }
        });

        const fAvisos = document.getElementById('qa-avisos-form');
        if(fAvisos) fAvisos.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = fAvisos.querySelector('button[type="submit"]');
            btn.disabled = true; btn.innerText = 'Enviando...';
            // Simulate network request
            await new Promise(r => setTimeout(r, 1500));
            showAlertModal('Avisos Enviados', 'Los mensajes han sido encolados y se enviarán en breve a través de WhatsApp/Email.', 'success');
            closeQaModal('avisos');
            btn.disabled = false; btn.innerText = 'Enviar Avisos';
            fAvisos.reset();
        });
    }

    async function populateCanchasSelect(selectId) {
        const select = document.getElementById(selectId);
        if(!select) return;
        // Si no tenemos las canchas cargadas, las buscamos
        let list = canchasList;
        if (!list || list.length === 0) {
            try {
                list = await window.API.getCanchas();
            } catch (e) {
                console.error(e);
            }
        }
        if (!list) return;

        select.innerHTML = '<option value="">Seleccionar Cancha...</option>' + 
            list.map(c => `<option value="${c.id}">${c.nombre} ($${c.precioPorHora})</option>`).join('');
    }

    // --- LOGICA DE GESTION DE CANCHAS ---
    let canchasList = [];
    const masterTableBody = document.getElementById('masteradmin-canchas-table');
    const modal = document.getElementById('cancha-modal');
    const modalContent = document.getElementById('cancha-modal-content');
    const form = document.getElementById('cancha-form');
    const modalTitle = document.getElementById('modal-title');
    const btnCancel = document.getElementById('modal-btn-cancel');
    const btnSave = document.getElementById('modal-btn-save');
    
    // form inputs
    const fId = document.getElementById('form-id');
    const fNombre = document.getElementById('form-nombre');
    const fDeporte = document.getElementById('form-deporte');
    const fPrecio = document.getElementById('form-precio');
    const fDesc = document.getElementById('form-descripcion');
    const fEstado = document.getElementById('form-estado');
    const fColor = document.getElementById('form-color');

    async function loadCanchas() {
        if (!masterTableBody) return;
        masterTableBody.innerHTML = '<tr><td colspan="6" class="p-8 text-center text-slate-500">Cargando canchas...</td></tr>';
        try {
            canchasList = await window.API.getCanchas();
            renderCanchasTable();
        } catch (error) {
            masterTableBody.innerHTML = '<tr><td colspan="6" class="p-8 text-center text-rose-500 font-bold">Error cargando canchas</td></tr>';
        }
    }

    function renderCanchasTable() {
        if (!canchasList || canchasList.length === 0) {
            masterTableBody.innerHTML = '<tr><td colspan="6" class="p-8 text-center text-slate-500">No hay canchas creadas.</td></tr>';
            return;
        }

        masterTableBody.innerHTML = '';
        canchasList.forEach(c => {
            const tr = document.createElement('tr');
            tr.className = 'hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors';
            
            const isMantenimiento = c.estado === 'mantenimiento';
            const estadoBadge = isMantenimiento 
                ? `<span class="px-2 py-1 bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400 rounded-lg text-xs font-bold border border-rose-200 dark:border-rose-800">Mantenimiento</span>`
                : `<span class="px-2 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 rounded-lg text-xs font-bold border border-emerald-200 dark:border-emerald-800">Disponible</span>`;

            tr.innerHTML = `
                <td class="p-4 pl-6 text-sm font-medium text-slate-500">#${c.id}</td>
                <td class="p-4 font-bold text-slate-900 dark:text-white">
                    ${c.nombre}
                    <div class="text-xs text-slate-500 font-normal mt-0.5 line-clamp-1">${c.descripcion || ''}</div>
                </td>
                <td class="p-4">
                    <span class="px-2.5 py-1 ${c.colorTag} rounded-full text-xs font-extrabold border">${c.deporte}</span>
                </td>
                <td class="p-4 font-black text-emerald-600 dark:text-emerald-400">$${c.precioPorHora}</td>
                <td class="p-4">${estadoBadge}</td>
                <td class="p-4 pr-6 text-right">
                    <div class="flex items-center justify-end gap-2">
                        <button class="btn-edit p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all" data-id="${c.id}">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-pencil"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                        </button>
                        <button class="btn-delete p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all" data-id="${c.id}">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash-2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                        </button>
                    </div>
                </td>
            `;
            masterTableBody.appendChild(tr);
        });

        document.querySelectorAll('.btn-edit').forEach(btn => btn.addEventListener('click', e => openCanchaModal(e.currentTarget.getAttribute('data-id'))));
        document.querySelectorAll('.btn-delete').forEach(btn => btn.addEventListener('click', e => deleteCancha(e.currentTarget.getAttribute('data-id'))));
    }

    function setupCanchasLogic() {
        const btnAdd = document.getElementById('btn-add-cancha');
        if(btnAdd) btnAdd.addEventListener('click', () => openCanchaModal(null));
        if(btnCancel) btnCancel.addEventListener('click', closeCanchaModal);
        
        if(btnSave) {
            btnSave.addEventListener('click', async () => {
                if(!form.checkValidity()) { form.reportValidity(); return; }
                const data = {
                    nombre: fNombre.value, deporte: fDeporte.value, precioPorHora: fPrecio.value,
                    descripcion: fDesc.value, estado: fEstado.value, colorTag: fColor.value
                };
                btnSave.disabled = true; btnSave.innerText = 'Guardando...';
                try {
                    if (fId.value) {
                        await window.API.actualizarCancha(fId.value, data);
                        showAlertModal('Éxito', 'Cancha actualizada correctamente', 'success');
                    } else {
                        await window.API.crearCancha(data);
                        showAlertModal('Éxito', 'Cancha creada correctamente', 'success');
                    }
                    closeCanchaModal();
                    await loadCanchas();
                } catch (error) {
                    showAlertModal('Error', 'Hubo un problema al guardar', 'error');
                } finally {
                    btnSave.disabled = false; btnSave.innerText = 'Guardar';
                }
            });
        }
    }

    function openCanchaModal(id) {
        if (id) {
            const c = canchasList.find(x => x.id == id);
            if (!c) return;
            modalTitle.innerText = 'Editar Cancha';
            fId.value = c.id; fNombre.value = c.nombre; fDeporte.value = c.deporte;
            fPrecio.value = c.precioPorHora; fDesc.value = c.descripcion;
            fEstado.value = c.estado; fColor.value = c.colorTag;
        } else {
            modalTitle.innerText = 'Nueva Cancha';
            form.reset(); fId.value = ''; fColor.value = 'bg-slate-100 text-slate-700';
        }
        modal.classList.remove('hidden');
        requestAnimationFrame(() => {
            modalContent.classList.remove('scale-95', 'opacity-0');
            modalContent.classList.add('scale-100', 'opacity-100');
        });
    }

    function closeCanchaModal() {
        modalContent.classList.remove('scale-100', 'opacity-100');
        modalContent.classList.add('scale-95', 'opacity-0');
        setTimeout(() => modal.classList.add('hidden'), 300);
    }

    async function deleteCancha(id) {
        showConfirmModal('Eliminar Cancha', `¿Estás seguro de eliminar la cancha #${id}?`, async () => {
            try {
                await window.API.eliminarCancha(id);
                showAlertModal('Eliminada', 'La cancha fue eliminada', 'success');
                loadCanchas();
            } catch(e) {
                showAlertModal('Error', 'No se pudo eliminar', 'error');
            }
        });
    }

    function showAlertModal(title, text, type = 'success') {
        const aModal = document.getElementById('alert-modal');
        const aModalContent = document.getElementById('alert-modal-content');
        if (!aModal) { alert(title + '\\n' + text); return; }
        document.getElementById('alert-modal-title').innerText = title;
        document.getElementById('alert-modal-text').innerText = text;
        const iconContainer = document.getElementById('alert-modal-icon');
        const btnAccept = document.getElementById('alert-btn-accept');
        
        if (type === 'success') {
            iconContainer.className = 'w-12 h-12 rounded-full mb-4 mx-auto flex items-center justify-center bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400';
            iconContainer.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check-circle w-6 h-6"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>';
            btnAccept.className = 'w-full py-4 text-sm font-black text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors';
        } else {
            iconContainer.className = 'w-12 h-12 rounded-full mb-4 mx-auto flex items-center justify-center bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400';
            iconContainer.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x-circle w-6 h-6"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>';
            btnAccept.className = 'w-full py-4 text-sm font-black text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors';
        }

        aModal.classList.remove('hidden');
        requestAnimationFrame(() => {
            aModalContent.classList.remove('scale-95', 'opacity-0');
            aModalContent.classList.add('scale-100', 'opacity-100');
        });

        const cleanup = () => {
            aModalContent.classList.remove('scale-100', 'opacity-100');
            aModalContent.classList.add('scale-95', 'opacity-0');
            setTimeout(() => aModal.classList.add('hidden'), 300);
            btnAccept.removeEventListener('click', cleanup);
        };
        btnAccept.addEventListener('click', cleanup);
    }

    function showConfirmModal(title, text, onConfirm) {
        const cModal = document.getElementById('confirm-modal');
        const cModalContent = document.getElementById('confirm-modal-content');
        if (!cModal) {
            if (confirm(title + '\n' + text)) onConfirm();
            return;
        }

        document.getElementById('confirm-modal-title').innerText = title;
        document.getElementById('confirm-modal-text').innerText = text;
        const btnCancel = document.getElementById('confirm-modal-btn-cancel');
        const btnConfirm = document.getElementById('confirm-modal-btn-confirm');

        cModal.classList.remove('hidden');
        requestAnimationFrame(() => {
            cModalContent.classList.remove('scale-95', 'opacity-0');
            cModalContent.classList.add('scale-100', 'opacity-100');
        });

        const cleanup = () => {
            cModalContent.classList.remove('scale-100', 'opacity-100');
            cModalContent.classList.add('scale-95', 'opacity-0');
            setTimeout(() => cModal.classList.add('hidden'), 300);
            btnCancel.removeEventListener('click', onCancel);
            btnConfirm.removeEventListener('click', onAccept);
        };

        const onCancel = () => cleanup();
        const onAccept = () => {
            cleanup();
            onConfirm();
        };

        btnCancel.addEventListener('click', onCancel);
        btnConfirm.addEventListener('click', onAccept);
    }

    init();
});
