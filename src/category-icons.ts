// Premium color category icon system for DubMenu.
// All icons are inline SVGs. Category icons use a mix of `currentColor` (for
// strokes and small accents) and category-specific gradients so they are crisp,
// distinctive, and theme-aware. Placeholder icons are larger, product-quality
// fallbacks shown when a product image is missing or fails to load. No external
// network assets are required.

export const CATEGORY_LABELS: Record<string, string> = {
  flower: 'Flower',
  edibles: 'Edibles',
  concentrates: 'Concentrates',
  prerolls: 'Pre-Rolls',
  vapes: 'Vapes',
  topicals: 'Topicals',
  tinctures: 'Tinctures',
  cbd: 'CBD',
  accessories: 'Accessories',
  other: 'Other',
  generic: 'Product',
};

// Shared SVG wrapper attributes for accessibility and rendering consistency.
const SVG_ATTRS = 'xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" role="img" aria-hidden="true" focusable="false"';
const PLACEHOLDER_ATTRS = 'xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-hidden="true" focusable="false" class="placeholder-icon"';

export const CATEGORY_ICON_SVGS: Record<string, string> = {
  flower:
    `<svg ${SVG_ATTRS}><defs><linearGradient id="g-cat-flower" x1="12" y1="0" x2="12" y2="24" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#4ade80"/><stop offset="1" stop-color="#15803d"/></linearGradient></defs><path d="M12 22V11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.4"/><path d="M12 17c-3-1.5-5.5-4-6.5-7.5 3.5-0.5 6 1.5 8 4.5 2-3 4.5-5 8-4.5-1.5 3.5-4 6-8 7.5z" fill="url(#g-cat-flower)" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" opacity="0.8"/><path d="M12 13c-2.5-1.5-4-4-4-7 0-2 1.5-3.5 4-3.5s4 1.5 4 3.5c0 3-1.5 5.5-4 7z" fill="url(#g-cat-flower)" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M12 12c-2-1.5-3.5-3.5-3.5-6 0-1.5 1-2.5 3.5-2.5s3.5 1 3.5 2.5c0 2.5-1.5 4.5-3.5 6z" fill="currentColor" opacity="0.2"/><circle cx="12" cy="7" r="1.2" fill="#14532d" opacity="0.8"/><path d="M12 9V5" stroke="currentColor" stroke-width="1" stroke-linecap="round" opacity="0.3"/></svg>`,
  edibles:
    `<svg ${SVG_ATTRS}><defs><linearGradient id="g-cat-edibles" x1="12" y1="0" x2="12" y2="24" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fbbf24"/><stop offset="1" stop-color="#ea580c"/></linearGradient></defs><circle cx="12" cy="12" r="8" fill="url(#g-cat-edibles)" stroke="currentColor" stroke-width="1.5"/><circle cx="9" cy="10" r="1.5" fill="currentColor"/><circle cx="15" cy="10" r="1.5" fill="currentColor"/><path d="M9 15c1.5 1.5 4.5 1.5 6 0" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" fill="none"/><path d="M4 8c2-2 4-2 6-1M20 8c-2-2-4-2-6-1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.4"/></svg>`,
  concentrates:
    `<svg ${SVG_ATTRS}><defs><linearGradient id="g-cat-concentrates" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#22d3ee"/><stop offset="0.5" stop-color="#8b5cf6"/><stop offset="1" stop-color="#c026d3"/></linearGradient></defs><path d="M12 3l8.5 6.5L12 19 3.5 9.5z" fill="url(#g-cat-concentrates)" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M12 8.5l4.5 3.5L12 15.5 7.5 12z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" opacity="0.6"/><path d="M12 8.5V15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.4"/></svg>`,
  prerolls:
    `<svg ${SVG_ATTRS}><defs><linearGradient id="g-cat-prerolls" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fde68a"/><stop offset="1" stop-color="#d97706"/></linearGradient></defs><path d="M4 20L20 4" stroke="url(#g-cat-prerolls)" stroke-width="4" stroke-linecap="round"/><circle cx="5" cy="19" r="3" fill="url(#g-cat-prerolls)" stroke="currentColor" stroke-width="1.5"/><path d="M6 18l-2 2M18 6l2-2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.5"/></svg>`,
  vapes:
    `<svg ${SVG_ATTRS}><defs><linearGradient id="g-cat-vapes" x1="12" y1="0" x2="12" y2="24" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#60a5fa"/><stop offset="1" stop-color="#1d4ed8"/></linearGradient><linearGradient id="g-cat-vapes-tip" x1="12" y1="18" x2="12" y2="24" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#e5e7eb"/><stop offset="1" stop-color="#9ca3af"/></linearGradient></defs><rect x="7" y="2" width="10" height="16" rx="3" fill="url(#g-cat-vapes)" stroke="currentColor" stroke-width="1.5"/><rect x="9.5" y="18" width="5" height="4" rx="1" fill="url(#g-cat-vapes-tip)" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="9" r="1.5" fill="currentColor" opacity="0.4"/></svg>`,
  topicals:
    `<svg ${SVG_ATTRS}><defs><linearGradient id="g-cat-topicals" x1="12" y1="0" x2="12" y2="24" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#2dd4bf"/><stop offset="1" stop-color="#0f766e"/></linearGradient><linearGradient id="g-cat-topicals-lid" x1="0" y1="0" x2="24" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#f3f4f6"/><stop offset="1" stop-color="#d1d5db"/></linearGradient></defs><path d="M12 3c-4.5 0-8 3.5-8 8 0 3.5 2.5 6.5 6 7.5v3h4v-3c3.5-1 6-4 6-7.5 0-4.5-3.5-8-8-8z" fill="url(#g-cat-topicals)" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M9 2h6v3H9z" fill="url(#g-cat-topicals-lid)" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M12 7v5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.6"/></svg>`,
  tinctures:
    `<svg ${SVG_ATTRS}><defs><linearGradient id="g-cat-tinctures" x1="12" y1="0" x2="12" y2="24" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#a78bfa"/><stop offset="1" stop-color="#6d28d9"/></linearGradient><linearGradient id="g-cat-tinctures-liquid" x1="12" y1="10" x2="12" y2="22" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fbbf24"/><stop offset="1" stop-color="#d97706"/></linearGradient></defs><path d="M9 2h6v5H9z" fill="url(#g-cat-tinctures)" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M8 8h8l-1 12a2.5 2.5 0 0 1-5 0L8 8z" fill="url(#g-cat-tinctures-liquid)" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M12 12v5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.5"/><circle cx="12" cy="5" r="1" fill="currentColor"/></svg>`,
  cbd:
    `<svg ${SVG_ATTRS}><defs><linearGradient id="g-cat-cbd" x1="12" y1="0" x2="12" y2="24" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#a3e635"/><stop offset="1" stop-color="#65a30d"/></linearGradient></defs><path d="M12 22c0-4-3-7-6-8 3-1 6-4 6-8 0 4 3 7 6 8-3 1-6 4-6 8z" fill="url(#g-cat-cbd)" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M12 6c-1.5 1.5-2 3-2 5s1 4 2 5c1.5-1 2-3 2-5s-1-4-2-5z" fill="currentColor" opacity="0.25"/><path d="M12 9v5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.6"/></svg>`,
  accessories:
    `<svg ${SVG_ATTRS}><defs><linearGradient id="g-cat-accessories" x1="12" y1="0" x2="12" y2="24" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fbbf24"/><stop offset="1" stop-color="#b45309"/></linearGradient></defs><circle cx="12" cy="12" r="7" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="12" r="3" fill="url(#g-cat-accessories)" stroke="currentColor" stroke-width="1.5"/><path d="M12 5v2M12 17v2M5 12h2M17 12h2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  other:
    `<svg ${SVG_ATTRS}><defs><linearGradient id="g-cat-other" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#9ca3af"/><stop offset="1" stop-color="#4b5563"/></linearGradient></defs><circle cx="6.5" cy="12" r="2.5" fill="url(#g-cat-other)" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="12" r="2.5" fill="url(#g-cat-other)" stroke="currentColor" stroke-width="1.5"/><circle cx="17.5" cy="12" r="2.5" fill="url(#g-cat-other)" stroke="currentColor" stroke-width="1.5"/></svg>`,
  generic:
    `<svg ${SVG_ATTRS}><defs><linearGradient id="g-cat-generic" x1="12" y1="0" x2="12" y2="24" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#34d399"/><stop offset="1" stop-color="#0f766e"/></linearGradient></defs><path d="M12 21c0-4.5-3.5-7.5-6-8.5 3-1 6-4 6-8.5 0 4.5 3 7.5 6 8.5-3 1-6 4-6 8.5z" fill="url(#g-cat-generic)" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M12 11V5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.6"/></svg>`,
};

