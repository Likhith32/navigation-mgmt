// InfoPanel.jsx — Right-side slide-in panel for building info + floor explorer

import { useState, useMemo } from 'react';

const FLOOR_COLORS = ['#38bdf8', '#34d399', '#fb923c', '#a78bfa', '#f472b6'];

const TYPE_META = {
  hostel:       { badge: '#1d4ed8', label: 'Boys Hostel'   },
  girls_hostel: { badge: '#9d174d', label: 'Girls Hostel'  },
  academic:     { badge: '#065f46', label: 'Academic Block' },
  workshop:     { badge: '#78350f', label: 'Workshop'       },
  admin:        { badge: '#374151', label: 'Administration' },
  canteen:      { badge: '#92400e', label: 'Food & Canteen' },
  library:      { badge: '#0369a1', label: 'Library'        },
};

const ROOM_TYPE_META = {
  hostel_room:   { icon: '🛏', label: 'Hostel Room'  },
  common_room:   { icon: '📺', label: 'Common Room'  },
  bathroom:      { icon: '🚿', label: 'Bathroom'     },
  stairwell:     { icon: '🪜', label: 'Stairwell'    },
  corridor:      { icon: '🚶', label: 'Corridor'     },
  warden_office: { icon: '🏢', label: 'Warden'       },
  study_room:    { icon: '📚', label: 'Study Room'   },
  exit:          { icon: '🚪', label: 'Entrance'     },
  classroom:     { icon: '🏫', label: 'Classroom'    },
  lab:           { icon: '🔬', label: 'Lab'          },
  office:        { icon: '💼', label: 'Office'       },
};

