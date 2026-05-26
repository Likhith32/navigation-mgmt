// PathTooltip.jsx — Google Maps-style tooltip that appears when hovering campus roads
import { useEffect, useRef } from 'react';

const TYPE_LABELS = {
  primary:   { label: 'Main Road',      icon: '🛣️',  color: '#29b6f6' },
  secondary: { label: 'Campus Road',    icon: '🛤️',  color: '#4dd0e1' },
  tertiary:  { label: 'Pathway',        icon: '🚶', color: '#80deea' },
};

export default function PathTooltip({ hoveredPath, clickedPath }) {
  const info = clickedPath || hoveredPath;
  if (!info) return null;

  const cfg = TYPE_LABELS[info.type] || TYPE_LABELS.secondary;
  const isClicked = !!clickedPath;

  return (
    <div style={{
      position: 'absolute',
      bottom: 180,
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'rgba(10,15,26,0.93)',
      border: `1px solid ${isClicked ? '#fbbf24' : 'rgba(255,255,255,0.12)'}`,
      borderRadius: 10,
      padding: '10px 16px',
      color: 'white',
      pointerEvents: 'none',
      zIndex: 25,
      backdropFilter: 'blur(10px)',
      boxShadow: isClicked
        ? '0 4px 24px rgba(251,191,36,0.3)'
        : '0 4px 16px rgba(0,0,0,0.4)',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      whiteSpace: 'nowrap',
      transition: 'border-color 0.2s, box-shadow 0.2s',
    }}>
      {/* Color indicator dot */}
      <div style={{
        width: 10,
        height: 10,
        borderRadius: '50%',
        background: isClicked ? '#fbbf24' : cfg.color,
        boxShadow: `0 0 6px ${isClicked ? '#fbbf24' : cfg.color}`,
        flexShrink: 0,
      }} />

      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'white' }}>
          {info.name}
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ 
            background: cfg.color + '22', 
            color: cfg.color, 
            padding: '1px 6px', 
            borderRadius: 4, 
            fontSize: 10,
            fontWeight: 600,
          }}>
            {cfg.label}
          </span>
          {isClicked && (
            <span style={{ color: '#fbbf24', fontSize: 10 }}>● Selected</span>
          )}
        </div>
      </div>
    </div>
  );
}