export const PLACEHOLDER_ICON_SVGS: Record<string, string> = {
  flower:
    `<svg ${PLACEHOLDER_ATTRS}><defs><linearGradient id="g-ph-flower" x1="50" y1="0" x2="50" y2="100" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#4ade80"/><stop offset="1" stop-color="#166534"/></linearGradient><radialGradient id="g-ph-flower-bg" cx="50" cy="50" r="50" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#14532d"/><stop offset="1" stop-color="#022c22"/></radialGradient><linearGradient id="g-ph-flower-stem" x1="50" y1="55" x2="50" y2="100" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#15803d"/><stop offset="1" stop-color="#064e3b"/></linearGradient></defs><circle cx="50" cy="50" r="48" fill="url(#g-ph-flower-bg)"/><path d="M50 90V58" stroke="url(#g-ph-flower-stem)" stroke-width="4" stroke-linecap="round" opacity="0.6"/><path d="M50 90V58" stroke="currentColor" stroke-width="4" stroke-linecap="round" opacity="0.15"/><path d="M50 78c-12-5-22-14-26-26 8-1 16 2 22 8 6-6 14-9 22-8-4 12-14 21-26 26z" fill="#166534" stroke="currentColor" stroke-width="2" stroke-linejoin="round" opacity="0.5"/><path d="M50 74c-15-8-26-22-28-38 10-2 22 4 28 16 6-12 18-18 28-16-2 16-13 30-28 38z" fill="url(#g-ph-flower)" stroke="currentColor" stroke-width="2" stroke-linejoin="round" opacity="0.85"/><path d="M50 60c-12-10-21-24-23-40 10-1 18 6 23 18 5-12 13-19 23-18-2 16-11 30-23 40z" fill="url(#g-ph-flower)" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M50 50c-10-9-17-21-18-36 8-1 14 5 18 14 4-9 10-15 18-14-1 15-8 27-18 36z" fill="url(#g-ph-flower)" stroke="currentColor" stroke-width="2" stroke-linejoin="round" opacity="0.9"/><ellipse cx="50" cy="50" rx="7" ry="9" fill="#14532d" stroke="currentColor" stroke-width="1.5" opacity="0.95"/><path d="M50 46v8M46 50h8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.4"/><path d="M50 58c-7-8-11-18-11-29M50 58c7-8 11-18 11-29" stroke="currentColor" stroke-width="1" stroke-linecap="round" opacity="0.15"/><path d="M50 74c-10-6-18-15-22-27M50 74c10-6 18-15 22-27" stroke="currentColor" stroke-width="1" stroke-linecap="round" opacity="0.12"/></svg>`,
  edibles:
    `<svg ${PLACEHOLDER_ATTRS}><defs><radialGradient id="g-ph-edibles" cx="50" cy="40" r="45" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fbbf24"/><stop offset="1" stop-color="#ea580c"/></radialGradient><linearGradient id="g-ph-edibles-shine" x1="35" y1="30" x2="65" y2="60" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#ffffff" stop-opacity="0.4"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></linearGradient></defs><circle cx="50" cy="50" r="48" fill="#431407"/><path d="M25 35c0-8 6-14 14-14h22c8 0 14 6 14 14v30c0 8-6 14-14 14H39c-8 0-14-6-14-14z" fill="url(#g-ph-edibles)" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><circle cx="32" cy="28" r="5" fill="url(#g-ph-edibles)" stroke="currentColor" stroke-width="1.5"/><circle cx="68" cy="28" r="5" fill="url(#g-ph-edibles)" stroke="currentColor" stroke-width="1.5"/><circle cx="40" cy="48" r="4" fill="#431407" opacity="0.6"/><circle cx="60" cy="48" r="4" fill="#431407" opacity="0.6"/><path d="M42 62c6 4 16 4 22 0" stroke="#431407" stroke-width="2" stroke-linecap="round"/><path d="M35 38c5 5 15 5 20 0" fill="url(#g-ph-edibles-shine)"/></svg>`,
  concentrates:
    `<svg ${PLACEHOLDER_ATTRS}><defs><linearGradient id="g-ph-concentrates" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#22d3ee"/><stop offset="0.5" stop-color="#8b5cf6"/><stop offset="1" stop-color="#c026d3"/></linearGradient><linearGradient id="g-ph-concentrates-shine" x1="30" y1="30" x2="70" y2="70" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#ffffff" stop-opacity="0.5"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></linearGradient></defs><circle cx="50" cy="50" r="48" fill="#0f172a"/><path d="M50 8L88 42L50 92L12 42z" fill="url(#g-ph-concentrates)" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M50 8L88 42L50 92L12 42z" fill="none" stroke="currentColor" stroke-width="1" stroke-linejoin="round" opacity="0.3"/><path d="M50 8v84M12 42h76" stroke="currentColor" stroke-width="1" opacity="0.2"/><path d="M50 35L30 42L50 55L70 42z" fill="url(#g-ph-concentrates-shine)"/></svg>`,
  prerolls:
    `<svg ${PLACEHOLDER_ATTRS}><defs><linearGradient id="g-ph-prerolls" x1="50" y1="0" x2="50" y2="100" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fde68a"/><stop offset="0.5" stop-color="#d97706"/><stop offset="1" stop-color="#92400e"/></linearGradient><linearGradient id="g-ph-prerolls-filter" x1="0" y1="0" x2="100" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fef3c7"/><stop offset="1" stop-color="#d97706"/></linearGradient></defs><circle cx="50" cy="50" r="48" fill="#2a1810"/><path d="M28 18h44L58 88H42L28 18z" fill="url(#g-ph-prerolls)" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><rect x="30" y="18" width="40" height="14" rx="2" fill="url(#g-ph-prerolls-filter)" stroke="currentColor" stroke-width="2"/><path d="M42 44h16" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity="0.3"/><path d="M38 60h24" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity="0.3"/></svg>`,
  vapes:
    `<svg ${PLACEHOLDER_ATTRS}><defs><linearGradient id="g-ph-vapes" x1="50" y1="0" x2="50" y2="100" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#60a5fa"/><stop offset="1" stop-color="#1e40af"/></linearGradient><linearGradient id="g-ph-vapes-tip" x1="50" y1="0" x2="50" y2="30" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#e5e7eb"/><stop offset="1" stop-color="#9ca3af"/></linearGradient></defs><circle cx="50" cy="50" r="48" fill="#0f172a"/><rect x="32" y="12" width="36" height="76" rx="12" fill="url(#g-ph-vapes)" stroke="currentColor" stroke-width="2"/><rect x="38" y="6" width="24" height="12" rx="3" fill="url(#g-ph-vapes-tip)" stroke="currentColor" stroke-width="2"/><circle cx="50" cy="38" r="8" fill="#e5e7eb" opacity="0.3"/><rect x="42" y="62" width="16" height="14" rx="2" fill="currentColor" opacity="0.2"/></svg>`,
  topicals:
    `<svg ${PLACEHOLDER_ATTRS}><defs><linearGradient id="g-ph-topicals" x1="50" y1="0" x2="50" y2="100" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#2dd4bf"/><stop offset="1" stop-color="#0f766e"/></linearGradient><linearGradient id="g-ph-topicals-lid" x1="0" y1="0" x2="100" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#f3f4f6"/><stop offset="1" stop-color="#d1d5db"/></linearGradient></defs><circle cx="50" cy="50" r="48" fill="#0c2e2a"/><path d="M50 8C28 8 10 26 10 48c0 16 10 32 24 38v4h32v-4c14-6 24-22 24-38C90 26 72 8 50 8z" fill="url(#g-ph-topicals)" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><rect x="22" y="16" width="56" height="12" rx="2" fill="url(#g-ph-topicals-lid)" stroke="currentColor" stroke-width="2"/><path d="M50 40v30" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity="0.2"/><circle cx="35" cy="55" r="5" fill="#ffffff" opacity="0.2"/><circle cx="65" cy="65" r="5" fill="#ffffff" opacity="0.2"/></svg>`,
  tinctures:
    `<svg ${PLACEHOLDER_ATTRS}><defs><linearGradient id="g-ph-tinctures" x1="50" y1="0" x2="50" y2="100" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#a78bfa"/><stop offset="1" stop-color="#5b21b6"/></linearGradient><linearGradient id="g-ph-tinctures-liquid" x1="50" y1="30" x2="50" y2="90" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fbbf24"/><stop offset="1" stop-color="#b45309"/></linearGradient></defs><circle cx="50" cy="50" r="48" fill="#1e1b4b"/><rect x="32" y="8" width="36" height="16" rx="2" fill="url(#g-ph-tinctures)" stroke="currentColor" stroke-width="2"/><path d="M28 28h44L62 88H38L28 28z" fill="url(#g-ph-tinctures-liquid)" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><rect x="42" y="20" width="16" height="28" rx="2" fill="#ffffff" opacity="0.15"/><circle cx="50" cy="70" r="4" fill="#ffffff" opacity="0.3"/><path d="M50 24v12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
  cbd:
    `<svg ${PLACEHOLDER_ATTRS}><defs><linearGradient id="g-ph-cbd" x1="50" y1="0" x2="50" y2="100" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#a3e635"/><stop offset="1" stop-color="#3f6212"/></linearGradient><linearGradient id="g-ph-cbd-drop" x1="50" y1="0" x2="50" y2="100" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#22d3ee"/><stop offset="1" stop-color="#0e7490"/></linearGradient></defs><circle cx="50" cy="50" r="48" fill="#1a2e05"/><path d="M50 88c0-12-8-22-18-28 10-4 18-14 18-28 0 14 8 24 18 28-10 6-18 16-18 28z" fill="url(#g-ph-cbd)" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M50 40c-8-6-14-16-16-26 6-1 12 4 16 12 4-8 10-13 16-12-2 10-8 20-16 26z" fill="url(#g-ph-cbd)" stroke="currentColor" stroke-width="2" stroke-linejoin="round" opacity="0.85"/><path d="M50 45v30" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity="0.2"/><path d="M50 92c-3 0-6-4-6-9 0-5 6-14 6-14s6 9 6 14c0 5-3 9-6 9z" fill="url(#g-ph-cbd-drop)" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>`,
  accessories:
    `<svg ${PLACEHOLDER_ATTRS}><defs><linearGradient id="g-ph-accessories" x1="50" y1="0" x2="50" y2="100" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fbbf24"/><stop offset="1" stop-color="#b45309"/></linearGradient></defs><circle cx="50" cy="50" r="48" fill="#1f2937"/><circle cx="50" cy="50" r="28" fill="url(#g-ph-accessories)" stroke="currentColor" stroke-width="2"/><circle cx="50" cy="50" r="12" fill="#1f2937" stroke="currentColor" stroke-width="2"/><path d="M50 12v8M50 80v8M12 50h8M80 50h8M22 22l6 6M72 72l6 6M78 22l-6 6M28 72l-6 6" stroke="currentColor" stroke-width="4" stroke-linecap="round"/></svg>`,
  other:
    `<svg ${PLACEHOLDER_ATTRS}><defs><linearGradient id="g-ph-other" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#9ca3af"/><stop offset="1" stop-color="#374151"/></linearGradient></defs><circle cx="50" cy="50" r="48" fill="#111827"/><circle cx="35" cy="50" r="18" fill="url(#g-ph-other)" stroke="currentColor" stroke-width="2" opacity="0.9"/><circle cx="50" cy="50" r="18" fill="url(#g-ph-other)" stroke="currentColor" stroke-width="2" opacity="0.9"/><circle cx="65" cy="50" r="18" fill="url(#g-ph-other)" stroke="currentColor" stroke-width="2" opacity="0.9"/></svg>`,
  generic:
    `<svg ${PLACEHOLDER_ATTRS}><defs><linearGradient id="g-ph-generic" x1="50" y1="0" x2="50" y2="100" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#34d399"/><stop offset="1" stop-color="#064e3b"/></linearGradient></defs><circle cx="50" cy="50" r="48" fill="#022c22"/><path d="M50 85V50" stroke="currentColor" stroke-width="3" stroke-linecap="round" opacity="0.2"/><path d="M50 78c-14-8-26-22-28-40 10-2 22 6 28 18 6-12 18-20 28-18-2 18-14 32-28 40z" fill="url(#g-ph-generic)" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M50 50c-12-10-20-24-20-38 10-1 18 8 20 20 2-12 10-21 20-20 0 14-8 28-20 38z" fill="url(#g-ph-generic)" stroke="currentColor" stroke-width="2" stroke-linejoin="round" opacity="0.85"/></svg>`,
};

