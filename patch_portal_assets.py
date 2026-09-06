import re

with open('public/portal.html', 'r', encoding='utf-8') as f:
    html = f.read()

pattern1 = r'\s*<script\s+type="module"\s+crossorigin=""\s+src="/assets/index-B_0uzRBB\.js"\s*></script>'
html = re.sub(pattern1, '', html)

pattern2 = r'\s*<link rel="stylesheet" crossorigin="" href="/assets/index-DLcsszoS\.css" />'
html = re.sub(pattern2, '', html)

with open('public/portal.html', 'w', encoding='utf-8') as f:
    f.write(html)
