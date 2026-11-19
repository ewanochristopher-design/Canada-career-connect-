import React from 'react';

export const REF_ARTWORK_URL =
  '/assets/aistudio/WhatsApp_Image_2026-11-19_at_1.54.12_PM_2ea9c634.jpeg';

export const MapleLeafIcon: React.FC<{ className?: string }> = ({ className = 'h-6 w-6' }) => (
  <svg viewBox="0 0 64 64" fill="currentColor" className={className} aria-hidden="true">
    <path d="M32 4l4.8 11.2 9.4-3.6-3.1 10.6 10.9-1.1-5.8 8.3 6.8 5.2-12.1 2.9 2.5 7.7-10.7-2.6L32 58l-2.7-15.4-10.7 2.6 2.5-7.7L9 34.6l6.8-5.2-5.8-8.3 10.9 1.1-3.1-10.6 9.4 3.6L32 4z" />
  </svg>
);

/**
 * Renders the exact photographic hero visual from the reference design
 * (professionals with maple-leaf laptop, CN Tower skyline, Canadian flag, airplane,
 * and curved red/white ribbon) cropped cleanly without the baked-in left text.
 */
export const ExactHeroPhotoLayer: React.FC = () => (
  <div className="pointer-events-none absolute inset-0 overflow-hidden select-none">
    {/* Base soft sky-blue canvas matching left side of reference */}
    <div className="absolute inset-0 bg-gradient-to-r from-[#F4F7FC] via-[#EAF1FC] to-[#DCE8FA]" />

    {/* Exact photo positioned on the center-right */}
    <div className="absolute inset-y-0 right-0 w-full lg:w-[74%]">
      <svg
        viewBox="505 64 1031 460"
        className="h-full w-full"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <image href={REF_ARTWORK_URL} x="0" y="0" width="1536" height="1024" />
      </svg>
      {/* Smooth left edge fade into #F4F7FC/#EAF1FC so headline text always stays 100% legible */}
      <div className="absolute inset-y-0 left-0 w-48 bg-gradient-to-r from-[#EEF3FB] via-[#EEF3FB]/85 to-transparent" />
    </div>

    {/* Subtle bottom white curve transition */}
    <svg
      viewBox="0 0 1440 48"
      className="absolute bottom-0 left-0 w-full text-[#F4F7FA]"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path d="M0 32 Q 360 0 760 28 T 1440 16 L 1440 48 L 0 48 Z" fill="currentColor" />
    </svg>
  </div>
);

/**
 * Renders the exact sunset Toronto skyline + stacked books + graduation cap + maple leaf
 * from the dashboard welcome banner in the reference image.
 */
export const ExactDashboardBannerArt: React.FC = () => (
  <div className="pointer-events-none absolute inset-0 overflow-hidden select-none">
    <div className="absolute inset-0 bg-gradient-to-r from-[#1A4B9F] via-[#2760BC] to-[#3B6AC6]" />
    <div className="absolute inset-y-0 right-0 w-full sm:w-[72%]">
      <svg
        viewBox="655 616 515 200"
        className="h-full w-full"
        preserveAspectRatio="xMaxYMid slice"
        aria-hidden="true"
      >
        <image href={REF_ARTWORK_URL} x="0" y="0" width="1536" height="1024" />
      </svg>
      <div className="absolute inset-y-0 left-0 w-44 bg-gradient-to-r from-[#1E53AC] via-[#1E53AC]/85 to-transparent" />
    </div>
  </div>
);

/**
 * Renders the exact waving Canadian flag photo snippet for the sidebar promo card.
 */
export const ExactSidebarFlagArt: React.FC = () => (
  <div className="relative h-20 w-full overflow-hidden rounded-xl border border-white/15 bg-[#0A2146]">
    <svg
      viewBox="16 840 140 120"
      className="h-full w-full"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <image href={REF_ARTWORK_URL} x="0" y="0" width="1536" height="1024" />
    </svg>
    <div className="absolute inset-0 bg-gradient-to-t from-[#091D3E] via-transparent to-transparent" />
  </div>
);
