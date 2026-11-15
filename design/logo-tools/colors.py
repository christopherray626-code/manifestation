import importlib.util, sys
spec = importlib.util.spec_from_file_location('weave', sys.argv[1]); w = importlib.util.module_from_spec(spec); spec.loader.exec_module(w)
KW = dict(R=320, sep=360, m=100)
ring = w.strands(ring=250, **KW); xr, orr, _, _ = w.weave(ring)

def lg(id, a, b, c=None, x2=1, y2=1):
    stops = f'<stop offset="0" stop-color="{a}"/>' + (f'<stop offset=".5" stop-color="{c}"/>' if c else '') + f'<stop offset="1" stop-color="{b}"/>'
    return f'<linearGradient id="{id}" x1="0" y1="0" x2="{x2}" y2="{y2}">{stops}</linearGradient>'
def rg(id, a, b):
    return f'<radialGradient id="{id}" cx="30%" cy="22%" r="95%"><stop offset="0" stop-color="{a}"/><stop offset="1" stop-color="{b}"/></radialGradient>'

# name, background (fill), ribbon colours [loop1, loop2, loop3, ring], halo colour (the gap at crossings), glow colour or None, defs
S = [
 ('Sky + white', 'url(#bSky)', ['#FFFFFF'] * 4, '#3E8EF0', None, rg('bSky', '#A9DCFF', '#3D86F0')),
 ('White + sky', '#F7FBFF', ['url(#rSky)'] * 4, '#F7FBFF', None, lg('rSky', '#7FD0FF', '#2F7BEF')),
 ('Navy + sky', 'url(#bNavy)', ['url(#rSky2)'] * 4, '#0A1430', '#5CB8FF', rg('bNavy', '#17305E', '#060B1C') + lg('rSky2', '#BDEBFF', '#4FA3FF')),
 ('Ice', '#E6F3FF', ['url(#rIce)'] * 3 + ['#FFFFFF'], '#E6F3FF', None, lg('rIce', '#5CC2FF', '#7A7CFF')),
 ('Sky glow', '#05070F', ['#FFFFFF'] * 3 + ['#8FD3FF'], '#05070F', '#4FB6FF', ''),
 ('Sky + purple ring', 'url(#bNight)', ['url(#rSky3)'] * 3 + ['url(#rPurp)'], '#0B0F26', None, rg('bNight', '#1C2350', '#070914') + lg('rSky3', '#C2EDFF', '#58AEFF') + lg('rPurp', '#D3B5FF', '#8A5CFF')),
 ('Purple + pink', 'url(#bPP)', ['#FFFFFF'] * 4, '#9B4DD6', None, lg('bPP', '#FF8BC8', '#7B3FE4')),
 ('Pink on purple', 'url(#bDeepP)', ['url(#rPink)'] * 4, '#24104A', '#FF7AC0', rg('bDeepP', '#3C1A78', '#140829') + lg('rPink', '#FFC2E3', '#FF5FAE')),
 ('Purple + blue', 'url(#bPB)', ['#FFFFFF'] * 4, '#5B5BEA', None, lg('bPB', '#7B4DFF', '#3FA0FF')),
 ('Blue → purple knot', '#0B0A14', ['url(#rBP)'] * 4, '#0B0A14', None, lg('rBP', '#5CC8FF', '#9B5CFF')),
 ('Lavender', '#EDE4FF', ['url(#rLav)'] * 4, '#EDE4FF', None, lg('rLav', '#B07CFF', '#6B3FD9')),
 ('Cotton candy', 'url(#bCC)', ['#FFFFFF'] * 4, '#C49BEF', None, lg('bCC', '#FFB3DA', '#8EC9FF')),
 ('Holographic', '#08070D', ['url(#rHolo)'] * 4, '#08070D', None, lg('rHolo', '#FF9AD5', '#7FE3FF', '#B596FF')),
 ('Neon', '#000000', ['url(#rNeon)'] * 4, '#000000', '#C34BFF', lg('rNeon', '#28E0FF', '#FF3DC8')),
 ('Sunset', 'url(#bSun)', ['#FFFFFF'] * 4, '#F2638A', None, lg('bSun', '#FFB36B', '#E0418F')),
 ('Ocean', 'url(#bOcean)', ['#FFFFFF'] * 4, '#1C8FB8', None, lg('bOcean', '#4FE0D0', '#2368D8')),
 ('Aurora', '#06080F', ['url(#rAur)'] * 4, '#06080F', '#3CE0B0', lg('rAur', '#56F0B0', '#9C6BFF', '#3CC8FF')),
 ('Mint + white', 'url(#bMint)', ['#FFFFFF'] * 4, '#3CC6A0', None, lg('bMint', '#B8F5D8', '#2EB79A')),
 ('Rose + peach', '#FFF2EC', ['url(#rRose)'] * 4, '#FFF2EC', None, lg('rRose', '#FFB08A', '#E8508F')),
 ('White on black', '#0A0A0A', ['#FFFFFF'] * 4, '#0A0A0A', None, ''),
 ('Black on white', '#FFFFFF', ['#111111'] * 4, '#FFFFFF', None, ''),
]
cells = []
for i, (name, bg, cols, halo, glow, defs) in enumerate(S):
    uid = f'k{i}'
    glow_svg = ''
    if glow:
        glow_svg = (f'<filter id="{uid}f" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="22"/></filter>'
                    f'<g filter="url(#{uid}f)" opacity=".75">' + ''.join(f'<path d="{w.path(s)}" fill="none" stroke="{glow}" stroke-width="40"/>' for s in ring) + '</g>')
    body = w.render(ring, xr, orr, uid, 36, 11, cols, halo)
    cells.append(f'<div class="opt"><svg viewBox="0 0 1024 1024"><defs>{defs}</defs><rect width="1024" height="1024" fill="{bg}"/>{glow_svg}{body}</svg>'
                 f'<div class="t">{i+1} · {name}</div></div>')
print('''<!doctype html><html><head><meta charset="utf-8"><title>Logo colours</title><style>
body{margin:0;background:#151519;color:#EEE;font-family:system-ui,sans-serif;padding:18px 14px 26px}
h1{font:600 13px system-ui;letter-spacing:.16em;text-transform:uppercase;color:#8C8CA0;margin:4px 4px 14px}
.grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px 10px}
.opt{text-align:center}.opt svg{width:100%;aspect-ratio:1;border-radius:23%;box-shadow:0 8px 22px rgba(0,0,0,.45)}
.t{font:600 12px system-ui;margin-top:6px}
</style></head><body><h1>Colour options · same woven knot</h1><div class="grid">''' + ''.join(cells) + '</div></body></html>')
