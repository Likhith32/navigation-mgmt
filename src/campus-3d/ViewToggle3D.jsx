// ViewToggle3D.jsx
// Add this inside your existing CampusMap.jsx return block
// to give users a "Switch to 3D" button.

import { useNavigate } from 'react-router-dom';

export function ViewToggle3D({ style }) {
  const navigate = useNavigate();
  return (
    <button
      title="Switch to 3D Campus View"
      onClick={() => navigate('/map3d')}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)',
        border: 'none',
        borderRadius: 22,
        padding: '9px 16px',
        color: 'white',
        fontSize: 12,
        fontWeight: 700,
        cursor: 'pointer',
        fontFamily: 'inherit',
        boxShadow: '0 4px 16px rgba(29, 78, 216, 0.5)',
        transition: 'all 0.2s',
        letterSpacing: '0.03em',
        ...style,
      }}
      onMouseOver={e => e.currentTarget.style.transform = 'translateY(-1px)'}
      onMouseOut={e => e.currentTarget.style.transform = 'none'}
    >
      <span style={{ fontSize: 15 }}>🏙</span>
      3D View
    </button>
  );
}

// ── USAGE in CampusMap.jsx return: ──────────────────
// Inside your floating-dock or controls:
//
//   import { ViewToggle3D } from './ViewToggle3D';
//
//   <ViewToggle3D style={{ position: 'absolute', top: 20, right: 130, zIndex: 20 }} />