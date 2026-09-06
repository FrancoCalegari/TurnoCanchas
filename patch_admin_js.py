import re

with open('public/js/admin.js', 'r', encoding='utf-8') as f:
    js = f.read()

# In loadAjustes
pattern_load = r'(            document\.getElementById\(\'ajustes-mp-alias\'\)\.value = data\.mercadopago_alias \|\| \'\';)'
new_load = """            document.getElementById('ajustes-mp-alias').value = data.mercadopago_alias || '';
            document.getElementById('ajustes-wifi-ssid').value = data.info_wifi_ssid || '';
            document.getElementById('ajustes-wifi-pass').value = data.info_wifi_pass || '';
            document.getElementById('ajustes-buffet').value = data.info_buffet || '';
            document.getElementById('ajustes-reglas').value = data.info_reglas || '';
"""
js = re.sub(pattern_load, new_load, js)

# In save form
pattern_save = r'(            const body = \{.*?)(\n                mercadopago_alias: document\.getElementById\(\'ajustes-mp-alias\'\)\.value)'
new_save = r"""\1\2,
                info_wifi_ssid: document.getElementById('ajustes-wifi-ssid').value,
                info_wifi_pass: document.getElementById('ajustes-wifi-pass').value,
                info_buffet: document.getElementById('ajustes-buffet').value,
                info_reglas: document.getElementById('ajustes-reglas').value"""
js = re.sub(pattern_save, new_save, js, flags=re.DOTALL)

with open('public/js/admin.js', 'w', encoding='utf-8') as f:
    f.write(js)
