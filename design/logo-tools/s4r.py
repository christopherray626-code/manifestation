import importlib.util, sys, math
spec = importlib.util.spec_from_file_location('weave', sys.argv[1]); w = importlib.util.module_from_spec(spec); spec.loader.exec_module(w)
def star_path(k=0.12):
    # four-point star in a -1..1 box; k sets how thin the points are (smaller = sharper)
    return (f'M0,-1 C{k},-{k} {k},-{k} 1,0 C{k},{k} {k},{k} 0,1 C-{k},{k} -{k},{k} -1,0 C-{k},-{k} -{k},-{k} 0,-1Z')
def star(x, y, size, fill, op=1, k=0.12, rot=0, extra=''):
    return f'<path transform="translate({x} {y}) rotate({rot}) scale({size / 2:.1f})" d="{star_path(k)}" fill="{fill}" opacity="{op}" {extra}/>'
def knot(uid, scale=0.78, ring=True, band=36, colors=('#FFFFFF',), outline=None, cy=512):
    S = w.strands(cx=512, cy=cy + 30 * scale, R=320 * scale, sep=360 * scale, m=100 * scale, ring=250 * scale if ring else None)
    xs, ov, _, _ = w.weave(S)
    return w.render(S, xs, ov, uid, band * scale, 11 * scale, list(colors), '#000', outline=outline), S
BG = '<rect width="1024" height="1024" fill="url(#bg)"/>'
GLOW = '<circle cx="512" cy="512" r="{r}" fill="url(#gl)" opacity="{o}"/>'
DEFS = ('<radialGradient id="bg" cx="35%" cy="25%" r="95%"><stop offset="0" stop-color="#6CC4FF"/><stop offset="1" stop-color="#1F5FD6"/></radialGradient>'
        '<radialGradient id="gl" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#E4F5FF" stop-opacity=".85"/><stop offset="1" stop-color="#E4F5FF" stop-opacity="0"/></radialGradient>'
        '<linearGradient id="kg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#CFEAFF"/></linearGradient>'
        '<linearGradient id="sg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF" stop-opacity=".55"/><stop offset="1" stop-color="#FFFFFF" stop-opacity=".2"/></linearGradient>'
        '<filter id="shadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="10" stdDeviation="14" flood-color="#0A2A70" flood-opacity=".45"/></filter>'
        '<filter id="soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="10"/></filter>')
