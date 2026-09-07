import React, { useState } from 'react';

/**
 * The longhorn mark.
 *
 * Served as SVG so it stays sharp on retina and at favicon size, and so the
 * whole mark costs 7KB instead of the 262KB the PNG cost on every page. The
 * vector was traced from public/logo.png, which remains the fallback — some
 * surfaces that consume this app's assets (mail clients, OG scrapers) still
 * want a raster, so the PNG is kept rather than replaced.
 */
export default function TexasSonsLogo({
  className = "w-10 h-10",
  variant = 'default',
}: {
  className?: string;
  /**
   * Which colourway. Both files are produced by the same trace of
   * public/logo.png, so the shapes cannot drift apart by hand — only the
   * two inks differ.
   */
  variant?: 'default' | 'brasada';
}) {
  const primary = variant === 'brasada' ? '/logo-brasada.svg' : '/logo.svg';
  const [src, setSrc] = useState(primary);

  return (
    <img
      src={src}
      alt="Texas Sons"
      className={`object-contain ${className}`}
      onError={() => setSrc((s) => (s === primary ? '/logo.png' : s))}
    />
  );
}
