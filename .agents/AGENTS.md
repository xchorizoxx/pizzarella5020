# Pizzarella5020 — Agent Rules

## Project Overview
- Static website (HTML/CSS/JS vanilla) for a pizza delivery menu.
- No frameworks, no build step. Files served directly.
- Ordering via WhatsApp message generation.

## Tech Stack
- HTML5, Vanilla CSS, Vanilla JavaScript
- GSAP (CDN) for loader animation
- No npm, no bundler, no framework

## Critical Rules

### NEVER Test in Browser Autonomously
- **DO NOT** use `browser_subagent` or any browser automation tool to test this site.
- **DO NOT** open the site in any headless or automated browser.
- Browser testing wastes tokens and is the user's responsibility.
- Instead, start a local HTTP server and let the user test manually.

### Local Server
- Use `python3 -m http.server 8080` from the project root to serve the site.
- Always tell the user the URL (http://localhost:8080) so they can test.

### File Structure
```
pizzarella/
├── index.html        # Main page (single-page app)
├── app.js            # Application logic (cart, rendering, WhatsApp)
├── products.js       # Product data, prices, configurations
├── style.css         # All styles
├── menu.csv          # Reference data (not used by the app)
├── CNAME             # GitHub Pages domain
└── logos/             # PNG assets (pizzas, sodas, logo)
```

### Architecture Conventions
- All product data lives in `products.js` as constants.
- `app.js` reads from those constants; never hardcode product data in app.js.
- Cart state uses string keys: `{productId}_{size}`, `{productId}_{size}_{flavor}`, `half_{size}_{idA}_{idB}`, `topping_{name}`.
- All prices are in COP (Colombian Pesos), integers, no decimals.
- Half-pizza prices are rounded to the nearest thousand: `Math.round(avg / 1000) * 1000`.

### Deployment
- Hosted on GitHub Pages.
- Cache busting via query params on script tags: `app.js?v=X.Y.Z`.
- Bump version on every deployment-worthy change.

### Currency
- All prices stored and displayed in COP.
- USD and BS are payment method options only (conversion handled externally).
