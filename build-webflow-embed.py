#!/usr/bin/env python3
"""Build webflow-embed.html from index.html, styles.css, game.js, and nucleus-logo.png."""

import base64
import re
from pathlib import Path

ROOT = Path(__file__).parent


def scope_css(css: str) -> str:
    css = css.replace(":root", "#deal-dash-root")
    css = re.sub(r"\bbody\b", "#deal-dash-root", css)
    css = re.sub(r"\bhtml\b", "#deal-dash-root", css)
    scoped = []
    for block in re.split(r"(?=@)", css):
        block = block.strip()
        if not block:
            continue
        if block.startswith("@media"):
            m = re.match(r"(@media[^{]+)\{([\s\S]*)\}\s*$", block)
            if m:
                inner = []
                for sel, decl in re.findall(r"([^{}]+)\{([^{}]*)\}", m.group(2)):
                    sel = sel.strip()
                    if sel and not sel.startswith("#deal-dash-root"):
                        sel = "#deal-dash-root " + ", #deal-dash-root ".join(
                            s.strip() for s in sel.split(",")
                        )
                    inner.append(f"{sel} {{ {decl.strip()} }}")
                block = m.group(1) + "{" + "\n".join(inner) + "}"
            scoped.append(block)
            continue
        if block.startswith("@keyframes"):
            scoped.append(block)
            continue
        m = re.match(r"([^{]+)\{([\s\S]*)\}", block)
        if not m:
            continue
        selectors, decls = m.group(1).strip(), m.group(2).strip()
        if selectors.startswith("#deal-dash-root"):
            scoped.append(block)
            continue
        parts = ["#deal-dash-root " + s.strip() for s in selectors.split(",") if s.strip()]
        scoped.append(", ".join(parts) + " { " + decls + " }")
    return "\n\n".join(scoped)


def main() -> None:
    css = (ROOT / "styles.css").read_text(encoding="utf-8")
    js = (ROOT / "game.js").read_text(encoding="utf-8")
    html = (ROOT / "index.html").read_text(encoding="utf-8")
    logo_uri = "data:image/png;base64," + base64.b64encode(
        (ROOT / "nucleus-logo.png").read_bytes()
    ).decode()

    body_match = re.search(r"<body[^>]*>(.*)</body>", html, re.DOTALL)
    if not body_match:
        raise SystemExit("Could not parse index.html body")
    body = re.sub(r'<script[^>]*src=[^>]*></script>\s*', "", body_match.group(1))
    body = body.replace('src="nucleus-logo.png"', f'src="{logo_uri}"').strip()

    embed = f"""<!-- DEAL DASH — paste into Webflow Embed element -->
<meta charset="utf-8" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet" />

<div id="deal-dash-root">
{body}
</div>

<style>
#deal-dash-root {{
  margin: 0;
  min-height: 100vh;
  font-family: "Inter", system-ui, sans-serif;
  color: #121212;
  background: #f8f6ed;
  overflow-x: hidden;
  scroll-behavior: smooth;
  box-sizing: border-box;
}}
#deal-dash-root *, #deal-dash-root *::before, #deal-dash-root *::after {{
  box-sizing: border-box;
}}

{scope_css(css)}
</style>

<script>
{js}
</script>
"""

    out = ROOT / "webflow-embed.html"
    out.write_text(embed, encoding="utf-8")
    print(f"Wrote {out} ({len(embed):,} bytes)")


if __name__ == "__main__":
    main()
