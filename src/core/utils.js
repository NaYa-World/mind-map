
'use strict';

/* ============================================================
   CONSTANTS & CONFIG
   ============================================================ */

const CFG = {
  NODE_H:      40,
  NODE_MIN_W:  88,
  NODE_PAD_X:  20,
  NODE_MAX_W:  220,  // max node width before text wraps
  LINE_H:      20,   // line height for wrapped text
  ROOT_H:      54,
  ROOT_MIN_W:  130,
  H_GAP:       170,
  V_GAP:       22,
  ZOOM_MIN:    0.05,
  ZOOM_MAX:    5.0,
  ZOOM_BTN:    1.25,
  ZOOM_SCROLL: 0.002,
  ZOOM_CAP:    0.15,
  MAX_UNDO:    60,
};

const SVG_NS = 'http://www.w3.org/2000/svg';

/* ---- THEMES ---- */
const THEMES = {
  bright: {
    name: 'Bright Colors',
    root: '#4DD0E1',
    palette: ['#66BB6A','#EF5350','#FFA726','#AB47BC','#26C6DA','#EC407A','#26A69A','#7E57C2'],
  },
  soft: {
    name: 'Soft Colors',
    root: '#80CBC4',
    palette: ['#A5D6A7','#F48FB1','#FFE082','#CE93D8','#80DEEA','#FFCC80','#B0BEC5','#EF9A9A'],
  },
  blueSteel: {
    name: 'Blue Steel',
    root: '#42A5F5',
    palette: ['#1565C0','#1976D2','#2196F3','#42A5F5','#64B5F6','#90CAF9','#1E88E5','#0D47A1'],
  },
  spring: {
    name: 'Spring Levels',
    root: '#00BCD4',
    palette: ['#4CAF50','#8BC34A','#CDDC39','#FFC107','#FF9800','#FF5722','#009688','#3F51B5'],
  },
  pastel: {
    name: 'Pastel Colors',
    root: '#CE93D8',
    palette: ['#FFCDD2','#C8E6C9','#BBDEFB','#FFF9C4','#E1BEE7','#B2EBF2','#FFE0B2','#D7CCC8'],
  },
  bw: {
    name: 'Black & White',
    root: '#EEEEEE',
    palette: ['#BDBDBD','#9E9E9E','#757575','#616161','#E0E0E0','#F5F5F5','#424242','#FAFAFA'],
  },
};

/* ---- LAYOUTS ---- */
const LAYOUTS = [
  { id:'horizontal', name:'Horizontal Layout' },
  { id:'fromParent', name:'From Parent' },
  { id:'freeForm',   name:'Free Form Layout' },
  { id:'vertical',   name:'Vertical Layout' },
  { id:'topDown',    name:'Top Down Layout' },
  { id:'list',       name:'List Layout' },
  { id:'linear',     name:'Linear Layout' },
  { id:'radial',     name:'Radial Layout' },
  { id:'matrix',     name:'Matrix Layout' },
];

