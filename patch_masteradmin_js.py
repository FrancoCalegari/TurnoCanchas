import re

with open('public/js/masteradmin.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Remove topBar and viewTenants logic from DOM Elements
js = js.replace("const viewTenants = document.getElementById('view-tenants');", "")
js = js.replace("const topBar = viewTenants.previousElementSibling; // The search/filter bar is only for tenants for now", "")

# In switchNav
# const views = [viewDashboard, viewTenants, viewRubros, viewPlanes, viewConfig, viewLogs, viewPwa];
js = re.sub(r'const views = \[viewDashboard, viewTenants,.*?\n.*?topBar\.classList\.add\(\'hidden\'\);\n.*?\n\s*if\(activeView === viewTenants\) topBar\.classList\.remove\(\'hidden\'\);', 
    "const views = [viewDashboard, viewRubros, viewPlanes, viewConfig, viewLogs, viewPwa];\n        views.forEach(v => { if(v) v.classList.add('hidden'); });\n        if(activeView) activeView.classList.remove('hidden');", js, flags=re.DOTALL)

# Also there's: if(navTenants) navTenants.addEventListener('click', () => switchNav(navTenants, viewTenants));
# Change it to switchNav(navDashboard, viewDashboard) or just comment it out.
# Wait, let's look at line 672.
js = js.replace("if(navTenants) navTenants.addEventListener('click', () => switchNav(navTenants, viewTenants));", "if(navTenants) navTenants.addEventListener('click', () => switchNav(navDashboard, viewDashboard));")

with open('public/js/masteradmin.js', 'w', encoding='utf-8') as f:
    f.write(js)
