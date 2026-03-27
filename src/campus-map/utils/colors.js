// utils/colors.js

const TYPE_COLORS = {
  academic:  [26,  86,  219, 200],
  hostel:    [126, 58,  242, 200],
  admin:     [14,  159, 110, 200],
  library:   [217, 119, 6,   200],
  canteen:   [231, 70,  148, 200],
  lab:       [63,  131, 248, 200],
  sports:    [49,  196, 141, 200],
  default:   [100, 116, 139, 200],
};

export function buildingColor(type) {
  return TYPE_COLORS[type] || TYPE_COLORS.default;
}

export function hexToRgba(hex, alpha = 200) {
  const r = parseInt(hex.slice(1,3), 16);
  const g = parseInt(hex.slice(3,5), 16);
  const b = parseInt(hex.slice(5,7), 16);
  return [r, g, b, alpha];
}

// Crowd density ratio (0–1) → color
export function densityColor(ratio) {
  if (ratio < 0.4) return [29, 158, 117, 80];   // teal — quiet
  if (ratio < 0.7) return [217, 119, 6,  120];  // amber — busy
  return              [220, 38,  38, 160];        // red — crowded
}
