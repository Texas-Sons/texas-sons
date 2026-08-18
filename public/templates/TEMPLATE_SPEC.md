# Texas Sons — Unified Template Specification

Every template family (**campaign**, **salon**, **admin**) must follow the conventions below so the
Texas Sons site builder can merge a single per-client `config.json` into any template. This spec
supersedes the campaign-only `campaign/TEMPLATIZE_INSTRUCTIONS.md` (kept for historical context).

---

## 1. Content Placeholders

**Syntax:** `{{TOKEN_NAME}}` (double braces, SCREAMING_SNAKE).

Rules:
- A token holds **plain text or a single URL** — never HTML markup. If a headline contains an
  accent span (`<i>`, `<span class="...">`), tokenize the text nodes separately
  (e.g. `{{HERO_HEADLINE_1}}` / `{{HERO_HEADLINE_2}}`).
- **Do not tokenize** generic UI labels (nav items, button labels like "Book Appointment",
  "Contact", "Gallery"). Only tokenize client content.
- The current hardcoded value of a token becomes its **default** in the template's `:root` block
  (for colors) or is documented as the example value in the family token table below.
- Every page in a template must use the same tokens for the same content (no `{{SITE_NAME}}`
  here and `Opalescent` there).

### 1a. Core tokens (shared by all families)

| Token | Meaning |
|---|---|
| `{{SITE_NAME}}` | Business / organization display name |
| `{{SITE_TITLE}}` | Full `<title>` string for the page |
| `{{CONTACT_EMAIL}}` | Public contact email |
| `{{CONTACT_PHONE}}` | Public contact phone |
| `{{BUSINESS_ADDRESS}}` | Full street + city + state + zip (single line) |
| `{{BUSINESS_ADDRESS_LINE_1}}` | Address line 1 (when rendered on separate lines) |
| `{{BUSINESS_ADDRESS_LINE_2}}` | Address line 2 (city, state, zip) |
| `{{BUSINESS_HOURS}}` | Hours of operation text |
| `{{HERO_IMAGE}}` | Hero / primary page image URL |
| `{{LOGO_IMAGE}}` | Brand logo image URL |
| `{{COPYRIGHT_YEAR}}` | Footer copyright year (e.g. `2026`) |

### 1b. Salon tokens

| Token | Meaning |
|---|---|
| `{{HERO_HEADLINE}}` | Hero main headline (single text node) |
| `{{HERO_HEADLINE_1}}` / `{{HERO_HEADLINE_2}}` | Hero headline split around an accent element |
| `{{HERO_HEADLINE_ACCENT}}` | Styled accent word inside the headline |
| `{{HERO_TAGLINE}}` | Eyebrow / sub-headline above or below the H1 |
| `{{SERVICES_TITLE}}` / `{{SERVICES_SUBTITLE}}` | Services section heading + subtitle |
| `{{SERVICE_1_NAME}}` … `{{SERVICE_6_NAME}}` | Service names (N per template) |
| `{{SERVICE_1_DESC}}` … | Service descriptions |
| `{{SERVICE_1_PRICE}}` … | Service price text (e.g. `FROM $350`, `BY CONSULTATION`) |
| `{{TESTIMONIALS_TITLE}}` / `{{TESTIMONIALS_SUBTITLE}}` | Testimonials section heading + subtitle |
| `{{TESTIMONIAL_1_QUOTE}}` … | Testimonial quotes |
| `{{TESTIMONIAL_1_AUTHOR}}` … | Testimonial author names |
| `{{TESTIMONIAL_1_IMAGE}}` … | Testimonial avatar image URLs (when present) |

### 1c. Admin / CMS tokens

| Token | Meaning |
|---|---|
| `{{EVENT_1_DATE}}`, `{{EVENT_1_NAME}}`, `{{EVENT_1_LOCATION}}` | Row 1 of the events table (repeat per row) |
| `{{VOLUNTEER_1_NAME}}`, `{{VOLUNTEER_1_EMAIL}}` | Row 1 of the people directory (repeat per row) |
| `{{PRICE_ITEM_1}}`, `{{PRICE_CATEGORY_1}}`, `{{PRICE_AMOUNT_1}}` | Row 1 of the pricing table (repeat per row) |

