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
import { VotingBannerBlock } from "./templates/blocks/VotingBannerBlock";
import { VotingPageBlock } from "./templates/blocks/VotingPageBlock";
import { EventsBlock } from "./templates/blocks/EventsBlock";
import { GalleryBlock } from "./templates/blocks/GalleryBlock";
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
  const [viewMode, setViewMode] = React.useState<'site' | 'admin' | 'voting'>(() => {
    if (window.location.search.includes('admin=true') || window.location.hash === '#admin') return 'admin';
    if (window.location.hash === '#voting') return 'voting';
    return 'site';
  });

  useEffect(() => {
    const handleHash = () => {
      if (window.location.hash === '#admin') setViewMode('admin');
      else if (window.location.hash === '#voting') setViewMode('voting');
      else setViewMode('site');
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
    const res = await fetch("/api/lead", {
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

  /** Maps one section descriptor to its block. Returns null when it has no data to show. */
  const renderSection = (section: SiteSection, _index: number) => {
    const p = section.props || {};
    const accentColor = project.profile.accentColor;

    switch (section.kind) {
      case 'navbar':
        return (
          <NavbarBlock
            businessName={project.profile.name}
            phone={project.profile.phone}
            theme={project.theme}
            accentColor={accentColor}
            ctaText={p.ctaText}
            navItems={p.navItems}
          />
        );

      case 'campaignHero':
        return (
          <CampaignHeroBlock
            headline={project.profile.tagline || project.profile.name}
            subheadline={project.profile.description || ''}
            heroImage={project.profile.heroImage}
            accentColor={accentColor}
            badges={project.badges}
            proofBadgeText={project.proofBadgeText}
            ctaText={p.ctaText}
            secondaryCtaText={p.secondaryCtaText}
            theme={project.theme}
            candidateName={project.profile.name}
            officeTitle={officeTitle}
          />
        );

      case 'hero':
        return (
          <HeroBlock
            theme={project.theme}
            variant={project.heroVariant}
            headline={project.profile.tagline || project.profile.name}
            subheadline={project.profile.description || ''}
            heroImage={project.profile.heroImage}
            badges={project.badges}
            accentColor={accentColor}
            proofBadgeText={project.proofBadgeText}
            ctaText={p.ctaText}
            secondaryCtaText={p.secondaryCtaText}
          />
        );

      case 'writeInGuide':
        return (
          <WriteInGuideBlock
            candidateName={project.profile.name.replace(/campaign/i, '').replace(/for judge/i, '').trim()}
            officeTitle="Atascosa County Judge"
            theme={project.theme}
            accentColor={accentColor}
          />
        );

      case 'votingBanner':
        return (
          <VotingBannerBlock
            accentColor={accentColor}
            candidateName={project.profile.name}
            officeTitle={officeTitle ? `${officeTitle} Election` : undefined}
            theme={project.theme}
          />
        );

      case 'services':
        return (
          <ServicesBlock
            theme={project.theme}
            services={project.services}
            accentColor={accentColor}
            title={p.title}
            subtitle={p.subtitle}
          />
        );

      case 'events':
        return (
          <EventsBlock
            events={project.events}
            theme={project.theme}
            accentColor={accentColor}
          />
        );

      case 'gallery':
        // GalleryBlock renders nothing without photos, so archetypes can include
        // it unconditionally.
        return (
          <GalleryBlock
            images={project.profile.galleryImages}
            theme={project.theme}
            accentColor={accentColor}
            title={p.title}
            subtitle={p.subtitle}
          />
        );

      case 'testimonials':
        // Preserves the previous guard: no reviews, no empty section.
        if (!project.testimonials?.length) return null;
        return (
          <TestimonialsBlock
            theme={project.theme}
            testimonials={project.testimonials}
            accentColor={accentColor}
            title={p.title}
            subtitle={p.subtitle}
          />
        );

      case 'booking':
        return (
          <BookingBlock
            theme={project.theme}
            phone={project.profile.phone}
            email={project.profile.email}
            address={project.profile.address}
            hours={project.profile.hours}
            services={project.services}
            accentColor={accentColor}
            title={p.title}
            subtitle={p.subtitle}
            onSubmit={handleLeadSubmit}
          />
        );

      case 'footer':
        return <FooterBlock business={project.profile} theme={project.theme} />;

      default:
        // An unknown kind from a newer blueprint must not break an older client
        // bundle — skip it rather than crashing the whole site.
        console.warn(`[ClientApp] Unknown section kind: ${(section as any).kind}`);
        return null;
    }
  };

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
            <span className="text-xs text-stone-500 font-mono">Authenticated Admin Session</span>
          </div>
          <IndustryAdminBlock
            business={project.profile}
            services={project.services}
            testimonials={project.testimonials}
          />
        </div>
      ) : viewMode === 'site' ? (
        <>
          {sections.map((section, i) => (
            <React.Fragment key={`${section.kind}-${i}`}>{renderSection(section, i)}</React.Fragment>
          ))}

          {/* Subtle client admin access badge */}
          <div className="fixed bottom-3 right-3 z-50">
            <button
              onClick={() => {
                window.location.hash = 'admin';
                setViewMode('admin');
              }}
              className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-stone-950/80 text-stone-400 hover:text-white border border-stone-800 shadow-xl backdrop-blur-md transition-all hover:scale-105"
              title="Open Client Admin Portal"
            >
              Portal Admin 🔒
            </button>
          </div>
        </>
      ) : viewMode === "voting" ? (
        <>
          <NavbarBlock businessName={project.profile.name} phone={project.profile.phone} theme={project.theme} accentColor={project.profile.accentColor} ctaText="Join The Campaign" navItems={[{ label: "Platform", href: "#services" }, { label: "Endorsements", href: "#reviews" }, { label: "Voting Info", href: "#voting" }, { label: "Contact", href: "#contact" }]} />
          <VotingPageBlock theme={project.theme} accentColor={project.profile.accentColor} />
          <FooterBlock business={project.profile} theme={project.theme} />
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

