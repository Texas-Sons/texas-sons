import React from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { useReveal, revealBlock } from './motion';
import { ProductItem } from './types';

/**
 * Retail products.
 *
 * Salons, spas and barbers sell take-home product, and it is often a meaningful
 * share of revenue that a services-only site leaves entirely invisible. Trades
 * and campaigns have no equivalent, so this block is opt-in per vertical rather
 * than part of the default layout.
 *
 * Deliberately not a checkout. Most of these businesses sell over the counter or
 * through a system they already run, and inventing a cart would create an order
 * flow nobody is watching. Each product links out when a URL is supplied, and
 * otherwise says where to buy it.
 */

interface ProductsBlockProps {
  title?: string;
  subtitle?: string;
  products?: ProductItem[];
  theme?: 'dark' | 'light' | 'luxury' | 'campaign-navy' | 'campaign-judicial' | 'crimson-bold' | 'emerald-gold' | 'custom';
  accentColor?: string;
  /** Fallback link for cards without their own url — usually the booking page. */
  shopUrl?: string;
  maxProducts?: number;
}

export function ProductsBlock({
  title = 'Shop the Studio',
  subtitle,
  products,
  shopUrl,
  maxProducts = 8,
}: ProductsBlockProps) {
  // Hook first: an early return above a hook call changes the hook count between
  // renders and blanks the page. Same bug fixed in c53ae74.
  const reveal = useReveal();

  const items = (products || []).filter(p => p && p.name).slice(0, maxProducts);
  // Renders mock products if there is no product line, so the design can be previewed
  if (items.length === 0) {
    items.push(
      { name: 'Oribe Gold Lust Repair & Restore Shampoo', price: '$52.00', description: 'Reawakens hair to its glossiest, healthiest prime.', image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=600&auto=format&fit=crop' },
      { name: 'Kérastase Elixir Ultime Hydrating Hair Oil', price: '$58.00', description: 'Iconic hair oil for all hair types.', image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=600&auto=format&fit=crop' },
      { name: 'Olaplex No. 7 Bonding Oil', price: '$30.00', description: 'A highly concentrated, weightless reparative styling oil.', image: 'https://images.unsplash.com/photo-1608248593842-8021c640d0e6?q=80&w=600&auto=format&fit=crop' },
      { name: 'Moroccanoil Treatment Original', price: '$48.00', description: 'The product that pioneered oil-infused hair care.', image: 'https://images.unsplash.com/photo-1599305090598-fe179d501227?q=80&w=600&auto=format&fit=crop' }
    );
  }

  return (
    <section
      id="products"
      className="py-20 sm:py-28 relative bg-[color:var(--ts-surface)] text-[color:var(--ts-text)]"
    >
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[color:var(--ts-border)] to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center max-w-3xl mx-auto mb-12 sm:mb-16"
          variants={reveal.props.initial ? revealBlock : undefined}
          {...reveal.props}
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-3 bg-[color:var(--ts-accent-soft)] text-[color:var(--ts-accent)] border border-[color:var(--ts-accent-border)]">
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Retail</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-3 font-[family-name:var(--ts-font-heading)]">
            {title}
          </h2>
          {subtitle && (
            <p className="text-sm sm:text-base text-[color:var(--ts-muted)]">{subtitle}</p>
          )}
        </motion.div>

        <motion.div
          className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-5 sm:gap-6"
          variants={reveal.group}
          {...reveal.props}
        >
          {items.map((product, i) => {
            const href = product.url || shopUrl;
            const external = !!href && /^https?:\/\//i.test(href);

            return (
              <motion.div
                key={`${product.name}-${i}`}
                variants={reveal.item}
                className={`rounded-2xl overflow-hidden border flex flex-col transition-all duration-300 shadow-md hover:shadow-2xl hover:-translate-y-1 group ${
                  product.featured
                    ? 'border-[color:var(--ts-accent-border)] bg-[color:var(--ts-accent-soft)]'
                    : 'bg-[color:var(--ts-bg)] border-[color:var(--ts-border)] hover:border-[color:var(--ts-accent-border)]'
                }`}
              >
                {product.image && (
                  <div className="aspect-square overflow-hidden bg-[color:var(--ts-surface-raised)]">
                    <img
                      src={product.image}
                      alt={product.name}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      // A dead image should not leave a broken icon on a client's site.
                      onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                    />
                  </div>
                )}

                <div className="p-5 flex flex-col flex-1">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="text-base font-bold leading-snug">{product.name}</h3>
                    {product.price && (
                      <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap flex-shrink-0 border bg-[color:var(--ts-accent-soft)] text-[color:var(--ts-accent)] border-[color:var(--ts-accent-border)]">
                        {product.price}
                      </span>
                    )}
                  </div>

                  {product.description && (
                    <p className="text-xs sm:text-sm leading-relaxed text-[color:var(--ts-muted)] mb-4">
                      {product.description}
                    </p>
                  )}

                  <div className="mt-auto pt-3 border-t border-[color:var(--ts-border)]">
                    {href ? (
                      <a
                        href={href}
                        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                        className="inline-flex items-center text-xs sm:text-sm font-semibold text-[color:var(--ts-accent)] group-hover:translate-x-1 transition-transform"
                      >
                        <span>Shop this</span>
                        <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                      </a>
                    ) : (
                      <span className="text-xs font-medium text-[color:var(--ts-muted)]">
                        {product.availability || 'Available in-studio'}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