### 1d. Campaign tokens

As already implemented in `campaign/` (`{{CANDIDATE_NAME}}`, `{{CANDIDATE_FIRST}}`,
`{{CANDIDATE_LAST}}`, `{{CANDIDATE_INITIALS}}`, `{{CANDIDATE_PHOTO}}`, `{{OFFICE_TITLE}}`,
`{{OFFICE_FULL}}`, `{{PLATFORM_TITLE_1..7}}`, `{{PLATFORM_DESC_1..7}}`,
`{{ENDORSER_NAME_1}}`, `{{ENDORSER_TITLE_1}}`, `{{ENDORSER_QUOTE_1}}`,
`{{CAMPAIGN_LOCATION}}`) **plus**:

| Token | Meaning |
|---|---|
| `{{CANDIDATE_PRONOUN}}` | Subject pronoun (She / He / They) |
| `{{CANDIDATE_POSSESSIVE}}` | Possessive pronoun (Her / His / Their) |
| `{{CAMPAIGN_TREASURER}}` | Treasurer line, e.g. `Erica Gregory, Treas.` |

---

## 2. Theming — CSS Custom Properties

Colors are exposed as `:root` CSS variables and referenced from `tailwind.config`.

- Naming: `--brand-*` for salon/admin, `--campaign-*` for campaign (legacy), `--admin-*` allowed
  for admin-only scales.
- Every hex value that defines brand identity must become `var(--brand-*)` and get a default in
  the template's `:root` block.
- The `:root` block goes at the **top of the first `<style>` block** in the file.
- Tailwind config color entries reference the variables, exactly like the campaign templates do
  (`primary: "var(--brand-primary)"`).

### Standard brand tokens (salon)

| Variable | Default (v1-desktop) |
|---|---|
| `--brand-primary` | `#1A1A1A` |
| `--brand-primary-container` | `#36454F` |
| `--brand-on-primary` | `#FFFFFF` |
| `--brand-on-primary-container` | `#A2B2BE` |
| `--brand-secondary` | `#735C00` |
| `--brand-secondary-container` | `#FED65B` |
| `--brand-on-secondary` | `#FFFFFF` |
| `--brand-surface` | `#FDFBF7` |
| `--brand-surface-container` | `#EEEEEE` |
| `--brand-surface-container-low` | `#F3F3F4` |
| `--brand-surface-container-high` | `#E8E8E8` |
| `--brand-surface-container-highest` | `#E2E2E2` |
| `--brand-on-surface` | `#1A1C1C` |
| `--brand-on-surface-variant` | `#43474B` |
| `--brand-background` | `#F9F9F9` |
| `--brand-on-background` | `#1A1C1C` |
| `--brand-outline` | `#73777B` |
| `--brand-outline-variant` | `#C3C7CB` |
| `--brand-error` | `#BA1A1A` |
| `--brand-accent` | `#D4AF37` |

Templates may add extra brand variables (`--brand-accent-hover`, `--brand-pearl`,
`--brand-prismatic-*`, `--brand-charcoal`, `--brand-gold`, `--brand-clinical-grey`,
`--brand-divider-line`, `--admin-blue-*`) as long as they follow the same `:root` convention.

---

## 3. Page metadata

Every template page should include (where the family allows):
- `<meta name="description" content="...">` — recommended; tokenize the client-specific part.
- `<meta name="og:title" ...>` / `<meta name="og:image" ...>` — recommended for campaign/landing.
- `<title>` must use tokens (`{{SITE_TITLE}}`, `{{CANDIDATE_NAME}} - {{OFFICE_TITLE}}`, …).
- A `<link rel="icon">` may be added by the builder at deploy time (not required in the template).

---

