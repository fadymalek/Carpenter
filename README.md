# Hewn & Oak

Bespoke **custom kitchens** and **office desks** — a marketing site plus an
interactive **3D product configurator**, in one Next.js app.

- **Marketing site** (`/`) — 9 sections: home, about, services, kitchens, desks,
  gallery, process, quote, contact.
- **Configurator** (`/configure`) — a step-by-step wizard with a live **three.js**
  3D preview, bilingual **EN / AR** (RTL), a running summary, an estimated price
  range, save-design, and an inquiry form.

The site's *"Design Your Kitchen / Desk"* and *"Start Designing"* buttons link
straight into the configurator with the right product pre-selected.

---

## Stack

- **Next.js 14** (App Router) · **React 18**
- **three.js** for the real-time 3D models
- **Tailwind CSS** (brand palette exposed as `hewn-*` tokens + CSS variables)
- **lucide-react** icons

## Run it

```bash
npm install
npm run dev          # http://localhost:3000
```

Build for production:

```bash
npm run build
npm start
```

## Project structure

```
hewn-oak/
├─ app/
│  ├─ layout.jsx              # root layout + fonts
│  ├─ globals.css             # Tailwind + palette CSS vars
│  ├─ page.jsx                # → MarketingSite
│  └─ configure/page.jsx      # → Configurator (client-only, ssr:false)
├─ components/
│  ├─ MarketingSite.jsx       # the full marketing site
│  └─ configurator/
│     ├─ Configurator.jsx     # wizard UI, summary, 3D preview wrapper, i18n
│     └─ build3d.js           # the 3D modeling engine (kitchens + desks)
├─ tailwind.config.js         # hewn-* colour tokens + Fraunces / Hanken fonts
└─ ...
```

## The 3D modeling (`components/configurator/build3d.js`)

Everything is **parametric** and built from small reusable blocks, so it scales
with the customer's inputs and is easy to extend.

**Kitchens** — toe-kicks, carcasses, shaker doors (proud frame + recessed
centre), worktops with overhang + front fascia, backsplash, upper cabinets, and
modelled appliances: a stainless **fridge** (split doors + bar handles), a
built-in **oven** (dark-glass door, control panel, handle), a **hob** (glass top
+ four burner rings), a tapered **extractor hood**, a **sink** with basin + tap,
and a **microwave**. Straight / **L** / **U** layouts are assembled from rotated
cabinet runs; the **island** gets a waterfall worktop and a seating overhang.

**Desks** — top with an edge band, four leg/base styles (timber with stretcher
rails, panel, flat-bar **steel** legs, **pedestal**), a drawer pedestal with
individual reveals + handles, a left storage slot (file / closed / open
shelves / CPU), a side unit, a **monitor** on a riser, a keyboard tray + board,
an executive modesty panel, an **L-return**, plus a cable tray and a **grommet
ring**. Materials use clearcoat for gloss, real metalness for hardware, and dark
glass for screens.

The camera supports drag-to-orbit, scroll-to-zoom, and gentle idle auto-rotate.

## Where to wire the backend

All marked in code:

- `components/configurator/Configurator.jsx`
  - `handleSubmit()` — POST the design to email / a database / your API / Firebase.
  - `saveDesign()` — currently downloads JSON; swap for `localStorage` (or your store).
  - `buildSummary()` — structured payload, ready to feed a PDF export (e.g. jsPDF).
- `components/MarketingSite.jsx`
  - the quote form `submit()` and the WhatsApp links (`wa.me/...`).
  - replace the Unsplash placeholder image URLs (`IMG`) with real project photos.

> The configurator is a **concept** tool — final dimensions, materials and
> pricing are confirmed after professional review. That note is shown to users.
