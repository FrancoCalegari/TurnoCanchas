import re

with open('public/js/masteradmin.js', 'r', encoding='utf-8') as f:
    js = f.read()

renew_logic = """        if (renewOneBtn) {
            const id = renewOneBtn.dataset.id;
            showConfirm(`¿Sumar 30 días al panel?`, 'El panel ganará 30 días adicionales de acceso.', async () => {
                try {
                    const res = await fetch(`/api/tenants/${id}/renew`, {
                        method: 'PUT',
                        headers: { 'Authorization': `Bearer ${token}` }
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
"""

# Insert renewOne logic
pattern = r'(        if \(deleteTenantBtn\) \{.*?        \}\n)'
js = re.sub(pattern, r'\1' + renew_logic, js, flags=re.DOTALL)


# Also add btn-renew-all listener somewhere near btn-create-tenant listener
renew_all_logic = """
    const btnRenewAll = document.getElementById('btn-renew-all');
    if (btnRenewAll) {
        btnRenewAll.addEventListener('click', () => {
            showConfirm('¿Sumar 30 días a todos los clientes activos?', 'Esta acción actualizará la fecha de vencimiento de todos.', async () => {
                try {
                    const res = await fetch('/api/tenants/renew-all', {
                        method: 'PUT',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (res.ok) {
                        const data = await res.json();
                        showAlert('Renovación Exitosa', data.message, 'success');
                        loadTenants();
                    } else {
                        showAlert('Error', 'Fallo al renovar', 'error');
                    }
                } catch(e) {
                    showAlert('Error', 'Error de conexión', 'error');
                }
            });
        });
    }
"""

pattern_create = r'(    const btnCreateTenant = document\.getElementById\(\'btn-create-tenant\'\);\n    if \(btnCreateTenant\) btnCreateTenant\.addEventListener\(\'click\', \(\) => \{\n        openModal\(modalCreateTenant, modalCreateTenantContent\);\n    \}\);)'
js = re.sub(pattern_create, r'\1\n' + renew_all_logic, js)

with open('public/js/masteradmin.js', 'w', encoding='utf-8') as f:
    f.write(js)
