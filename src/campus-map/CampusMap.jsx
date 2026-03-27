// CampusMap.jsx — v8: Multi-building stable
import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MapboxOverlay } from '@deck.gl/mapbox';
import './CampusMap.css';
import { useCampusLayers, FLOOR_CONFIG, FLOOR_HEIGHT, BUILDINGS } from './useCampusLayers';
import { useEyeControl }  from './useEyeControl';
import { useRoomSearch }  from './useRoomSearch';
import { usePathfinding } from './usePathfinding';
import roomsData          from './data/rooms.json';
import navgraphData       from './data/navgraph.json';
import { getBuildingCameras } from './utils/buildingCameras';

const CAMPUS_CENTER = [83.375500, 18.150300];

const CAMERA_PRESETS = [
  {
    id: 'all',
    label: 'Full Campus',
    icon: '⬡',
    config: { center: [83.375200, 18.150800], zoom: 16.8, pitch: 45, bearing: 0, duration: 1000 },
  },
  {
    id: 'hostels',
    label: 'Hostels',
    icon: '🏠',
    config: { center: [83.372000, 18.148900], zoom: 18.4, pitch: 52, bearing: -15, duration: 900 },
  },
  {
    id: 'academic',
    label: 'Academic',
    icon: '🎓',
    config: { center: [83.374800, 18.151500], zoom: 18.0, pitch: 50, bearing: -10, duration: 900 },
  },
  {
    id: 'workshops',
    label: 'Workshops',
    icon: '⚙',
    config: { center: [83.375500, 18.151500], zoom: 18.2, pitch: 50, bearing: -10, duration: 900 },
  },
  {
    id: 'top',
    label: 'Top',
    icon: '⬆',
    config: { center: [83.375200, 18.150800], zoom: 17.0, pitch: 0, bearing: 0, duration: 900 },
  },
];

const ROOM_TYPE = {
  hostel_room:   { label:'Hostel Room',  icon:'🛏'  },
  common_room:   { label:'Common Room',  icon:'📺'  },
  bathroom:      { label:'Bathroom',     icon:'🚿'  },
  stairwell:     { label:'Stairwell',    icon:'🪜'  },
  corridor:      { label:'Corridor',     icon:'🚶'  },
  warden_office: { label:'Warden',       icon:'🏢'  },
  study_room:    { label:'Study Room',   icon:'📚'  },
  exit:          { label:'Entrance',     icon:'🚪'  },
};

