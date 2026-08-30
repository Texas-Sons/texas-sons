import React from 'react';

export interface SquareBookingBlockProps {
  /** The client's Square Appointments booking site URL. */
  bookingUrl?: string;
  title?: string;
  subtitle?: string;
  /** 'live' — real site, load the iframe. 'preview' — Studio, see Part 3. */
  variant?: 'live' | 'preview';
  theme?: 'dark' | 'light' | 'luxury' | 'campaign-navy' | 'campaign-judicial' | 'crimson-bold' | 'emerald-gold' | 'custom';
  accentColor?: string;
}

export function SquareBookingBlock({
  bookingUrl,
  title = 'Book Your Appointment',
  subtitle,
  variant = 'live',
  theme,
  accentColor,
}: SquareBookingBlockProps) {
  if (!bookingUrl) return null;

  return (
    <section
      id="book"
      className="py-20 sm:py-28 relative bg-[color:var(--ts-bg)] text-[color:var(--ts-text)] border-t border-[color:var(--ts-border)]"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center">
        <h2 className="text-3xl sm:text-5xl font-bold tracking-tight mb-4 font-[family-name:var(--ts-font-heading)]">
          {title}
        </h2>
        {subtitle && (
          <p className="text-base sm:text-lg text-[color:var(--ts-muted)] font-medium max-w-2xl mx-auto mb-12">
            {subtitle}
          </p>
        )}

        <div className="mb-8 rounded-xl overflow-hidden shadow-xl border border-[color:var(--ts-border)] bg-[color:var(--ts-surface)]">
          {variant === 'preview' ? (
            <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-[color:var(--ts-muted)] bg-[color:var(--ts-bg)]">
              <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-lg font-medium text-[color:var(--ts-text)]">Square booking embed</p>
              <p className="text-sm mt-1">Loads on the published site</p>
            </div>
          ) : (
            <iframe
              src={bookingUrl}
              title="Square Online Booking"
              className="w-full min-h-[800px] sm:min-h-[1000px] bg-white"
              loading="lazy"
            />
          )}
        </div>

        <div className="text-center">
          <a
            href={bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-base sm:text-lg font-medium rounded-md text-white bg-black hover:opacity-80 transition-opacity shadow-sm"
          >
            Book on Square
            <svg className="ml-2 -mr-1 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
          <p className="mt-4 text-sm text-[color:var(--ts-muted)]">
            Having trouble? Open booking directly.
          </p>
        </div>
      </div>
    </section>
  );
}