/* ---- LAYOUT PREVIEW SVGs ---- */
const LAYOUT_PREVIEWS = {
  horizontal:`<ellipse cx="0" cy="0" rx="18" ry="10" fill="#4DD0E1"/>
    <rect x="32" y="-18" width="32" height="12" rx="6" fill="none" stroke="#66BB6A" stroke-width="2"/>
    <rect x="32" y="6" width="32" height="12" rx="6" fill="none" stroke="#EF5350" stroke-width="2"/>
    <rect x="-64" y="-18" width="32" height="12" rx="6" fill="none" stroke="#FFA726" stroke-width="2"/>
    <rect x="-64" y="6" width="32" height="12" rx="6" fill="none" stroke="#AB47BC" stroke-width="2"/>
    <path d="M18,-4 C25,-4 25,-12 32,-12" stroke="#66BB6A" fill="none" stroke-width="2"/>
    <path d="M18,4 C25,4 25,12 32,12" stroke="#EF5350" fill="none" stroke-width="2"/>
    <path d="M-18,-4 C-25,-4 -25,-12 -32,-12" stroke="#FFA726" fill="none" stroke-width="2"/>
    <path d="M-18,4 C-25,4 -25,12 -32,12" stroke="#AB47BC" fill="none" stroke-width="2"/>`,
  fromParent:`<ellipse cx="-50" cy="0" rx="14" ry="9" fill="#4DD0E1"/>
    <rect x="-26" y="-18" width="26" height="10" rx="5" fill="none" stroke="#66BB6A" stroke-width="1.8"/>
    <rect x="-26" y="-4"  width="26" height="10" rx="5" fill="none" stroke="#66BB6A" stroke-width="1.8"/>
    <rect x="-26" y="10"  width="26" height="10" rx="5" fill="none" stroke="#EF5350" stroke-width="1.8"/>
    <rect x="10"  y="-22" width="24" height="10" rx="5" fill="none" stroke="#66BB6A" stroke-width="1.5"/>
    <rect x="10"  y="-9"  width="24" height="10" rx="5" fill="none" stroke="#66BB6A" stroke-width="1.5"/>
    <path d="M-36,0 C-30,0 -30,-13 -26,-13" stroke="#66BB6A" fill="none" stroke-width="1.8"/>
    <path d="M-36,0 C-30,0 -30,1 -26,1" stroke="#66BB6A" fill="none" stroke-width="1.8"/>
    <path d="M-36,0 C-30,0 -30,15 -26,15" stroke="#EF5350" fill="none" stroke-width="1.8"/>`,
  freeForm:`<ellipse cx="0" cy="-4" rx="15" ry="9" fill="#4DD0E1"/>
    <rect x="28" y="-26" width="26" height="10" rx="5" fill="none" stroke="#66BB6A" stroke-width="1.8"/>
    <rect x="-56" y="10"  width="26" height="10" rx="5" fill="none" stroke="#EF5350" stroke-width="1.8"/>
    <rect x="22"  y="14"  width="26" height="10" rx="5" fill="none" stroke="#FFA726" stroke-width="1.8"/>
    <rect x="-50" y="-24" width="26" height="10" rx="5" fill="none" stroke="#AB47BC" stroke-width="1.8"/>
    <line x1="15" y1="-4"  x2="28"  y2="-21" stroke="#66BB6A" stroke-width="1.8"/>
    <line x1="-15" y1="-4" x2="-43" y2="15" stroke="#EF5350" stroke-width="1.8"/>
    <line x1="15" y1="-4"  x2="35"  y2="19"  stroke="#FFA726" stroke-width="1.8"/>
    <line x1="-15" y1="-4" x2="-37" y2="-19" stroke="#AB47BC" stroke-width="1.8"/>`,
  vertical:`<rect x="-14" y="-28" width="28" height="12" rx="6" fill="#4DD0E1"/>
    <rect x="-38" y="-8"  width="26" height="10" rx="5" fill="none" stroke="#66BB6A" stroke-width="2"/>
    <rect x="12"  y="-8"  width="26" height="10" rx="5" fill="none" stroke="#EF5350" stroke-width="2"/>
    <rect x="-52" y="10"  width="22" height="10" rx="5" fill="none" stroke="#66BB6A" stroke-width="1.5"/>
    <rect x="-26" y="10"  width="22" height="10" rx="5" fill="none" stroke="#66BB6A" stroke-width="1.5"/>
    <rect x="8"   y="10"  width="22" height="10" rx="5" fill="none" stroke="#EF5350" stroke-width="1.5"/>
    <path d="M-14,-16 C-25,-16 -25,-3 -25,-3" stroke="#66BB6A" fill="none" stroke-width="2"/>
    <path d="M14,-16 C25,-16 25,-3 25,-3"  stroke="#EF5350" fill="none" stroke-width="2"/>`,
  topDown:`<ellipse cx="0" cy="-22" rx="22" ry="10" fill="#4DD0E1"/>
    <rect x="-62" y="-4" width="30" height="10" rx="5" fill="none" stroke="#66BB6A" stroke-width="2"/>
    <rect x="-27" y="-4" width="30" height="10" rx="5" fill="none" stroke="#EF5350" stroke-width="2"/>
    <rect x="10"  y="-4" width="30" height="10" rx="5" fill="none" stroke="#FFA726" stroke-width="2"/>
    <rect x="-62" y="14" width="22" height="10" rx="5" fill="none" stroke="#66BB6A" stroke-width="1.5"/>
    <rect x="-36" y="14" width="22" height="10" rx="5" fill="none" stroke="#66BB6A" stroke-width="1.5"/>
    <line x1="0" y1="-12" x2="-47" y2="-4" stroke="#66BB6A" stroke-width="2"/>
    <line x1="0" y1="-12" x2="-12" y2="-4" stroke="#EF5350" stroke-width="2"/>
    <line x1="0" y1="-12" x2="25"  y2="-4" stroke="#FFA726" stroke-width="2"/>`,
  list:`<rect x="-70" y="-27" width="38" height="10" rx="4" fill="#4DD0E1"/>
    <rect x="-56" y="-13" width="32" height="9" rx="4" fill="none" stroke="#66BB6A" stroke-width="1.8"/>
    <rect x="-42" y="-1"  width="28" height="9" rx="4" fill="none" stroke="#66BB6A" stroke-width="1.5"/>
    <rect x="-56" y="11"  width="32" height="9" rx="4" fill="none" stroke="#EF5350" stroke-width="1.8"/>
    <rect x="-42" y="23"  width="28" height="9" rx="4" fill="none" stroke="#EF5350" stroke-width="1.5"/>
    <line x1="-52" y1="-22" x2="-52" y2="-9" stroke="#66BB6A" stroke-width="1.2"/>
    <line x1="-52" y1="-9" x2="-56" y2="-9" stroke="#66BB6A" stroke-width="1.2"/>
    <line x1="-52" y1="-22" x2="-52" y2="15" stroke="#EF5350" stroke-width="1.2"/>
    <line x1="-52" y1="15" x2="-56" y2="15" stroke="#EF5350" stroke-width="1.2"/>`,
  linear:`<ellipse cx="-62" cy="0" rx="12" ry="8" fill="#4DD0E1"/>
    <rect x="-44" y="-5" width="22" height="10" rx="5" fill="none" stroke="#66BB6A" stroke-width="2"/>
    <rect x="-16" y="-5" width="22" height="10" rx="5" fill="none" stroke="#EF5350" stroke-width="2"/>
    <rect x="12"  y="-5" width="22" height="10" rx="5" fill="none" stroke="#FFA726" stroke-width="2"/>
    <rect x="40"  y="-5" width="22" height="10" rx="5" fill="none" stroke="#AB47BC" stroke-width="2"/>
    <line x1="-50" y1="0" x2="-44" y2="0" stroke="#66BB6A" stroke-width="2"/>
    <line x1="-22" y1="0" x2="-16" y2="0" stroke="#EF5350" stroke-width="2"/>
    <line x1="6"   y1="0" x2="12"  y2="0" stroke="#FFA726" stroke-width="2"/>
    <line x1="34"  y1="0" x2="40"  y2="0" stroke="#AB47BC" stroke-width="2"/>`,
  radial:`<ellipse cx="0" cy="0" rx="14" ry="9" fill="#4DD0E1"/>
    <rect x="22"  y="-5"  width="24" height="10" rx="5" fill="none" stroke="#66BB6A" stroke-width="2"/>
    <rect x="-46" y="-5"  width="24" height="10" rx="5" fill="none" stroke="#EF5350" stroke-width="2"/>
    <rect x="-9"  y="-28" width="24" height="10" rx="5" fill="none" stroke="#FFA726" stroke-width="2"/>
    <rect x="-9"  y="18"  width="24" height="10" rx="5" fill="none" stroke="#AB47BC" stroke-width="2"/>
    <rect x="18"  y="-22" width="22" height="10" rx="5" fill="none" stroke="#26C6DA" stroke-width="1.5"/>
    <line x1="14" y1="0"   x2="22"  y2="0"   stroke="#66BB6A" stroke-width="2"/>
    <line x1="-14" y1="0"  x2="-22" y2="0"   stroke="#EF5350" stroke-width="2"/>
    <line x1="0"  y1="-9"  x2="3"   y2="-18" stroke="#FFA726" stroke-width="2"/>
    <line x1="0"  y1="9"   x2="3"   y2="18"  stroke="#AB47BC" stroke-width="2"/>`,
  matrix:`<rect x="-64" y="-24" width="20" height="12" rx="4" fill="#4DD0E1"/>
    <rect x="-40" y="-24" width="20" height="12" rx="4" fill="none" stroke="#66BB6A" stroke-width="1.8"/>
    <rect x="-16" y="-24" width="20" height="12" rx="4" fill="none" stroke="#EF5350" stroke-width="1.8"/>
    <rect x="8"   y="-24" width="20" height="12" rx="4" fill="none" stroke="#FFA726" stroke-width="1.8"/>
    <rect x="32"  y="-24" width="20" height="12" rx="4" fill="none" stroke="#AB47BC" stroke-width="1.8"/>
    <rect x="-64" y="-8"  width="20" height="12" rx="4" fill="none" stroke="#26C6DA" stroke-width="1.5"/>
    <rect x="-40" y="-8"  width="20" height="12" rx="4" fill="none" stroke="#EC407A" stroke-width="1.5"/>
    <rect x="-16" y="-8"  width="20" height="12" rx="4" fill="none" stroke="#66BB6A" stroke-width="1.5"/>
    <rect x="8"   y="-8"  width="20" height="12" rx="4" fill="none" stroke="#EF5350" stroke-width="1.5"/>
    <rect x="32"  y="-8"  width="20" height="12" rx="4" fill="none" stroke="#FFA726" stroke-width="1.5"/>
    <rect x="-64" y="8"   width="20" height="12" rx="4" fill="none" stroke="#AB47BC" stroke-width="1.5"/>
    <rect x="-40" y="8"   width="20" height="12" rx="4" fill="none" stroke="#26C6DA" stroke-width="1.5"/>`,
};

/* ============================================================
   UTILITY HELPERS
   ============================================================ */
let _idCtr = 1;
const genId = () => `n${Date.now()}_${_idCtr++}`;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

function svgEl(tag, attrs={}) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
}
export { CFG, SVG_NS, THEMES, LAYOUTS, LAYOUT_PREVIEWS, genId, clamp, svgEl };
