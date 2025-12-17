# E‑Waste Product Categorization Website

A simple, responsive site to explore e‑waste items by category, search them, and learn if they are recyclable.

## Features
- Category filters: All, Household, Office, Industrial
- Live search with debounce
- Product cards with icons and recyclable/non‑recyclable badges
- Result count updates via aria‑live
- "Recyclers Near Me" button: geolocation + Google Maps
- Details modal per item with extra tips and recycler link

## Run Locally
Use any static server. With Python:

```powershell
# from ewaste-project directory
python -m http.server 5500
# Visit http://localhost:5500
```

If you open `index.html` directly via file://, fetching `data/products.json` may be blocked by the browser. Use the local server above.

## Structure
```
/ewaste-project
├── index.html
├── style.css
├── script.js
├── data/
│   └── products.json
└── images/
    ├── placeholder.svg
    ├── laptop.svg, monitor.svg, keyboard.svg, printer.svg, toner-cartridge.svg
    ├── phone.svg, tv.svg, microwave.svg, kettle.svg, battery.svg
    ├── server.svg, inverter.svg, motor.svg, cctv.svg, switch.svg, bulb.svg
```

## Notes
- Data is illustrative; check local regulations for proper disposal.
- Geolocation requires HTTPS or localhost in most browsers.
