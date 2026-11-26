"""Replace the old in-script table of contents (stale wrapper notes) with a pointer to CODEMAP.md. Comments only.
usage: python3 -I finalize.py <in.html> <out.html>
"""
import re, sys
src, dst = sys.argv[1], sys.argv[2]
L = open(src, encoding='utf-8').read().split('\n')
s = next(i for i, l in enumerate(L) if l.strip() == '<script>') + 1
# end of the TOC = the bar line right before the "[01] DOM" section marker
k = next(i for i in range(s, s + 400) if re.match(r'\s*//\s*\[01\]\s*DOM', L[i]) and i > s + 20)
e = k - 1 if re.match(r'\s*//\s*═{5,}', L[k - 1]) else k
new = [
    '  // CoH 1944 — game script.',
    '  // The split source tree is the source of truth: CODEMAP.md has the file map, the wrapper chains (js/chains/)',
    '  // and the lookup tools. All JS files form ONE classic script: they share one global scope and run top to bottom',
    '  // in manifest.txt order. Function declarations are hoisted, so a function can live in any file.',
    '',
]
L = L[:s] + new + L[e:]
open(dst, 'w', encoding='utf-8', newline='').write('\n'.join(L))
print('TOC replaced:', e - s, 'lines ->', len(new))
