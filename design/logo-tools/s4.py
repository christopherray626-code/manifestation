import importlib.util, sys
spec = importlib.util.spec_from_file_location('weave', sys.argv[1]); w = importlib.util.module_from_spec(spec); spec.loader.exec_module(w)
S = w.strands(cx=512, cy=505 + 30 * 0.78, R=320 * 0.78, sep=360 * 0.78, m=100 * 0.78, ring=250 * 0.78)
xs, ov, _, _ = w.weave(S)
STAR = 'M50 6 C54 38 62 46 94 50 C62 54 54 62 50 94 C46 62 38 54 6 50 C38 46 46 38 50 6Z'
def bgdef(i, kind, a, b, c=None):
    if kind == 'flat': return '', a
    stops = f'<stop offset="0" stop-color="{a}"/>' + (f'<stop offset=".5" stop-color="{c}"/>' if c else '') + f'<stop offset="1" stop-color="{b}"/>'
    if kind == 'radial':
        return f'<radialGradient id="bg{i}" cx="35%" cy="25%" r="95%">{stops}</radialGradient>', f'url(#bg{i})'
    return f'<linearGradient id="bg{i}" x1="0" y1="0" x2="1" y2="1">{stops}</linearGradient>', f'url(#bg{i})'
def gdef(i, a, b, c=None):
    stops = f'<stop offset="0" stop-color="{a}"/>' + (f'<stop offset=".5" stop-color="{c}"/>' if c else '') + f'<stop offset="1" stop-color="{b}"/>'
    return f'<linearGradient id="kn{i}" x1="0" y1="0" x2="1" y2="1">{stops}</linearGradient>', f'url(#kn{i})'
# name, background, knot colour (or gradient), star colour, star opacity, glow colour
V = [
 ('Sky + white (original)', ('radial', '#A9DCFF', '#3D86F0'), '#FFFFFF', '#FFFFFF', .3, '#FFFFFF'),
 ('Deep sky', ('radial', '#6CC4FF', '#1F5FD6'), '#FFFFFF', '#FFFFFF', .35, '#BFE9FF'),
 ('Baby blue', ('radial', '#E3F4FF', '#9CD3FF'), '#FFFFFF', '#FFFFFF', .7, '#FFFFFF'),
 ('White + sky knot', ('flat', '#F6FBFF', None), ('#7FD0FF', '#2F7BEF'), '#9CD6FF', .35, '#CDEBFF'),
 ('Navy + sky', ('radial', '#1D3A6E', '#060B1C'), ('#C2EDFF', '#58AEFF'), '#7FC8FF', .3, '#5CB8FF'),
 ('Midnight + white', ('radial', '#1A1F3D', '#05060E'), '#FFFFFF', '#9FD8FF', .28, '#6FB8FF'),
 ('Sky → lavender', ('linear', '#9FDCFF', '#A68BFF'), '#FFFFFF', '#FFFFFF', .32, '#FFFFFF'),
 ('Purple + blue', ('linear', '#7B4DFF', '#3FA0FF'), '#FFFFFF', '#FFFFFF', .28, '#D9C9FF'),
 ('Purple + pink', ('linear', '#FF8BC8', '#7B3FE4'), '#FFFFFF', '#FFFFFF', .3, '#FFD1EA'),
 ('Pink on plum', ('radial', '#3C1A78', '#120726'), ('#FFC2E3', '#FF5FAE'), '#FF9AD0', .3, '#FF7AC0'),
 ('Lavender light', ('radial', '#F2EBFF', '#CDB8FF'), ('#A77BFF', '#6B3FD9'), '#FFFFFF', .8, '#FFFFFF'),
 ('Violet aura', ('radial', '#5A2CA8', '#170A33'), '#F3DEFF', '#E7B8FF', .3, '#E7B8FF'),
 ('Cotton candy', ('linear', '#FFB3DA', '#8EC9FF'), '#FFFFFF', '#FFFFFF', .4, '#FFFFFF'),
 ('Holographic on black', ('flat', '#08070D', None), ('#FF9AD5', '#7FE3FF', '#B596FF'), '#B596FF', .25, '#9F8BFF'),
 ('Teal ocean', ('linear', '#4FE0D0', '#2368D8'), '#FFFFFF', '#FFFFFF', .3, '#D4FFF8'),
 ('Aurora', ('radial', '#0E2A3A', '#04070D'), ('#56F0B0', '#9C6BFF', '#3CC8FF'), '#56F0D0', .22, '#3CE0B0'),
 ('Sunrise', ('linear', '#FFC98B', '#FF6FA8'), '#FFFFFF', '#FFFFFF', .35, '#FFF0D9'),
 ('Black + sky', ('flat', '#050608', None), ('#BDEBFF', '#4FA3FF'), '#4FA3FF', .25, '#2F80FF'),
 ('Silver', ('radial', '#3A3F4D', '#101217'), ('#FFFFFF', '#AEB6C6'), '#DDE3EE', .22, '#C8D2E6'),
 ('Monochrome white', ('flat', '#FFFFFF', None), '#111111', '#111111', .12, '#FFFFFF'),
]
cells = []
for i, (name, bg, knot, starc, starop, glow) in enumerate(V):
    d_bg, fill_bg = bgdef(i, *bg) if bg[0] != 'flat' else ('', bg[1])
    if isinstance(knot, tuple):
        d_k, kc = gdef(i, *knot)
    else:
        d_k, kc = '', knot
    defs = (d_bg + d_k + f'<radialGradient id="gl{i}" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="{glow}" stop-opacity=".75"/><stop offset="1" stop-color="{glow}" stop-opacity="0"/></radialGradient>')
    body = (f'<rect width="1024" height="1024" fill="{fill_bg}"/>'
            f'<circle cx="512" cy="512" r="330" fill="url(#gl{i})" opacity=".6"/>'
            f'<path transform="translate(512 512) scale({880/88:.3f}) translate(-50 -50)" d="{STAR}" fill="{starc}" opacity="{starop}"/>'
            + w.render(S, xs, ov, f'v{i}', 36 * 0.78, 11 * 0.78, [kc], '#000'))
    cells.append(f'<div class="opt"><svg viewBox="0 0 1024 1024"><defs>{defs}</defs>{body}</svg><div class="t">{i+1} · {name}</div></div>')
print('''<!doctype html><html><head><meta charset="utf-8"><title>Star behind: colours</title><style>
body{margin:0;background:#151519;color:#EEE;font-family:system-ui,sans-serif;padding:18px 14px 26px}
h1{font:600 13px system-ui;letter-spacing:.16em;text-transform:uppercase;color:#8C8CA0;margin:4px 4px 14px}
.grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px 10px}
.opt{text-align:center}.opt svg{width:100%;aspect-ratio:1;border-radius:23%;box-shadow:0 8px 22px rgba(0,0,0,.45)}
.t{font:600 12px system-ui;margin-top:6px}
</style></head><body><h1>Star behind · colour schemes</h1><div class="grid">''' + ''.join(cells) + '</div></body></html>')
