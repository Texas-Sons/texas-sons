import React from 'react';
import { motion } from 'framer-motion';
import { Instagram } from 'lucide-react';

/**
 * Photo gallery.
 *
 * Exists because `galleryImages` — the business's own extra photos, pulled from
 * Google Places or uploaded through the intake portal — was being carried on the
 * blueprint and never rendered. For a restaurant or a salon these photos are the
 * strongest thing on the page: a demo showing someone their own storefront reads
 * as researched in a way no amount of palette matching does.
 *
 * Renders nothing when there are no photos, so it is always safe to include in
 * an archetype.
 */

interface GalleryBlockProps {
  title?: string;
  subtitle?: string;
  images?: string[];
  theme?: 'dark' | 'light' | 'luxury' | 'campaign-navy' | 'campaign-judicial' | 'crimson-bold' | 'emerald-gold' | 'custom';
  accentColor?: string;
  /** Cap so a business with 30 Places photos does not produce an endless page. */
  maxImages?: number;
  /** Their profile, where the rest of the work lives. */
  instagramUrl?: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const tileVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 110, damping: 20 },
  },
};

export function GalleryBlock({
  title = 'A Look Inside',
  subtitle,
  images,
  maxImages = 12,
  instagramUrl,
}: GalleryBlockProps) {
  const photos = (images || []).filter(Boolean).slice(0, maxImages);
  if (photos.length === 0) return null;

  // A lone photo reads as a mistake in a grid, so give it full width.
  const isSingle = photos.length === 1;

  return (
    <section
      id="gallery"
      className="py-20 sm:py-28 relative bg-[color:var(--ts-bg)] text-[color:var(--ts-text)] overflow-hidden"
    >
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[color:var(--ts-border)] to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight mb-4 font-[family-name:var(--ts-font-heading)]">
            {title}
          </h2>
          {subtitle && (
            <p className="text-base sm:text-lg text-[color:var(--ts-muted)] font-medium max-w-2xl mx-auto">
              {subtitle}
            </p>
          )}
        </div>

        {/* Columns, not a grid.
            A grid needs every cell to agree on a height. These photos do not
            agree on anything — a salon's portfolio is phone pictures, portrait
            and landscape and square, and forcing them into fixed row heights
            either crops the subject out or leaves the short ones sitting in
            large empty boxes. It did both: the first tile took `col-span-2
            row-span-2`, which on a two-column phone layout is the entire width
            and two rows of nothing beside it.

            Columns let each photo keep its own proportions and stack against
            whatever is above it, so there are no holes and nothing is cropped —
            the arrangement every gallery of this kind uses, for this reason. */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          className={isSingle ? '' : 'columns-2 lg:columns-3 gap-3 sm:gap-4 [column-fill:balance]'}
        >
          {photos.map((src, i) => (
            <motion.figure
              key={`${src}-${i}`}
              variants={tileVariants}
              className={`group relative overflow-hidden rounded-2xl border border-[color:var(--ts-border)] bg-[color:var(--ts-surface)] shadow-xl shadow-black/20 ${
                isSingle ? '' : 'break-inside-avoid mb-3 sm:mb-4'
              }`}
            >
              <img
                src={src}
                alt={`${title} photo ${i + 1}`}
                loading="lazy"
                decoding="async"
                // h-auto is the whole point: the photo decides its own height.
                className={`w-full transition-transform duration-500 group-hover:scale-105 ${
                  isSingle ? 'h-72 sm:h-[28rem] object-cover' : 'h-auto'
                }`}
                // A dead Places URL should collapse the tile, not leave a broken
                // image icon on a client's demo.
                onError={e => {
                  const fig = (e.currentTarget as HTMLImageElement).closest('figure');
                  if (fig) fig.style.display = 'none';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </motion.figure>
          ))}
        </motion.div>

        {/* Where the rest of it is. A gallery caps at a dozen photos and a
            working stylist posts that many in a fortnight. */}
        {instagramUrl && (
          <div className="mt-10 sm:mt-12 flex justify-center">
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 px-6 py-3 rounded-2xl border font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.99] border-[color:var(--ts-border)] bg-[color:var(--ts-surface)] text-[color:var(--ts-text)] hover:border-[color:var(--ts-accent)] hover:text-[color:var(--ts-accent)]"
            >
              <Instagram className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
              {/* The visible text is the accessible name, so it has to say
                  where the link goes on its own — WCAG 2.5.3, and the same
                  reason the booking button is not labelled twice. */}
              <span>See more on Instagram</span>
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
