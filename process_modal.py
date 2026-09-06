from bs4 import BeautifulSoup
import re

with open('modal_template.html', 'r', encoding='utf-8') as f:
    soup = BeautifulSoup(f, 'html.parser')

# Find form and give it an ID
form = soup.find('form')
if form:
    form['id'] = 'form-edit-tenant'
    # Add hidden input for ID
    hidden_input = BeautifulSoup('<input type="hidden" id="et-id">', 'html.parser')
    form.insert(0, hidden_input)

# Find inputs by their value or label text
labels = soup.find_all('label')
for label in labels:
    text = label.get_text(strip=True)
    input_tag = label.find_next_sibling('input')
    if not input_tag:
        # maybe it's inside a div
        div = label.find_next_sibling('div')
        if div:
            input_tag = div.find('input')
    if not input_tag:
        continue
    
    if 'Logo' in text:
        input_tag['id'] = 'et-logo'
    elif 'Nombre del Complejo' in text:
        input_tag['id'] = 'et-nombre'
    elif 'Slug' in text:
        input_tag['id'] = 'et-slug'
    elif 'Cliente' in text:
        input_tag['id'] = 'et-owner'
    elif 'WhatsApp' in text or 'Teléfono' in text:
        input_tag['id'] = 'et-telefono'
    elif 'Email' in text:
        input_tag['id'] = 'et-email'
    elif 'Dirección' in text:
        input_tag['id'] = 'et-ubicacion'

# Add ID to submit button
submit_btn = soup.find('button', type='submit')
if submit_btn:
    submit_btn['id'] = 'btn-et-confirm'

# Add ID to close buttons
close_btn = soup.find('button', text=re.compile('Cerrar', re.I))
if close_btn:
    close_btn['id'] = 'btn-et-cancel'
# Also the top right X
close_x = soup.find('button', title='Cerrar ventana')
if close_x:
    close_x['id'] = 'btn-et-close'

# We should give the modal a container ID so it matches #modal-edit-tenant
# The outer div is the modal
outer_div = soup.find('div')
outer_div['id'] = 'modal-edit-tenant'
outer_div['class'] = outer_div.get('class', []) + ['hidden'] # hide by default
# The inner div is content
inner_div = outer_div.find('div', recursive=False)
inner_div['id'] = 'modal-edit-tenant-content'

# Write back
with open('modal_template.html', 'w', encoding='utf-8') as f:
    f.write(str(soup))
