// public/js/masteradmin.js — Super Admin Panel

document.addEventListener('DOMContentLoaded', () => {
    // ─── Auth check ──────────────────────────────────────────────────────────
    const token = localStorage.getItem('masterToken');
    if (!token) {
        window.location.href = '/masterlogin.html';
        return;
    }

    // ─── State ───────────────────────────────────────────────────────────────
    let allTenants = [];
    let currentFilter = 'todos';
    let searchQuery = '';
    let pendingApproveTenantId = null;

    // ─── DOM refs ─────────────────────────────────────────────────────────────
    const grid = document.getElementById('tenants-grid');
    const searchInput = document.getElementById('search-input');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const btnRenewAll = document.getElementById('btn-renew-all');
    const btnLogout = document.getElementById('btn-master-logout');
    const badgeTotal = document.getElementById('badge-total');
    const btnCreateTenant = document.getElementById('btn-create-tenant');

    // Views
    const navDashboard = document.getElementById('nav-dashboard');
    const navTenants = document.getElementById('nav-tenants');
    const navRubros = document.getElementById('nav-rubros');
    const navPlanes = document.getElementById('nav-planes');
    const navConfig = document.getElementById('nav-config');
    const navLogs = document.getElementById('nav-logs');
    const navPwa = document.getElementById('nav-pwa');

    const viewDashboard = document.getElementById('view-dashboard');
    
    const viewRubros = document.getElementById('view-rubros');
    const viewPlanes = document.getElementById('view-planes');
    const viewConfig = document.getElementById('view-config');
    const viewLogs = document.getElementById('view-logs');
    const viewPwa = document.getElementById('view-pwa');
    

    // Modal: Approve
    const modalApprove = document.getElementById('modal-approve');
    const modalApproveContent = document.getElementById('modal-approve-content');
    const modalApproveName = document.getElementById('modal-approve-name');
    const approveMeses = document.getElementById('approve-meses');
    const btnApproveCancel = document.getElementById('btn-approve-cancel');
    const btnApproveConfirm = document.getElementById('btn-approve-confirm');

    // Modal: Create Tenant
    const modalCreateTenant = document.getElementById('modal-create-tenant');
    const modalCreateTenantContent = document.getElementById('modal-create-tenant-content');
    const formCreateTenant = document.getElementById('form-create-tenant');
    const btnCtCancel = document.getElementById('btn-ct-cancel');

    // Modal: Edit Tenant
    const modalEditTenant = document.getElementById('modal-edit-tenant');
    const modalEditTenantContent = document.getElementById('modal-edit-tenant-content');
    const formEditTenant = document.getElementById('form-edit-tenant');
    const btnEtCancel = document.getElementById('btn-et-cancel');
    
    // Modal: Rubro
    const modalRubro = document.getElementById('modal-rubro');
    const modalRubroContent = document.getElementById('modal-rubro-content');
    const formRubro = document.getElementById('form-rubro');
    const btnRCancel = document.getElementById('btn-r-cancel');
    const btnCreateRubro = document.getElementById('btn-create-rubro');
    const rubrosList = document.getElementById('rubros-list');

    // Modal: Plan
    const modalPlan = document.getElementById('modal-plan');
    const modalPlanContent = document.getElementById('modal-plan-content');
    const formPlan = document.getElementById('form-plan');
    const btnPCancel = document.getElementById('btn-p-cancel');
    const btnCreatePlan = document.getElementById('btn-create-plan');
    const planesList = document.getElementById('planes-list');

    // ─── API helper ──────────────────────────────────────────────────────────
    const apiHeaders = () => ({
        'Content-Type': 'application/json',
        'Authorization': `SuperAdmin ${token}`
    });

    const apiFetch = async (path, opts = {}) => {
        const res = await fetch(path, { headers: apiHeaders(), ...opts });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Error de servidor');
        return json;
    };

    // ─── Load tenants ─────────────────────────────────────────────────────────
    const loadTenants = async () => {
        try {
            grid.innerHTML = `
                <div class="col-span-full flex flex-col items-center justify-center py-20 text-slate-600">
                    <svg class="animate-spin h-8 w-8 mb-4 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    <p class="font-bold">Cargando tenants...</p>
                </div>
            `;
            const result = await apiFetch('/api/tenants');
            allTenants = result.data || [];
            updateCountBadges();
            renderCards();
        } catch (err) {
            if (err.message && err.message.includes('autorizado')) {
                localStorage.removeItem('masterToken');
                window.location.href = '/masterlogin.html';
            }
            grid.innerHTML = `<div class="col-span-full text-center py-20 text-rose-400 font-bold">${err.message}</div>`;
        }
    };

    const loadRubros = async () => {
        try {
            const result = await apiFetch('/api/rubros');
            renderRubros(result.data || []);
            
            // Populate select in Create/Edit Tenant modal
            const selectCt = document.getElementById('ct-rubro');
            const selectEt = document.getElementById('et-rubro');
            const options = '<option value="">Seleccionar Rubro...</option>' + 
                (result.data || []).map(r => `<option value="${r.id}">${r.nombre}</option>`).join('');
            
            if (selectCt) selectCt.innerHTML = options;
            if (selectEt) selectEt.innerHTML = options;
        } catch (err) {
            rubrosList.innerHTML = `<div class="text-center py-10 text-rose-400 font-bold">${err.message}</div>`;
        }
    };

    // ─── Update count badges ──────────────────────────────────────────────────
    const updateCountBadges = () => {
        const counts = { todos: allTenants.length, activo: 0, por_vencer: 0, vencidos: 0, pendiente: 0 };
        allTenants.forEach(t => {
            if (t.estado === 'activo') counts.activo++;
            if (t.estado === 'pendiente') counts.pendiente++;
            if (t.dias_restantes !== null && t.dias_restantes >= 0 && t.dias_restantes <= 7 && t.estado === 'activo') counts.por_vencer++;
            if ((t.dias_restantes !== null && t.dias_restantes < 0) || t.estado === 'suspendido') counts.vencidos++;
        });
        badgeTotal.textContent = counts.todos;
        Object.entries(counts).forEach(([key, val]) => {
            const el = document.querySelector(`.filter-count-${key}`);
            if (el) el.textContent = val > 0 ? `(${val})` : '';
        });
    };

    // ─── Filter & Search ──────────────────────────────────────────────────────
    const getFilteredTenants = () => {
        let list = [...allTenants];

        // Filter by estado
        if (currentFilter !== 'todos') {
            if (currentFilter === 'activo') list = list.filter(t => t.estado === 'activo');
            else if (currentFilter === 'pendiente') list = list.filter(t => t.estado === 'pendiente');
            else if (currentFilter === 'por_vencer') list = list.filter(t => t.dias_restantes !== null && t.dias_restantes >= 0 && t.dias_restantes <= 7 && t.estado === 'activo');
            else if (currentFilter === 'vencidos') list = list.filter(t => (t.dias_restantes !== null && t.dias_restantes < 0) || t.estado === 'suspendido');
        }

        // Search
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            list = list.filter(t =>
                t.nombre.toLowerCase().includes(q) ||
                t.email.toLowerCase().includes(q) ||
                (t.telefono || '').toLowerCase().includes(q) ||
                t.slug.toLowerCase().includes(q) ||
                (t.ubicacion || '').toLowerCase().includes(q)
            );
        }

        return list;
    };

    // ─── Render Cards ─────────────────────────────────────────────────────────
    const renderCards = () => {
        const list = getFilteredTenants();
        if (list.length === 0) {
            grid.innerHTML = `<div class="col-span-full text-center py-20 text-slate-500 font-bold">No hay tenants para los filtros seleccionados.</div>`;
            return;
        }

        grid.innerHTML = '';
        list.forEach(t => grid.appendChild(buildCard(t)));
    };

    const buildCard = (t) => {
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
                        <a href="https://wa.me/${t.telefono.replace(/\D/g,'')}" target="_blank" class="hover:underline text-slate-700 dark:text-slate-300">${t.telefono}</a>
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
    };

    // ─── Event Delegation for Cards ──────────────────────────────────────────
    grid.addEventListener('click', async (e) => {
        const approveBtn = e.target.closest('.btn-approve');
        const impersonateBtn = e.target.closest('.btn-impersonate');
        const suspendBtn = e.target.closest('.btn-suspend');
        const activateBtn = e.target.closest('.btn-activate');
        const renewOneBtn = e.target.closest('.btn-renew-one');
        const editBtn = e.target.closest('.btn-edit');
        const deleteTenantBtn = e.target.closest('.btn-delete-tenant');

        if (editBtn) {
            const id = editBtn.dataset.id;
            const t = allTenants.find(tenant => tenant.id == id);
            if (t) {
                document.getElementById('et-id').value = t.id;
                document.getElementById('et-nombre').value = t.nombre;
                if(document.getElementById('et-slug')) document.getElementById('et-slug').value = t.slug;
                if(document.getElementById('et-owner')) document.getElementById('et-owner').value = t.nombre;
                document.getElementById('et-telefono').value = t.telefono || '';
                document.getElementById('et-email').value = t.email || '';
                document.getElementById('et-ubicacion').value = t.ubicacion || '';
                if (document.getElementById('et-rubro')) {
                    document.getElementById('et-rubro').value = t.rubro_id || '';
                }
                
                if (document.getElementById('btn-tab-general')) {
                    document.getElementById('btn-tab-general').click();
                }
                openModal(modalEditTenant, modalEditTenantContent);

            }
        }

        if (approveBtn) {
            pendingApproveTenantId = approveBtn.dataset.id;
            modalApproveName.textContent = approveBtn.dataset.name;
            approveMeses.value = 1;
            openModal(modalApprove, modalApproveContent);
        }

        if (impersonateBtn) {
            const id = impersonateBtn.dataset.id;
            try {
                const res = await apiFetch(`/api/tenants/${id}/impersonate`, { method: 'POST' });
                localStorage.setItem('tenantToken', res.token);
                localStorage.setItem('tenantData', JSON.stringify(res.tenant));
                window.open('/admin.html', '_blank');
            } catch (err) { showAlert("Error", err.message, "error"); }
        }

        if (suspendBtn) {
            const id = suspendBtn.dataset.id;
            showConfirm('Suspender Tenant', '¿Estás seguro de suspender este servicio? El dueño no podrá acceder a su panel.', async () => {
                try {
                    await apiFetch(`/api/tenants/${id}/suspend`, { method: 'PUT' });
                    await loadTenants();
                } catch (err) { showAlert('Error', err.message, 'error'); }
            });
        }

        if (activateBtn) {
            const id = activateBtn.dataset.id;
            showConfirm('Reactivar Tenant', '¿Reactivar este servicio?', async () => {
                try {
                    await apiFetch(`/api/tenants/${id}/activate`, { method: 'PUT' });
                    await loadTenants();
                } catch (err) { showAlert('Error', err.message, 'error'); }
            });
        }

        if (renewOneBtn) {
            const id = renewOneBtn.dataset.id;
            showConfirm(`¿Sumar 30 días al panel?`, 'El panel ganará 30 días adicionales de acceso.', async () => {
                try {
                    const res = await fetch(`/api/tenants/${id}/renew`, {
                        method: 'PUT',
                        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                        body: JSON.stringify({ meses: 1 })
                    });
                    if (res.ok) {
                        showAlert('Renovado', '+30 días añadidos correctamente.', 'success');
                        loadTenants();
                    } else {
                        showAlert('Error', 'No se pudo renovar', 'error');
                    }
                } catch (e) {
                    showAlert('Error', 'Error de conexión', 'error');
                }
            });
        }

        if (deleteTenantBtn) {
            const id = deleteTenantBtn.dataset.id;
            const name = deleteTenantBtn.dataset.name;
            showConfirm(
                '⚠️ Eliminar Cliente',
                `¿Eliminar a "${name}" y TODOS sus datos (canchas, reservas, clientes)? Esta acción es permanente e irreversible.`,
                async () => {
                    try {
                        const res = await fetch(`/api/tenants/${id}`, {
                            method: 'DELETE',
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        if (res.ok) {
                            showAlert('Eliminado', `Cliente "${name}" eliminado correctamente.`, 'success');
                            loadTenants();
                        } else {
                            showAlert('Error', 'Fallo al eliminar cliente', 'error');
                        }
                    } catch (err) { showAlert('Error', 'Error de conexión', 'error'); }
                }
            );
        }
    });

    // ─── Render Rubros ────────────────────────────────────────────────────────
    const renderRubros = (list) => {
        if (list.length === 0) {
            rubrosList.innerHTML = `<div class="text-center py-10 text-slate-500 font-bold">No hay rubros creados.</div>`;
            return;
        }
        rubrosList.innerHTML = list.map(r => `
            <div class="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4 flex items-center justify-between">
                <div>
                    <h4 class="font-bold text-white flex items-center gap-2">
                        ${r.nombre} 
                        ${r.activo ? '<span class="w-2 h-2 rounded-full bg-emerald-500" title="Activo"></span>' : '<span class="w-2 h-2 rounded-full bg-rose-500" title="Inactivo"></span>'}
                    </h4>
                    <p class="text-xs text-slate-400 mt-1">${r.descripcion || 'Sin descripción'}</p>
                </div>
                <div class="flex items-center gap-2">
                    <button class="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors btn-edit-rubro" 
                        data-id="${r.id}" data-nombre="${r.nombre}" data-desc="${r.descripcion || ''}" data-activo="${r.activo}">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button class="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors btn-delete-rubro" data-id="${r.id}">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                    </button>
                </div>
            </div>
        `).join('');
    };

    rubrosList.addEventListener('click', async (e) => {
        const btnEdit = e.target.closest('.btn-edit-rubro');
        const btnDelete = e.target.closest('.btn-delete-rubro');

        if (btnEdit) {
            document.getElementById('modal-rubro-title').textContent = 'Editar Rubro';
            document.getElementById('r-id').value = btnEdit.dataset.id;
            document.getElementById('r-nombre').value = btnEdit.dataset.nombre;
            document.getElementById('r-desc').value = btnEdit.dataset.desc;
            document.getElementById('r-activo').checked = btnEdit.dataset.activo == '1';
            openModal(modalRubro, modalRubroContent);
        }

        if (btnDelete) {
            const id = btnDelete.dataset.id;
            showConfirm('Eliminar Rubro', '¿Estás seguro? Esta acción no se puede deshacer y fallará si hay clientes usándolo.', async () => {
                try {
                    await apiFetch(`/api/rubros/${id}`, { method: 'DELETE' });
                    showAlert('Eliminado', 'Rubro eliminado', 'success');
                    await loadRubros();
                } catch (err) { showAlert('Error', err.message, 'error'); }
            });
        }
    });

    // ─── Modal Create Rubro ──────────────────────────────────────────────────
    btnCreateRubro.addEventListener('click', () => {
        document.getElementById('modal-rubro-title').textContent = 'Nuevo Rubro';
        formRubro.reset();
        document.getElementById('r-id').value = '';
        openModal(modalRubro, modalRubroContent);
    });

    btnRCancel.addEventListener('click', () => closeModal(modalRubro, modalRubroContent));

    formRubro.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('r-id').value;
        const body = {
            nombre: document.getElementById('r-nombre').value,
            descripcion: document.getElementById('r-desc').value,
            activo: document.getElementById('r-activo').checked
        };
        try {
            if (id) {
                await apiFetch(`/api/rubros/${id}`, { method: 'PUT', body: JSON.stringify(body) });
                showAlert('Actualizado', 'Rubro actualizado', 'success');
            } else {
                await apiFetch('/api/rubros', { method: 'POST', body: JSON.stringify(body) });
                showAlert('Creado', 'Rubro creado', 'success');
            }
            closeModal(modalRubro, modalRubroContent);
            await loadRubros();
        } catch (err) {
            showAlert('Error', err.message, 'error');
        }
    });

    // ─── Modal Create Tenant ──────────────────────────────────────────────────
    if (btnCreateTenant) btnCreateTenant.addEventListener('click', () => {
        formCreateTenant.reset();
        openModal(modalCreateTenant, modalCreateTenantContent);
    });

    btnCtCancel.addEventListener('click', () => closeModal(modalCreateTenant, modalCreateTenantContent));

    document.getElementById('ct-nombre').addEventListener('input', (e) => {
        const slug = document.getElementById('ct-slug');
        if (!slug._edited) {
            slug.value = e.target.value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 -]/g, '').trim().replace(/\s+/g, '-');
        }
    });
    document.getElementById('ct-slug').addEventListener('input', (e) => e.target._edited = true);

    formCreateTenant.addEventListener('submit', async (e) => {
        e.preventDefault();
        const body = {
            nombre: document.getElementById('ct-nombre').value,
            slug: document.getElementById('ct-slug').value,
            rubro_id: document.getElementById('ct-rubro').value,
            email: document.getElementById('ct-email').value,
            password: document.getElementById('ct-password').value
        };
        try {
            await apiFetch('/api/tenants/super-create', { method: 'POST', body: JSON.stringify(body) });
            showAlert('Creado', 'Cliente creado y activado', 'success');
            closeModal(modalCreateTenant, modalCreateTenantContent);
            await loadTenants();
        } catch (err) {
            showAlert('Error', err.message, 'error');
        }
    });

    // ─── Modal Edit Tenant ────────────────────────────────────────────────────
    if (modalEditTenant) {
        const etCloseBtn = document.getElementById('btn-et-close');
        if (etCloseBtn) etCloseBtn.addEventListener('click', () => closeModal(modalEditTenant, modalEditTenantContent));
        
        const allCancelBtns = modalEditTenant.querySelectorAll('button');
        allCancelBtns.forEach(btn => {
            if (btn.textContent.trim() === 'Cerrar') {
                btn.addEventListener('click', () => closeModal(modalEditTenant, modalEditTenantContent));
            }
        });
    }

    if (formEditTenant) {
        formEditTenant.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('et-id').value;
            const body = {
                nombre: document.getElementById('et-nombre').value,
                telefono: document.getElementById('et-telefono').value,
                email: document.getElementById('et-email').value,
                ubicacion: document.getElementById('et-ubicacion').value,
                rubro_id: (document.getElementById('et-rubro') ? document.getElementById('et-rubro').value : null)
            };
            try {
                await apiFetch(`/api/tenants/${id}`, { method: 'PUT', body: JSON.stringify(body) });
                showAlert('Actualizado', 'Datos del cliente actualizados', 'success');
                closeModal(modalEditTenant, modalEditTenantContent);
                await loadTenants();
            } catch (err) {
                showAlert('Error', err.message, 'error');
            }
        });
    }

    // ─── Approve Modal ────────────────────────────────────────────────────────
    btnApproveCancel.addEventListener('click', () => closeModal(modalApprove, modalApproveContent));
    btnApproveConfirm.addEventListener('click', async () => {
        if (!pendingApproveTenantId) return;
        btnApproveConfirm.disabled = true;
        btnApproveConfirm.textContent = 'Aprobando...';
        try {
            const meses = parseInt(approveMeses.value) || 1;
            await apiFetch(`/api/tenants/${pendingApproveTenantId}/approve`, {
                method: 'PUT',
                body: JSON.stringify({ meses })
            });
            closeModal(modalApprove, modalApproveContent);
            showAlert('¡Aprobado!', `Tenant activado por ${meses} mes(es).`, 'success');
            await loadTenants();
        } catch (err) {
            showAlert('Error', err.message, 'error');
        } finally {
            btnApproveConfirm.disabled = false;
            btnApproveConfirm.textContent = 'Aprobar y Activar';
        }
    });

    // ─── Renew All ────────────────────────────────────────────────────────────
    btnRenewAll.addEventListener('click', () => {
        showConfirm('+30 Días a Todos', '¿Añadir 30 días a todos los tenants activos visibles?', async () => {
            try {
                const res = await apiFetch('/api/tenants/renew-all', { method: 'PUT' });
                showAlert('¡Listo!', res.message, 'success');
                await loadTenants();
            } catch (err) { showAlert('Error', err.message, 'error'); }
        });
    });

    // ─── Filters ─────────────────────────────────────────────────────────────
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => {
                b.classList.remove('active', 'bg-indigo-600', 'text-white');
                b.classList.add('text-slate-400');
            });
            btn.classList.add('active', 'bg-indigo-600', 'text-white');
            btn.classList.remove('text-slate-400');
            currentFilter = btn.dataset.filter;
            renderCards();
        });
    });

    // ─── Search ───────────────────────────────────────────────────────────────
    let searchDebounce;
    searchInput.addEventListener('input', () => {
        clearTimeout(searchDebounce);
        searchDebounce = setTimeout(() => {
            searchQuery = searchInput.value;
            renderCards();
        }, 250);
    });

    // ─── Nav switching ────────────────────────────────────────────────────────
    const switchNav = (activeNav, activeView) => {
        const navs = [navDashboard, navTenants, navRubros, navPlanes, navConfig, navLogs, navPwa];
        navs.forEach(nav => {
            if(nav) {
                nav.classList.remove('active', 'text-indigo-400');
                nav.classList.add('text-slate-400');
            }
        });
        
        const views = [viewDashboard, viewRubros, viewPlanes, viewConfig, viewLogs, viewPwa];
        views.forEach(view => {
            if(view) view.classList.add('hidden');
        });
        
        if (activeNav) {
            activeNav.classList.add('active', 'text-indigo-400');
            activeNav.classList.remove('text-slate-400');
        }
        if (activeView) {
            activeView.classList.remove('hidden');
        }
    };

    if(navDashboard) navDashboard.addEventListener('click', () => {
        switchNav(navDashboard, viewDashboard);
        loadDashboardStats();
    });
    if(navTenants) navTenants.addEventListener('click', () => switchNav(navDashboard, viewDashboard));
    if(navRubros) navRubros.addEventListener('click', () => switchNav(navRubros, viewRubros));
    if(navPlanes) navPlanes.addEventListener('click', () => switchNav(navPlanes, viewPlanes));
    if(navConfig) navConfig.addEventListener('click', () => {
        switchNav(navConfig, viewConfig);
        loadPlatformInfo();
    });
    if(navLogs) navLogs.addEventListener('click', () => switchNav(navLogs, viewLogs));
    if(navPwa) navPwa.addEventListener('click', () => switchNav(navPwa, viewPwa));

    // ─── Logout ───────────────────────────────────────────────────────────────
    btnLogout.addEventListener('click', () => {
        localStorage.removeItem('masterToken');
        window.location.href = '/masterlogin.html';
    });

    // ─── Modal helpers ────────────────────────────────────────────────────────
    const openModal = (modal, content) => {
        modal.classList.remove('hidden');
        requestAnimationFrame(() => {
            content.classList.remove('scale-95', 'opacity-0');
            content.classList.add('scale-100', 'opacity-100');
        });
    };

    const closeModal = (modal, content) => {
        content.classList.remove('scale-100', 'opacity-100');
        content.classList.add('scale-95', 'opacity-0');
        setTimeout(() => modal.classList.add('hidden'), 300);
    };

    const showAlert = (title, text, type = 'success') => {
        const modal = document.getElementById('alert-modal');
        const content = document.getElementById('alert-modal-content');
        const iconEl = document.getElementById('alert-icon');
        document.getElementById('alert-title').textContent = title;
        document.getElementById('alert-text').textContent = text;
        iconEl.className = `w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center ${type === 'success' ? 'bg-emerald-500/20' : 'bg-rose-500/20'}`;
        iconEl.innerHTML = type === 'success'
            ? `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`
            : `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
        document.getElementById('alert-btn-ok').onclick = () => closeModal(modal, content);
        openModal(modal, content);
    };

    let confirmCallback = null;
    const showConfirm = (title, text, onConfirm) => {
        const modal = document.getElementById('confirm-modal');
        const content = document.getElementById('confirm-modal-content');
        document.getElementById('confirm-title').textContent = title;
        document.getElementById('confirm-text').textContent = text;
        confirmCallback = onConfirm;
        document.getElementById('confirm-btn-cancel').onclick = () => closeModal(modal, content);
        document.getElementById('confirm-btn-ok').onclick = async () => {
            closeModal(modal, content);
            if (confirmCallback) await confirmCallback();
        };
        openModal(modal, content);
    };

    // ─── Planes y Precios ──────────────────────────────────────────────────────
    const loadPlanes = async () => {
        try {
            const result = await apiFetch('/api/planes');
            renderPlanes(result.data || []);
        } catch (err) {
            if(planesList) planesList.innerHTML = `<div class="text-center py-10 text-rose-400 font-bold">${err.message}</div>`;
        }
    };

    const renderPlanes = (list) => {
        if (!planesList) return;
        if (list.length === 0) {
            planesList.innerHTML = `<div class="col-span-full text-center py-10 text-slate-500 font-bold">No hay planes creados.</div>`;
            return;
        }
        planesList.innerHTML = list.map(p => `
            <div class="bg-slate-800/40 border border-slate-700/60 rounded-xl p-5 flex flex-col relative">
                ${p.activo ? '<span class="absolute top-4 right-4 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-wider border border-emerald-500/30">Activo</span>' : '<span class="absolute top-4 right-4 px-2 py-0.5 rounded-full bg-slate-500/20 text-slate-400 text-[10px] font-black uppercase tracking-wider border border-slate-500/30">Inactivo</span>'}
                <h4 class="font-black text-white text-lg mb-1">${p.nombre}</h4>
                <p class="text-3xl font-black text-indigo-400 mb-4">$${Number(p.precio).toLocaleString('es-AR')}</p>
                <div class="space-y-2 mb-6 flex-1">
                    ${(p.caracteristicas || '').split(',').map(c => c.trim()).filter(c=>c).map(c => `
                        <div class="flex items-start gap-2">
                            <svg class="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                            <span class="text-sm text-slate-300">${c}</span>
                        </div>
                    `).join('')}
                </div>
                <div class="flex items-center gap-2 mt-auto pt-4 border-t border-slate-700/50">
                    <button class="flex-1 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 font-bold text-sm transition-colors btn-edit-plan" 
                        data-id="${p.id}" data-nombre="${p.nombre}" data-precio="${p.precio}" data-carac="${p.caracteristicas || ''}" data-activo="${p.activo}">
                        Editar Plan
                    </button>
                    <button class="px-3 py-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors btn-delete-plan" data-id="${p.id}">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                    </button>
                </div>
            </div>
        `).join('');
    };

    if(planesList) {
        planesList.addEventListener('click', async (e) => {
            const btnEdit = e.target.closest('.btn-edit-plan');
            const btnDelete = e.target.closest('.btn-delete-plan');

            if (btnEdit) {
                document.getElementById('modal-plan-title').textContent = 'Editar Plan';
                document.getElementById('p-id').value = btnEdit.dataset.id;
                document.getElementById('p-nombre').value = btnEdit.dataset.nombre;
                document.getElementById('p-precio').value = btnEdit.dataset.precio;
                document.getElementById('p-carac').value = btnEdit.dataset.carac;
                document.getElementById('p-activo').checked = btnEdit.dataset.activo == '1';
                openModal(modalPlan, modalPlanContent);
            }

            if (btnDelete) {
                const id = btnDelete.dataset.id;
                showConfirm('Eliminar Plan', '¿Estás seguro? Esta acción no se puede deshacer.', async () => {
                    try {
                        await apiFetch(`/api/planes/${id}`, { method: 'DELETE' });
                        showAlert('Eliminado', 'Plan eliminado', 'success');
                        await loadPlanes();
                    } catch (err) { showAlert('Error', err.message, 'error'); }
                });
            }
        });
    }

    if(btnCreatePlan) {
        btnCreatePlan.addEventListener('click', () => {
            document.getElementById('modal-plan-title').textContent = 'Nuevo Plan';
            formPlan.reset();
            document.getElementById('p-id').value = '';
            openModal(modalPlan, modalPlanContent);
        });
    }

    if(btnPCancel) btnPCancel.addEventListener('click', () => closeModal(modalPlan, modalPlanContent));

    if(formPlan) {
        formPlan.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('p-id').value;
            const body = {
                nombre: document.getElementById('p-nombre').value,
                precio: document.getElementById('p-precio').value,
                caracteristicas: document.getElementById('p-carac').value,
                activo: document.getElementById('p-activo').checked
            };
            try {
                if (id) {
                    await apiFetch(`/api/planes/${id}`, { method: 'PUT', body: JSON.stringify(body) });
                    showAlert('Actualizado', 'Plan actualizado', 'success');
                } else {
                    await apiFetch('/api/planes', { method: 'POST', body: JSON.stringify(body) });
                    showAlert('Creado', 'Plan creado', 'success');
                }
                closeModal(modalPlan, modalPlanContent);
                await loadPlanes();
            } catch (err) {
                showAlert('Error', err.message, 'error');
            }
        });
    }

    // ─── Platform Info / Administrar Información ──────────────────────────────
    let serviceLinks = [];

    const loadPlatformInfo = async () => {
        try {
            const res = await apiFetch('/api/plataforma/info');
            const data = res.data || {};
            if (data.logo_url) {
                document.getElementById('cfg-logo-url').value = data.logo_url;
                document.getElementById('cfg-logo-preview').innerHTML =
                    `<img src="${data.logo_url}" class="w-full h-full object-cover" onerror="this.style.display='none'">`;
            }
            if (data.favicon_url) {
                document.getElementById('cfg-favicon-url').value = data.favicon_url;
                document.getElementById('cfg-favicon-preview').innerHTML =
                    `<img src="${data.favicon_url}" class="w-full h-full object-cover" onerror="this.style.display='none'">`;
            }
            if (data.nombre_plataforma) document.getElementById('cfg-nombre').value = data.nombre_plataforma;
            if (data.tagline) document.getElementById('cfg-tagline').value = data.tagline;
            serviceLinks = Array.isArray(data.links_servicios) ? data.links_servicios : [];
            renderServiceLinks();
        } catch (err) {
            console.warn('No se pudo cargar info de plataforma:', err.message);
        }
    };

    const renderServiceLinks = () => {
        const container = document.getElementById('cfg-links-list');
        if (!container) return;
        if (serviceLinks.length === 0) {
            container.innerHTML = `<div class="text-center py-8 text-slate-500 font-bold bg-slate-800/30 rounded-xl border border-dashed border-slate-700">No hay links configurados.</div>`;
            return;
        }
        container.innerHTML = serviceLinks.map((link, idx) => `
            <div class="flex items-center justify-between bg-slate-800/40 border border-slate-700/60 rounded-xl px-4 py-3">
                <div>
                    <p class="font-bold text-white text-sm">${link.nombre}</p>
                    <p class="text-xs text-slate-400">${link.url}</p>
                </div>
                <div class="flex items-center gap-2">
                    <button class="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors btn-edit-link" data-idx="${idx}" title="Editar">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button class="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors btn-remove-link" data-idx="${idx}" title="Eliminar">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                    </button>
                </div>
            </div>
        `).join('');
        container.querySelectorAll('.btn-edit-link').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.dataset.idx);
                const link = serviceLinks[idx];
                document.getElementById('cfg-link-editing-idx').value = idx;
                document.getElementById('cfg-link-nombre').value = link.nombre;
                document.getElementById('cfg-link-url').value = link.url;
                document.getElementById('cfg-link-form').classList.remove('hidden');
            });
        });
        container.querySelectorAll('.btn-remove-link').forEach(btn => {
            btn.addEventListener('click', () => {
                serviceLinks.splice(parseInt(btn.dataset.idx), 1);
                renderServiceLinks();
            });
        });
    };

    // Sub-tabs dentro de config
    const cfgTabIdentidad = document.getElementById('cfg-tab-identidad');
    const cfgTabLinks = document.getElementById('cfg-tab-links');
    const cfgViewIdentidad = document.getElementById('cfg-view-identidad');
    const cfgViewLinks = document.getElementById('cfg-view-links');

    const switchCfgTab = (tab) => {
        [cfgTabIdentidad, cfgTabLinks].forEach(t => {
            t && t.classList.remove('text-indigo-400', 'border-indigo-400');
            t && t.classList.add('text-slate-400', 'border-transparent');
        });
        cfgViewIdentidad && cfgViewIdentidad.classList.add('hidden');
        cfgViewLinks && cfgViewLinks.classList.add('hidden');
        if (tab === 'identidad') {
            cfgTabIdentidad && cfgTabIdentidad.classList.add('text-indigo-400', 'border-indigo-400');
            cfgViewIdentidad && cfgViewIdentidad.classList.remove('hidden');
        } else {
            cfgTabLinks && cfgTabLinks.classList.add('text-indigo-400', 'border-indigo-400');
            cfgViewLinks && cfgViewLinks.classList.remove('hidden');
        }
    };
    if (cfgTabIdentidad) cfgTabIdentidad.addEventListener('click', () => switchCfgTab('identidad'));
    if (cfgTabLinks) cfgTabLinks.addEventListener('click', () => switchCfgTab('links'));

    // File upload helper
    const uploadFile = async (file) => {
        const fd = new FormData();
        fd.append('image', file);
        const res = await fetch('/api/upload/image', { method: 'POST', headers: { 'Authorization': `SuperAdmin ${token}` }, body: fd });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Error al subir imagen');
        return json.url;
    };

    const uploadPlatformLogo = async (file) => {
        const fd = new FormData();
        fd.append('logo', file);
        const res = await fetch('/api/plataforma/logo', { method: 'POST', headers: { 'Authorization': `SuperAdmin ${token}` }, body: fd });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Error al subir logo');
        return { logo_url: json.logo_url, favicon_url: json.favicon_url };
    };

    const cfgLogoFile = document.getElementById('cfg-logo-file');
    const cfgFaviconFile = document.getElementById('cfg-favicon-file');
    if (cfgLogoFile) cfgLogoFile.addEventListener('change', async (e) => {
        const file = e.target.files[0]; if (!file) return;
        try {
            const result = await uploadPlatformLogo(file);
            
            // Update both logo and favicon fields since the backend updates both
            document.getElementById('cfg-logo-url').value = result.logo_url;
            document.getElementById('cfg-logo-preview').innerHTML = `<img src="${result.logo_url}" class="w-full h-full object-cover">`;
            
            if (document.getElementById('cfg-favicon-url')) {
                document.getElementById('cfg-favicon-url').value = result.favicon_url;
                document.getElementById('cfg-favicon-preview').innerHTML = `<img src="${result.favicon_url}" class="w-full h-full object-cover">`;
            }
            
            // Re-fetch info so it updates UI? It's fine, the URLs are updated.
        } catch (err) { showAlert('Error', err.message, 'error'); }
    });
    if (cfgFaviconFile) cfgFaviconFile.addEventListener('change', async (e) => {
        const file = e.target.files[0]; if (!file) return;
        try {
            const url = await uploadFile(file);
            document.getElementById('cfg-favicon-url').value = url;
            document.getElementById('cfg-favicon-preview').innerHTML = `<img src="${url}" class="w-full h-full object-cover">`;
        } catch (err) { showAlert('Error', err.message, 'error'); }
    });

    const btnSaveIdentidad = document.getElementById('btn-save-identidad');
    if (btnSaveIdentidad) btnSaveIdentidad.addEventListener('click', async () => {
        try {
            await apiFetch('/api/plataforma/info', { method: 'PUT', body: JSON.stringify({
                logo_url: document.getElementById('cfg-logo-url').value,
                favicon_url: document.getElementById('cfg-favicon-url').value,
                nombre_plataforma: document.getElementById('cfg-nombre').value,
                tagline: document.getElementById('cfg-tagline').value,
            }) });
            showAlert('Guardado', 'Identidad de la plataforma actualizada.', 'success');
        } catch (err) { showAlert('Error', err.message, 'error'); }
    });

    const btnSaveLinks = document.getElementById('btn-save-links');
    if (btnSaveLinks) btnSaveLinks.addEventListener('click', async () => {
        try {
            await apiFetch('/api/plataforma/info', { method: 'PUT', body: JSON.stringify({ links_servicios: serviceLinks }) });
            showAlert('Guardado', 'Links de servicios actualizados.', 'success');
        } catch (err) { showAlert('Error', err.message, 'error'); }
    });

    const btnAddLink = document.getElementById('btn-add-link');
    const cfgLinkForm = document.getElementById('cfg-link-form');
    const btnLinkCancel = document.getElementById('btn-link-cancel');
    const btnLinkSave = document.getElementById('btn-link-save');
    if (btnAddLink) btnAddLink.addEventListener('click', () => {
        document.getElementById('cfg-link-editing-idx').value = '';
        document.getElementById('cfg-link-nombre').value = '';
        document.getElementById('cfg-link-url').value = '';
        cfgLinkForm && cfgLinkForm.classList.remove('hidden');
    });
    if (btnLinkCancel) btnLinkCancel.addEventListener('click', () => cfgLinkForm && cfgLinkForm.classList.add('hidden'));
    if (btnLinkSave) btnLinkSave.addEventListener('click', () => {
        const nombre = document.getElementById('cfg-link-nombre').value.trim();
        const url = document.getElementById('cfg-link-url').value.trim();
        if (!nombre || !url) { showAlert('Error', 'Completá el nombre y la URL.', 'error'); return; }
        const idx = document.getElementById('cfg-link-editing-idx').value;
        if (idx !== '') { serviceLinks[parseInt(idx)] = { nombre, url }; }
        else { serviceLinks.push({ nombre, url }); }
        cfgLinkForm && cfgLinkForm.classList.add('hidden');
        renderServiceLinks();
    });

    // ─── Init ─────────────────────────────────────────────────────────────────
    const loadDashboardStats = async () => {
        try {
            // Usa apiFetch para mantener los headers correctos
            const res = await apiFetch('/api/tenants/stats');
            if (res && res.data) {
                const { total, activos, pendientes, suspendidos, mrr } = res.data;
                document.getElementById('stat-total').textContent = total;
                document.getElementById('stat-activos').textContent = activos;
                document.getElementById('stat-pendientes').textContent = pendientes + suspendidos;
                
                const formatter = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });
                document.getElementById('stat-mrr').textContent = formatter.format(mrr);
            }
        } catch (error) {
            console.error('Error cargando stats:', error);
        }
    };

    // Hacer window.loadDashboardStats global si es necesario
    window.loadDashboardStats = loadDashboardStats;

    loadRubros();
    loadTenants();
    loadPlanes();
    
    if (navDashboard && viewDashboard && !viewDashboard.classList.contains('hidden')) {
        loadDashboardStats();
    }

    // Tab switching for Edit Tenant Modal
    const tabs = [
        { btn: document.getElementById('btn-tab-general'), form: document.getElementById('form-edit-tenant') },
        { btn: document.getElementById('btn-tab-credenciales'), form: document.getElementById('form-tab-credenciales') },
        { btn: document.getElementById('btn-tab-canchas'), form: document.getElementById('form-tab-canchas') },
        { btn: document.getElementById('btn-tab-cobros'), form: document.getElementById('form-tab-cobros') },
        { btn: document.getElementById('btn-tab-licencia'), form: document.getElementById('form-tab-licencia') }
    ];

    tabs.forEach(tab => {
        if (tab.btn) {
            tab.btn.addEventListener('click', () => {
                // Remove active classes from all buttons
                tabs.forEach(t => {
                    if (t.btn) {
                        t.btn.classList.remove('bg-indigo-600', 'text-white', 'shadow-md', 'shadow-indigo-600/30', 'scale-100');
                        t.btn.classList.add('text-slate-300', 'hover:bg-slate-800/80', 'hover:text-white');
                    }
                    if (t.form) t.form.classList.add('hidden');
                });
                // Add active class to clicked button
                tab.btn.classList.remove('text-slate-300', 'hover:bg-slate-800/80', 'hover:text-white');
                tab.btn.classList.add('bg-indigo-600', 'text-white', 'shadow-md', 'shadow-indigo-600/30', 'scale-100');
                if (tab.form) tab.form.classList.remove('hidden');
            });
        }
    });

});