const CATEGORY_NEEDLES: { type: string; needles: string[] }[] = [
  { type: 'cbd', needles: ['cbd'] },
  { type: 'flower', needles: ['flower', 'bud', 'strain', 'whole flower', 'ground flower', 'smalls', 'popcorn'] },
  { type: 'edibles', needles: ['edible', 'gummy', 'gummies', 'candy', 'chocolate', 'baked', 'munchie', 'chew', 'cookie', 'brownie', 'beverage', 'drink', 'soda', 'mint', 'snack'] },
  { type: 'concentrates', needles: ['concentrate', 'extract', 'wax', 'shatter', 'resin', 'rosin', 'oil', 'dab', 'sauce', 'badder', 'crumble', 'live', 'diamond', 'distillate', 'kief', 'bubble hash'] },
  { type: 'prerolls', needles: ['pre-roll', 'preroll', 'pre roll', 'joint', 'cone', 'blunt'] },
  { type: 'vapes', needles: ['vape', 'vaporizer', 'cartridge', 'cart', 'disposable', 'aio', '510', 'pen'] },
  { type: 'topicals', needles: ['topical', 'cream', 'balm', 'lotion', 'salve', 'transdermal', 'patch'] },
  { type: 'tinctures', needles: ['tincture', 'sublingual', 'drop', 'spray', 'elixir'] },
  { type: 'accessories', needles: ['accessor', 'battery', 'paper', 'grinder', 'pipe', 'bong', 'rig', 'tool', 'gear', 'lighter', 'apparel'] },
];

