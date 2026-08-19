---
name: texas-sons-builder
description: Autonomous agency site builder for Texas Sons. Ingests business profile blueprints, selects token-optimized modular React/Tailwind component blocks, tests builds, and deploys 1-click live sites to Cloudflare Pages.
---

# Texas Sons Autonomous Site Builder Skill

Use this skill when building or customizing full-stack websites for Texas Sons clients.

## Architecture Guidelines
1. **Design System**: Use modern Tailwind CSS with a luxury/high-converting palette (Dark Onyx `bg-stone-950`, Warm Amber/Orange `text-orange-500`, Clean Crisp White typography).
2. **Component Blocks**: Always compose sites from the modular block foundation in `src/templates/blocks/`:
   - `NavbarBlock`: Sticky glassmorphic navbar with mobile drawer
   - `HeroBlock`: High-converting headlines with Google review pills, badges, and split/bento showcase
   - `ServicesBlock`: Transparent service pricing cards with category tags
   - `TestimonialsBlock`: 5-star verified customer reviews
   - `BookingBlock`: Free estimate & consultation lead capture forms
   - `FooterBlock`: Business contact details, hours of operation, and service guarantees
3. **Token Efficiency**: Never regenerate whole projects when making tweaks. Target single component props or files.
4. **Deployment Protocol**:
   - Verify builds: `npm run lint` & `npm run build`
   - Deploy command: Push directly via Cloudflare API (`/api/deploy`)
