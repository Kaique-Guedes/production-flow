"""Gera os ícones do app (favicon, PWA e apple-touch-icon) a partir de um
desenho vetorial simples feito em Pillow — sem dependências externas.
Paleta alinhada aos tokens de design do app (primary = azul-aço escuro,
accent = âmbar industrial).
"""

from PIL import Image, ImageDraw

PRIMARY = (37, 52, 74)  # azul-aço escuro (fundo)
PRIMARY_DARK = (26, 38, 56)
ACCENT = (224, 163, 68)  # âmbar industrial
WHITE = (245, 247, 250)


def draw_mark(size: int, padding_ratio: float = 0.16) -> Image.Image:
    """Desenha o símbolo (fábrica estilizada: base + 3 chaminés) centralizado
    num quadrado `size`x`size`, com fundo primary e leve gradiente."""
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    corner = int(size * 0.22)
    draw.rounded_rectangle([0, 0, size - 1, size - 1], radius=corner, fill=PRIMARY)

    # leve sombreado inferior para dar profundidade
    shade = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shade)
    sd.rounded_rectangle([0, size * 0.55, size - 1, size - 1], radius=corner, fill=(*PRIMARY_DARK, 90))
    img = Image.alpha_composite(img, shade)
    draw = ImageDraw.Draw(img)

    pad = size * padding_ratio
    w = size - 2 * pad
    h = w

    base_y = size - pad - h * 0.34
    base_x0 = pad
    base_x1 = size - pad

    # base do galpão
    draw.rounded_rectangle(
        [base_x0, base_y, base_x1, size - pad],
        radius=size * 0.03,
        fill=WHITE,
    )

    # telhado em serra (dente de serra) — clássico de galpão industrial
    teeth = 3
    tooth_w = (base_x1 - base_x0) / teeth
    roof_top = base_y - h * 0.30
    pts = [(base_x0, base_y)]
    for i in range(teeth):
        x0 = base_x0 + i * tooth_w
        x1 = x0 + tooth_w
        pts.append((x0, roof_top))
        pts.append((x1, base_y))
    draw.polygon(pts, fill=WHITE)

    # três chaminés em accent
    chim_w = w * 0.09
    chim_h = h * 0.34
    for i in range(3):
        cx = base_x0 + tooth_w * (i + 0.5) - chim_w / 2
        cy = roof_top - chim_h * (0.55 if i == 1 else 0.35)
        draw.rounded_rectangle(
            [cx, cy, cx + chim_w, base_y - h * 0.02],
            radius=chim_w * 0.25,
            fill=ACCENT,
        )

    # base/porta em primary para contraste sobre o branco
    door_w = w * 0.16
    door_h = h * 0.22
    dx = size / 2 - door_w / 2
    dy = size - pad - door_h
    draw.rounded_rectangle([dx, dy, dx + door_w, size - pad], radius=door_w * 0.2, fill=PRIMARY)

    return img


def maskable(size: int) -> Image.Image:
    """Versão com margem de segurança extra (safe zone ~20%) para ícones
    'maskable' do Android, evitando corte do símbolo."""
    return draw_mark(size, padding_ratio=0.26)


def save_all():
    import os

    out = os.path.join(os.path.dirname(__file__), "..", "public")
    os.makedirs(out, exist_ok=True)

    sizes_any = [192, 512]
    for s in sizes_any:
        draw_mark(s).save(os.path.join(out, f"icon-{s}.png"))

    for s in sizes_any:
        maskable(s).save(os.path.join(out, f"icon-maskable-{s}.png"))

    draw_mark(180).save(os.path.join(out, "apple-touch-icon.png"))

    # favicon.ico multi-tamanho
    icon_sizes = [16, 32, 48, 64]
    imgs = [draw_mark(s).convert("RGBA") for s in icon_sizes]
    imgs[0].save(
        os.path.join(out, "favicon.ico"),
        format="ICO",
        sizes=[(s, s) for s in icon_sizes],
    )

    print("icons written to", out)


if __name__ == "__main__":
    save_all()
