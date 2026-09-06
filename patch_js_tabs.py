import re

with open('public/js/masteradmin.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Add tab switching logic inside the DOMContentLoaded or at the end
tab_logic = """
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
"""

# append to the end of the file before the final `});`
js = js.replace('});\n// End of DOMContentLoaded', tab_logic + '\n});')
# Wait, if there's no `// End of DOMContentLoaded` comment, we can just insert before the last `});`
if '});\n// End of DOMContentLoaded' not in js:
    js = re.sub(r'\}\);\s*$', tab_logic + '\n});\n', js)

with open('public/js/masteradmin.js', 'w', encoding='utf-8') as f:
    f.write(js)
