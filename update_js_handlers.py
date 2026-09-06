import re

with open('public/js/masteradmin.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Add handling for deleteTenantBtn
handler = """        if (deleteTenantBtn) {
            const id = deleteTenantBtn.dataset.id;
            const name = deleteTenantBtn.dataset.name;
            showConfirm(`¿Estás seguro de eliminar el panel de "${name}"?`, 'Esta acción eliminará todos los datos asociados.', async () => {
                try {
                    const res = await fetch(`/api/tenants/${id}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (res.ok) {
                        showAlert('Cliente eliminado correctamente', 'success');
                        loadTenants();
                    } else {
                        showAlert('Error al eliminar cliente', 'error');
                    }
                } catch (e) {
                    console.error(e);
                    showAlert('Error de conexión', 'error');
                }
            });
        }
"""

# Insert it after `if (impersonateBtn) { ... }` or at the end of the `tenantsGrid.addEventListener`
pattern_insert_delete = r'(        if \(impersonateBtn\) \{.*?        \})'
js = re.sub(pattern_insert_delete, r'\1\n' + handler, js, flags=re.DOTALL)

# Add et-slug
pattern_et_fields = r"(document\.getElementById\('et-nombre'\)\.value = t\.nombre;)"
replace_et_fields = r"\1\n                if(document.getElementById('et-slug')) document.getElementById('et-slug').value = t.slug;\n                if(document.getElementById('et-owner')) document.getElementById('et-owner').value = t.nombre;"
js = re.sub(pattern_et_fields, replace_et_fields, js)

with open('public/js/masteradmin.js', 'w', encoding='utf-8') as f:
    f.write(js)
