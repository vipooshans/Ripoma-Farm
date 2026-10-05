import React from 'react';

/* ─────────────────────────────────────────────────────────────
   TORN / DECKLED EDGE DIVIDER
   A subtle hand-torn paper edge between sections.
   Usage: <TornEdgeDivider color="#D9C4A3" flip />
─────────────────────────────────────────────────────────────── */
export const TornEdgeDivider = ({
  color = '#D9C4A3',
  className = '',
  flip = false,
}) => (
  <div
    className={`w-full overflow-hidden leading-none pointer-events-none ${flip ? 'rotate-180' : ''} ${className}`}
    aria-hidden="true"
  >
    <svg
      viewBox="0 0 1200 60"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="none"
      className="block w-full h-[40px] sm:h-[52px]"
    >
      <path
        d="M0,0 C30,18 60,5 90,22 C120,38 155,10 190,28 C225,46 258,8 295,30 C332,52 368,12 405,35 C442,58 478,5 515,22 C552,40 588,10 625,28 C662,46 698,8 735,26 C772,44 808,12 845,30 C882,48 918,8 955,25 C992,42 1028,10 1065,28 C1102,46 1138,14 1175,30 L1200,33 L1200,60 L0,60 Z"
        fill={color}
      />
    </svg>
  </div>
);

/* ─────────────────────────────────────────────────────────────
   STAMPED WAX / INK SEAL
   Rotated circular hand-stamped badge.
   Usage: <StampedSeal label="Farm Fresh" />
─────────────────────────────────────────────────────────────── */
export const StampedSeal = ({
  label = 'Farm Fresh',
  size = 72,
  color = '#B5484D',
  className = '',
}) => (
  <div
    className={`relative select-none ${className}`}
    style={{ width: size, height: size }}
    aria-label={label}
  >
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer rough circle */}
      <circle
        cx="50"
        cy="50"
        r="46"
        fill={`${color}18`}
        stroke={color}
        strokeWidth="2.5"
        strokeDasharray="4 3"
      />
      {/* Inner filled ring */}
      <circle cx="50" cy="50" r="36" fill={`${color}12`} stroke={color} strokeWidth="1.5" />
      {/* Decorative inner dot */}
      <circle cx="50" cy="50" r="4" fill={color} />
    </svg>

    {/* Label text — centred, slightly rotated for stamp feel */}
    <div
      className="absolute inset-0 flex items-center justify-center px-3"
      style={{ transform: 'rotate(-8deg)' }}
    >
      <span
        className="font-handwritten font-bold uppercase text-center leading-tight"
        style={{ color, fontSize: size * 0.13 }}
      >
        {label}
      </span>
    </div>
  </div>
);

/* ─────────────────────────────────────────────────────────────
   CHALKBOARD PRICE BADGE
   Dark chalkboard chip with hand-lettered price text.
   Usage: <ChalkboardBadge price="LKR 1,497.00" />
─────────────────────────────────────────────────────────────── */
export const ChalkboardBadge = ({ price, className = '' }) => (
  <div
    className={`badge-chalkboard inline-flex items-center justify-center px-3 py-1 rounded-md text-base font-handwritten font-bold tracking-tight shadow-inner ${className}`}
    aria-label={`Price: ${price}`}
  >
    {price}
  </div>
);

/* ─────────────────────────────────────────────────────────────
   TWINE TAG HEADER
   A small twine-loop SVG pinned to the top of a card.
─────────────────────────────────────────────────────────────── */
export const TwineTagHeader = ({ className = '' }) => (
  <div className={`flex justify-center -mb-1 ${className}`} aria-hidden="true">
    <svg
      viewBox="0 0 60 24"
      width="60"
      height="24"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Hole */}
      <circle cx="30" cy="7" r="3.5" fill="#D9C4A3" stroke="#8A6A4B" strokeWidth="1.2" />
      {/* Twine loop */}
      <path
        d="M30,10.5 C25,14 15,14 10,20 M30,10.5 C35,14 45,14 50,20"
        fill="none"
        stroke="#8A6A4B"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  </div>
);

/* ─────────────────────────────────────────────────────────────
   WOODEN CRATE FRAME
   A decorative wooden crate border around a grid of products.
   Usage: <WoodenCrateFrame>…</WoodenCrateFrame>
─────────────────────────────────────────────────────────────── */
export const WoodenCrateFrame = ({ children, className = '' }) => (
  <div
    className={`relative rounded-2xl p-6 sm:p-10 ${className}`}
    style={{
      background: 'linear-gradient(145deg, #D9C4A3 0%, #C5AD8C 100%)',
      boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.10), inset 0 -2px 4px rgba(255,255,255,0.2), 0 4px 20px rgba(92,70,48,0.15)',
      border: '4px solid #5C4630',
      borderRadius: '1rem',
    }}
  >
    {/* Corner nail-head accents */}
    {['top-3 left-3','top-3 right-3','bottom-3 left-3','bottom-3 right-3'].map((pos) => (
      <div
        key={pos}
        className={`absolute ${pos} w-3 h-3 rounded-full bg-[#3A2B1D] shadow-inner`}
        aria-hidden="true"
      />
    ))}

    {/* Horizontal slat lines */}
    <div className="absolute top-1/3 left-3 right-3 h-px bg-[#5C4630]/25 pointer-events-none" aria-hidden="true" />
    <div className="absolute top-2/3 left-3 right-3 h-px bg-[#5C4630]/25 pointer-events-none" aria-hidden="true" />

    {children}
  </div>
);

/* ─────────────────────────────────────────────────────────────
   STITCHED BORDER CARD WRAPPER
   A kraft-paper tag style wrapper with a dashed stitched edge.
─────────────────────────────────────────────────────────────── */
export const StitchedCard = ({ children, className = '' }) => (
  <div
    className={`relative rounded-xl ${className}`}
    style={{
      background: '#F2E8D5',
      border: '2px dashed #8A6A4B',
      boxShadow: '0 2px 12px rgba(92,70,48,0.12), inset 0 0 0 4px #F2E8D5',
    }}
  >
    {children}
  </div>
);
