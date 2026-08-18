> **Note:** This file documents the campaign family only. The master conventions live in
> [`../TEMPLATE_SPEC.md`](../TEMPLATE_SPEC.md) and apply to all template families.

You are templatizing a political campaign website built with Tailwind CSS. The goal is to replace all candidate-specific content with clearly marked placeholders so this HTML can be reused for any campaign.

## Files to Process
All files in: `public/templates/campaign/`
- home-desktop.html
- meet-desktop.html  
- platform-desktop.html
- events-desktop.html
- home-mobile.html

## Replacement Rules

### 1. Candidate Name
Replace ALL instances of "Deborah Dietzmann", "Deborah", "Dietzmann", and "DD" monogram references with:
- Full name → `{{CANDIDATE_NAME}}`
- First name only → `{{CANDIDATE_FIRST}}`
- Last name only → `{{CANDIDATE_LAST}}`
- Monogram/initials → `{{CANDIDATE_INITIALS}}`

### 2. Office Title
Replace "For Judge", "for Judge", "County Court 12", "Judicial" with:
- `{{OFFICE_TITLE}}` (e.g., "For City Council")
- `{{OFFICE_FULL}}` (e.g., "For Judge, County Court 12")

### 3. Colors — Convert to CSS Custom Properties
In the Tailwind config `<script>` block AND any inline styles, replace the hardcoded campaign colors:
- `#0a1f44` (navy blue primary) → `var(--campaign-primary)`
- `#00081e` (dark navy) → `var(--campaign-primary-dark)` 
- `#bb0027` or `#d91e36` (crimson red CTA) → `var(--campaign-accent)`
- `#C5A059` or `#c5a059` (heritage gold) → `var(--campaign-gold)`

Add a `:root` CSS block at the top of each file's `<style>` section with default values:
```css
:root {
  --campaign-primary: #0a1f44;
  --campaign-primary-dark: #00081e;
  --campaign-accent: #d91e36;
  --campaign-gold: #C5A059;
}
```

### 4. Images
Replace candidate headshot/photo `src` URLs with `{{HERO_IMAGE}}` or `{{CANDIDATE_PHOTO}}` placeholders.
Replace campaign logo image URLs with `{{CAMPAIGN_LOGO}}`.
Keep stock/generic images (courtroom, community, etc.) as-is.

### 5. Platform/Issue Content
In platform-desktop.html, replace specific judicial platform items (e.g., "Access to Justice", "Court Modernization") with:
- `{{PLATFORM_TITLE_1}}`, `{{PLATFORM_DESC_1}}`
- `{{PLATFORM_TITLE_2}}`, `{{PLATFORM_DESC_2}}`
- `{{PLATFORM_TITLE_3}}`, `{{PLATFORM_DESC_3}}`
(up to however many platform items exist)

### 6. Endorsements/Testimonials
Replace specific endorser names and quotes with:
- `{{ENDORSER_NAME_1}}`, `{{ENDORSER_TITLE_1}}`, `{{ENDORSER_QUOTE_1}}`

### 7. Contact/Location Info
Replace specific addresses, phone numbers, emails with:
- `{{CONTACT_EMAIL}}`, `{{CONTACT_PHONE}}`, `{{CAMPAIGN_LOCATION}}`

### 8. Page Titles
Replace `<title>` content with `{{CANDIDATE_NAME}} - {{OFFICE_TITLE}}` pattern.

### 9. Pronouns & Treasurer
- Replace gendered subject pronouns ("She", "He", "They") with `{{CANDIDATE_PRONOUN}}`.
- Replace gendered possessive pronouns ("Her", "His", "Their") with `{{CANDIDATE_POSSESSIVE}}`.
- Replace the treasurer line ("Erica Gregory, Treas.") with `{{CAMPAIGN_TREASURER}}`.
- Replace copyright years ("© 2024") with `© {{COPYRIGHT_YEAR}}`.

## Important Notes
- Do NOT change the HTML structure, layout, or Tailwind classes
- Do NOT remove any sections — just replace the content
- Keep all JavaScript interactions (mobile menu, drawer, etc.) working
- The Tailwind CDN `<script>` tags must remain functional
- Preserve all `data-alt` attributes on images but update their text descriptions to use placeholders too
