import re

with open('public/js/masteradmin.js', 'r', encoding='utf-8') as f:
    js = f.read()

# We need to replace the entire `grid.addEventListener('click', async (e) => { ... });`
# up to the next block which is `    // ─── PWA Management ────────────────────────────────────────────────────`

start_marker = "    // ─── Event Delegation for Cards ──────────────────────────────────────────"
end_marker = "    // ─── PWA Management ────────────────────────────────────────────────────"

new_delegation = """    // ─── Event Delegation for Cards ──────────────────────────────────────────
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
                    await apiFetch(`/api/tenants/${id}/renew`, { method: 'PUT', body: JSON.stringify({ meses: 1 }) });
                    showAlert('Renovado', '+30 días añadidos', 'success');
                    await loadTenants();
                } catch (err) { showAlert('Error', err.message, 'error'); }
            });
        }

        if (deleteTenantBtn) {
            const id = deleteTenantBtn.dataset.id;
            const name = deleteTenantBtn.dataset.name;
            showConfirm('⚠️ Eliminar Cliente', `¿Eliminar a "${name}" y TODOS sus datos (canchas, reservas, clientes)? Esta acción es permanente e irreversible.`, async () => {
                try {
                    await apiFetch(`/api/tenants/${id}`, { method: 'DELETE' });
                    showAlert('Eliminado', `Cliente "${name}" eliminado correctamente.`, 'success');
                    await loadTenants();
                } catch (err) { showAlert('Error', err.message, 'error'); }
            });
        }
    });

"""

# Use string replace
start_idx = js.find(start_marker)
end_idx = js.find(end_marker)

if start_idx != -1 and end_idx != -1:
    js = js[:start_idx] + new_delegation + js[end_idx:]
    with open('public/js/masteradmin.js', 'w', encoding='utf-8') as f:
        f.write(js)
    print("Replaced successfully")
else:
    print("Markers not found")
