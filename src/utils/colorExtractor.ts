/**
 * Client-Side Image Palette & Color Extractor
 * Analyzes image pixels to extract dominant background, surface, and vibrant accent colors.
 */

export interface ExtractedColorPalette {
  primaryBg: string;
  accentColor: string;
  secondaryAccent: string;
  palette: string[];
  isDark: boolean;
  themeRecommendation: 'campaign-navy' | 'crimson-bold' | 'emerald-gold' | 'luxury' | 'dark' | 'light' | 'custom';
  reason: string;
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (c: number) => {
    const hex = Math.max(0, Math.min(255, Math.round(c))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function getHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

export async function extractPaletteFromImage(dataUrl: string): Promise<ExtractedColorPalette> {
  return new Promise((resolve) => {
    // Default fallback palette if image fails to load
    const fallback: ExtractedColorPalette = {
      primaryBg: '#00081e',
      accentColor: '#C5A059',
      secondaryAccent: '#D4AF37',
      palette: ['#00081e', '#C5A059', '#1e3a8a', '#d97706', '#f59e0b'],
      isDark: true,
      themeRecommendation: 'campaign-navy',
      reason: 'Signature high-authority Texas Sons palette'
    };

    if (!dataUrl || typeof window === 'undefined') {
      return resolve(fallback);
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(fallback);

        // Scale down to 80x80 for fast pixel analysis
        const sampleSize = 80;
        canvas.width = sampleSize;
        canvas.height = sampleSize;
        ctx.drawImage(img, 0, 0, sampleSize, sampleSize);

        const imgData = ctx.getImageData(0, 0, sampleSize, sampleSize).data;
        const colorBuckets: Array<{ r: number; g: number; b: number; count: number; hsl: { h: number; s: number; l: number } }> = [];

        for (let i = 0; i < imgData.length; i += 16) {
          const r = imgData[i];
          const g = imgData[i + 1];
          const b = imgData[i + 2];
          const a = imgData[i + 3];

          if (a < 128) continue; // Ignore transparent pixels

          const hsl = getHsl(r, g, b);
          // Group colors within close hue & lightness
          let found = false;
          for (const bucket of colorBuckets) {
            const dr = Math.abs(bucket.r - r);
            const dg = Math.abs(bucket.g - g);
            const db = Math.abs(bucket.b - b);
            if (dr + dg + db < 45) {
              bucket.count++;
              found = true;
              break;
            }
          }

          if (!found) {
            colorBuckets.push({ r, g, b, count: 1, hsl });
          }
        }

        // Sort by frequency
        colorBuckets.sort((a, b) => b.count - a.count);

        // Separate vibrant accent candidates (saturation > 25% and 20% < lightness < 85%)
        const vibrantAccents = colorBuckets
          .filter(c => c.hsl.s > 25 && c.hsl.l > 20 && c.hsl.l < 85)
          .sort((a, b) => (b.hsl.s * 1.5 + b.count) - (a.hsl.s * 1.5 + a.count));

        // Separate background/dominant dark or light tones
        const darkTones = colorBuckets.filter(c => c.hsl.l < 25);
        const lightTones = colorBuckets.filter(c => c.hsl.l > 80);

        let chosenAccent = vibrantAccents[0] 
          ? rgbToHex(vibrantAccents[0].r, vibrantAccents[0].g, vibrantAccents[0].b)
          : '#C5A059';

        let secondaryAccent = vibrantAccents[1]
          ? rgbToHex(vibrantAccents[1].r, vibrantAccents[1].g, vibrantAccents[1].b)
          : '#ea580c';

        let primaryBg = darkTones[0]
          ? rgbToHex(darkTones[0].r, darkTones[0].g, darkTones[0].b)
          : '#00081e';

        const topColors = colorBuckets.slice(0, 5).map(c => rgbToHex(c.r, c.g, c.b));

        // Determine Theme Archetype from the extracted accent & hue
        const accentHsl = vibrantAccents[0] ? vibrantAccents[0].hsl : { h: 42, s: 50, l: 55 };
        let themeRecommendation: 'campaign-navy' | 'crimson-bold' | 'emerald-gold' | 'luxury' | 'dark' | 'light' | 'custom' = 'campaign-navy';
        let reason = `Extracted vibrant accent ${chosenAccent} from image`;

        if (accentHsl.h >= 35 && accentHsl.h <= 60) {
          themeRecommendation = 'campaign-navy';
          reason = `Extracted gold / warm amber (${chosenAccent}) from photo — paired with Authority Navy`;
        } else if (accentHsl.h < 30 || accentHsl.h > 330) {
          themeRecommendation = 'crimson-bold';
          reason = `Extracted bold crimson / ember tone (${chosenAccent}) from photo`;
        } else if (accentHsl.h >= 80 && accentHsl.h <= 170) {
          themeRecommendation = 'emerald-gold';
          reason = `Extracted emerald / forest tone (${chosenAccent}) from photo`;
        } else if (accentHsl.h >= 180 && accentHsl.h <= 260) {
          themeRecommendation = 'campaign-navy';
          reason = `Extracted high-contrast blue / navy tone (${chosenAccent}) from photo`;
        } else {
          themeRecommendation = 'luxury';
          reason = `Extracted luxury warm rose / bronze tone (${chosenAccent}) from photo`;
        }

        resolve({
          primaryBg,
          accentColor: chosenAccent,
          secondaryAccent,
          palette: topColors.length >= 3 ? topColors : fallback.palette,
          isDark: darkTones.length >= lightTones.length,
          themeRecommendation,
          reason
        });
      } catch (err) {
        console.warn('Canvas pixel extraction fallback:', err);
        resolve(fallback);
      }
    };

    img.onerror = () => resolve(fallback);
    img.src = dataUrl;
  });
}
