# Opalescent Color Studio — design system

Reconstructed by claude-code on 2026-08-29 **from the Stitch HTML exports in this
folder**, because the `design_system.md` the import was supposed to include did
not arrive. Everything below was read out of the markup, not invented. If the
original file turns up, prefer it and delete this.

**Client:** Opalescent Color Studio — boutique hair colour studio, San Antonio TX
**Positioning** (from `aso_metadata_report___opalescent.txt`): *"Luxury Hair &
Color Artistry"* — balayage, precision highlights, custom colour correction,
extensions.

> Note: the Stitch project was generated as a **mobile app** concept (hence the
> App Store metadata). The screens map cleanly onto website sections, but the
> copy occasionally says "app" or "download" and needs rewriting for web.

---

## The three variations

Stitch produced three directions. Each has a desktop and mobile screen.

| Variation | Feel | Heading font | Palette |
|---|---|---|---|
| **Midnight Luxe** | Dark, high-contrast, jewellery-box | Playfair Display | Near-black `#1a1c1c`, warm neutrals |
| **Prismatic Glow** | Soft light, iridescent, editorial | Playfair Display *(italics used)* | Bg `#fbfafd`, primary `#202f38`, secondary `#735c00` |
| **Pure Minimalist** | Stark gallery-white | Montserrat | Pure `#ffffff` / `#000000` |

"Midnight Luxe" matches the name of `v1` already in `public/templates/salon/`, so
this direction is consistent with work already done.

## Typography

Every variation loads **Playfair Display** or **Montserrat** — both already
loaded by `client.html`, so no new font requests are needed.

Available in the blueprint as `profile.fontFamily`:

- `'luxe'` — Playfair Display headings + Montserrat body. **Matches the Stitch
  designs.** Added 2026-08-29 for this client.
- `'serif'` — Playfair Display + Inter. Close, slightly more neutral body.

## Colour

Extracted by frequency across all ten screens:

| Hex | Role |
|---|---|
| `#ffffff` | Surface / page ground (light variations) |
| `#1a1c1c` | Near-black text and dark ground |
| `#f9f9f9` `#fbfafd` | Off-white backgrounds |
| `#e2e2e2` `#eeeeee` | Hairlines and dividers |
| `#202f38` | Deep slate — Prismatic Glow primary |
| `#735c00` | Antique gold — Prismatic Glow secondary |
| `#36454f` | Charcoal blue — containers |
| `#b9c9d5` | Pale blue-grey — fixed surfaces |

### The actual brand colour

`#e8b4b8` — a soft rose. **Not from the Stitch files**: it is the `color`
parameter on her live Square booking URL, which means she already chose it for
her real booking page. Using it makes the site match the booking flow customers
land on, which is worth more than any palette we would pick.

## Recommended blueprint

```
theme        luxury          (dark ground, closest to Midnight Luxe)
fontFamily   luxe            (Playfair Display + Montserrat)
accentColor  #e8b4b8         (her own Square brand rose)
category     Beauty & Wellness
bookingUrl   <her Square appointments link>
```

`Beauty & Wellness` selects the booking-led archetype in
`src/templates/sections.ts`: hero → services & pricing → **gallery** → booking →
reviews. Which is the right order here — someone choosing a colourist wants to
see the work and the price before anything else.

## Sections in the Stitch screens, mapped to blocks

| Stitch screen | Block |
|---|---|
| Home | `hero` |
| Services & Pricing | `services` |
| Portfolio Gallery | `gallery` |
| (booking CTA throughout) | `booking` with `bookingUrl` |

No block is missing. The gallery block was added 2026-08-28 and renders
`profile.galleryImages`.

## Still needed from the client

- **Portfolio photos.** The Stitch screens use placeholder imagery. Send her the
  intake portal link and let her upload her own work — that is the single thing
  that will make this demo feel like hers.
- **Real service names and prices** for the services block.
- **Confirmation on the rose accent**, since it is inferred from her booking page
  rather than stated.
