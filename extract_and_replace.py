from bs4 import BeautifulSoup
import re

# 1. Load the template
with open('masteradmin_template.html', 'r', encoding='utf-8') as f:
    template_soup = BeautifulSoup(f, 'html.parser')

header_tag = template_soup.find('header')
main_tag = template_soup.find('main')

# We need the inner content of the main_tag, but we'll remove the cards
# The cards are inside `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">`
cards_grid = main_tag.find('div', class_=re.compile(r'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'))
if cards_grid:
    cards_grid.clear()
    cards_grid['id'] = 'tenants-grid'
    # Add the loading state back
    cards_grid.append(BeautifulSoup("""
        <div class="col-span-full flex flex-col items-center justify-center py-20 text-slate-600">
            <svg class="animate-spin h-8 w-8 mb-4 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            <p class="font-bold">Cargando tenants...</p>
        </div>
    """, 'html.parser'))

# Find the KPIs to add IDs
kpi_divs = main_tag.find_all('div', class_=re.compile(r'p-5 rounded-3xl bg-white'))
if len(kpi_divs) >= 4:
    kpi_divs[0].find('span', class_=re.compile(r'text-2xl sm:text-3xl font-black text-slate-900')).string.replace_with('0')
    kpi_divs[0].find('span', class_=re.compile(r'text-2xl sm:text-3xl font-black text-slate-900'))['id'] = 'stat-total'
    
    kpi_divs[1].find('span', class_=re.compile(r'text-2xl sm:text-3xl font-black text-slate-900')).string.replace_with('0')
    kpi_divs[1].find('span', class_=re.compile(r'text-2xl sm:text-3xl font-black text-slate-900'))['id'] = 'stat-activos'
    
    kpi_divs[2].find('span', class_=re.compile(r'text-2xl sm:text-3xl font-black text-slate-900')).string.replace_with('0')
    kpi_divs[2].find('span', class_=re.compile(r'text-2xl sm:text-3xl font-black text-slate-900'))['id'] = 'stat-pendientes'
    
    kpi_divs[3].find('span', class_=re.compile(r'text-xl sm:text-2xl font-black text-emerald-600')).string.replace_with('$ 0')
    kpi_divs[3].find('span', class_=re.compile(r'text-xl sm:text-2xl font-black text-emerald-600'))['id'] = 'stat-mrr'

# Search input id
search_input = main_tag.find('input', type='text')
if search_input:
    search_input['id'] = 'search-input'

# Filters IDs and classes
# we need to find the buttons for filters
filters_div = main_tag.find('div', class_=re.compile(r'bg-slate-100 dark:bg-slate-900/60'))
if filters_div:
    buttons = filters_div.find_all('button')
    if len(buttons) >= 4:
        buttons[0]['data-filter'] = 'todos'
        buttons[0]['class'] = buttons[0].get('class', []) + ['filter-btn', 'active']
        buttons[0].string = 'Todos '
        span0 = BeautifulSoup('<span class="filter-count-todos opacity-70"></span>', 'html.parser')
        buttons[0].append(span0)

        buttons[1]['data-filter'] = 'activo'
        buttons[1]['class'] = buttons[1].get('class', []) + ['filter-btn']
        buttons[1].string = 'Habilitados '
        span1 = BeautifulSoup('<span class="filter-count-activo opacity-70"></span>', 'html.parser')
        buttons[1].append(span1)

        buttons[2]['data-filter'] = 'por_vencer'
        buttons[2]['class'] = buttons[2].get('class', []) + ['filter-btn']
        buttons[2].string = 'Por Vencer (≤ 7d) '
        span2 = BeautifulSoup('<span class="filter-count-por_vencer opacity-70"></span>', 'html.parser')
        buttons[2].append(span2)

        buttons[3]['data-filter'] = 'vencidos'
        buttons[3]['class'] = buttons[3].get('class', []) + ['filter-btn']
        buttons[3].string = 'Vencidos / Bloqueados '
        span3 = BeautifulSoup('<span class="filter-count-vencidos opacity-70"></span>', 'html.parser')
        buttons[3].append(span3)
        
        # Add pendiente filter
        btn_pen = BeautifulSoup('<button data-filter="pendiente" class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-slate-600 dark:text-slate-400 hover:text-slate-900 filter-btn">Pendientes <span class="filter-count-pendiente opacity-70"></span></button>', 'html.parser')
        filters_div.append(btn_pen)

# Action buttons
btn_renew_all = main_tag.find('button', title=re.compile(r'\+30 Días a Todos|Sumar 30 días'))
if btn_renew_all:
    btn_renew_all['id'] = 'btn-renew-all'

btn_create = header_tag.find('button', text=re.compile(r'Nuevo Panel')) if header_tag else None
if btn_create:
    btn_create['id'] = 'btn-create-tenant'

# Create the new dashboard/tenants view string
new_view = str(header_tag) + "\n<div id=\"view-dashboard\" class=\"flex-1 overflow-y-auto\">" + "".join(str(c) for c in main_tag.contents) + "</div>"

# 2. Load the target file
with open('public/masteradmin.html', 'r', encoding='utf-8') as f:
    master_html = f.read()

# Replace the content
# We will replace from <main class="flex-1 flex flex-col min-h-screen overflow-hidden">
# to the start of <div id="view-rubros"
pattern = r'(<main class="flex-1 flex flex-col min-h-screen overflow-hidden">).*?(<div id="view-rubros")'
replacement = r'\1\n' + new_view + r'\n\2'
new_master_html = re.sub(pattern, replacement, master_html, flags=re.DOTALL)

with open('public/masteradmin.html', 'w', encoding='utf-8') as f:
    f.write(new_master_html)
