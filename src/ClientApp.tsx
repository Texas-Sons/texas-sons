import React, { useEffect } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

import { NavbarBlock } from "./templates/blocks/NavbarBlock";
import { HeroBlock } from "./templates/blocks/HeroBlock";
import { ServicesBlock } from "./templates/blocks/ServicesBlock";
import { TestimonialsBlock } from "./templates/blocks/TestimonialsBlock";
import { BookingBlock } from "./templates/blocks/BookingBlock";
import { FooterBlock } from "./templates/blocks/FooterBlock";
import { buildThemeVars } from "./templates/blocks/theme";
import type { ProjectSnapshot } from "./components/AgentBuilder/AgentBuilderStudio";

declare global {
  interface Window {
    __TXSONS_BLUEPRINT__?: ProjectSnapshot;
  }
}

export function ClientApp() {
  const project = window.__TXSONS_BLUEPRINT__;

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
      <NavbarBlock
        businessName={project.profile.name}
        phone={project.profile.phone}
        theme={project.theme}
        accentColor={project.profile.accentColor}
        ctaText={isCampaign ? "Join The Campaign" : "Book Free Estimate"}
      />
      <HeroBlock
        theme={project.theme}
        variant={project.heroVariant}
        headline={project.profile.tagline || project.profile.name}
        subheadline={project.profile.description || ""}
        heroImage={project.profile.heroImage}
        badges={project.badges}
        accentColor={project.profile.accentColor}
        proofBadgeText={project.proofBadgeText}
      />
      <ServicesBlock
        theme={project.theme}
        services={project.services}
        accentColor={project.profile.accentColor}
      />
      {project.testimonials.length > 0 && (
        <TestimonialsBlock
          theme={project.theme}
          testimonials={project.testimonials}
          accentColor={project.profile.accentColor}
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
        onSubmit={handleLeadSubmit}
      />
      <FooterBlock
        business={project.profile}
        theme={project.theme}
      />
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

