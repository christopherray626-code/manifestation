import importlib.util, sys, math
spec = importlib.util.spec_from_file_location('weave', sys.argv[1]); w = importlib.util.module_from_spec(spec); spec.loader.exec_module(w)
CX, CY = 512, 512
def knot(scale=1.0, ring=True, cy=CY, band=34, color='#FFFFFF', halo='#3E8EF0', uid='k', colors=None):
    S = w.strands(cx=CX, cy=cy + 30 * scale, R=320 * scale, sep=360 * scale, m=100 * scale, ring=250 * scale if ring else None)
    xs, ov, _, _ = w.weave(S)
    return w.render(S, xs, ov, uid, band * scale, 11 * scale, colors or [color], halo), S
# The launch animation's star and sparks (drawn in a 0-100 box, centre 50,50).
STAR = 'M50 6 C54 38 62 46 94 50 C62 54 54 62 50 94 C46 62 38 54 6 50 C38 46 46 38 50 6Z'
SPARK = 'M50 30 C52 46 54 48 70 50 C54 52 52 54 50 70 C48 54 46 52 30 50 C46 48 48 46 50 30Z'
def star(x, y, size, fill, rot=0, d=STAR):
    s = size / 88
    return f'<path transform="translate({x:.1f} {y:.1f}) rotate({rot}) scale({s:.3f}) translate(-50 -50)" d="{d}" fill="{fill}"/>'
def glow(x, y, r, color, op=.6):
    return f'<circle cx="{x}" cy="{y}" r="{r}" fill="url(#glow)" opacity="{op}" style="color:{color}"/>'
def sparks(pts, size, fill):
    return ''.join(star(x, y, size, fill, d=SPARK) for x, y in pts)
SKY = '<rect width="1024" height="1024" fill="url(#bSky)"/>'
NAVY = '<rect width="1024" height="1024" fill="url(#bNavy)"/>'
AURA = '<rect width="1024" height="1024" fill="url(#bAura)"/>'
W = '#FFFFFF'; ICE = '#BFE9FF'
DEFS = ('<radialGradient id="bSky" cx="30%" cy="22%" r="95%"><stop offset="0" stop-color="#A9DCFF"/><stop offset="1" stop-color="#3D86F0"/></radialGradient>'
        '<radialGradient id="bNavy" cx="50%" cy="38%" r="85%"><stop offset="0" stop-color="#17305E"/><stop offset="1" stop-color="#060B1C"/></radialGradient>'
        '<radialGradient id="bAura" cx="50%" cy="40%" r="85%"><stop offset="0" stop-color="#3A1C6E"/><stop offset="1" stop-color="#120724"/></radialGradient>'
        '<radialGradient id="glow" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#FFFFFF" stop-opacity=".8"/><stop offset=".45" stop-color="#9FD8FF" stop-opacity=".35"/><stop offset="1" stop-color="#9FD8FF" stop-opacity="0"/></radialGradient>'
        '<radialGradient id="glowP" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#FFFFFF" stop-opacity=".8"/><stop offset=".45" stop-color="#E7B8FF" stop-opacity=".35"/><stop offset="1" stop-color="#E7B8FF" stop-opacity="0"/></radialGradient>'
        '<linearGradient id="rSky" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#C2EDFF"/><stop offset="1" stop-color="#58AEFF"/></linearGradient>')
I = []
k1, S1 = knot(0.95, True, uid='a')
I.append(('Star heart', 'The launch star shining in the open middle of the knot.', SKY + f'<circle cx="512" cy="570" r="150" fill="url(#glow)"/>' + k1 + star(512, 572, 150, W)))
k2, S2 = knot(0.95, True, halo='#0A1430', uid='b', colors=['url(#rSky)'])
I.append(('Night star', 'Same idea at night: a sky-blue knot with a white star.', NAVY + f'<circle cx="512" cy="570" r="170" fill="url(#glow)"/>' + k2 + star(512, 572, 160, W)))
k3, S3 = knot(0.8, True, cy=560, uid='c')
I.append(('Crowned', 'The star rising above the knot, with three sparks.', SKY + f'<circle cx="512" cy="170" r="140" fill="url(#glow)"/>' + k3 + star(512, 175, 190, W) + sparks([(380, 140), (650, 115), (640, 250)], 50, W)))
k4, S4 = knot(0.78, True, cy=505, band=36, uid='d')
I.append(('Star behind', 'A big star glowing behind the woven knot.', SKY + f'<circle cx="512" cy="512" r="330" fill="url(#glow)" opacity=".55"/>' + star(512, 512, 880, '#FFFFFF', d=STAR).replace('fill="#FFFFFF"', 'fill="#FFFFFF" opacity=".3"') + k4))
# star tips: a spark at each loop's outer point
tips = []
for s in S1[:3]:
    tips.append(max(s, key=lambda p: math.hypot(p[0] - 512, p[1] - 542)))
k5, _ = knot(0.95, True, uid='e')
I.append(('Lit tips', 'A spark at the end of each loop, like the launch sparks.', SKY + k5 + sparks([(x + (x - 512) * 0.12, y + (y - 542) * 0.12) for x, y in tips], 110, W)))
k6, _ = knot(0.95, True, halo='#120724', uid='f', colors=['#F3DEFF'])
I.append(('Aura star', 'Launch-animation colours: the knot and star on violet.', AURA + f'<circle cx="512" cy="570" r="170" fill="url(#glowP)"/>' + k6 + star(512, 572, 150, '#E7B8FF') + sparks([(800, 210), (230, 230), (790, 800)], 60, '#E7B8FF')))
k7, _ = knot(0.95, False, uid='g')
I.append(('Knot + four sparks', 'No ring: the knot with a star in the middle and sparks around.', SKY + k7 + star(512, 560, 120, W) + sparks([(800, 230), (220, 250), (512, 900)], 54, W)))
k8, _ = knot(0.62, True, cy=520, band=40, halo='#0A1430', uid='h', colors=['url(#rSky)'])
I.append(('Knot in the star', 'The star is the shape; a small knot sits at its heart.', NAVY + star(512, 512, 900, W) + f'<circle cx="512" cy="512" r="210" fill="#0B1838"/>' + k8))
k9, _ = knot(0.95, True, uid='i')
I.append(('Splash', 'Closest to the launch animation: glow, star, three sparks, knot.', SKY + f'<circle cx="512" cy="560" r="230" fill="url(#glow)"/>' + k9 + star(512, 562, 175, W) + sparks([(760, 300), (300, 740), (740, 760)], 46, W)))
cards = ''.join(f'<div class="opt"><svg viewBox="0 0 1024 1024"><defs>{DEFS}</defs>{svg}</svg><div class="t">{i+1} · {n}</div><div class="s">{a}</div></div>' for i, (n, a, svg) in enumerate(I))
print('''<!doctype html><html><head><meta charset="utf-8"><title>Star + triquetra</title><style>
body{margin:0;background:#151519;color:#EEE;font-family:system-ui,sans-serif;padding:18px 14px 26px}
h1{font:600 13px system-ui;letter-spacing:.16em;text-transform:uppercase;color:#8C8CA0;margin:4px 4px 14px}
.grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px 10px}
.opt{text-align:center}.opt svg{width:100%;aspect-ratio:1;border-radius:23%;box-shadow:0 8px 22px rgba(0,0,0,.45)}
.t{font:600 12px system-ui;margin-top:6px}.s{font-size:10.5px;color:#9A9AB0;margin-top:2px;line-height:1.3}
</style></head><body><h1>Launch star + triquetra</h1><div class="grid">''' + cards + '</div></body></html>')