I = []
def add(n, a, svg): I.append((n, a, svg))
k, _ = knot('a'); add('Current', 'The pick as it is now, for comparison.', BG + GLOW.format(r=330, o=.6) + star(512, 512, 880, '#fff', .3) + k)
k, _ = knot('b', band=24); add('Thinner ribbons', 'Finer, more elegant knot.', BG + GLOW.format(r=330, o=.6) + star(512, 512, 880, '#fff', .3) + k)
k, _ = knot('c', band=46, colors=('#1F5FD6',), outline='#FFFFFF'); add('Outlined ribbons', 'Each ribbon drawn as two fine lines, like the reference.', BG + GLOW.format(r=330, o=.6) + star(512, 512, 880, '#fff', .3) + k)
k, _ = knot('d'); add('Sharper star', 'Longer, needle-thin star points.', BG + GLOW.format(r=330, o=.6) + star(512, 512, 960, '#fff', .38, k=0.05) + k)
k, _ = knot('e'); add('Solid star', 'The star solid white with the knot cut into it.', BG + star(512, 512, 900, '#fff', 1, k=0.09) + knot('e2', colors=('#1F5FD6',))[0])
k, _ = knot('f'); add('Eight points', 'A smaller diagonal star behind the main one, like a compass.', BG + GLOW.format(r=330, o=.6) + star(512, 512, 600, '#fff', .2, k=0.08, rot=45) + star(512, 512, 900, '#fff', .32) + k)
k, _ = knot('g', ring=False, scale=0.84); add('No ring', 'Just the three loops over the star: cleaner.', BG + GLOW.format(r=320, o=.6) + star(512, 512, 880, '#fff', .32) + k)
k, _ = knot('h', scale=0.62, band=40); add('Smaller knot', 'More star, more space around the knot.', BG + GLOW.format(r=280, o=.65) + star(512, 512, 900, '#fff', .38, k=0.08) + k)
k, _ = knot('i', scale=0.9); add('Bigger knot', 'The knot fills the icon, star peeks out.', BG + GLOW.format(r=340, o=.55) + star(512, 512, 960, '#fff', .3) + k)
k, _ = knot('j'); add('With sparks', 'Three small sparks, like the launch animation.', BG + GLOW.format(r=330, o=.6) + star(512, 512, 880, '#fff', .3) + k + star(800, 230, 70, '#fff', .95, k=0.1) + star(225, 790, 50, '#fff', .9, k=0.1) + star(820, 790, 38, '#fff', .85, k=0.1))
k, _ = knot('k'); add('Light rays', 'Thin rays of light behind, a lens-flare feel.', BG + GLOW.format(r=330, o=.6) + ''.join(f'<line x1="512" y1="512" x2="{512 + 470 * math.cos(math.radians(a)):.0f}" y2="{512 + 470 * math.sin(math.radians(a)):.0f}" stroke="#fff" stroke-width="3" opacity=".25"/>' for a in range(0, 360, 15)) + star(512, 512, 880, '#fff', .3) + k)
k, _ = knot('l', colors=('url(#kg)',)); add('Depth', 'A soft shadow and a white-to-ice knot, so it lifts off the page.', BG + GLOW.format(r=330, o=.6) + star(512, 512, 880, 'url(#sg)', 1, k=0.08) + f'<g filter="url(#shadow)">{k}</g>')
k, _ = knot('m'); add('Glow star', 'The star blurred into pure light.', BG + f'<g filter="url(#soft)">' + star(512, 512, 900, '#fff', .55, k=0.07) + '</g>' + GLOW.format(r=260, o=.7) + k)
k, _ = knot('n', ring=False, scale=0.84, colors=('url(#kg)',)); add('No ring + depth + sparks', 'A mix: no ring, shadow, sharper star, sparks.', BG + GLOW.format(r=320, o=.6) + star(512, 512, 960, 'url(#sg)', 1, k=0.05) + f'<g filter="url(#shadow)">{k}</g>' + star(805, 225, 64, '#fff', .95, k=0.1) + star(225, 800, 44, '#fff', .9, k=0.1))
k, _ = knot('o', band=24, colors=('url(#kg)',)); add('Thin + depth + rays', 'A mix: fine ribbons, rays, shadow.', BG + GLOW.format(r=330, o=.6) + ''.join(f'<line x1="512" y1="512" x2="{512 + 470 * math.cos(math.radians(a)):.0f}" y2="{512 + 470 * math.sin(math.radians(a)):.0f}" stroke="#fff" stroke-width="3" opacity=".22"/>' for a in range(0, 360, 15)) + star(512, 512, 920, 'url(#sg)', 1, k=0.06) + f'<g filter="url(#shadow)">{k}</g>')
cards = ''.join(f'<div class="opt"><svg viewBox="0 0 1024 1024"><defs>{DEFS}</defs>{svg}</svg><div class="t">{i+1} · {n}</div><div class="s">{a}</div></div>' for i, (n, a, svg) in enumerate(I))
print('''<!doctype html><html><head><meta charset="utf-8"><title>Star behind: refinements</title><style>
body{margin:0;background:#151519;color:#EEE;font-family:system-ui,sans-serif;padding:18px 14px 26px}
h1{font:600 13px system-ui;letter-spacing:.16em;text-transform:uppercase;color:#8C8CA0;margin:4px 4px 14px}
.grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px 10px}
.opt{text-align:center}.opt svg{width:100%;aspect-ratio:1;border-radius:23%;box-shadow:0 8px 22px rgba(0,0,0,.45)}
.t{font:600 12px system-ui;margin-top:6px}.s{font-size:10.5px;color:#9A9AB0;margin-top:2px;line-height:1.3}
</style></head><body><h1>Star behind · refinements</h1><div class="grid">''' + cards + '</div></body></html>')
