import re

with open('public/masteradmin.html', 'r', encoding='utf-8') as f:
    master = f.read()

with open('modal_template.html', 'r', encoding='utf-8') as f:
    modal = f.read()

# Replace the existing modal-edit-tenant
# The old modal is between: <!-- Modal: Edit Tenant --> and <!-- Modal: Rubro -->
pattern = r'<!-- Modal: Edit Tenant -->.*?<!-- Modal: Rubro -->'

new_master = re.sub(pattern, '<!-- Modal: Edit Tenant -->\n' + modal + '\n\n    <!-- Modal: Rubro -->', master, flags=re.DOTALL)

with open('public/masteradmin.html', 'w', encoding='utf-8') as f:
    f.write(new_master)
