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

    // Modal: Approve
    const modalApprove = document.getElementById('modal-approve');
    const modalApproveContent = document.getElementById('modal-approve-content');
    const modalApproveName = document.getElementById('modal-approve-name');
    const approveMeses = document.getElementById('approve-meses');
    const btnApproveCancel = document.getElementById('btn-approve-cancel');
    const btnApproveConfirm = document.getElementById('btn-approve-confirm');

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

        // Determine card border class
        let cardBorderClass = 'border-slate-700/60';
        if (isBlocked) cardBorderClass = 'card-blocked';
        else if (isPending) cardBorderClass = 'card-pending';
        else if (isActive) cardBorderClass = 'card-active';

        // Status badge
        let statusBadge = '';
        if (isBlocked) {
            statusBadge = `<span class="flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 text-[10px] font-black uppercase tracking-wider">
                <span class="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>Panel Bloqueado
            </span>`;
        } else if (isPending) {
            statusBadge = `<span class="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 text-[10px] font-black uppercase tracking-wider">
                <span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>Pendiente
            </span>`;
        } else if (isActive) {
            statusBadge = `<span class="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-black uppercase tracking-wider">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Panel En Uso
            </span>`;
        }

        // Días restantes display
        let diasDisplay = '';
        if (!isPending) {
            const diasNum = dias !== null ? dias : 0;
            const diasColor = isBlocked ? 'text-rose-400' : isVenciendo ? 'text-amber-400' : 'text-emerald-400';
            const diasBg = isBlocked ? 'bg-rose-500/10 border-rose-500/30' : isVenciendo ? 'bg-amber-500/10 border-amber-500/30' : 'bg-emerald-500/10 border-emerald-500/30';
            const fechaStr = t.fecha_vencimiento ? new Date(t.fecha_vencimiento).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' }) : '--';

            const diasIcon = isBlocked
                ? `<svg class="w-4 h-4 ${diasColor}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`
                : `<svg class="w-4 h-4 ${diasColor}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`;

            diasDisplay = `
                <div class="flex items-center justify-between px-3 py-2.5 rounded-xl border ${diasBg}">
                    <div class="flex items-center gap-2">
                        ${diasIcon}
                        <div>
                            <p class="text-xs font-black ${diasColor}">${Math.abs(diasNum)} días ${diasNum < 0 ? 'vencido' : 'restantes'}</p>
                            <p class="text-[10px] text-slate-500 font-medium">Vence: ${fechaStr}</p>
                        </div>
                    </div>
                    <svg class="w-3.5 h-3.5 text-slate-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </div>`;
        }

        // Owner info
        const ownerInfo = `
            <div class="space-y-1.5 text-xs text-slate-400">
                <div class="flex items-center gap-2">
                    <svg class="w-3.5 h-3.5 text-slate-600 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    <span class="font-semibold">${t.nombre}</span>
                </div>
                ${t.telefono ? `<div class="flex items-center gap-2"><svg class="w-3.5 h-3.5 text-slate-600 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.54 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l.81-.81a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg><span>${t.telefono}</span></div>` : ''}
                ${t.ubicacion ? `<div class="flex items-center gap-2"><svg class="w-3.5 h-3.5 text-slate-600 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg><span class="truncate max-w-[160px]" title="${t.ubicacion}">${t.ubicacion}</span></div>` : ''}
            </div>`;

        // Stats
        const stats = t.stats || { canchas: 0, reservas: 0, clientes: 0 };
        const statsHtml = `
            <div class="grid grid-cols-3 gap-2 text-center">
                <div class="bg-slate-800/50 rounded-xl p-2.5">
                    <p class="text-lg font-black text-white">${stats.canchas}</p>
                    <p class="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Canchas</p>
                </div>
                <div class="bg-slate-800/50 rounded-xl p-2.5">
                    <p class="text-lg font-black text-white">${stats.reservas}</p>
                    <p class="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Reservas</p>
                </div>
                <div class="bg-slate-800/50 rounded-xl p-2.5">
                    <p class="text-lg font-black text-white">${stats.clientes}</p>
                    <p class="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Clientes</p>
                </div>
            </div>`;

        // Action buttons
        let primaryBtn = '';
        if (isPending) {
            primaryBtn = `<button class="btn-approve flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl transition-colors" data-id="${t.id}" data-name="${t.nombre}">✓ Aprobar</button>`;
        } else {
            primaryBtn = `<button class="btn-impersonate flex-1 py-2.5 bg-indigo-600/80 hover:bg-indigo-600 text-white text-xs font-bold rounded-xl transition-colors" data-id="${t.id}" data-name="${t.nombre}">Acceder al Panel ›</button>`;
        }

        const secondaryBtn = `<button class="btn-renew-one py-2.5 px-3.5 bg-amber-400 hover:bg-amber-300 text-slate-900 text-xs font-black rounded-xl transition-colors flex items-center gap-1" data-id="${t.id}">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M11.5 2C6.81 2 3 5.81 3 10.5S6.81 19 11.5 19h.5v3c4.86-2.34 8-7 8-11.5C20 5.81 16.19 2 11.5 2zm1 14.5h-2v-6h2v6zm0-8h-2v-2h2v2z"/></svg>
            +30 Días
        </button>`;

        let suspendBtn = '';
        if (!isPending) {
            if (isBlocked) {
                suspendBtn = `<button class="btn-activate absolute top-3 right-10 p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-400/10 transition-colors" data-id="${t.id}" title="Reactivar">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                </button>`;
            } else {
                suspendBtn = `<button class="btn-suspend absolute top-3 right-10 p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-400/10 transition-colors" data-id="${t.id}" title="Suspender">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                </button>`;
            }
        }

        const card = document.createElement('div');
        card.className = `relative bg-[#181c28] border ${cardBorderClass} rounded-2xl p-4 space-y-4 flex flex-col transition-all hover:bg-[#1c2135]`;
        card.innerHTML = `
            <!-- Header -->
            <div class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                    <p class="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5">${t.slug}</p>
                    <h3 class="text-base font-black text-white leading-tight truncate">${t.nombre}</h3>
                </div>
                <div class="flex items-center gap-1.5 shrink-0 mt-0.5">
                    ${statusBadge}
                </div>
            </div>
            ${suspendBtn}
            <button class="btn-edit absolute top-3 right-3 p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-700/50 transition-colors" data-id="${t.id}" title="Editar">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>

            ${diasDisplay}
            ${ownerInfo}
            <hr class="border-slate-700/60">
            ${statsHtml}

            <!-- Actions -->
            <div class="flex gap-2 pt-1">
                ${secondaryBtn}
                ${primaryBtn}
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
                localStorage.setItem('adminToken', res.token);
                localStorage.setItem('adminUser', res.tenant.nombre);
                localStorage.setItem('tenantId', res.tenant.id);
                localStorage.setItem('tenantSlug', res.tenant.slug);
                window.open('/admin', '_blank');
            } catch (err) {
                showAlert('Error', err.message, 'error');
            }
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
            try {
                await apiFetch(`/api/tenants/${id}/renew`, { method: 'PUT', body: JSON.stringify({ meses: 1 }) });
                showAlert('Renovado', '+30 días añadidos', 'success');
                await loadTenants();
            } catch (err) { showAlert('Error', err.message, 'error'); }
        }
    });

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

    // ─── Init ─────────────────────────────────────────────────────────────────
    loadTenants();
});
