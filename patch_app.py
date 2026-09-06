import re

with open('public/js/app.js', 'r', encoding='utf-8') as f:
    js = f.read()

new_logic = """            if (ajustes.ubicacion_maps) {
                const mapsLink = document.getElementById('btn-ubicacion-header');
                if (mapsLink) {
                    mapsLink.href = ajustes.ubicacion_maps;
                }
                const infoMapsLink = document.getElementById('info-ubicacion');
                if (infoMapsLink) infoMapsLink.href = ajustes.ubicacion_maps;
            }

            if (document.getElementById('info-wifi-ssid')) document.getElementById('info-wifi-ssid').textContent = ajustes.info_wifi_ssid || 'No disponible';
            if (document.getElementById('info-wifi-pass')) document.getElementById('info-wifi-pass').textContent = ajustes.info_wifi_pass || 'No disponible';
            if (document.getElementById('info-buffet')) document.getElementById('info-buffet').textContent = ajustes.info_buffet || 'Servicios no especificados.';
            if (document.getElementById('info-reglas')) document.getElementById('info-reglas').textContent = ajustes.info_reglas || 'No hay reglamento especificado.';
"""

pattern = r'(            if \(ajustes\.ubicacion_maps\) \{.*?\n                \}\n            \})'
js = re.sub(pattern, new_logic, js, flags=re.DOTALL)

with open('public/js/app.js', 'w', encoding='utf-8') as f:
    f.write(js)
