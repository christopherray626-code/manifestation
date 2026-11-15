import math, itertools

def lens_pts(c1, c2, R, n=400):
    (x1, y1), (x2, y2) = c1, c2
    dx, dy = x2 - x1, y2 - y1; d = math.hypot(dx, dy)
    a = d / 2; h = math.sqrt(R * R - a * a)
    mx, my = x1 + dx / 2, y1 + dy / 2
    px, py = -dy / d, dx / d
    p1 = (mx + px * h, my + py * h); p2 = (mx - px * h, my - py * h)
    def arc(c, pa, pb):
        a0 = math.atan2(pa[1] - c[1], pa[0] - c[0]); a1 = math.atan2(pb[1] - c[1], pb[0] - c[0])
        # take the short way round
        da = (a1 - a0 + math.pi) % (2 * math.pi) - math.pi
        return [(c[0] + R * math.cos(a0 + da * t / n), c[1] + R * math.sin(a0 + da * t / n)) for t in range(n)]
    return arc(c2, p1, p2) + arc(c1, p2, p1)

def vesica(cx, cy, theta, m, R, sep, n=420):
    """An almond loop pointing at angle theta: two circles of radius R, `sep` apart across the axis,
    its middle `m` out from the knot's centre."""
    ux, uy = math.cos(theta), math.sin(theta)
    vx, vy = -uy, ux
    mx, my = cx + ux * m, cy + uy * m
    c1 = (mx + vx * sep / 2, my + vy * sep / 2); c2 = (mx - vx * sep / 2, my - vy * sep / 2)
    half = math.sqrt(R * R - (sep / 2) ** 2)
    tip_out = (mx + ux * half, my + uy * half); tip_in = (mx - ux * half, my - uy * half)
    def arc(c, pa, pb):
        a0 = math.atan2(pa[1] - c[1], pa[0] - c[0]); a1 = math.atan2(pb[1] - c[1], pb[0] - c[0])
        da = (a1 - a0 + math.pi) % (2 * math.pi) - math.pi
        return [(c[0] + R * math.cos(a0 + da * t / n), c[1] + R * math.sin(a0 + da * t / n)) for t in range(n)]
    return arc(c2, tip_out, tip_in) + arc(c1, tip_in, tip_out)

def strands(cx=512, cy=560, R=300, sep=300, m=130, ring=None):
    out = [vesica(cx, cy, math.radians(a), m, R, sep) for a in (-90, 30, 150)]
    if ring:
        out.append([(cx + ring * math.cos(2 * math.pi * t / 900), cy + ring * math.sin(2 * math.pi * t / 900)) for t in range(900)])
    return out

def seg_x(p, q, r, s):
    d = (q[0] - p[0]) * (s[1] - r[1]) - (q[1] - p[1]) * (s[0] - r[0])
    if abs(d) < 1e-9: return None
    t = ((r[0] - p[0]) * (s[1] - r[1]) - (r[1] - p[1]) * (s[0] - r[0])) / d
    u = ((r[0] - p[0]) * (q[1] - p[1]) - (r[1] - p[1]) * (q[0] - p[0])) / d
    if 0 <= t < 1 and 0 <= u < 1: return (p[0] + t * (q[0] - p[0]), p[1] + t * (q[1] - p[1])), t, u
    return None

def crossings(S):
    xs = []
    for a, b in itertools.combinations(range(len(S)), 2):
        A, B = S[a], S[b]
        for i in range(len(A)):
            p, q = A[i], A[(i + 1) % len(A)]
            for j in range(len(B)):
                r = seg_x(p, q, B[j], B[(j + 1) % len(B)])
                if r:
                    pt, t, u = r
                    if all(math.hypot(pt[0] - x['pt'][0], pt[1] - x['pt'][1]) > 25 for x in xs):
                        xs.append({'pt': pt, 'a': a, 'b': b, 'ia': i + t, 'ib': j + u})
    return xs

def weave(S):
    """Pick which strand goes over at each crossing so each strand alternates over, under, over…"""
    xs = crossings(S)
    order = {k: sorted([(x['ia'] if x['a'] == k else x['ib'], n) for n, x in enumerate(xs) if k in (x['a'], x['b'])]) for k in range(len(S))}
    rank = {}
    for k, lst in order.items():
        for pos, (_, n) in enumerate(lst): rank[(k, n)] = pos
    best = None
    for bits in itertools.product([0, 1], repeat=len(S)):
        good = 0; overs = []
        for n, x in enumerate(xs):
            a_over = (rank[(x['a'], n)] + bits[x['a']]) % 2 == 0
            b_over = (rank[(x['b'], n)] + bits[x['b']]) % 2 == 0
            if a_over != b_over: good += 1
            overs.append(x['a'] if a_over else x['b'])
        if best is None or good > best[0]: best = (good, overs)
    return xs, best[1], best[0], len(xs)

def path(pts):
    return 'M' + ' L'.join(f'{x:.1f},{y:.1f}' for x, y in pts) + 'Z'

def render(S, xs, overs, uid, band, gap, colors, halo, outline=None):
    """Ribbons: each strand as a band, then at each crossing the strand on top is drawn again, clipped to
    a small disc, over a halo in the background colour, so the one underneath looks like it passes below."""
    out = []
    def strand(k, extra=''):
        d = path(S[k]); c = colors[k % len(colors)]
        if outline:
            return (f'<path d="{d}" fill="none" stroke="{outline}" stroke-width="{band}" stroke-linejoin="round" {extra}/>'
                    f'<path d="{d}" fill="none" stroke="{c}" stroke-width="{band - 2 * outline_w}" stroke-linejoin="round" {extra}/>')
        return f'<path d="{d}" fill="none" stroke="{c}" stroke-width="{band}" stroke-linejoin="round" {extra}/>'
    outline_w = band * 0.16
    clips, mask, tops = [], [], []
    for n, (x, k) in enumerate(zip(xs, overs)):
        cid = f'{uid}c{n}'
        clips.append(f'<clipPath id="{cid}"><circle cx="{x["pt"][0]:.1f}" cy="{x["pt"][1]:.1f}" r="{band * 1.15:.1f}"/></clipPath>')
        d = path(S[k])
        # The gap is cut out of whatever lies underneath, so the real background shows through it.
        mask.append(f'<path d="{d}" fill="none" stroke="black" stroke-width="{band + 2 * gap}" stroke-linejoin="round" clip-path="url(#{cid})"/>')
        tops.append(strand(k, f'clip-path="url(#{cid})"'))
    base = ''.join(strand(k) for k in range(len(S)))
    mid = f'{uid}m'
    return ('<defs>' + ''.join(clips) + f'<mask id="{mid}" maskUnits="userSpaceOnUse" x="0" y="0" width="1024" height="1024">'
            '<rect width="1024" height="1024" fill="white"/>' + ''.join(mask) + '</mask></defs>'
            f'<g mask="url(#{mid})">{base}</g>' + ''.join(tops))

