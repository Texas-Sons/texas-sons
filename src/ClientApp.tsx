import React, { useEffect } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

import { NavbarBlock } from "./templates/blocks/NavbarBlock";
import { HeroBlock } from "./templates/blocks/HeroBlock";
import { CampaignHeroBlock } from "./templates/blocks/CampaignHeroBlock";
import { ServicesBlock } from "./templates/blocks/ServicesBlock";
import { TestimonialsBlock } from "./templates/blocks/TestimonialsBlock";
import { BookingBlock } from "./templates/blocks/BookingBlock";
import { FooterBlock } from "./templates/blocks/FooterBlock";
import { IndustryAdminBlock } from "./templates/blocks/IndustryAdminBlock";
import { resolveSections, SiteSection } from "./templates/sections";
import { SiteRenderer } from "./templates/SiteRenderer";
import { VotingBannerBlock } from "./templates/blocks/VotingBannerBlock";
import { VotingPageBlock } from "./templates/blocks/VotingPageBlock";
import { EventsBlock } from "./templates/blocks/EventsBlock";
import { GalleryBlock } from "./templates/blocks/GalleryBlock";
import { ProductsBlock } from "./templates/blocks/ProductsBlock";
import { BeforeAfterBlock } from "./templates/blocks/BeforeAfterBlock";
import { WriteInGuideBlock } from "./templates/blocks/WriteInGuideBlock";
import { buildThemeVars } from "./templates/blocks/theme";
import type { ProjectSnapshot } from "./components/AgentBuilder/AgentBuilderStudio";

declare global {
  interface Window {
    __TXSONS_BLUEPRINT__?: ProjectSnapshot;
  }
}