export function getCategoryType(name: string): string {
  const n = (name || '').toLowerCase();
  for (const { type, needles } of CATEGORY_NEEDLES) {
    if (needles.some((needle) => n.includes(needle))) return type;
  }
  return 'other';
}

// Self-contained JavaScript source for the shared category detector so it can
// be injected into the inline browser scripts of html-menu and html-tv without
// duplicating the needle list or logic.
export const GET_CATEGORY_TYPE_JS = `function getCategoryType(name){
  var n=(name||'').toLowerCase();
  var NEEDLES=${JSON.stringify(CATEGORY_NEEDLES)};
  for(var i=0;i<NEEDLES.length;i++){
    var needles=NEEDLES[i].needles;
    for(var j=0;j<needles.length;j++){
      if(n.indexOf(needles[j])!==-1)return NEEDLES[i].type;
    }
  }
  return 'other';
}`;

// Deterministic product-level visual variant for placeholder icons. Keeps the
// same category shape but shifts color/rotation subtly so adjacent products in
// one category do not look identical. Returns 0-3.
export function getProductVariant(id: string, name: string): number {
  const s = String(id || '') + ':' + String(name || '');
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h) % 4;
}

export const GET_PRODUCT_VARIANT_JS = `function getProductVariant(id,name){
  var s=String(id||'')+':'+String(name||'');
  var h=0;
  for(var i=0;i<s.length;i++){
    h=(h*31+s.charCodeAt(i))|0;
  }
  return Math.abs(h)%4;
}`;