export default function InfoPanel({ building, rooms, onClose, onFloorSelect, activeFloor, userRole }) {
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [view, setView] = useState('building'); // 'building' | 'floor' | 'room'

  const props    = building?.userData?.props || {};
  const type     = building?.userData?.type  || 'academic';
  const meta     = TYPE_META[type] || TYPE_META.academic;
  const floors   = building?.userData?.floors || 1;
  const totalH   = building?.userData?.totalH || 4;

  const floorRooms = useMemo(() => {
    if (!rooms || activeFloor === null) return [];
    return rooms.filter(r => r.building_id === props.id && r.floor === activeFloor);
  }, [rooms, props.id, activeFloor]);

  const roomCfg = selectedRoom ? (ROOM_TYPE_META[selectedRoom.type] || { icon: '📍', label: selectedRoom.type }) : null;

  const handleFloor = (f) => {
    onFloorSelect(f);
    setView('floor');
    setSelectedRoom(null);
  };

  const handleRoom = (room) => {
    setSelectedRoom(room);
    setView('room');
  };

  if (!building) return null;

  return (
    <div className="c3d-info-panel" style={{ animation: 'slideInRight 0.3s cubic-bezier(0.16,1,0.3,1)' }}>

      {/* ── CLOSE ── */}
      <button className="c3d-panel-close" onClick={onClose}>✕</button>

      {/* ── BREADCRUMB ── */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 14, flexWrap: 'wrap' }}>
        <span
          style={{ fontSize: 11, color: view === 'building' ? '#38bdf8' : 'rgba(255,255,255,0.4)', cursor: 'pointer', fontWeight: 600 }}
          onClick={() => { setView('building'); setSelectedRoom(null); }}
        >
          {props.short_name || props.name}
        </span>
        {(view === 'floor' || view === 'room') && (
          <>
            <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11 }}>›</span>
            <span
              style={{ fontSize: 11, color: view === 'floor' ? '#38bdf8' : 'rgba(255,255,255,0.4)', cursor: 'pointer', fontWeight: 600 }}
              onClick={() => { setView('floor'); setSelectedRoom(null); }}
            >
              Floor {activeFloor === 0 ? 'G' : activeFloor}
            </span>
          </>
        )}
        {view === 'room' && selectedRoom && (
          <>
            <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11 }}>›</span>
            <span style={{ fontSize: 11, color: '#38bdf8', fontWeight: 600 }}>{selectedRoom.name}</span>
          </>
        )}
      </div>

      {/* ════════════════════ BUILDING VIEW ════════════════════ */}
      {view === 'building' && (
        <>
          <div className="c3d-panel-type-badge" style={{ background: meta.badge }}>
            {building.userData.props?.type === 'hostel' ? '🏠' :
             building.userData.props?.type === 'girls_hostel' ? '🏠' :
             building.userData.props?.type === 'workshop' ? '⚙️' :
             building.userData.props?.type === 'canteen' ? '🍔' :
             building.userData.props?.type === 'library' ? '📚' : '🏛️'} {meta.label}
          </div>

          <div className="c3d-panel-name">{props.name}</div>

          {props.description && (
            <div className="c3d-panel-desc">{props.description}</div>
          )}

          {/* Stats */}
          <div className="c3d-panel-stats" style={{ marginBottom: 16 }}>
            <div className="c3d-stat">
              <div className="c3d-stat-val">{floors}</div>
              <div className="c3d-stat-lbl">Floors</div>
            </div>
            <div className="c3d-stat">
              <div className="c3d-stat-val">{Math.round(totalH)}m</div>
              <div className="c3d-stat-lbl">Height</div>
            </div>
            {props.room_prefix && (
              <div className="c3d-stat">
                <div className="c3d-stat-val" style={{ fontSize: 14 }}>{props.room_prefix}</div>
                <div className="c3d-stat-lbl">Prefix</div>
              </div>
            )}
          </div>

          {/* Floor selector */}
          <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
            Explore Floors
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
            {Array.from({ length: floors }).map((_, f) => {
              const lbl = props.floor_labels?.[f] || (f === 0 ? 'Ground' : `Floor ${f}`);
              const col = FLOOR_COLORS[f % FLOOR_COLORS.length];
              return (
                <div
                  key={f}
                  onClick={() => handleFloor(f)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
                    border: `1px solid ${activeFloor === f ? col : 'rgba(255,255,255,0.08)'}`,
                    background: activeFloor === f ? col + '22' : 'rgba(255,255,255,0.03)',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ width: 28, height: 28, borderRadius: 7, background: col, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                    {f === 0 ? 'G' : f}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 500, color: activeFloor === f ? '#fff' : 'rgba(255,255,255,0.55)' }}>{lbl} Floor</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 1 }}>Click to highlight &amp; explore rooms</div>
                  </div>
                  {activeFloor === f && (
                    <div style={{ fontSize: 10, padding: '2px 7px', borderRadius: 10, background: col, color: '#fff', fontWeight: 600 }}>Active</div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Tags */}
          {props.has_corridor !== undefined && (
            <div className="c3d-panel-tags">
              {props.has_corridor && <span className="c3d-tag">🚶 Corridor Layout</span>}
              <span className="c3d-tag">📐 {Math.round(building.userData.w)}×{Math.round(building.userData.d)}m</span>
              <span className="c3d-tag">🏗️ {props.type}</span>
            </div>
          )}

          {props.id === 'LIBRARY' && (
            <a href="/library" className="c3d-explore-btn" style={{ display: 'block', textAlign: 'center', textDecoration: 'none', marginTop: 8 }}>
              📚 Open 3D Library Explorer
            </a>
          )}
        </>
      )}

      {/* ════════════════════ FLOOR VIEW ════════════════════ */}
      {view === 'floor' && (
        <>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
            {props.name}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 14 }}>
            {props.floor_labels?.[activeFloor] || (activeFloor === 0 ? 'Ground' : `Floor ${activeFloor}`)} · {floorRooms.length} rooms
          </div>

          {floorRooms.length === 0 ? (
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '20px 0' }}>
              No room data for this floor yet.<br/>
              <span style={{ fontSize: 10 }}>Add rooms to rooms.json for {props.id}</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, maxHeight: 280, overflowY: 'auto' }}>
              {floorRooms.map(room => {
                const rm = ROOM_TYPE_META[room.type] || { icon: '📍', label: room.type };
                const allowed = !room.allowed_roles || room.allowed_roles.includes(userRole);
                return (
                  <div
                    key={room.id}
                    onClick={() => handleRoom(room)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '8px 10px', borderRadius: 8, cursor: 'pointer',
                      border: '1px solid rgba(255,255,255,0.07)',
                      background: 'rgba(255,255,255,0.03)',
                      opacity: allowed ? 1 : 0.5,
                    }}
                  >
                    <span style={{ fontSize: 16 }}>{rm.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, color: '#f1f5f9', fontWeight: 500 }}>{room.name}</div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>{rm.label}</div>
                    </div>
                    {!allowed && <span style={{ fontSize: 9, color: '#f87171', border: '1px solid #f87171', borderRadius: 4, padding: '1px 4px' }}>Restricted</span>}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ════════════════════ ROOM VIEW ════════════════════ */}
      {view === 'room' && selectedRoom && roomCfg && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(56,189,248,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, border: '1px solid rgba(56,189,248,0.3)', flexShrink: 0 }}>
              {roomCfg.icon}
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9' }}>{selectedRoom.name}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{roomCfg.label} · {props.short_name}</div>
            </div>
          </div>

          {selectedRoom.description && (
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.55, marginBottom: 14 }}>
              {selectedRoom.description}
            </div>
          )}

          {/* Access control */}
          {(() => {
            const allowed = !selectedRoom.allowed_roles || selectedRoom.allowed_roles.includes(userRole);
            return (
              <div style={{
                padding: '9px 12px', borderRadius: 10, marginBottom: 12,
                background: allowed ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
                border: `1px solid ${allowed ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.35)'}`,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Authorization</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: allowed ? '#34d399' : '#f87171' }}>
                  {allowed ? '🛡 Access Granted' : '🚫 Restricted'}
                </span>
              </div>
            );
          })()}

          {/* Room stats */}
          <div className="c3d-panel-stats" style={{ marginBottom: 14 }}>
            {selectedRoom.capacity && (
              <div className="c3d-stat">
                <div className="c3d-stat-val">{selectedRoom.capacity}</div>
                <div className="c3d-stat-lbl">👥 Cap.</div>
              </div>
            )}
            {selectedRoom.area_sqm && (
              <div className="c3d-stat">
                <div className="c3d-stat-val">{selectedRoom.area_sqm}</div>
                <div className="c3d-stat-lbl">📐 m²</div>
              </div>
            )}
            {selectedRoom.open_time && (
              <div className="c3d-stat">
                <div className="c3d-stat-val" style={{ fontSize: 11 }}>{selectedRoom.open_time?.slice(0,5)}</div>
                <div className="c3d-stat-lbl">🕐 Opens</div>
              </div>
            )}
          </div>

          {/* Attributes */}
          {(selectedRoom.attributes || []).length > 0 && (
            <div className="c3d-panel-tags">
              {selectedRoom.attributes.map(a => (
                <span key={a} className="c3d-tag">{a}</span>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}