export default function CampusMap() {
  const mapContainer = useRef(null);
  const mapRef       = useRef(null);
  const overlayRef   = useRef(null);

  const [mapReady,     setMapReady]     = useState(false);
  const [mode,         setMode]         = useState('block');
  const [activeBuildingId, setActiveBuildingId] = useState(null);
  const [activeFloor,  setActiveFloor]  = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [hoveredRoom,  setHoveredRoom]  = useState(null);
  const [panelState,   setPanelState]   = useState('none');
  const [activeCam,    setActiveCam]    = useState('iso');
  const [activeBldgCam, setActiveBldgCam] = useState('bldg-iso');

  const modeRef               = useRef('block');
  const handleBuildingClickRef = useRef(null);

  useEffect(() => { modeRef.current = mode; }, [mode]);

  const rooms = useMemo(() => roomsData?.rooms || [], []);
  const { query, results, search }   = useRoomSearch(rooms);
  const { routeGeoJson, findRoute, clearRoute, accessibleOnly, setAccessibleOnly } = usePathfinding(navgraphData);
  const { eyeMode, toggleEyeMode, handlers: eyeHandlers } = useEyeControl(mapRef);

  const buildingCameras = useMemo(() => {
    if (!activeBuildingId) return [];
    const building = BUILDINGS[activeBuildingId];
    return building ? getBuildingCameras(building) : [];
  }, [activeBuildingId]);

  const applyPreset = useCallback((preset) => {
    setActiveCam(preset.id);
    setActiveBldgCam(null);
    mapRef.current?.flyTo(preset.config);
  }, []);

  const applyBuildingCam = useCallback((preset) => {
    setActiveBldgCam(preset.id);
    mapRef.current?.flyTo(preset.config);
  }, []);

  const handleBuildingClick = useCallback((buildingId) => {
    setActiveBuildingId(buildingId);
    setMode('floors'); setActiveFloor(0); setPanelState('floors'); setSelectedRoom(null);
    setActiveBldgCam('bldg-iso');
    const bldg = BUILDINGS[buildingId];
    if (bldg) {
      mapRef.current?.flyTo({ center:bldg.centroid, zoom:19.6, pitch:58, bearing:-15, duration:800 });
    }
  }, []);

  useEffect(() => { handleBuildingClickRef.current = handleBuildingClick; }, [handleBuildingClick]);

  const handleFloorSelect = useCallback((floorIdx) => {
    setActiveFloor(floorIdx); setSelectedRoom(null); setPanelState('floors');
    const bldg = BUILDINGS[activeBuildingId];
    if (bldg) {
      mapRef.current?.flyTo({ center:bldg.centroid, zoom:19.6, pitch:58, bearing:mapRef.current.getBearing(), duration:500 });
    }
  }, [activeBuildingId]);

  const handleRoomClick = useCallback((room, floorIdx) => {
    if (!room) { setActiveFloor(floorIdx); return; }
    setSelectedRoom(room); setActiveFloor(floorIdx); setPanelState('room'); search('');
  }, [search]);

  const handleRoomHover = useCallback((room) => { setHoveredRoom(room); }, []);

  const handleBackToBlock = useCallback(() => {
    setMode('block'); setActiveBuildingId(null); setActiveFloor(null); setPanelState('none'); setSelectedRoom(null);
    setActiveBldgCam(null);
    clearRoute(); applyPreset(CAMERA_PRESETS[0]);
  }, [applyPreset, clearRoute]);

  const handleBackToFloors = useCallback(() => { setSelectedRoom(null); setPanelState('floors'); }, []);

  const handleSearchSelect = useCallback((room) => {
    setActiveBuildingId(room.building_id);
    setMode('floors'); setActiveFloor(room.floor); setSelectedRoom(room); setPanelState('room'); search('');
  }, [search]);

  const handleGetRoute = useCallback(() => {
    if (!selectedRoom) return;
    const from = rooms.find(r => r.building_id===selectedRoom.building_id && r.id!==selectedRoom.id && r.type!=='corridor' && r.type!=='stairwell');
    if (from) findRoute(from, selectedRoom);
  }, [selectedRoom, rooms, findRoute]);

  useEffect(() => {
    if (mapRef.current || !mapContainer.current) return;
    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
        sources: { 'osm-tiles': { type: 'raster', tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'], tileSize: 256, attribution: '© OpenStreetMap contributors', maxzoom:19 } },
        layers: [ { id:'background', type:'background', paint:{'background-color':'#f0ede8'} }, { id:'osm-raster', type:'raster', source:'osm-tiles', paint:{'raster-opacity':0.85} } ],
      },
      center: CAMPUS_CENTER, zoom: 16.8, pitch: 45, bearing: 0, antialias: true, maxPitch: 85, dragRotate: false,
    });
    mapRef.current = map;
    const overlay = new MapboxOverlay({ layers:[], interleaved:false });
    map.addControl(overlay);
    overlayRef.current = overlay;

    map.on('load', () => { setMapReady(true); });

    map.on('click', (e) => {
      if (modeRef.current !== 'block') return;
      const { lng, lat } = e.lngLat;
      for (const bldg of Object.values(BUILDINGS)) {
        const { minLng, maxLng, minLat, maxLat } = bldg.bbox;
        if (lng >= minLng && lng <= maxLng && lat >= minLat && lat <= maxLat) {
          handleBuildingClickRef.current?.(bldg.id);
          return;
        }
      }
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass:true, visualizePitch:true }), 'top-right');
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  const layers = useCampusLayers({
    roomsData: rooms, mode, activeBuildingId, activeFloor,
    selectedRoom, hoveredRoom,
    onBuildingClick: handleBuildingClick, onRoomClick: handleRoomClick, onRoomHover: handleRoomHover,
    routeGeoJson,
  });

  useEffect(() => { overlayRef.current?.setProps({ layers }); }, [layers]);

  const floorCfg = activeFloor !== null ? FLOOR_CONFIG[activeFloor] : FLOOR_CONFIG[0];
  const roomCfg  = selectedRoom ? (ROOM_TYPE[selectedRoom.type]||{label:selectedRoom.type,icon:'📍'}) : null;

  const bldgStats = useMemo(() => {
    if (!activeBuildingId) return { total:0, rooms:0, common:0, bath:0 };
    const bRooms = rooms.filter(r => r.building_id === activeBuildingId);
    return {
      name:  BUILDINGS[activeBuildingId]?.name || 'Building',
      total: bRooms.length,
      rooms: bRooms.filter(r => r.type === 'hostel_room').length,
      common:bRooms.filter(r => r.type === 'common_room').length,
      bath:  bRooms.filter(r => r.type === 'bathroom').length,
    };
  }, [activeBuildingId, rooms]);

  return (
    <div className="campus-map-root" {...eyeHandlers}>
      <div ref={mapContainer} className="map-container" />

      {/* SEARCH */}
      <div className="search-bar">
        <div className="search-input-wrap">
          <svg width="16" height="16" fill="none" stroke="white" strokeWidth="2" style={{opacity:.5,flexShrink:0}}><circle cx="7" cy="7" r="5"/><path d="m13 13-3-3"/></svg>
          <input className="search-input" placeholder="Search rooms…" value={query} onChange={e=>search(e.target.value)} />
          {query&&<button onClick={()=>search('')} style={{background:'none',border:'none',color:'rgba(255,255,255,.4)',cursor:'pointer',fontSize:18}}>×</button>}
        </div>
        {results.length>0&&(
          <div className="search-results">
            {results.map(room=>(
              <div key={room.id} className="search-result-item" onClick={()=>handleSearchSelect(room)}>
                <div><div className="result-name">{room.name}</div><div className="result-sub">{BUILDINGS[room.building_id]?.name} · {FLOOR_CONFIG[room.floor]?.label} floor</div></div>
                <span className="result-badge" style={{background:FLOOR_CONFIG[room.floor]?.accentHex+'33',color:FLOOR_CONFIG[room.floor]?.accentHex}}>{ROOM_TYPE[room.type]?.label||room.type}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CAMERA PRESETS (Main) */}
      <div style={{position:'absolute',top:72,left:'50%',transform:'translateX(-50%)', display:'flex',gap:5,zIndex:10}}>
        {CAMERA_PRESETS.map(p=>(
          <button key={p.id} onClick={()=>applyPreset(p)} style={{
            padding:'5px 11px', borderRadius:8, fontFamily:'inherit', cursor:'pointer',
            border: activeCam===p.id ? `1px solid ${floorCfg.accentHex}` : '1px solid rgba(255,255,255,.12)',
            background: activeCam===p.id ? floorCfg.accentHex+'33' : 'rgba(15,20,35,.88)',
            backdropFilter:'blur(8px)', color: activeCam===p.id ? floorCfg.accentHex : 'rgba(255,255,255,.6)',
            fontSize:12, fontWeight:500,
          }}>{p.icon} {p.label}</button>
        ))}
      </div>

      {/* ── BUILDING-SPECIFIC CAMERA BAR ──────────────────────────────── */}
      {activeBuildingId && panelState !== 'none' && buildingCameras.length > 0 && (
        <div style={{
          position: 'absolute',
          top: 118,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: 4,
          zIndex: 10,
          alignItems: 'center',
        }}>
          {/* Building name pill */}
          <div style={{
            padding: '5px 10px',
            borderRadius: 8,
            background: 'rgba(15,20,35,.88)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,.1)',
            fontSize: 11,
            color: 'rgba(255,255,255,.45)',
            fontFamily: 'inherit',
            marginRight: 2,
            whiteSpace: 'nowrap',
          }}>
            {BUILDINGS[activeBuildingId]?.shortName}
          </div>

          {/* View buttons */}
          {buildingCameras.map(preset => (
            <button
              key={preset.id}
              onClick={() => applyBuildingCam(preset)}
              style={{
                padding: '5px 10px',
                borderRadius: 8,
                border: activeBldgCam === preset.id
                  ? `1px solid ${BUILDINGS[activeBuildingId]?.wallColors?.[activeFloor||0]?.accentHex || '#1A56DB'}`
                  : '1px solid rgba(255,255,255,.12)',
                background: activeBldgCam === preset.id
                  ? (BUILDINGS[activeBuildingId]?.wallColors?.[activeFloor||0]?.accentHex || '#1A56DB') + '33'
                  : 'rgba(15,20,35,.88)',
                backdropFilter: 'blur(8px)',
                color: activeBldgCam === preset.id
                  ? (BUILDINGS[activeBuildingId]?.wallColors?.[activeFloor||0]?.accentHex || '#1A56DB')
                  : 'rgba(255,255,255,.6)',
                fontFamily: 'inherit',
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                transition: 'all .15s',
                whiteSpace: 'nowrap',
              }}
            >
              <span style={{fontSize: 10}}>{preset.icon}</span>
              {preset.label}
            </button>
          ))}
        </div>
      )}

      {/* TOP-RIGHT CONTROLS */}
      <div className="map-controls" style={{top:72}}>
        <button className="ctrl-btn" title="Manual Orbit mode" style={eyeMode ? {background:'rgba(26,86,219,.35)',borderColor:'#1A56DB',color:'#7dd3fc',fontSize:16} : {fontSize:16}} onClick={toggleEyeMode}>👁</button>
        <button className="ctrl-btn" title="Reset to default view" onClick={handleBackToBlock}>⌂</button>
        <button className="ctrl-btn" title="Clear route" onClick={clearRoute}>✕</button>
      </div>

      {/* QUICK SWITCH FLOOR BADGES */}
      {mode === 'floors' && activeBuildingId && (
        <div style={{position:'absolute', left:20, top:'50%', transform:'translateY(-50%)', display:'flex', flexDirection:'column', gap:6, zIndex:10}}>
          {Array.from({ length: BUILDINGS[activeBuildingId]?.floors || 1 }).map((_, idx) => idx).reverse().map(f => {
            const cfg = FLOOR_CONFIG[f]; const isActive = activeFloor === f;
            return (
              <button key={f} onClick={() => handleFloorSelect(f)} style={{
                  padding: '8px 12px', borderRadius: 10,
                  border: `1px solid ${isActive ? cfg.accentHex : 'rgba(255,255,255,.15)'}`,
                  background: isActive ? cfg.accentHex+'33' : 'rgba(15,20,35,.85)',
                  backdropFilter: 'blur(8px)', color: isActive ? cfg.accentHex : 'rgba(255,255,255,.5)',
                  fontFamily: 'inherit', fontSize: 12, fontWeight: 500, cursor: 'pointer',
                  transition: 'all .2s', display: 'flex', alignItems: 'center', gap: 8, minWidth: 90,
                }}>
                <div style={{width:10, height:10, borderRadius:'50%', background:cfg.accentHex, opacity:isActive?1:0.4, flexShrink:0}}/>
                <div style={{textAlign:'left'}}><div style={{fontSize:12}}>{cfg.label}</div><div style={{fontSize:9,opacity:.5}}>{isActive ? 'Click rooms' : 'Tap to switch'}</div></div>
              </button>
            );
          })}
        </div>
      )}

      {/* FLOOR MANAGER PANEL */}
      <div className={`room-panel ${panelState==='floors'?'open':''}`}>
        <div className="panel-drag"/>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
          <div style={{flex:1}}>
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <div style={{fontSize:16,fontWeight:600,color:'white'}}>{bldgStats.name}</div>
              {BUILDINGS[activeBuildingId] && (
                <span style={{ 
                  fontSize:10, padding:'2px 8px', borderRadius:20, fontWeight:600,
                  background: BUILDINGS[activeBuildingId].type === 'boys_hostel' ? '#1A56DB33' : BUILDINGS[activeBuildingId].type === 'girls_hostel' ? '#EC489933' : 'rgba(255,255,255,0.1)',
                  color: BUILDINGS[activeBuildingId].type === 'boys_hostel' ? '#3F83F8' : BUILDINGS[activeBuildingId].type === 'girls_hostel' ? '#F472B6' : 'rgba(255,255,255,0.6)',
                  border: `1px solid ${BUILDINGS[activeBuildingId].type === 'boys_hostel' ? '#1A56DB44' : BUILDINGS[activeBuildingId].type === 'girls_hostel' ? '#EC489944' : 'rgba(255,255,255,0.2)'}`
                }}>
                  {BUILDINGS[activeBuildingId].type === 'boys_hostel' ? 'Boys Hostel' : BUILDINGS[activeBuildingId].type === 'girls_hostel' ? 'Girls Hostel' : BUILDINGS[activeBuildingId].type}
                </span>
              )}
            </div>
            <div style={{fontSize:12,color:'rgba(255,255,255,.4)',marginTop:2}}>{BUILDINGS[activeBuildingId]?.floors || 1} floor(s) · {bldgStats.total} rooms · Select a floor to explore</div>
          </div>
          <button className="close-btn" onClick={handleBackToBlock} title="Back to building view">←</button>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          {Array.from({ length: BUILDINGS[activeBuildingId]?.floors || 1 }).map((_, f) => {
            const cfg = FLOOR_CONFIG[f]; const isActive = activeFloor===f;
            return (
              <div key={f} onClick={() => handleFloorSelect(f)} style={{
                  borderRadius: 12, border: `1px solid ${isActive ? cfg.accentHex : 'rgba(255,255,255,.12)'}`,
                  background: isActive ? cfg.accentHex+'22' : 'rgba(255,255,255,.04)',
                  padding: '12px 14px', cursor: 'pointer', transition: 'all .25s', display: 'flex', alignItems: 'center', gap: 12,
                }}>
                <div style={{ width:32, height:32, borderRadius:8, background:cfg.accentHex, opacity:isActive?1:0.5, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'white', flexShrink:0 }}>{f===0?'G':f===1?'1':'2'}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:500, color:isActive?'white':'rgba(255,255,255,.55)' }}>{cfg.label} Floor</div>
                  <div style={{ fontSize:11, color:'rgba(255,255,255,.35)', marginTop:2 }}>Explore and select rooms</div>
                </div>
                {isActive && <div style={{ fontSize:10, padding:'2px 8px', borderRadius:20, background:cfg.accentHex, color:'white', fontWeight:600 }}>Active</div>}
              </div>
            );
          })}
        </div>
        <div style={{fontSize:11,color:'rgba(255,255,255,.25)',textAlign:'center',marginTop:14}}>Click any floor on the map or in this panel</div>
      </div>

      {/* ROOM INFO PANEL */}
      <div className={`room-panel ${panelState==='room'?'open':''}`}>
        <div className="panel-drag"/>
        {selectedRoom && roomCfg && (
          <>
            <div style={{height:4,background:floorCfg.accentHex,borderRadius:'4px 4px 0 0',margin:'-2px -24px 16px'}}/>
            <div className="room-panel-header">
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <button onClick={handleBackToFloors} style={{ background:'rgba(255,255,255,.08)',border:'none',color:'rgba(255,255,255,.6)', width:32,height:32,borderRadius:'50%',cursor:'pointer',fontSize:14, display:'flex',alignItems:'center',justifyContent:'center', }} title="Back to floor manager">‹</button>
                <div style={{ width:36,height:36,borderRadius:8, background:floorCfg.accentHex+'22', display:'flex',alignItems:'center',justifyContent:'center',fontSize:18, border:`1px solid ${floorCfg.accentHex}44` }}>{roomCfg.icon}</div>
                <div>
                  <div className="room-title">{selectedRoom.name}</div>
                  <div className="room-subtitle" style={{display:'flex',alignItems:'center',gap:6}}><span style={{padding:'1px 8px',borderRadius:20,fontSize:11,fontWeight:500, background:floorCfg.accentHex+'33',color:floorCfg.accentHex}}>{floorCfg.label}</span>{roomCfg.label}</div>
                </div>
              </div>
              <button className="close-btn" onClick={()=>{setPanelState('none');setSelectedRoom(null);}}>×</button>
            </div>
            {selectedRoom.description && (
              <div style={{fontSize:13, color:'rgba(255,255,255,.5)', lineHeight:1.5, marginBottom:20, padding:'0 4px'}}>{selectedRoom.description}</div>
            )}
            <div className="room-stats">
              <div className="stat-card">
                <div className="stat-val">{selectedRoom.capacity || '--'}</div>
                <div className="stat-label">👥 Capacity</div>
              </div>
              <div className="stat-card">
                <div className="stat-val">{selectedRoom.area_sqm || '--'} <span style={{fontSize:11, opacity:.5}}>m²</span></div>
                <div className="stat-label">📐 Area</div>
              </div>
              <div className="stat-card">
                <div className="stat-val">{selectedRoom.width_m && selectedRoom.length_m ? `${selectedRoom.width_m}×${selectedRoom.length_m}` : '--'}</div>
                <div className="stat-label">📏 Dimensions</div>
              </div>
            </div>
            <div style={{fontSize:11, fontWeight:600, color:'rgba(255,255,255,.3)', textTransform:'uppercase', letterSpacing:'1px', marginBottom:8, marginLeft:4}}>Amenities</div>
            <div className="room-attrs">
              {(selectedRoom.attributes || []).length > 0 ? (
                selectedRoom.attributes.map(a => (
                  <span key={a} className="attr-chip" style={{borderColor:floorCfg.accentHex+'44'}}>{a}</span>
                ))
              ) : (
                <div style={{fontSize:12, color:'rgba(255,255,255,.2)', padding:'4px 0'}}>No special amenities listed</div>
              )}
            </div>
            <div className="action-row" style={{marginTop:8}}>
              <button className="action-btn primary" style={{background:floorCfg.accentHex}} onClick={handleGetRoute}>
                {routeGeoJson ? 'Update Route' : 'Get Route'}
              </button>
              <button className="action-btn secondary" onClick={()=>{clearRoute();setPanelState('none');setSelectedRoom(null);}}>
                Dismiss
              </button>
            </div>
          </>
        )}
      </div>

      {/* ACCESSIBLE TOGGLE */}
      <div className="accessible-toggle" onClick={()=>setAccessibleOnly(v=>!v)}>
        <span>♿ Accessible only</span>
        <div className={`toggle-switch ${accessibleOnly?'on':''}`}><div className="toggle-knob"/></div>
      </div>

      {/* HOVER TOOLTIP */}
      {hoveredRoom && panelState!=='room' && (
        <div style={{position:'absolute',bottom:150,left:'50%',transform:'translateX(-50%)', background:'rgba(10,15,26,.92)',border:'1px solid rgba(255,255,255,.1)', borderRadius:8,padding:'6px 14px',fontSize:13,color:'white', pointerEvents:'none',zIndex:20,whiteSpace:'nowrap',backdropFilter:'blur(8px)'}}>
          {ROOM_TYPE[hoveredRoom.type]?.icon} {hoveredRoom.name}
          <span style={{opacity:.5,marginLeft:8}}>{FLOOR_CONFIG[hoveredRoom.floor]?.label} floor</span>
        </div>
      )}

      {/* BLOCK MODE HINT */}
      {mode==='block' && mapReady && (
        <div style={{position:'absolute',bottom:150,left:'50%',transform:'translateX(-50%)', background:'rgba(10,15,26,.85)',border:'1px solid rgba(255,255,255,.1)', borderRadius:8,padding:'7px 16px',fontSize:12,color:'rgba(255,255,255,.6)', pointerEvents:'none',zIndex:5,whiteSpace:'nowrap',backdropFilter:'blur(8px)'}}>
          Click the building to explore floors
        </div>
      )}
    </div>
  );
}
