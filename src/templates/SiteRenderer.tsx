import React from 'react';
import { NavbarBlock } from './blocks/NavbarBlock';
import { HeroBlock } from './blocks/HeroBlock';
import { CampaignHeroBlock } from './blocks/CampaignHeroBlock';
import { ServicesBlock } from './blocks/ServicesBlock';
import { TestimonialsBlock } from './blocks/TestimonialsBlock';
import { BookingBlock } from './blocks/BookingBlock';
import { FooterBlock } from './blocks/FooterBlock';
import { VotingBannerBlock } from './blocks/VotingBannerBlock';
import { EventsBlock } from './blocks/EventsBlock';
import { GalleryBlock } from './blocks/GalleryBlock';
import { ProductsBlock } from './blocks/ProductsBlock';
import { BeforeAfterBlock } from './blocks/BeforeAfterBlock';
import { WriteInGuideBlock } from './blocks/WriteInGuideBlock';
import { SquareBookingBlock } from './blocks/SquareBookingBlock';
import { resolveSections, SiteSection } from './sections';
import { BookingFab } from './blocks/BookingFab';

/**
 * The single renderer for a client site.
 *
 * There used to be two: ClientApp drove the deployed site from a section array,
 * while the Studio preview laid out a hardcoded list of nine blocks. Every new
 * block had to be added in both places, and when it wasn't the Studio showed
 * something different from what the client would actually receive — gallery,
 * before/after and products were all live on deployed sites and invisible in the
 * preview.
 *
 * Both now render this. A block added here appears in both, or in neither.
 */

export interface SiteRendererProps {
  project: any;
  /** Lead form handler. Omitted in the Studio, where submitting is meaningless. */
  onLeadSubmit?: (data: any) => void | Promise<void>;
  /**
   * Studio only: makes each section clickable for the block inspector. Left
   * undefined on a real site, where sections are not selectable.
   */
  onSelectBlock?: (kind: string) => void;
  selectedBlock?: string | null;
  /** Render a specific composition instead of the project's own. Used by sub-pages. */
  sections?: SiteSection[];
}

export function SiteRenderer({
  project,
  onLeadSubmit,
  onSelectBlock,
  selectedBlock,
  sections: sectionsOverride,
}: SiteRendererProps) {
  if (!project?.profile) return null;

  const isCampaign =
    project.profile.category === 'Campaign & Leadership' ||
    project.theme === 'campaign-navy' ||
    project.theme === 'campaign-judicial';

  const isWriteIn = !!isCampaign && (
    (project.proofBadgeText && project.proofBadgeText.toLowerCase().includes('write-in')) ||
    project.badges?.some((b: string) => b.toLowerCase().includes('write-in')) ||
    project.profile.name?.toLowerCase().includes('waylon')
  );

  const officeTitle = project.profile.name?.toLowerCase().includes('judge')
    ? 'Atascosa County Judge'
    : undefined;

  const sections = sectionsOverride || resolveSections(project.sections, {
    category: project.profile.category,
    isCampaign,
    isWriteIn,
    officeTitle,
  });

  // When a business already takes bookings elsewhere, the primary CTAs go there.
  const bookingUrl = project.profile.bookingUrl;
  const accentColor = project.profile.accentColor;

  const renderOne = (section: SiteSection) => {
    const p = section.props || {};

    switch (section.kind) {
      case 'navbar':
        return (
          <NavbarBlock
            businessName={project.profile.name}
            logoUrl={project.profile.logoUrl}
            phone={project.profile.phone}
            theme={project.theme}
            accentColor={accentColor}
            ctaText={p.ctaText}
            ctaHref={bookingUrl || '#contact'}
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
            ctaHref={bookingUrl || '#contact'}
            secondaryCtaText={p.secondaryCtaText}
          />
        );

      case 'writeInGuide':
        return (
          <WriteInGuideBlock
            candidateName={(project.profile.name || '').replace(/campaign/i, '').replace(/for judge/i, '').trim()}
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
            services={project.services || []}
            accentColor={accentColor}
            title={p.title}
            subtitle={p.subtitle}
          />
        );

      case 'events':
        return <EventsBlock events={project.events} theme={project.theme} accentColor={accentColor} />;

      case 'gallery':
        return (
          <GalleryBlock
            images={project.profile.galleryImages}
            theme={project.theme}
            accentColor={accentColor}
            title={p.title}
            subtitle={p.subtitle}
          />
        );

      case 'beforeAfter':
        return (
          <BeforeAfterBlock
            items={project.beforeAfter}
            theme={project.theme}
            accentColor={accentColor}
            title={p.title}
            subtitle={p.subtitle}
          />
        );

      case 'products':
        return (
          <ProductsBlock
            products={project.products}
            theme={project.theme}
            accentColor={accentColor}
            title={p.title}
            subtitle={p.subtitle}
            shopUrl={bookingUrl}
          />
        );

      case 'testimonials':
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

      case 'squareBooking':
        return (
          <SquareBookingBlock
            theme={project.theme}
            accentColor={accentColor}
            title={p.title}
            subtitle={p.subtitle}
            bookingUrl={bookingUrl}
            variant={!!onSelectBlock ? 'preview' : 'live'}
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
            services={project.services || []}
            accentColor={accentColor}
            title={p.title}
            subtitle={p.subtitle}
            bookingUrl={bookingUrl}
            bookingLabel={p.bookingLabel}
            onSubmit={onLeadSubmit}
          />
        );

      case 'footer':
        return <FooterBlock business={project.profile} theme={project.theme} />;

      default:
        // An unknown kind from a newer blueprint must not break an older client
        // bundle — skip it rather than crashing the whole site.
        console.warn(`[SiteRenderer] Unknown section kind: ${(section as any).kind}`);
        return null;
    }
  };

  // "Book an appointment" is meaningless on a judicial campaign.
  const showBookingFab = !isCampaign;
  const inStudio = !!onSelectBlock;

  return (
    // relative so the Studio's contained FAB has something to anchor to;
    // pb-24 so the button never sits on top of the last lines of the footer.
    <div className={showBookingFab ? 'relative pb-24' : ''}>
      {sections.map((section, i) => {
        const rendered = renderOne(section);
        if (!rendered) return null;

        const key = `${section.kind}-${i}`;

        // Studio inspector: wrap in a selectable shell. A real site gets the
        // block untouched, so nothing about the preview leaks into the output.
        if (onSelectBlock) {
          return (
            <div
              key={key}
              onClick={() => onSelectBlock(section.kind)}
              className={`relative transition-all cursor-pointer hover:ring-2 hover:ring-blue-500/40 ${
                selectedBlock === section.kind ? 'ring-2 ring-blue-500 z-20' : ''
              }`}
            >
              {rendered}
            </div>
          );
        }

        return <React.Fragment key={key}>{rendered}</React.Fragment>;
      })}

      {showBookingFab && (
        <BookingFab bookingUrl={bookingUrl} variant={inStudio ? 'preview' : 'fixed'} />
      )}
    </div>
  );
}
