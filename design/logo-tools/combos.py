import importlib.util, sys, math
spec = importlib.util.spec_from_file_location('weave', sys.argv[1]); w = importlib.util.module_from_spec(spec); spec.loader.exec_module(w)

CX, CY = 512, 512
def knot(scale=1.0, ring=True, cy=CY, band=34, color='#FFFFFF', halo='#3E8EF0', uid='k'):
    R = 320 * scale
    S = w.strands(cx=CX, cy=cy + 30 * scale, R=R, sep=360 * scale, m=100 * scale, ring=250 * scale if ring else None)
    xs, ov, _, _ = w.weave(S)
    return w.render(S, xs, ov, uid, band * scale, 11 * scale, [color], halo)
def circ(x, y, r, c, sw, op=1):
    return f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r:.1f}" fill="none" stroke="{c}" stroke-width="{sw}" opacity="{op}"/>'
def seed(x, y, r, c, sw, op=1, rings=1):
    out = circ(x, y, r, c, sw, op)
    for a in range(0, 360, 60):
        out += circ(x + r * math.cos(math.radians(a)), y + r * math.sin(math.radians(a)), r, c, sw, op)
    if rings > 1: out += circ(x, y, r * 2, c, sw, op)
    return out
def spark(x, y, s, c, k=0.08):
    return (f'<path transform="translate({x:.1f} {y:.1f}) scale({s})" fill="{c}" d="M0,-1 C{k},-{k} {k},-{k} 1,0 C{k},{k} {k},{k} 0,1 '
            f'C-{k},{k} -{k},{k} -1,0 C-{k},-{k} -{k},-{k} 0,-1Z"/>')
def petal(x, y, h, wdt, ang, c, sw, fill='none'):
    return (f'<path transform="rotate({ang} {x} {y})" d="M{x},{y} C{x - wdt},{y - h * 0.35} {x - wdt * 0.7},{y - h * 0.8} {x},{y - h} '
            f'C{x + wdt * 0.7},{y - h * 0.8} {x + wdt},{y - h * 0.35} {x},{y}Z" fill="{fill}" stroke="{c}" stroke-width="{sw}" stroke-linejoin="round"/>')
def lotus(x, y, h, c, sw):
    return ''.join(petal(x, y, h * k, h * 0.32, a, c, sw) for a, k in ((-62, .72), (62, .72), (-30, .9), (30, .9), (0, 1)))
def spiral_pts(x, y, turns, a, rot):
    pts = []
    n = int(turns * 80)
    for i in range(n + 1):
        th = i / 80 * 2 * math.pi
        r = a * th
        pts.append((x + r * math.cos(th + rot), y + r * math.sin(th + rot)))
    return pts
def poly(pts, c, sw):
    return f'<path d="M' + ' L'.join(f'{px:.1f},{py:.1f}' for px, py in pts) + f'" fill="none" stroke="{c}" stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round"/>'
def triskele(x, y, s, c, sw):
    """Three spirals, each winding in around its own centre and sweeping smoothly out into the middle."""
    out = ''
    for k in range(3):
        ang = math.radians(-90 + 120 * k)
        cx, cy = x + s * 0.5 * math.cos(ang), y + s * 0.5 * math.sin(ang)
        a = s * 0.05
        turns = 1.75
        start = ang + math.pi  # the spiral's outer end faces the middle
        pts = []
        n = int(turns * 120)
        for i in range(n + 1):
            th = i / 120 * 2 * math.pi
            r = a * th
            pts.append((cx + r * math.cos(start - turns * 2 * math.pi + th), cy + r * math.sin(start - turns * 2 * math.pi + th)))
        ex, ey = pts[-1]; px, py = pts[-6]
        tx, ty = ex - px, ey - py; L = math.hypot(tx, ty) or 1; tx, ty = tx / L, ty / L
        c1x, c1y = ex + tx * s * 0.28, ey + ty * s * 0.28
        out += poly(pts, c, sw) + f'<path d="M{ex:.1f},{ey:.1f} C{c1x:.1f},{c1y:.1f} {x + (c1x - x) * 0.25:.1f},{y + (c1y - y) * 0.25:.1f} {x},{y}" fill="none" stroke="{c}" stroke-width="{sw}" stroke-linecap="round"/>'
    return out
def rays(x, y, r1, r2, n, c, sw):
    return ''.join(f'<line x1="{x + r1 * math.cos(2 * math.pi * i / n):.1f}" y1="{y + r1 * math.sin(2 * math.pi * i / n):.1f}" x2="{x + r2 * math.cos(2 * math.pi * i / n):.1f}" y2="{y + r2 * math.sin(2 * math.pi * i / n):.1f}" stroke="{c}" stroke-width="{sw}" stroke-linecap="round"/>' for i in range(n))