export function ClientApp() {
  const project = window.__TXSONS_BLUEPRINT__;
  const [viewMode, setViewMode] = React.useState<'site' | 'admin' | 'voting' | 'portfolio' | 'services'>(() => {
    if (window.location.search.includes('admin=true') || window.location.hash === '#admin') return 'admin';
    if (window.location.hash === '#voting') return 'voting';
    if (window.location.hash === '#portfolio') return 'portfolio';
    if (window.location.hash === '#services-page') return 'services';
    return 'site';
  });

  useEffect(() => {
    const handleHash = () => {
      if (window.location.hash === '#admin') setViewMode('admin');
      else if (window.location.hash === '#voting') setViewMode('voting');
      else if (window.location.hash === '#portfolio') setViewMode('portfolio');
      else if (window.location.hash === '#services-page') setViewMode('services');
      else setViewMode('site');
      // A hash route is a page change, so start at the top rather than wherever
      // the previous page happened to be scrolled to.
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  useEffect(() => {
    if (!project) return;
    const seo = project.seo ?? { title: '', description: '' };
    const title = seo.title || (project.profile.tagline ? `${project.profile.name} — ${project.profile.tagline}` : project.profile.name);
    const description = seo.description || project.profile.description || '';
    document.title = title;
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', description);

    // Dynamic Favicon update
    const isCampaignSite = project.profile.category === 'Campaign & Leadership' || project.theme === 'campaign-navy' || project.theme === 'campaign-judicial' || project.profile.name.toLowerCase().includes('sheriff') || project.profile.name.toLowerCase().includes('judge');
    const targetFavicon = project.profile.faviconUrl || (isCampaignSite ? '/sheriff-badge-favicon.svg' : '/favicon.png');
    let faviconLink: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
    if (!faviconLink) {
      faviconLink = document.createElement('link');
      faviconLink.rel = 'icon';
      document.head.appendChild(faviconLink);
    }
    faviconLink.type = targetFavicon.endsWith('.svg') ? 'image/svg+xml' : 'image/png';
    faviconLink.href = targetFavicon;
  }, [project]);

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-950 text-white">
        <p>Error: Site configuration missing.</p>
      </div>
    );
  }

  const isCampaign = project.profile.category === "Campaign & Leadership" || project.theme === "campaign-navy" || project.theme === "campaign-judicial";
  const isWriteIn = isCampaign && (
    (project.proofBadgeText && project.proofBadgeText.toLowerCase().includes('write-in')) ||
    project.badges?.some(b => b.toLowerCase().includes('write-in')) ||
    project.profile.name.toLowerCase().includes('waylon')
  );
  const themeVars = buildThemeVars(project.profile) as React.CSSProperties;

  const handleLeadSubmit = async (data: any) => {
    // The Studio's true preview renders this exact page from the same builder
    // the deploy uses. That fidelity has one cost: without this guard, an
    // operator clicking through their own preview files a real enquiry against
    // a site no customer can reach yet.
    if ((window as any).__TXSONS_PREVIEW__) {
      throw new Error('Preview only — this form starts working when the site is published.');
    }
    // Absolute when the deploy injected a base, relative in local development.
    // A relative path on a deployed site resolves to the Cloudflare Pages host,
    // which has no API — see the injection in publishBlueprint.
    const apiBase = (window as any).__TXSONS_API__ || '';
    const res = await fetch(apiBase + "/api/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        businessName: project.profile.name,
        siteSlug: project.profile.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""),
      }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || "Failed to submit request");
    }
  };

  // Composition comes from the blueprint when it has one, otherwise from an
  // archetype chosen by vertical. Blueprints deployed before sections existed
  // take the archetype path and render exactly as they did before.
  const officeTitle = project.profile.name.toLowerCase().includes('judge')
    ? 'Atascosa County Judge'
    : undefined;

  const sections = resolveSections(project.sections, {
    category: project.profile.category,
    isCampaign,
    isWriteIn,
    officeTitle,
  });

  // When the business already takes bookings somewhere (Square, Vagaro,
  // Calendly), the primary CTAs go there rather than to our lead form. They have
  // real availability and deposits on that system; routing a ready-to-book
  // visitor through a contact form instead adds a step and loses the booking.
  const bookingUrl = project.profile.bookingUrl;

  // One header definition for every page. A nav that differs page to page is the
  // fastest way to make a multi-page site feel stitched together.
  const navProps = sections.find(sec => sec.kind === 'navbar')?.props || {};

  /** Renders a composition through the shared renderer the Studio also uses. */
  const page = (secs: SiteSection[]) => (
    <SiteRenderer project={project} sections={secs} onLeadSubmit={handleLeadSubmit} />
  );

  return (
    <div
      data-ts-site=""
      className="w-full h-full min-h-screen"
      style={themeVars}
    >
      {viewMode === 'admin' ? (
        <div className="max-w-7xl mx-auto p-4 sm:p-8">
          <div className="mb-6 flex items-center justify-between">
            <button
              onClick={() => {
                window.location.hash = '';
                setViewMode('site');
              }}
              className="text-xs font-bold text-orange-400 hover:text-orange-300 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900 border border-stone-800 shadow-md transition-all hover:scale-105"
            >
              ← Return to Live Public Website
            </button>
            <span className="text-xs text-stone-500 font-mono">Client preview � not a secure area</span>
          </div>
          <IndustryAdminBlock
            business={project.profile}
            services={project.services}
            testimonials={project.testimonials}
          />
        </div>
      ) : viewMode === 'site' ? (
        <>
          {page(sections)}

          </>
      ) : viewMode === "voting" ? (
        <>
          <NavbarBlock businessName={project.profile.name} phone={project.profile.phone} theme={project.theme} accentColor={project.profile.accentColor} ctaText="Join The Campaign" navItems={[{ label: "Platform", href: "#services" }, { label: "Endorsements", href: "#reviews" }, { label: "Voting Info", href: "#voting" }, { label: "Contact", href: "#contact" }]} />
          <VotingPageBlock theme={project.theme} accentColor={project.profile.accentColor} />
          <FooterBlock business={project.profile} theme={project.theme} />
        </>
      ) : viewMode === 'portfolio' ? (
        // Dedicated portfolio page: the work, at length, with the comparisons
        // above the grid. Reuses the same blocks as the home page rather than
        // duplicating markup, so a fix to the gallery fixes both.
        <>
          {page([
            { kind: 'navbar', props: navProps },
                      {
            kind: 'beforeAfter',
            props: { title: 'Transformations', subtitle: 'Drag any image to reveal the change.' },
          },
                      {
            kind: 'gallery',
            props: { title: 'The Portfolio', subtitle: 'Recent work from the chair.' },
          },
                      {
            kind: 'booking',
            props: { title: 'Book Your Transformation', subtitle: 'Tell us what you have in mind.' },
          },
                      { kind: 'footer' },
          ])}
        </>
      ) : viewMode === 'services' ? (
        <>
          {page([
            { kind: 'navbar', props: navProps },
                      {
            kind: 'services',
            props: { title: 'Services & Pricing', subtitle: 'Everything we offer, with no hidden costs.' },
          },
                      {
            kind: 'products',
            props: { title: 'Shop the Studio', subtitle: 'Take the salon home with you.' },
          },
                      {
            kind: 'booking',
            props: { title: 'Book a Service', subtitle: 'Pick what you need and we will confirm your time.' },
          },
                      { kind: 'footer' },
          ])}
        </>
      ) : null}
    </div>
  );
}

const rootElement = document.getElementById("root");
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <ClientApp />
    </React.StrictMode>
  );
}