## 4. Per-client `config.json` (the automation contract)

The site builder reads one config per client and substitutes it into the selected template +
version. Field names map to the token tables above. Example:

```json
{
  "site": {
    "name": "Opalescent",
    "title": "Opalescent Color Studio",
    "email": "hello@opalescent.com",
    "phone": "(210) 555-0100",
    "address": "123 Luxury Blvd, San Antonio, TX 78205",
    "hours": "Tue-Sat 9am-7pm",
    "heroImage": "https://cdn.texassons.com/clients/opalescent/hero.jpg",
    "logoImage": "https://cdn.texassons.com/clients/opalescent/logo.png"
  },
  "theme": {
    "primary": "#1A1A1A",
    "accent": "#D4AF37",
    "surface": "#FDFBF7",
    "onSurfaceVariant": "#D1CEC7"
  },
  "services": [
    { "name": "Signature Balayage", "description": "…", "price": "FROM $350" }
  ],
  "testimonials": [
    { "quote": "…", "author": "Sarah M.", "image": "…" }
  ],
  "events": [
    { "date": "Oct 24, 2026", "name": "Community Townhall", "location": "City Center Plaza" }
  ],
  "pricing": [
    { "item": "Women's Haircut", "category": "Styling", "amount": "$65.00" }
  ],
  "people": [
    { "name": "Sarah Jenkins", "email": "sarah.j@example.com" }
  ],
  "campaign": {
    "candidateName": "Deborah Dietzmann",
    "officeTitle": "For Judge, County Court 12",
    "pronoun": "She",
    "possessive": "Her",
    "treasurer": "Erica Gregory, Treas.",
    "copyrightYear": "2026"
  }
}
```

- `services`, `testimonials`, `events`, `pricing`, `people` are **arrays**; the render engine maps
  array index N to `{{SERVICE_N_*}}`, `{{TESTIMONIAL_N_*}}`, `{{EVENT_N_*}}`, `{{PRICE_*_N}}`,
  `{{VOLUNTEER_N_*}}`. Templates with more slots than config items use the last item's value (or
  a blank value if the config omits it).
- `theme.*` maps to the `--brand-*` / `--campaign-*` CSS variables in `:root`.

---

## 5. Rules

- **Do not change** the HTML structure, layout, or Tailwind utility classes while templatizing —
  only swap content for tokens and hex colors for `var()`.
- **Do not remove** any section; replace content in place.
- Keep all existing JavaScript interactions working (drawer toggles, tab switchers, menu).
- Keep Tailwind CDN `<script>` tags functional; the `tailwind.config` block must remain valid JS.
- Preserve `data-alt` attributes (they describe the current placeholder image); the builder
  replaces `src`/`background-image` URLs with `{{HERO_IMAGE}}` / `{{LOGO_IMAGE}}` / client assets.
- Every template file must be a **complete standalone HTML document** (its own `<head>`, fonts,
  config, and interactions) so it can be previewed in the Templates view iframe as-is.
- Desktop and mobile variants are separate files and may carry separate content; the builder
  injects the same config values into both.

---

## 6. Production-readiness checklist

For a template version to be considered "templatized and ready":

- [ ] No client-specific names, contact details, dates, or prices remain hardcoded.
- [ ] All colors that define the brand use `var(--brand-*)` (or `var(--campaign-*)`) with a
      `:root` block at the top of the first `<style>`.
- [ ] `<title>` uses a token.
- [ ] No gendered/hardcoded pronouns remain (use `{{CANDIDATE_PRONOUN}}` /
      `{{CANDIDATE_POSSESSIVE}}`).
- [ ] `© 2024`-style years use `{{COPYRIGHT_YEAR}}`; treasurer/paid-for lines use
      `{{CAMPAIGN_TREASURER}}`.
- [ ] Every placeholder `{{...}}` token used by the file is documented in this spec.
- [ ] The page still renders in a sandboxed iframe (`sandbox="allow-same-origin allow-scripts
      allow-popups allow-forms"`).