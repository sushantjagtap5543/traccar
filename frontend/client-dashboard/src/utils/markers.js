const COLORS = {
  cyan: "#06B6D4",
  indigo: "#818CF8",
  purple: "#A855F7",
  emerald: "#10B981",
  rose: "#F43F5E",
  amber: "#F59E0B",
  lime: "#84CC16",
  orange: "#FB923C",
  fuchsia: "#D946EF",
  sky: "#0EA5E9"
};

const SHAPES = {
  sedan: `<path d="M4 14C4 13.4477 4.44772 13 5 13H19C19.5523 13 20 13.4477 20 14V17C20 17.5523 19.5523 18 19 18H5C4.44772 18 4 17.5523 4 17V14ZM6 4C6 3.44772 6.44772 3 7 3H17C17.5523 3 18 3.44772 18 4V13H6V4ZM9 7V10H15V7H9Z" fill="currentColor"/>`,
  suv: `<path d="M3 13C3 12.4477 3.44772 12 4 12H20C20.5523 12 21 12.4477 21 13V18C21 18.5523 20.5523 19 20 19H4C3.44772 19 3 18.5523 3 18V13ZM5 4C5 3.44772 5.44772 3 6 3H18C18.5523 3 19 3.44772 19 4V12H5V4ZM7 6V9H17V6H7Z" fill="currentColor"/>`,
  truck: `<rect x="6" y="2" width="12" height="15" rx="2" fill="currentColor"/><rect x="4" y="10" width="16" height="12" rx="2" fill="currentColor"/><rect x="8" y="4" width="8" height="6" fill="rgba(0,0,0,0.3)"/>`,
  pickup: `<path d="M4 14V19H20V14H4ZM6 4H14V14H6V4ZM16 7H20V14H16V7Z" fill="currentColor"/><rect x="8" y="6" width="4" height="6" fill="rgba(0,0,0,0.2)"/>`,
  van: `<rect x="4" y="4" width="16" height="16" rx="3" fill="currentColor"/><rect x="6" y="6" width="12" height="6" rx="1" fill="rgba(0,0,0,0.2)"/><path d="M4 13H20" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>`,
  bus: `<rect x="5" y="2" width="14" height="20" rx="4" fill="currentColor"/><rect x="7" y="4" width="10" height="2" fill="rgba(0,0,0,0.2)"/><rect x="7" y="10" width="10" height="2" fill="rgba(0,0,0,0.2)"/><rect x="7" y="16" width="10" height="2" fill="rgba(0,0,0,0.2)"/>`,
  bike: `<path d="M12 2C10.9 2 10 2.9 10 4V7H14V4C14 2.9 13.1 2 12 2ZM10 9V22H14V9H10Z" fill="currentColor"/><circle cx="12" cy="15.5" r="1.5" fill="rgba(0,0,0,0.3)"/>`,
  emergency: `<rect x="4" y="4" width="16" height="16" rx="2" fill="currentColor"/><path d="M12 7V17M7 12H17" stroke="rgba(255,255,255,0.4)" stroke-width="3" stroke-linecap="round"/><circle cx="12" cy="12" r="8" fill="none" stroke="rgba(251,191,36,0.3)" stroke-width="1"/>`,
  security: `<path d="M12 2L4 5V10C4 15.33 7.33 20.33 12 22C16.67 20.33 20 15.33 20 10V5L12 2Z" fill="currentColor"/><path d="M12 7V17M9 10L12 13L15 10" stroke="rgba(0,0,0,0.3)" stroke-width="2" stroke-linecap="round"/>`,
  cargo: `<rect x="4" y="2" width="16" height="20" rx="1" fill="currentColor"/><path d="M8 6H16M8 10H16M8 14H16M8 18H16" stroke="rgba(0,0,0,0.2)" stroke-width="1"/>`,
  drone: `<path d="M12 2L15 5L12 8L9 5L12 2Z" fill="currentColor"/><circle cx="6" cy="12" r="3" fill="currentColor"/><circle cx="18" cy="12" r="3" fill="currentColor"/><circle cx="12" cy="18" r="3" fill="currentColor"/><path d="M6 12H18M12 6V18" stroke="currentColor" stroke-width="2"/>`
};

export const getVehicleIcon = (category = "sedan", colorName = "cyan", rotation = 0, isOnline = true) => {
  const color = COLORS[colorName] || COLORS.cyan;
  const shape = SHAPES[category] || SHAPES.sedan;
  const opacity = isOnline ? 1 : 0.4;
  const glow = isOnline ? `drop-shadow(0 0 8px ${color})` : 'none';

  return `
    <div style="transform: rotate(${rotation}deg); width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; filter: ${glow}; opacity: ${opacity};">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="color: ${color}; transition: all 0.3s ease;">
        ${shape}
      </svg>
    </div>
  `;
};

// Pre-generated set of 50 icons (as references)
export const VEHICLE_PALETTE = Object.keys(COLORS).flatMap(c => 
  Object.keys(SHAPES).map(s => ({ category: s, color: c }))
);
