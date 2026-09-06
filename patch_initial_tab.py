with open('public/js/masteradmin.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Make the first tab active by default when opening the modal
# Look for where the modal is opened
pattern = "openModal(modalEditTenant, modalEditTenantContent);"
replacement = """
                if (document.getElementById('btn-tab-general')) {
                    document.getElementById('btn-tab-general').click();
                }
                openModal(modalEditTenant, modalEditTenantContent);
"""
js = js.replace(pattern, replacement)

with open('public/js/masteradmin.js', 'w', encoding='utf-8') as f:
    f.write(js)
