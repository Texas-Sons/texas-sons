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
import { VotingBannerBlock } from "./templates/blocks/VotingBannerBlock";
import { VotingPageBlock } from "./templates/blocks/VotingPageBlock";
import { EventsBlock } from "./templates/blocks/EventsBlock";
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
    const isCampaignSite = project.profile.category === 'Campaign & Leadership' || project.theme === 'campaign-navy' || project.profile.name.toLowerCase().includes('sheriff') || project.profile.name.toLowerCase().includes('judge');
    let faviconLink: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
    if (!faviconLink) {
      faviconLink = document.createElement('link');
      faviconLink.rel = 'icon';
      document.head.appendChild(faviconLink);
    }
    if (isCampaignSite) {
      faviconLink.type = 'image/svg+xml';
      faviconLink.href = '/sheriff-badge-favicon.svg';
    }
  }, [project]);

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-950 text-white">
        <p>Error: Site configuration missing.</p>
      </div>
    );
  }

  const isCampaign = project.profile.category === "Campaign & Leadership" || project.theme === "campaign-navy";
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
          <NavbarBlock
            businessName={project.profile.name}
            phone={project.profile.phone}
            theme={project.theme}
            accentColor={project.profile.accentColor}
            ctaText={isCampaign ? "Join The Campaign" : "Book Free Estimate"}
            navItems={isCampaign ? [
              { label: "Platform", href: "#services" },
              { label: "Events", href: "#events" },
              { label: "Endorsements", href: "#reviews" },
              { label: "Voting Info", href: "#voting" },
              { label: "Volunteer", href: "#contact" }
            ] : undefined}
          />
          {isCampaign ? (
            <CampaignHeroBlock
              headline={project.profile.tagline || project.profile.name}
              subheadline={project.profile.description || ""}
              heroImage={project.profile.heroImage}
              accentColor={project.profile.accentColor}
              badges={project.badges}
              proofBadgeText={project.proofBadgeText}
              ctaText="Join The Campaign"
              secondaryCtaText="Read Our Platform"
            />
          ) : (
            <HeroBlock
              theme={project.theme}
              variant={project.heroVariant}
              headline={project.profile.tagline || project.profile.name}
              subheadline={project.profile.description || ""}
              heroImage={project.profile.heroImage}
              badges={project.badges}
              accentColor={project.profile.accentColor}
              proofBadgeText={project.proofBadgeText}
              ctaText={
                project.profile.category === 'Food & Beverage' ? 'View Menu' : 
                project.profile.category === 'Beauty & Wellness' ? 'Book Appointment' : 
                'Book Free Estimate'
              }
              secondaryCtaText={
                project.profile.category === 'Food & Beverage' ? 'Catering Options' : 
                'View Services'
              }
            />
          )}
          {isCampaign && <VotingBannerBlock accentColor={project.profile.accentColor} />}
          <ServicesBlock
            theme={project.theme}
            services={project.services}
            accentColor={project.profile.accentColor}
            title={isCampaign ? 'Campaign Platform & Priorities' : 'Our Services'}
            subtitle={isCampaign ? 'Our commitment to the community and our plan for the future.' : 'Professional, reliable, and tailored to your needs.'}
          />
          {isCampaign && (
            <EventsBlock
              events={project.events}
              theme={project.theme}
              accentColor={project.profile.accentColor}
            />
          )}
          {project.testimonials.length > 0 && (
            <TestimonialsBlock
              theme={project.theme}
              testimonials={project.testimonials}
              accentColor={project.profile.accentColor}
              title={isCampaign ? 'Endorsements & Community Support' : 'What Our Clients Say'}
              subtitle={isCampaign ? 'Trusted by leaders, law enforcement, and families across Texas.' : 'Real reviews from verified customers in your area.'}
            />
          )}
          <BookingBlock
            theme={project.theme}
            phone={project.profile.phone}
            email={project.profile.email}
            address={project.profile.address}
            hours={project.profile.hours}
            services={project.services}
            accentColor={project.profile.accentColor}
            title={isCampaign ? 'Volunteer & Request Yard Signs' : 'Request a Free Consultation'}
            subtitle={isCampaign ? 'Join today.' : 'Get in touch with us.'}
            onSubmit={handleLeadSubmit}
          />
          <FooterBlock
            business={project.profile}
            theme={project.theme}
          />
          
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

