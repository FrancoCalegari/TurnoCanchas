import re

with open('public/js/masteradmin.js', 'r', encoding='utf-8') as f:
    js = f.read()

pattern = r'(localStorage\.setItem\(\'tenantData\', JSON\.stringify\(res\.tenant\)\);\n                window\.open\(\'/admin\.html\', \'_blank\'\);\n            \})(\n        if \(deleteTenantBtn\))'
replacement = r'\1 catch (err) { showAlert("Error", err.message, "error"); }\n        }\2'

js = re.sub(pattern, replacement, js)

with open('public/js/masteradmin.js', 'w', encoding='utf-8') as f:
    f.write(js)
