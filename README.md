# Deal Dash

Mario-style endless runner for **Nucleus by GTM Buddy**, the Revenue Activation Engine.

Jump past sales chaos, collect gold revenue signals, and dodge red blockers. Share your score on a GTM Buddy branded card.

## How to play

| Thing | What it does |
|-------|----------------|
| **Gold coin** | +100 revenue capacity (combo bonus on streaks) |
| **Red blocker** | -1 deal health (ghosted, legal, RevOps, etc.) |
| **Pink star** | Nucleus slow-mo boost |
| **Space / tap** | Jump |

3 hearts. Endless mode. Beat your best score. Share when you score 100+.

## Run locally

**Do not** double-click `index.html` (file:// breaks assets and audio). Use a local server:

```bash
cd nucleus-games
./start.sh
```

Or:

```bash
cd nucleus-games
python3 -m http.server 8080
```

Then open: **http://localhost:8080**

## QA (Playwright)

```bash
cd nucleus-games
npm install
npx playwright install chromium
npm test
```

## Webflow embed

1. Run `python3 build-webflow-embed.py`
2. Open `webflow-embed.html`
3. Copy everything into a Webflow **Embed** element
4. Publish
