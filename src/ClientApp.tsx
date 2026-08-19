import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

import { NavbarBlock } from "./templates/blocks/NavbarBlock";
import { HeroBlock } from "./templates/blocks/HeroBlock";
import { ServicesBlock } from "./templates/blocks/ServicesBlock";
import { TestimonialsBlock } from "./templates/blocks/TestimonialsBlock";
import { BookingBlock } from "./templates/blocks/BookingBlock";
import { FooterBlock } from "./templates/blocks/FooterBlock";
import { ProjectSnapshot } from "./components/AgentBuilder/AgentBuilderStudio";

declare global {
  interface Window {
    __TXSONS_BLUEPRINT__?: ProjectSnapshot;
  }
}

function ClientApp() {
  const project = window.__TXSONS_BLUEPRINT__;

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-950 text-white">
        <p>Error: Site configuration missing.</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-screen">
      <NavbarBlock
        theme={project.theme}
        name={project.profile.name}
        phone={project.profile.phone}
        badges={project.badges}
      />
      <HeroBlock
        theme={project.theme}
        variant={project.heroVariant}
        headline={project.profile.tagline}
        subheadline={project.profile.description}
        image={project.profile.heroImage}
        badges={project.badges}
      />
      <ServicesBlock
        theme={project.theme}
        services={project.services}
      />
      {project.testimonials.length > 0 && (
        <TestimonialsBlock
          theme={project.theme}
          testimonials={project.testimonials}
          proofBadgeText={project.proofBadgeText}
        />
      )}
      <BookingBlock
        theme={project.theme}
        phone={project.profile.phone}
        email={project.profile.email}
        address={project.profile.address}
        hours={project.profile.hours}
      />
      <FooterBlock
        theme={project.theme}
        name={project.profile.name}
        tagline={project.profile.tagline}
        email={project.profile.email}
        phone={project.profile.phone}
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

