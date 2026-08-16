// public/js/masteradmin.js

document.addEventListener('DOMContentLoaded', () => {
    
    let currentConfig = null;

    // DOM Elements
    const badgeEstado = document.getElementById('plat-estado-badge');
    const labelVencimiento = document.getElementById('plat-vencimiento');
    const btnToggleStatus = document.getElementById('btn-toggle-status');
    const btnToggleDemo = document.getElementById('btn-toggle-demo');
    const btnAdd1m = document.getElementById('btn-add-1m');
    const btnAdd6m = document.getElementById('btn-add-6m');

    async function init() {
        // 1. Check Authentication
        const token = localStorage.getItem('masterToken');
        if (!token) {
            window.location.href = '/masterlogin.html';
            return;
        }

        const btnLogout = document.getElementById('btn-master-logout');
        if (btnLogout) {
            btnLogout.addEventListener('click', () => {
                window.API.masterLogout();
            });
        }

        await loadConfig();
        setupEvents();
    }

    async function loadConfig() {
        try {
            currentConfig = await window.API.getPlataforma();
            if (currentConfig) {
                renderConfig();
            }
        } catch (error) {
            showAlertModal('Error', 'No se pudo cargar la configuración de la plataforma.', 'error');
        }
    }

    function renderConfig() {
        // Estado
        if (currentConfig.estado === 'activo') {
            badgeEstado.innerText = 'ACTIVO';
            badgeEstado.className = 'px-3 py-1 rounded-full text-sm font-black border bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800';
            
            btnToggleStatus.innerText = 'Suspender Servicio';
            btnToggleStatus.className = 'w-full py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black transition-colors shadow-lg shadow-rose-600/20 mt-2';
        } else {
            badgeEstado.innerText = 'INACTIVO';
            badgeEstado.className = 'px-3 py-1 rounded-full text-sm font-black border bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800';
            
            btnToggleStatus.innerText = 'Reactivar Servicio';
            btnToggleStatus.className = 'w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black transition-colors shadow-lg shadow-emerald-600/20 mt-2';
        }

        // Vencimiento
        if (currentConfig.fecha_vencimiento) {
            const date = new Date(currentConfig.fecha_vencimiento);
            const isExpired = date < new Date();
            
            labelVencimiento.innerText = date.toLocaleDateString('es-AR', {
                year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute:'2-digit'
            });

            if (isExpired) {
                labelVencimiento.classList.add('text-rose-600', 'dark:text-rose-400');
                labelVencimiento.innerText += ' (Vencido)';
            } else {
                labelVencimiento.classList.remove('text-rose-600', 'dark:text-rose-400');
            }
        }

        // Demo Mode
        if (btnToggleDemo) {
            if (currentConfig.demo_mode === 'true') {
                btnToggleDemo.innerText = 'ACTIVADO';
                btnToggleDemo.className = 'px-3 py-1 rounded-full text-sm font-black border bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800 hover:opacity-80 cursor-pointer';
            } else {
                btnToggleDemo.innerText = 'DESACTIVADO';
                btnToggleDemo.className = 'px-3 py-1 rounded-full text-sm font-black border bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 hover:opacity-80 cursor-pointer';
            }
        }
    }

    function setupEvents() {
        btnToggleStatus.addEventListener('click', async () => {
            const newState = currentConfig.estado === 'activo' ? 'inactivo' : 'activo';
            const confirmMsg = newState === 'activo' 
                ? '¿Estás seguro de reactivar el servicio al cliente?' 
                : '¿Estás seguro de SUSPENDER el servicio? Los clientes no podrán acceder a la web.';
            
            if (confirm(confirmMsg)) {
                await updatePlatform({ estado: newState });
            }
        });

        if (btnToggleDemo) {
            btnToggleDemo.addEventListener('click', async () => {
                const newDemoState = currentConfig.demo_mode === 'true' ? 'false' : 'true';
                if (confirm(`¿Estás seguro de cambiar el Modo Demo a ${newDemoState === 'true' ? 'ACTIVADO' : 'DESACTIVADO'}?`)) {
                    await updatePlatform({ demo_mode: newDemoState });
                }
            });
        }

        btnAdd1m.addEventListener('click', () => addTime(1));
        btnAdd6m.addEventListener('click', () => addTime(6));
    }

    async function addTime(monthsToAdd) {
        if (!currentConfig || !currentConfig.fecha_vencimiento) return;
        
        let currentDate = new Date(currentConfig.fecha_vencimiento);
        
        // If it's already expired, add time from TODAY
        if (currentDate < new Date()) {
            currentDate = new Date();
        }

        currentDate.setMonth(currentDate.getMonth() + monthsToAdd);

        if (confirm(`La nueva fecha de vencimiento será ${currentDate.toLocaleDateString('es-AR')}. ¿Confirmar?`)) {
            await updatePlatform({ fecha_vencimiento: currentDate.toISOString() });
        }
    }

    async function updatePlatform(data) {
        try {
            await window.API.updatePlataforma(data);
            showAlertModal('Éxito', 'La configuración ha sido actualizada.', 'success');
            await loadConfig();
        } catch (error) {
            showAlertModal('Error', 'Hubo un problema al actualizar.', 'error');
        }
    }

    // Modal Alert logic
    function showAlertModal(title, text, type = 'success') {
        const aModal = document.getElementById('alert-modal');
        const aModalContent = document.getElementById('alert-modal-content');
        const titleEl = document.getElementById('alert-modal-title');
        const textEl = document.getElementById('alert-modal-text');
        const iconContainer = document.getElementById('alert-modal-icon');
        const btnAccept = document.getElementById('alert-btn-accept');

        if (!aModal) {
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

        aModal.classList.remove('hidden');
        requestAnimationFrame(() => {
            aModalContent.classList.remove('scale-95', 'opacity-0');
            aModalContent.classList.add('scale-100', 'opacity-100');
        });

        const cleanup = () => {
            aModalContent.classList.remove('scale-100', 'opacity-100');
            aModalContent.classList.add('scale-95', 'opacity-0');
            setTimeout(() => {
                aModal.classList.add('hidden');
            }, 300);
            btnAccept.removeEventListener('click', onAcceptClick);
        };
        const onAcceptClick = () => cleanup();
        btnAccept.addEventListener('click', onAcceptClick);
    }

    init();
});