SKY = '<rect width="1024" height="1024" fill="url(#bSky)"/>'
NAVY = '<rect width="1024" height="1024" fill="url(#bNavy)"/>'
PP = '<rect width="1024" height="1024" fill="url(#bPP)"/>'
W = '#FFFFFF'
DEFS = ('<radialGradient id="bSky" cx="30%" cy="22%" r="95%"><stop offset="0" stop-color="#A9DCFF"/><stop offset="1" stop-color="#3D86F0"/></radialGradient>'
        '<radialGradient id="bNavy" cx="50%" cy="35%" r="85%"><stop offset="0" stop-color="#17305E"/><stop offset="1" stop-color="#060B1C"/></radialGradient>'
        '<linearGradient id="bPP" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FF8BC8"/><stop offset="1" stop-color="#7B3FE4"/></linearGradient>'
        '<radialGradient id="glowW" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fff" stop-opacity=".7"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>')
I = []
I.append(('Knot + seed of life', 'The woven knot over the seed of life, the pattern said to stand for creation.', SKY + seed(512, 540, 125, W, 4, .4) + knot(0.92, False, uid='a')))
I.append(('Knot + lotus', 'The knot rising out of a lotus: something blooming into being.', SKY + lotus(512, 900, 380, W, 9) + knot(0.55, True, cy=300, band=38, uid='b')))
I.append(('Knot in a vesica', 'Two circles crossing (where new things begin), holding the knot.', SKY + circ(410, 512, 300, W, 6, .6) + circ(614, 512, 300, W, 6, .6) + knot(0.62, False, cy=490, uid='c')))
I.append(('Knot + sun', 'The knot in its ring, with rays: light and creation.', SKY + rays(512, 540, 300, 360, 24, W, 8) + knot(0.9, True, uid='d')))
I.append(('Knot + spark', 'A spark lit at the open heart of the knot.', NAVY + '<circle cx="512" cy="560" r="150" fill="url(#glowW)" opacity=".6"/>' + knot(0.95, True, halo='#0A1430', uid='e') + spark(512, 565, 70, '#BFE9FF')))
I.append(('Knot + flower ring', 'The knot inside a ring of seed-of-life petals.', SKY + ''.join(circ(512 + 300 * math.cos(math.radians(a)), 540 + 300 * math.sin(math.radians(a)), 95, W, 4, .45) for a in range(0, 360, 30)) + knot(0.78, True, uid='f')))
I.append(('Triskele', 'The Celtic triple spiral, the triquetra\'s cousin: growth and motion.', SKY + triskele(512, 512, 330, W, 30) + circ(512, 512, 395, W, 10, .9)))
I.append(('Triskele + knot', 'Triple spirals turning around a small woven knot.', NAVY + triskele(512, 512, 360, '#8FD3FF', 22) + knot(0.42, True, cy=500, band=40, halo='#0A1430', uid='h')))
I.append(('Lotus + seed', 'A lotus blooming inside the seed of life.', SKY + seed(512, 470, 120, W, 4, .4, rings=2) + lotus(512, 700, 330, W, 10)))
I.append(('Vesica spiral', 'A spiral of growth inside the vesica.', SKY + circ(430, 512, 250, W, 8) + circ(594, 512, 250, W, 8) + poly(spiral_pts(512, 512, 2.6, 13, 0), W, 14)))
I.append(('Knot + seed (pink/purple)', 'Same as 1 in purple and pink, to compare.', PP + seed(512, 540, 125, W, 4, .4) + knot(0.92, False, halo='#B04CC8', uid='k')))
I.append(('Lotus knot (pink/purple)', 'Same as 2 in purple and pink.', PP + lotus(512, 900, 380, W, 9) + knot(0.55, True, cy=300, band=38, halo='#C058C0', uid='l')))
cards = ''.join(f'<div class="opt"><svg viewBox="0 0 1024 1024"><defs>{DEFS}</defs>{svg}</svg><div class="t">{i+1} · {n}</div><div class="s">{a}</div></div>' for i, (n, a, svg) in enumerate(I))
print('''<!doctype html><html><head><meta charset="utf-8"><title>Symbol combinations</title><style>
body{margin:0;background:#151519;color:#EEE;font-family:system-ui,sans-serif;padding:18px 14px 26px}
h1{font:600 13px system-ui;letter-spacing:.16em;text-transform:uppercase;color:#8C8CA0;margin:4px 4px 14px}
.grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px 10px}
.opt{text-align:center}.opt svg{width:100%;aspect-ratio:1;border-radius:23%;box-shadow:0 8px 22px rgba(0,0,0,.45)}
.t{font:600 12px system-ui;margin-top:6px}.s{font-size:10.5px;color:#9A9AB0;margin-top:2px;line-height:1.3}
</style></head><body><h1>Symbol combinations</h1><div class="grid">''' + cards + '</div></body></html>')
