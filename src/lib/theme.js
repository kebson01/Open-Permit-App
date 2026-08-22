/**
 * lib/theme.js — one visual system for the whole app.
 *
 * The shell and the pages had drifted into two designs: Layout used #003466
 * with Hanken Grotesk and Public Sans, Home used #004ac6 with Manrope and Plus
 * Jakarta Sans. Same product, two identities, and a homeowner moving between
 * them notices even if they cannot name what changed.
 *
 * The navy is the logo's, so that is the one that stays. Only two families are
 * loaded now, and every page imports from here rather than restating hexes.
 */

export const C = {
  ink:       "#0c1a28",  // body text
  muted:     "#5c6b7a",  // secondary text — passes AA on surface and ground
  faint:     "#8b98a6",  // captions, sources
  line:      "#dde4eb",
  surface:   "#ffffff",
  ground:    "#f2f5f8",  // biased toward the navy, not the old lavender
  brand:     "#003466",
  brandInk:  "#00203f",  // pressed / hover
  brandSoft: "#e7eef6",
  brandSoftHover: "#d8e4ef",
  brandLine: "#c3d3e2",  // tinted border — dropzones, chips that read as "ours"

  // Verdict colours, shared with the camera scan so a green here and a green
  // there mean the same thing.
  ok:     "#0f6e46",
  okSoft: "#e3f3ec",
  warn:     "#8a5a00",
  warnSoft: "#fdf1dc",
  stop:     "#a32218",
  stopSoft: "#fbe9e7",
};

export const F = {
  head: "'Manrope', system-ui, -apple-system, sans-serif",
  body: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
};

/** Type scale. Anything not on it is a mistake, not a nuance. */
export const T = {
  caption: 12,
  small:   13,
  body:    15,
  lead:    17,
  title:   22,
  display: 28,
};

export const RADIUS = 12;

/** One shadow, used sparingly — depth is not how this app shows hierarchy. */
export const SHADOW = "0 1px 2px rgba(12,26,40,0.04), 0 4px 12px rgba(12,26,40,0.05)";
