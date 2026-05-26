import { useEffect, useRef, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

// ── COLOR TOKENS ─────────────────────────────────────────────────────────────
const THEME = `
  :root {
    /* ── Backgrounds ─────────────────────────────── */
    --bg:          #FDFCF0;   /* Creamy Bean / Off-white */
    --surface:     #FFFFFF;   /* card/panel white */
    --surf2:       #F5F5DC;   /* Bean Milk Surface */
    --surf3:       #EAE6DC;   /* warm tan-white */
    --surf-mint:   #F1F8E9;   /* Sprout-tinted surface */
    --surf-sage:   #F9FBE7;   /* Pale Bean-tinted surface */

    /* ── Palette colors ──────────────────────────── */
    --sage:        #C5E1A5;   /* Pale Leaf Green */
    --mint:        #8BC34A;   /* Vibrant Sprout Green */
    --dusty:       #8D6E63;   /* Bean Husk Brown */
    --slate:       #4E342E;   /* espresso black */
    --warm-sage:   #AED581;   /* Fresh Leaf */

    /* ── Text ────────────────────────────────────── */
    --text:        #2B1B17;   /* Dark Roasted Bean */
    --text-sec:    #5E4A42;   /* Cocoa Brown */
    --muted:       #9E8B83;   /* Dusty Bean */

    /* ── Borders ──────────────────────────────────── */
    --border:      rgba(141,110,99,0.20);
    --border-hover:rgba(139,195,74,0.45);

    /* ── Glows / shadows ─────────────────────────── */
    --shadow-sm:   0 2px 8px  rgba(141,110,99,0.12);
    --shadow-md:   0 8px 24px rgba(141,110,99,0.15);
    --shadow-lg:   0 20px 48px rgba(141,110,99,0.18);
    --shadow-card: 0 4px 20px rgba(107,168,152,0.10);

    /* ── Typography ───────────────────────────────── */
    --font-display:'Playfair Display', Georgia, serif;
    --font-body:   'DM Sans', system-ui, sans-serif;
    --font-mono:   'JetBrains Mono', monospace;
  }

  /* Selection */
  ::selection {
    background: rgba(126,196,168,0.35);
    color: #1A2E1A;
  }

  /* Scrollbar hidden */
  *::-webkit-scrollbar { display: none; }
  * { scrollbar-width: none; }

  /* Smooth transitions on color changes */
  * { transition-property: background-color, border-color, color, box-shadow;
      transition-duration: 0.3s; transition-timing-function: ease; }

  /* Global Keyframes */
  @keyframes orbFloat1 {
    0%,100% { transform: translate(0,0)    scale(1); }
    33%     { transform: translate(20px,-15px) scale(1.05); }
    66%     { transform: translate(-10px,20px) scale(0.97); }
  }
  @keyframes orbFloat2 {
    0%,100% { transform: translate(0,0)    scale(1); }
    40%     { transform: translate(-25px,10px) scale(1.08); }
    70%     { transform: translate(15px,-20px) scale(0.95); }
  }
  @keyframes textShimmer {
    0%,100% { background-position: 0% center; }
    50%     { background-position: 100% center; }
  }
  @keyframes scanLine {
    0%   { top: 0%; opacity: 0; }
    10%  { opacity: 1; }
    90%  { opacity: 1; }
    100% { top: 100%; opacity: 0; }
  }
  @keyframes gearGlow {
    0%,100% { opacity: 0.30; }
    50%     { opacity: 0.45; }
  }
  @keyframes scrollLine {
    0%   { transform: scaleY(0); transform-origin: top; opacity: 0; }
    20%  { opacity: 1; }
    80%  { opacity: 1; }
    100% { transform: scaleY(1); transform-origin: top; opacity: 0; }
  }
  @keyframes numberRoll {
    from { transform: translateY(20px); opacity: 0; }
    to   { transform: translateY(0);    opacity: 1; }
  }
  @keyframes dotPulse {
    0%,100% { box-shadow: 0 0 0 0   rgba(107,168,152,0.5); }
    50%     { box-shadow: 0 0 0 10px rgba(107,168,152,0); }
  }
  @keyframes coordTick {
    0%,90%,100% { opacity: 1; }
    95%         { opacity: 0; }
  }
`;

export default function LandingPage() {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const [activeSection, setActiveSection] = useState(0);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [cursorHover, setCursorHover] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const move = (e) => setCursorPos({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', move);
    return () => window.removeEventListener('mousemove', move);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onScroll = () => {
      const idx = Math.round(el.scrollTop / window.innerHeight);
      setActiveSection(idx);
      setScrollY(el.scrollTop);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  const goToSection = (idx) => {
    containerRef.current?.scrollTo({
      top: idx * window.innerHeight,
      behavior: 'smooth',
    });
  };

  return (
    <>
      <style>{THEME}</style>

      <div style={{
        position: 'fixed',
        left: cursorPos.x - 6,
        top:  cursorPos.y - 6,
        width: cursorHover ? 48 : 12,
        height: cursorHover ? 48 : 12,
        borderRadius: '50%',
        background: cursorHover ? 'transparent' : 'var(--mint)',
        border: cursorHover ? '1.5px solid var(--teal)' : 'none',
        pointerEvents: 'none',
        zIndex: 9999,
        transition: 'width 0.2s, height 0.2s, background 0.2s, transform 0.1s',
        transform: cursorHover ? 'translate(-12px,-12px)' : 'none',
        mixBlendMode: 'multiply',
      }} />

      <nav style={{
        position: 'fixed', right: 24, top: '50%',
        transform: 'translateY(-50%)',
        display: 'flex', flexDirection: 'column', gap: 12,
        zIndex: 100,
      }}>
        {[0,1,2,3,4].map(i => (
          <button key={i} onClick={() => goToSection(i)}
            onMouseEnter={() => setCursorHover(true)}
            onMouseLeave={() => setCursorHover(false)}
            style={{
              width: activeSection === i ? 24 : 8,
              height: 8, borderRadius: 4,
              background: activeSection === i ? 'var(--mint)' : 'rgba(107,168,152,0.25)',
              border: 'none', cursor: 'pointer', padding: 0,
              transition: 'all 0.3s ease',
            }} />
        ))}
      </nav>

      <div ref={containerRef} style={{
        height: '100vh', overflowY: 'scroll',
        scrollSnapType: 'y mandatory',
        background: 'var(--bg)',
        fontFamily: 'var(--font-body)',
        color: 'var(--text)',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}>
        <Section1 scrollY={scrollY} onExplore={() => navigate('/map')} onHover={setCursorHover} />
        <Section2 active={activeSection === 1} onHover={setCursorHover} />
        <Section3 active={activeSection === 2} onHover={setCursorHover} />
        <Section4 active={activeSection === 3} />
        <Section5 onExplore={() => navigate('/map')} onHover={setCursorHover} />
      </div>
    </>
  );
}

function Section1({ scrollY, onExplore, onHover }) {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { setTimeout(() => setLoaded(true), 100); }, []);
  const textY = scrollY * 0.4;

  return (
    <section style={{ height: '100vh', scrollSnapAlign: 'start', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', background: 'linear-gradient(160deg, #FDFCF0 0%, #FAFAE6 50%, #F5F5DC 100%)' }}>
      <CoordGrid />
      <NatureParticles />
      
      {/* Orb 1 — Bean bloom */}
      <div style={{
        position: 'absolute', right: '15%', top: '15%',
        width: 550, height: 550,
        background: 'radial-gradient(ellipse, rgba(141,110,99,0.14) 0%, rgba(139,195,74,0.05) 50%, transparent 70%)',
        borderRadius: '50%',
        animation: 'orbFloat1 8s ease-in-out infinite',
        pointerEvents: 'none',
        zIndex: 1,
      }} />

      {/* Orb 2 — Sprout bloom */}
      <div style={{
        position: 'absolute', left: '5%', bottom: '10%',
        width: 350, height: 350,
        background: 'radial-gradient(ellipse, rgba(139,195,74,0.12) 0%, transparent 65%)',
        borderRadius: '50%',
        animation: 'orbFloat2 11s ease-in-out infinite 3s',
        pointerEvents: 'none',
        zIndex: 1,
      }} />

      {/* Scan line — moves top to bottom very slowly */}
      <div style={{
        position: 'absolute', left: 0, right: 0,
        height: 1,
        background: 'linear-gradient(to right, transparent, rgba(126,196,168,0.06), transparent)',
        animation: 'scanLine 8s linear infinite',
        pointerEvents: 'none', zIndex: 1,
      }} />

      <div className="hero-container" style={{ position: 'relative', zIndex: 2, maxWidth: 1440, margin: '0 auto', padding: '0 64px', transform: `translateY(${textY}px)`, width: '100%' }}>
        
        {/* Left Side: Typography and Actions */}
        <div className="hero-left">
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(56px, 8vw, 104px)', fontWeight: 900, lineHeight: 0.95, margin: '0 0 24px', letterSpacing: '-0.02em', opacity: loaded ? 1 : 0, transform: loaded ? 'translateY(0)' : 'translateY(40px)', transition: 'all 1s ease 0.4s' }}>
            <span style={{ fontWeight: 900, color: 'var(--slate)', textShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>Smart</span><br />
            <span style={{
              background: 'linear-gradient(135deg, #4E342E 0%, #8BC34A 40%, #AED581 80%, #C5E1A5 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontStyle: 'italic',
              backgroundSize: '200% auto',
              animation: 'textShimmer 4s ease-in-out infinite',
            }}>
              Campus
            </span><br />
            <span style={{ WebkitTextStroke: '1.5px rgba(121,85,72,0.25)', color: 'transparent' }}>Navigate.</span>
          </h1>

          <p style={{ fontSize: 18, color: 'var(--text-sec)', maxWidth: 520, lineHeight: 1.7, marginBottom: 40, opacity: loaded ? 1 : 0, transform: loaded ? 'translateY(0)' : 'translateY(30px)', transition: 'all 1s ease 0.6s' }}>
            A Digital Twin–based platform that integrates 3D navigation, real-time mobility tracking, and emergency response into one unified intelligent system.
          </p>

          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center', marginBottom: 48, opacity: loaded ? 1 : 0, transform: loaded ? 'translateY(0)' : 'translateY(30px)', transition: 'all 1s ease 0.8s' }}>
            <button 
              onClick={onExplore} 
              onMouseEnter={e => {
                e.currentTarget.style.boxShadow = '0 12px 32px rgba(139,195,74,0.35), 0 4px 12px rgba(121,85,72,0.15)';
                e.currentTarget.style.transform = 'scale(1.03)';
                onHover(true);
              }} 
              onMouseLeave={e => {
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(139,195,74,0.25), 0 2px 8px rgba(121,85,72,0.10)';
                e.currentTarget.style.transform = 'scale(1)';
                onHover(false);
              }} 
              style={{ 
                padding: '14px 32px', 
                background: 'linear-gradient(135deg, #8BC34A, #AED581)', 
                color: 'var(--slate)', 
                border: 'none', 
                borderRadius: 48, 
                fontSize: 14, 
                fontWeight: 700, 
                fontFamily: 'var(--font-body)', 
                cursor: 'pointer', 
                letterSpacing: '0.02em', 
                transition: 'all 0.3s ease', 
                boxShadow: '0 8px 24px rgba(139,195,74,0.25), 0 2px 8px rgba(121,85,72,0.10)' 
              }}
            >
              Explore Campus →
            </button>
            <button 
              onClick={() => navigate('/library')}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = '#1565C0';
                e.currentTarget.style.color = '#ffffff';
                e.currentTarget.style.background = 'rgba(21,101,192,0.15)';
                onHover(true);
              }} 
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'rgba(21,101,192,0.5)';
                e.currentTarget.style.color = 'var(--slate)';
                e.currentTarget.style.background = 'transparent';
                onHover(false);
              }} 
              style={{ 
                padding: '14px 32px', 
                background: 'transparent', 
                color: 'var(--slate)', 
                border: '1.5px solid rgba(21,101,192,0.5)', 
                borderRadius: 48, 
                fontSize: 14, 
                fontWeight: 700,
                fontFamily: 'var(--font-body)', 
                cursor: 'pointer', 
                transition: 'all 0.3s ease' 
              }}
            >
              Explore YSR Library 🏛️
            </button>
          </div>

          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', display: 'flex', gap: 24, opacity: loaded ? 0.6 : 0, transition: 'opacity 1s ease 1.2s' }}>
            <TickingCoord label="LAT" value={18.148724} />
            <TickingCoord label="LNG" value={83.372788} />
            <span>ELEV 143.95m</span>
            <span>4 BUILDINGS · 120 ROOMS</span>
          </div>
        </div>

        {/* Right Side: Interactive Smart City District */}
        <div className="hero-right" style={{
          opacity: loaded ? 1 : 0,
          transform: loaded ? 'translateX(0)' : 'translateX(40px)',
          transition: 'all 1.2s cubic-bezier(0.22, 1, 0.36, 1) 0.6s'
        }}>
          <SmartCityDistrict onHover={onHover} />
        </div>

      </div>

      <div style={{ position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, color: 'var(--muted)', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', animation: 'float 2s ease-in-out infinite' }}>
        <span>Scroll</span>
        <div style={{
          width: 1, height: 50,
          background: 'linear-gradient(to bottom, var(--mint), transparent)',
          animation: 'scrollLine 2s ease-in-out infinite',
          transformOrigin: 'top',
        }} />
      </div>

      <style>{`
        .hero-container {
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: space-between;
          gap: 48px;
          width: 100%;
        }
        .hero-left {
          flex: 0 0 45%;
          max-width: 650px;
        }
        .hero-right {
          flex: 0 0 55%;
          display: flex;
          justify-content: center;
          align-items: center;
          position: relative;
          width: 100%;
          z-index: 10;
        }
        @media (max-width: 991px) {
          .hero-container {
            flex-direction: column;
            justify-content: center;
            align-items: center;
            gap: 40px;
            padding-top: 60px;
            padding-bottom: 80px;
            text-align: center;
          }
          .hero-left {
            max-width: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .hero-right {
            width: 100%;
            max-width: 600px;
          }
        }
        @keyframes pulse { 0%,100%{opacity:0.6;transform:scale(1)} 50%{opacity:1;transform:scale(1.05)} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes float { 0%,100%{transform:translateX(-50%) translateY(0)} 50%{transform:translateX(-50%) translateY(-8px)} }
        @keyframes walkX { 0%{transform:translateX(-80px)} 100%{transform:translateX(calc(100vw + 80px))} }
        @keyframes gridPulse { 0%,100%{opacity:0.03} 50%{opacity:0.07} }
        @keyframes particleFloat { 0%{transform:translateY(0) translateX(0);opacity:0} 10%{opacity:1} 90%{opacity:1} 100%{transform:translateY(-100vh) translateX(40px);opacity:0} }
        
        @keyframes fadeInUp {
          from { opacity: 0; transform: translate(-50%, 15px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes dashFlow {
          from { strokeDashoffset: 50; }
          to { strokeDashoffset: 0; }
        }
        @keyframes pulseRadar {
          0% { transform: scale(0.6); opacity: 0.9; }
          100% { transform: scale(1.3); opacity: 0; }
        }
        @keyframes droneFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
      `}</style>
    </section>
  );
}

function SmartCityDistrict({ onHover }) {
  const [hovered, setHovered] = useState(null); // 'wave' | 'solar' | 'highrise' | 'cshape' | 'atrium' | null

  // Helper: Draw isometric prism
  const drawIsoBox = (cx, cy, w, d, h, leftColor, rightColor, topColor, strokeColor = "rgba(139,195,74,0.18)", opacity = 1) => {
    const p0 = [cx, cy];
    const p1 = [cx + w, cy + w * 0.577];
    const p2 = [cx - d, cy + d * 0.577];
    const p3 = [cx + w - d, cy + (w + d) * 0.577];

    const t0 = [cx, cy - h];
    const t1 = [cx + w, cy + w * 0.577 - h];
    const t2 = [cx - d, cy + d * 0.577 - h];
    const t3 = [cx + w - d, cy + (w + d) * 0.577 - h];

    const leftFace = `${p0[0]},${p0[1]} ${p2[0]},${p2[1]} ${t2[0]},${t2[1]} ${t0[0]},${t0[1]}`;
    const rightFace = `${p0[0]},${p0[1]} ${p1[0]},${p1[1]} ${t1[0]},${t1[1]} ${t0[0]},${t0[1]}`;
    const topFace = `${t0[0]},${t0[1]} ${t1[0]},${t1[1]} ${t3[0]},${t3[1]} ${t2[0]},${t2[1]}`;

    return (
      <g style={{ opacity, transition: 'all 0.3s ease' }}>
        {/* Left Face */}
        <polygon points={leftFace} fill={leftColor} stroke={strokeColor} strokeWidth="0.5" />
        {/* Right Face */}
        <polygon points={rightFace} fill={rightColor} stroke={strokeColor} strokeWidth="0.5" />
        {/* Top Face */}
        <polygon points={topFace} fill={topColor} stroke={strokeColor} strokeWidth="0.5" />
      </g>
    );
  };

  // Helper: Draw isometric cylinder
  const drawIsoCylinder = (cx, cy, r, h, sideColor, topColor, strokeColor = "rgba(139,195,74,0.18)", opacity = 1) => {
    const rx = r;
    const ry = r * 0.577;

    return (
      <g style={{ opacity, transition: 'all 0.3s ease' }}>
        <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={sideColor} stroke={strokeColor} strokeWidth="0.5" />
        <path 
          d={`M ${cx - rx} ${cy} L ${cx - rx} ${cy - h} A ${rx} ${ry} 0 0 0 ${cx + rx} ${cy - h} L ${cx + rx} ${cy} A ${rx} ${ry} 0 0 1 ${cx - rx} ${cy} Z`} 
          fill={sideColor} 
          stroke={strokeColor} 
          strokeWidth="0.5" 
        />
        <ellipse cx={cx} cy={cy - h} rx={rx} ry={ry} fill={topColor} stroke={strokeColor} strokeWidth="0.5" />
      </g>
    );
  };

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: 800, aspectRatio: '640/480', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      
      {/* ── REAL-TIME STATS CARD OVERLAY (HUD) ──────────────────────── */}
      <div style={{
        position: 'absolute',
        top: 10,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 300,
        height: 120,
        zIndex: 100,
        pointerEvents: 'none',
      }}>
        {hovered === 'wave' && (
          <div style={{
            background: 'rgba(253, 252, 240, 0.96)',
            backdropFilter: 'blur(12px)',
            border: '2px solid #F08C8A',
            borderRadius: 12,
            padding: '12px 16px',
            boxShadow: '0 12px 28px rgba(240,140,138,0.2), 0 4px 10px rgba(0,0,0,0.05)',
            fontFamily: 'var(--font-body)',
            animation: 'fadeInUp 0.3s ease forwards',
          }}>
            <h4 style={{ margin: '0 0 6px 0', fontSize: 13, fontFamily: 'var(--font-mono)', color: '#C86A68', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#F08C8A', display: 'inline-block', animation: 'blink 1s infinite' }} />
              S-Wave Admin Building
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11, color: 'var(--text-sec)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Entrance Security:</span><span style={{ fontWeight: 700, color: 'var(--mint)' }}>GATE ACTIVE</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Facial Recognition:</span><span style={{ fontWeight: 600 }}>CCTV Stream Online</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Active Personnel:</span><span style={{ fontWeight: 600 }}>184 Residents Inside</span></div>
            </div>
          </div>
        )}

        {hovered === 'solar' && (
          <div style={{
            background: 'rgba(253, 252, 240, 0.96)',
            backdropFilter: 'blur(12px)',
            border: '2px solid var(--warm-sage)',
            borderRadius: 12,
            padding: '12px 16px',
            boxShadow: '0 12px 28px rgba(139,195,74,0.18)',
            fontFamily: 'var(--font-body)',
            animation: 'fadeInUp 0.3s ease forwards',
          }}>
            <h4 style={{ margin: '0 0 6px 0', fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--slate)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--warm-sage)', display: 'inline-block', animation: 'blink 1s infinite' }} />
              Solar Curve Tower
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11, color: 'var(--text-sec)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Solar Harvesting:</span><span style={{ fontWeight: 700, color: 'var(--mint)' }}>12.8 kW (Peak)</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Roof Solar Panel Status:</span><span style={{ fontWeight: 600 }}>8/8 Active</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Grid Contribution:</span><span style={{ fontWeight: 600 }}>+4.2 kW Surplus</span></div>
            </div>
          </div>
        )}

        {hovered === 'highrise' && (
          <div style={{
            background: 'rgba(253, 252, 240, 0.96)',
            backdropFilter: 'blur(12px)',
            border: '2px solid #6E8894',
            borderRadius: 12,
            padding: '12px 16px',
            boxShadow: '0 12px 28px rgba(110,136,148,0.2)',
            fontFamily: 'var(--font-body)',
            animation: 'fadeInUp 0.3s ease forwards',
          }}>
            <h4 style={{ margin: '0 0 6px 0', fontSize: 13, fontFamily: 'var(--font-mono)', color: '#4A5E68', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#6E8894', display: 'inline-block', animation: 'blink 1s infinite' }} />
              High-Rise Skyscraper
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11, color: 'var(--text-sec)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>HVAC Cooling:</span><span style={{ fontWeight: 700, color: '#1565C0' }}>OPTIMAL (22°C)</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Elevator Status:</span><span style={{ fontWeight: 600 }}>Dynamic A* Routing Active</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Occupancy:</span><span style={{ fontWeight: 600 }}>78% Capacity (340 Users)</span></div>
            </div>
          </div>
        )}

        {hovered === 'cshape' && (
          <div style={{
            background: 'rgba(253, 252, 240, 0.96)',
            backdropFilter: 'blur(12px)',
            border: '2px solid #EACAA3',
            borderRadius: 12,
            padding: '12px 16px',
            boxShadow: '0 12px 28px rgba(234,202,163,0.25)',
            fontFamily: 'var(--font-body)',
            animation: 'fadeInUp 0.3s ease forwards',
          }}>
            <h4 style={{ margin: '0 0 6px 0', fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--slate)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#EACAA3', display: 'inline-block', animation: 'blink 1s infinite' }} />
              C-Curve Solar Block
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11, color: 'var(--text-sec)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Solar Generation:</span><span style={{ fontWeight: 700, color: 'var(--mint)' }}>9.4 kW (Active)</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Eco Balcony Cover:</span><span style={{ fontWeight: 600 }}>Ivy Vertical Gardens Active</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Energy Reserve:</span><span style={{ fontWeight: 600 }}>100% (Tesla Powerwalls)</span></div>
            </div>
          </div>
        )}

        {hovered === 'atrium' && (
          <div style={{
            background: 'rgba(253, 252, 240, 0.96)',
            backdropFilter: 'blur(12px)',
            border: '2px solid var(--mint)',
            borderRadius: 12,
            padding: '12px 16px',
            boxShadow: '0 12px 28px rgba(139,195,74,0.2)',
            fontFamily: 'var(--font-body)',
            animation: 'fadeInUp 0.3s ease forwards',
          }}>
            <h4 style={{ margin: '0 0 6px 0', fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--slate)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--mint)', display: 'inline-block', animation: 'blink 1s infinite' }} />
              Smart Tech Atrium
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11, color: 'var(--text-sec)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Solar Array Maintenance:</span><span style={{ fontWeight: 700, color: '#FFB300' }}>INSTALLATION ACTIVE</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Tech Lab Load:</span><span style={{ fontWeight: 600 }}>16.4 kW (Eco-Powered)</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>IoT Gateway Nodes:</span><span style={{ fontWeight: 600 }}>120/120 Synchronized</span></div>
            </div>
          </div>
        )}

        {!hovered && (
          <div style={{
            background: 'rgba(255,255,255,0.45)',
            backdropFilter: 'blur(4px)',
            border: '1px dashed rgba(141,110,99,0.25)',
            borderRadius: 12,
            padding: '10px 14px',
            textAlign: 'center',
            fontSize: 11,
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-sec)',
            opacity: 0.85,
          }}>
            🏢 HOVER A SMART DISTRICT OFFICE
          </div>
        )}
      </div>

      {/* ── CORE ISOMETRIC SVG ──────────────────────────────────────── */}
      <svg viewBox="0 0 780 580" width="100%" height="100%" style={{ overflow: 'visible' }}>
        
        {/* ── SVG DEFINITIONS & GRADIENTS ───────────────────────────── */}
        <defs>
          <linearGradient id="roadGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4A5255" />
            <stop offset="100%" stopColor="#5E696D" />
          </linearGradient>
          <linearGradient id="glassGrad" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#80DEEA" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#E0F7FA" stopOpacity="0.95" />
          </linearGradient>
          <linearGradient id="glassGradTall" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1976D2" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#80DEEA" stopOpacity="0.95" />
          </linearGradient>
          <linearGradient id="solarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2E3D48" />
            <stop offset="100%" stopColor="#4E5F6D" />
          </linearGradient>
          <linearGradient id="sandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#EACAA3" />
            <stop offset="100%" stopColor="#DEBA91" />
          </linearGradient>
          <linearGradient id="holoBeam" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="var(--mint)" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#80DEEA" stopOpacity="0.05" />
          </linearGradient>
          <filter id="shadow3D" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="-3" dy="8" stdDeviation="6" floodColor="#3F5A2F" floodOpacity="0.2" />
          </filter>
        </defs>

        {/* ── 3D CLAY-LIKE GROUND LAND EXTRUSION (DEPTH WALL) ────────── */}
        <path 
          d="M 50,300 L 160,460 L 260,470 L 400,600 L 640,560 L 760,400 L 760,412 L 640,572 L 400,612 L 260,482 L 160,472 L 50,312 Z" 
          fill="#597A44" 
        />

        {/* ── BRIGHT GREEN TOP GROUND (THE ISLAND BASE) ──────────────── */}
        <path 
          d="M 50,300 L 230,160 L 320,200 L 440,110 L 700,110 L 760,200 L 760,400 L 640,560 L 400,600 L 260,470 L 160,460 L 50,300 Z" 
          fill="#7EAD64" 
          stroke="#6E9956" 
          strokeWidth="1.5"
          filter="url(#shadow3D)" 
        />

        {/* ── SANDY WALKING PATHS & ARENAS (SAND COLOURED) ───────────── */}
        {/* Top-Left Crowd Arena base */}
        <polygon points="210,175 360,175 390,260 250,260" fill="url(#sandGrad)" stroke="#D8B182" strokeWidth="0.8" />
        {/* Connection path in center */}
        <path d="M 330,220 L 430,300 L 470,280 L 370,200 Z" fill="url(#sandGrad)" opacity="0.9" />

        {/* ── PUBLIC SPACE: CROWD MONITORING ARENA (TOP-LEFT) ────────── */}
        <g>
          {/* Red clay presentation square */}
          <polygon points="220,185 340,185 360,250 240,250" fill="#E75D4C" stroke="#D34B3B" strokeWidth="1" />
          {/* Transparent Glass enclosure panels */}
          <polygon points="220,185 220,135 240,200 240,250" fill="rgba(255,255,255,0.22)" stroke="rgba(255,255,255,0.5)" strokeWidth="0.8" />
          <polygon points="240,250 240,200 360,200 360,250" fill="rgba(255,255,255,0.18)" stroke="rgba(255,255,255,0.5)" strokeWidth="0.8" />
          <polygon points="340,185 340,135 360,200 360,250" fill="rgba(255,255,255,0.18)" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />

          {/* Hologram Board Projection Beam (Vertical Glass screen) */}
          <polygon points="310,135 310,75 360,75 360,135" fill="rgba(128,222,234,0.15)" stroke="rgba(128,222,234,0.5)" strokeWidth="1" />
          <polygon points="310,75 360,75 360,110 310,110" fill="rgba(78,82,90,0.8)" />
          <text x="314" y="90" fill="var(--mint)" fontFamily="var(--font-mono)" fontSize="6" fontWeight="bold">CROWD:</text>
          {/* Holographic graph bars */}
          <rect x="315" y="95" width="4" height="10" fill="var(--mint)" />
          <rect x="321" y="92" width="4" height="13" fill="var(--mint)" />
          <rect x="327" y="97" width="4" height="8" fill="#FF8A80" />
          <rect x="333" y="93" width="4" height="12" fill="var(--mint)" />
          <rect x="339" y="96" width="4" height="9" fill="var(--mint)" />

          {/* Presentation podium */}
          <rect x="235" y="195" width="20" height="8" fill="#F0EDE2" stroke="var(--slate)" strokeWidth="0.5" />
          <line x1="245" y1="195" x2="245" y2="185" stroke="var(--slate)" strokeWidth="1" />

          {/* Mini people sitting/standing inside arena */}
          <circle cx="245" cy="184" r="2.5" fill="#4285F4" /> {/* Speaker head */}
          <rect x="244" y="186.5" width="2" height="4" fill="#333" />

          {/* Rows of attendees */}
          {/* Row 1 */}
          <circle cx="270" cy="210" r="2" fill="#E28743" />
          <circle cx="280" cy="210" r="2" fill="#2596BE" />
          <circle cx="290" cy="210" r="2" fill="#8D3B72" />
          {/* Row 2 */}
          <circle cx="275" cy="225" r="2" fill="#1E88E5" />
          <circle cx="285" cy="225" r="2" fill="#FFB300" />
          <circle cx="295" cy="225" r="2" fill="#43A047" />
          {/* People standing */}
          <g>
            <circle cx="230" cy="230" r="2.2" fill="#D81B60" />
            <line x1="230" y1="232" x2="228" y2="238" stroke="#D81B60" strokeWidth="1.2" />
            <circle cx="235" cy="231" r="2.2" fill="#1E88E5" />
            <line x1="235" y1="233" x2="237" y2="239" stroke="#1E88E5" strokeWidth="1.2" />
          </g>
        </g>

        {/* ── ROADWAYS NETWORK ──────────────────────────────────────── */}
        <g>
          {/* Left parking lot and access road */}
          <polygon points="90,340 260,460 210,480 50,370" fill="url(#roadGrad)" />
          {/* Main central dual lane road */}
          <polygon points="260,460 480,310 520,335 300,485" fill="url(#roadGrad)" />
          {/* Branch road to bottom parking */}
          <polygon points="340,430 460,520 400,560 290,470" fill="url(#roadGrad)" />
          {/* Right roadway exit */}
          <polygon points="460,330 670,470 630,500 420,360" fill="url(#roadGrad)" />

          {/* Zebra Crosswalk 1 */}
          <g stroke="#FFFFFF" strokeWidth="2" opacity="0.6">
            <line x1="330" y1="420" x2="350" y2="406" />
            <line x1="336" y1="424" x2="356" y2="410" />
            <line x1="342" y1="428" x2="362" y2="414" />
            <line x1="348" y1="432" x2="368" y2="418" />
          </g>

          {/* Zebra Crosswalk 2 */}
          <g stroke="#FFFFFF" strokeWidth="2" opacity="0.6">
            <line x1="385" y1="365" x2="405" y2="351" />
            <line x1="391" y1="369" x2="411" y2="355" />
            <line x1="397" y1="373" x2="417" y2="359" />
            <line x1="403" y1="377" x2="423" y2="363" />
          </g>

          {/* Road center dash dividing lines */}
          <path d="M 120,358 L 235,441 M 285,463 L 490,323 M 325,445 L 420,517" fill="none" stroke="#FFFFFF" strokeWidth="1.2" strokeDasharray="6, 12" opacity="0.4" />
        </g>

        {/* ── LANDSCAPE TREES ────────────────────────────────────────── */}
        <g>
          {/* Row of trees along top-left road boundary */}
          {Array.from({ length: 6 }).map((_, i) => {
            const tx = 95 + i * 22;
            const ty = 300 + i * 15;
            return (
              <g key={`tree-tl-${i}`}>
                {/* Trunk */}
                <line x1={tx} y1={ty} x2={tx} y2={ty - 10} stroke="#5E4A42" strokeWidth="1.5" />
                {/* Tree Foliage */}
                <circle cx={tx} cy={ty - 12} r="6" fill="#6A9F4E" />
                <circle cx={tx - 3} cy={ty - 15} r="4" fill="#88C267" opacity="0.9" />
                <circle cx={tx + 3} cy={ty - 11} r="4" fill="#54863A" opacity="0.8" />
              </g>
            );
          })}

          {/* Row of trees along bottom-left roadside */}
          {Array.from({ length: 6 }).map((_, i) => {
            const tx = 185 + i * 16;
            const ty = 485 + i * 11;
            return (
              <g key={`tree-bl-${i}`}>
                <line x1={tx} y1={ty} x2={tx} y2={ty - 14} stroke="#5E4A42" strokeWidth="1.8" />
                <circle cx={tx} cy={ty - 16} r="8" fill="#6A9F4E" />
                <circle cx={tx - 4} cy={ty - 20} r="5" fill="#88C267" />
                <circle cx={tx + 4} cy={ty - 15} r="5" fill="#54863A" />
              </g>
            );
          })}

          {/* Row of trees near bottom right exit road */}
          {Array.from({ length: 6 }).map((_, i) => {
            const tx = 520 + i * 20;
            const ty = 465 + i * 14;
            return (
              <g key={`tree-br-${i}`}>
                <line x1={tx} y1={ty} x2={tx} y2={ty - 14} stroke="#5E4A42" strokeWidth="1.8" />
                <circle cx={tx} cy={ty - 16} r="8" fill="#6A9F4E" />
                <circle cx={tx - 4} cy={ty - 20} r="5" fill="#88C267" />
                <circle cx={tx + 4} cy={ty - 15} r="5" fill="#54863A" />
              </g>
            );
          })}
        </g>

        {/* ── PARKING AREAS WITH MINIATURE AUTOMOBILES ───────────────── */}
        
        {/* LEFT PARKING LOT */}
        <g>
          {/* Green glowing parking lines */}
          <g stroke="#6DDA68" strokeWidth="1.2" fill="none">
            <polygon points="100,380 145,350 160,360 115,390" />
            <polygon points="120,395 165,365 180,375 135,405" />
            <polygon points="140,410 185,380 200,390 155,420" />
            <polygon points="160,425 205,395 220,405 175,435" />
          </g>

          {/* EV Charging Posts */}
          <g>
            <rect x="140" y="340" width="4" height="12" fill="#E1E5E8" stroke="#333" strokeWidth="0.5" />
            <circle cx="142" cy="340" r="2.5" fill="var(--mint)" style={{ animation: 'blink 1.2s infinite' }} />
            <rect x="160" y="355" width="4" height="12" fill="#E1E5E8" stroke="#333" strokeWidth="0.5" />
            <circle cx="162" cy="355" r="2.5" fill="var(--mint)" style={{ animation: 'blink 1.2s infinite 0.6s' }} />
          </g>

          {/* Parked Miniature Cars */}
          {/* Yellow Car (Spot 1) */}
          <g transform="translate(108,356)">
            {/* Base block */}
            <polygon points="5,15 28,-1 40,7 17,23" fill="#FFC107" />
            {/* Windshield */}
            <polygon points="12,12 20,6 28,11 20,17" fill="#ADD8E6" />
            {/* Roof cap */}
            <polygon points="18,10 24,6 30,10 24,14" fill="#FFD54F" />
          </g>

          {/* Blue Car (Spot 2) */}
          <g transform="translate(130,373)">
            <polygon points="5,15 28,-1 40,7 17,23" fill="#1E88E5" />
            <polygon points="12,12 20,6 28,11 20,17" fill="#ADD8E6" />
            <polygon points="18,10 24,6 30,10 24,14" fill="#64B5F6" />
          </g>

          {/* Red Car (Spot 4) */}
          <g transform="translate(168,406)">
            <polygon points="5,15 28,-1 40,7 17,23" fill="#E53935" />
            <polygon points="12,12 20,6 28,11 20,17" fill="#ADD8E6" />
            <polygon points="18,10 24,6 30,10 24,14" fill="#EF5350" />
          </g>
        </g>

        {/* BOTTOM PARKING LOT */}
        <g>
          <g stroke="#6DDA68" strokeWidth="1.2" fill="none">
            <polygon points="305,490 350,460 365,470 320,500" />
            <polygon points="325,505 370,475 385,485 340,515" />
            <polygon points="345,520 390,490 405,500 360,530" />
            <polygon points="365,535 410,505 425,515 380,545" />
          </g>

          {/* Parked Miniature Cars */}
          {/* Blue Sedan (Spot 1) */}
          <g transform="translate(315,466)">
            <polygon points="5,15 28,-1 40,7 17,23" fill="#00ACC1" />
            <polygon points="12,12 20,6 28,11 20,17" fill="#E0F7FA" />
            <polygon points="18,10 24,6 30,10 24,14" fill="#26C6DA" />
          </g>

          {/* Dark Blue Car (Spot 2) */}
          <g transform="translate(337,483)">
            <polygon points="5,15 28,-1 40,7 17,23" fill="#1A237E" />
            <polygon points="12,12 20,6 28,11 20,17" fill="#ADD8E6" />
            <polygon points="18,10 24,6 30,10 24,14" fill="#3F51B5" />
          </g>

          {/* Red Sports Car (Spot 4) */}
          <g transform="translate(378,515)">
            <polygon points="5,15 28,-1 40,7 17,23" fill="#B71C1C" />
            <polygon points="12,12 20,6 28,11 20,17" fill="#E0F7FA" />
            <polygon points="18,10 24,6 30,10 24,14" fill="#E53935" />
          </g>

          {/* Small Box Delivery Truck parked on access road */}
          <g transform="translate(340,510)" opacity="0.95">
            {/* Wheels */}
            <circle cx="8" cy="20" r="3.5" fill="#333" />
            <circle cx="24" cy="30" r="3.5" fill="#333" />
            {/* Cabin */}
            <polygon points="0,12 12,4 20,9 8,17" fill="#FFB300" stroke="#FF8F00" strokeWidth="0.5" />
            <polygon points="2,11 8,7 11,9 5,13" fill="#E0F7FA" />
            {/* Cargo Box */}
            <polygon points="8,17 32,-1 44,7 20,25" fill="#EEEEEE" stroke="#CCCCCC" strokeWidth="0.5" />
            <polygon points="8,-1 8,17 20,25 20,7" fill="#E0E0E0" />
          </g>
        </g>

        {/* ── FIVE HIGH-TECH CURVED OFFICE BUILDINGS (DEPTH BUFFERED) ── */}

        {/* 1. S-WAVE TOWER (Left-Center, cy=440) */}
        <g 
          className="iso-building"
          style={{
            transform: hovered === 'wave' ? 'translateY(-10px)' : 'translateY(0)',
            transition: 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1), filter 0.4s ease',
            filter: hovered === 'wave' ? 'drop-shadow(0 15px 30px rgba(240,140,138,0.3))' : 'none',
            cursor: 'pointer'
          }}
          onMouseEnter={() => { setHovered('wave'); onHover(true); }}
          onMouseLeave={() => { setHovered(null); onHover(false); }}
        >
          {/* Coral Outline Frame Paths */}
          {/* Back edge shadow */}
          <path d="M 230,460 C 255,425 270,455 295,420 L 295,310 C 270,345 255,315 230,350 Z" fill="#D37573" />
          {/* Front Curved Glass Wall */}
          <path d="M 230,460 C 255,425 270,455 295,420 L 295,310 C 270,345 255,315 230,350 Z" fill="url(#glassGrad)" stroke="#C86A68" strokeWidth="0.8" />
          {/* White window strip dividers */}
          <path d="M 230,420 C 255,385 270,415 295,380" fill="none" stroke="#FFFFFF" strokeWidth="1.5" opacity="0.65" />
          <path d="M 230,385 C 255,350 270,380 295,345" fill="none" stroke="#FFFFFF" strokeWidth="1.5" opacity="0.65" />

          {/* Side wall extrusions */}
          <polygon points="295,420 330,440 330,330 295,310" fill="#E2DDD0" stroke="#CDC8B9" strokeWidth="0.5" />
          <polygon points="230,460 215,450 215,340 230,350" fill="#C2BEAF" stroke="#CDC8B9" strokeWidth="0.5" />
          
          {/* Roof Cap S-shape */}
          <path d="M 230,350 C 255,315 270,345 295,310 L 330,330 C 305,365 290,335 265,370 Z" fill="#F3F0E6" stroke="#DCD7C9" strokeWidth="0.8" />
          {/* Roof Coral Accents */}
          <circle cx="280" cy="336" r="3.5" fill="#F08C8A" />
          <circle cx="290" cy="342" r="3.5" fill="#F08C8A" />

          {/* Security Gate archway at entrance */}
          <g>
            <polygon points="295,420 315,431 315,405 295,394" fill="var(--slate)" />
            {/* Glowing Green Entrance Gate */}
            <polygon points="300,418 310,424 310,408 300,402" fill="rgba(109,218,104,0.4)" stroke="#6DDA68" strokeWidth="1.5" style={{ animation: 'pulse 1.5s infinite' }} />
          </g>
        </g>

        {/* 2. SOLAR CURVE TOWER (Top-Center, cy=350) */}
        <g 
          className="iso-building"
          style={{
            transform: hovered === 'solar' ? 'translateY(-10px)' : 'translateY(0)',
            transition: 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1), filter 0.4s ease',
            filter: hovered === 'solar' ? 'drop-shadow(0 15px 30px rgba(139,195,74,0.25))' : 'none',
            cursor: 'pointer'
          }}
          onMouseEnter={() => { setHovered('solar'); onHover(true); }}
          onMouseLeave={() => { setHovered(null); onHover(false); }}
        >
          {/* Main frame block */}
          {drawIsoBox(410, 370, 50, 40, 110, '#EEEEEE', '#D6D6D6', '#FFFFFF')}
          
          {/* Curved Facade Facing Right */}
          <path d="M 460,399 C 485,385 490,365 510,350 L 510,240 C 490,255 485,275 460,289 Z" fill="url(#glassGrad)" stroke="#B0BEC5" strokeWidth="0.8" />
          {/* Horizontal Window Dividers */}
          {Array.from({ length: 6 }).map((_, i) => (
            <path key={`win-div-${i}`} d={`M 460,${289 + i * 20} C 485,${275 + i * 20} 490,${255 + i * 20} 510,${240 + i * 20}`} fill="none" stroke="#FFFFFF" strokeWidth="1.2" opacity="0.65" />
          ))}

          {/* Roof Solar Panels slanted */}
          <g transform="translate(420, 235)">
            <polygon points="5,15 22,5 30,10 13,20" fill="url(#solarGrad)" stroke="#37474F" strokeWidth="0.5" />
            <line x1="13" y1="20" x2="13" y2="24" stroke="var(--slate)" strokeWidth="1.5" />
            <line x1="30" y1="10" x2="30" y2="14" stroke="var(--slate)" strokeWidth="1.5" />
            
            <polygon points="20,7 37,-3 45,2 28,12" fill="url(#solarGrad)" stroke="#37474F" strokeWidth="0.5" />
            <line x1="28" y1="12" x2="28" y2="16" stroke="var(--slate)" strokeWidth="1.5" />
            <line x1="45" y1="2" x2="45" y2="6" stroke="var(--slate)" strokeWidth="1.5" />
          </g>

          {/* Security Gate archway */}
          <g>
            <polygon points="415,360 435,371 435,348 415,337" fill="var(--slate)" />
            <polygon points="420,358 430,364 430,350 420,344" fill="rgba(109,218,104,0.4)" stroke="#6DDA68" strokeWidth="1.5" style={{ animation: 'pulse 1.5s infinite 0.3s' }} />
          </g>
        </g>

        {/* 3. TALL HIGH-RISE TOWER (Top-Right, cy=240) */}
        <g 
          className="iso-building"
          style={{
            transform: hovered === 'highrise' ? 'translateY(-10px)' : 'translateY(0)',
            transition: 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1), filter 0.4s ease',
            filter: hovered === 'highrise' ? 'drop-shadow(0 15px 30px rgba(110,136,148,0.3))' : 'none',
            cursor: 'pointer'
          }}
          onMouseEnter={() => { setHovered('highrise'); onHover(true); }}
          onMouseLeave={() => { setHovered(null); onHover(false); }}
        >
          {/* Main skyscraper pillar */}
          {drawIsoBox(590, 240, 42, 42, 175, '#CFD8DC', '#B0BEC5', '#ECEFF1')}

          {/* Curved Facade Wrap */}
          <path d="M 590,240 C 615,225 615,205 632,190 L 632,15 C 615,30 615,50 590,65 Z" fill="url(#glassGradTall)" stroke="#90A4AE" strokeWidth="0.8" />
          {/* Curved structural horizontal bars */}
          {Array.from({ length: 8 }).map((_, i) => (
            <path key={`sky-div-${i}`} d={`M 590,${65 + i * 22} C 615,${50 + i * 22} 615,${30 + i * 22} 632,${15 + i * 22}`} fill="none" stroke="#FFFFFF" strokeWidth="1.5" opacity="0.55" />
          ))}

          {/* Coral Top Roof Curve Trim */}
          <path d="M 590,65 C 615,50 615,30 632,15 L 632,12 C 615,27 615,47 590,62 Z" fill="#F08C8A" />

          {/* Ground Footprint Entrance archway */}
          <g>
            <polygon points="595,230 615,218 615,195 595,207" fill="var(--slate)" />
            <polygon points="600,225 610,214 610,201 600,211" fill="rgba(109,218,104,0.4)" stroke="#6DDA68" strokeWidth="1.5" style={{ animation: 'pulse 1.5s infinite 0.6s' }} />
          </g>
        </g>

        {/* 4. C-SHAPED SOLAR BLOCK (Mid-Right, cy=460) */}
        <g 
          className="iso-building"
          style={{
            transform: hovered === 'cshape' ? 'translateY(-10px)' : 'translateY(0)',
            transition: 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1), filter 0.4s ease',
            filter: hovered === 'cshape' ? 'drop-shadow(0 15px 30px rgba(234,202,163,0.3))' : 'none',
            cursor: 'pointer'
          }}
          onMouseEnter={() => { setHovered('cshape'); onHover(true); }}
          onMouseLeave={() => { setHovered(null); onHover(false); }}
        >
          {/* Curved architectural block */}
          {drawIsoBox(630, 460, 48, 48, 120, '#EEEEEE', '#CCCCCC', '#FFFFFF')}
          
          {/* C-Shape Curved Front Wall */}
          <path d="M 630,460 C 655,445 660,425 678,410 L 678,290 C 660,305 655,325 630,340 Z" fill="url(#glassGrad)" stroke="#B0BEC5" strokeWidth="0.8" />
          
          {/* Horizontal Window Bars */}
          {Array.from({ length: 6 }).map((_, i) => (
            <path key={`c-div-${i}`} d={`M 630,${340 + i * 20} C 655,${325 + i * 20} 660,${305 + i * 20} 678,${290 + i * 20}`} fill="none" stroke="#FFFFFF" strokeWidth="1.2" opacity="0.65" />
          ))}

          {/* Roof Solar Panels */}
          <g transform="translate(640, 315)">
            <polygon points="5,15 22,5 30,10 13,20" fill="url(#solarGrad)" stroke="#37474F" strokeWidth="0.5" />
            <line x1="13" y1="20" x2="13" y2="24" stroke="var(--slate)" strokeWidth="1.5" />
            <line x1="30" y1="10" x2="30" y2="14" stroke="var(--slate)" strokeWidth="1.5" />
          </g>

          {/* Coral frame detailing */}
          <path d="M 678,410 L 678,290 L 685,294 L 685,414 Z" fill="#F08C8A" stroke="#C86A68" strokeWidth="0.5" />

          {/* Security Gate archway */}
          <g>
            <polygon points="635,450 655,438 655,415 635,427" fill="var(--slate)" />
            <polygon points="640,445 650,434 650,421 640,431" fill="rgba(109,218,104,0.4)" stroke="#6DDA68" strokeWidth="1.5" style={{ animation: 'pulse 1.5s infinite 0.9s' }} />
          </g>

          {/* Little green balconies on side of C-shape */}
          <path d="M 685,380 C 695,370 695,360 685,350 Z" fill="#6A9F4E" />
          <path d="M 685,340 C 695,330 695,320 685,310 Z" fill="#6A9F4E" />
        </g>

        {/* 5. SMART TECH ATRIUM (Bottom-Center, cy=550) */}
        <g 
          className="iso-building"
          style={{
            transform: hovered === 'atrium' ? 'translateY(-10px)' : 'translateY(0)',
            transition: 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1), filter 0.4s ease',
            filter: hovered === 'atrium' ? 'drop-shadow(0 15px 30px rgba(139,195,74,0.25))' : 'none',
            cursor: 'pointer'
          }}
          onMouseEnter={() => { setHovered('atrium'); onHover(true); }}
          onMouseLeave={() => { setHovered(null); onHover(false); }}
        >
          {/* Rectangular Atrium Structure: Base cx=440, cy=520, w=55, d=50, h=95 */}
          {drawIsoBox(440, 520, 55, 50, 95, '#CFD8DC', '#ECEFF1', '#FFFFFF')}

          {/* Glass facade overlay on left side */}
          <polygon points="440,520 390,491 390,396 440,425" fill="url(#glassGrad)" stroke="#90A4AE" strokeWidth="0.8" />
          {/* Vertical and Horizontal window mullions */}
          <line x1="415" y1="505.5" x2="415" y2="410.5" stroke="#FFFFFF" strokeWidth="1.2" opacity="0.6" />
          <line x1="390" y1="462" x2="440" y2="491" stroke="#FFFFFF" strokeWidth="1" opacity="0.6" />
          <line x1="390" y1="428" x2="440" y2="457" stroke="#FFFFFF" strokeWidth="1" opacity="0.6" />

          {/* Solar Panels on Atrium Roof */}
          <g transform="translate(425, 400)">
            <polygon points="5,15 22,5 30,10 13,20" fill="url(#solarGrad)" stroke="#37474F" strokeWidth="0.5" />
            <line x1="13" y1="20" x2="13" y2="24" stroke="var(--slate)" strokeWidth="1.5" />
            <line x1="30" y1="10" x2="30" y2="14" stroke="var(--slate)" strokeWidth="1.5" />
            
            <polygon points="22,25 39,15 47,20 30,30" fill="url(#solarGrad)" stroke="#37474F" strokeWidth="0.5" />
            <line x1="30" y1="30" x2="30" y2="34" stroke="var(--slate)" strokeWidth="1.5" />
            <line x1="47" y1="20" x2="47" y2="24" stroke="var(--slate)" strokeWidth="1.5" />

            {/* Little worker on the roof installing solar panels (orange clad) */}
            <circle cx="10" cy="30" r="1.8" fill="#F4511E" /> {/* head */}
            <line x1="10" y1="31" x2="15" y2="35" stroke="#F4511E" strokeWidth="1.5" /> {/* body/legs */}
            <line x1="10" y1="32" x2="5" y2="30" stroke="#FF8A65" strokeWidth="0.8" /> {/* arm reaching panel */}
          </g>

          {/* Green grass garden corner on Atrium Roof */}
          <polygon points="440,425 440,428 420,416 420,413" fill="#6A9F4E" />

          {/* Security Gate archway at entrance */}
          <g>
            <polygon points="445,510 465,521 465,498 445,487" fill="var(--slate)" />
            <polygon points="450,508 460,514 460,500 450,494" fill="rgba(109,218,104,0.4)" stroke="#6DDA68" strokeWidth="1.5" style={{ animation: 'pulse 1.5s infinite 1.2s' }} />
          </g>
        </g>

        {/* ── PUBLIC AMENITY: BUS STOP (MID-RIGHT SIDE) ────────────────── */}
        <g transform="translate(480, 240)" opacity="0.95">
          {/* Blue shelter base & bench */}
          <polygon points="50,15 70,5 82,11 62,21" fill="#4285F4" stroke="#1565C0" strokeWidth="0.8" />
          {/* Vertical supports */}
          <line x1="50" y1="15" x2="50" y2="2" stroke="#1565C0" strokeWidth="1.5" />
          <line x1="70" y1="5" x2="70" y2="-8" stroke="#1565C0" strokeWidth="1.5" />
          <line x1="62" y1="21" x2="62" y2="8" stroke="#1565C0" strokeWidth="1.5" />
          {/* Shelter Roof canopy (Blue) */}
          <polygon points="50,2 70,-8 82,-2 62,8" fill="#1976D2" stroke="#1565C0" strokeWidth="0.8" />
          {/* "BUS STOP" Signboard text */}
          <polygon points="52,-3 65,-9 68,-7 55,-1" fill="#FFFFFF" />
          <text x="53" y="1" fill="#1565C0" fontFamily="var(--font-mono)" fontSize="4" fontWeight="bold" transform="rotate(27 53 1)">BUS STOP</text>

          {/* Blue pole sign post */}
          <line x1="88" y1="12" x2="88" y2="-10" stroke="#1565C0" strokeWidth="1.2" />
          <rect x="85" y="-14" width="6" height="6" fill="#1976D2" stroke="#1565C0" strokeWidth="0.5" />

          {/* Tiny waiting passengers */}
          <circle cx="56" cy="12" r="1.8" fill="#FF8A80" />
          <line x1="56" y1="14" x2="56" y2="18" stroke="#FF8A80" strokeWidth="1.2" />
          
          <circle cx="62" cy="18" r="1.8" fill="#26A69A" />
          <line x1="62" y1="20" x2="64" y2="24" stroke="#26A69A" strokeWidth="1.2" />
        </g>

        {/* ── PUBLIC AMENITY: SORTED RECYCLING BINS ───────────────────── */}
        <g transform="translate(500, 395)" opacity="0.95">
          {/* Bins Pad */}
          <polygon points="10,5 25,-2 48,10 33,17" fill="#CFD8DC" />
          
          {/* Bin 1: Blue (Paper) */}
          {drawIsoCylinder(16, 7, 3.5, 8, '#1E88E5', '#64B5F6', 'none')}
          
          {/* Bin 2: Green (Glass) */}
          {drawIsoCylinder(23, 10, 3.5, 8, '#43A047', '#81C784', 'none')}
          
          {/* Bin 3: Red (Plastic) */}
          {drawIsoCylinder(30, 13, 3.5, 8, '#E53935', '#E57373', 'none')}
          
          {/* Bin 4: Grey (Metal) */}
          {drawIsoCylinder(37, 16, 3.5, 8, '#757575', '#BDBDBD', 'none')}
        </g>

      </svg>
    </div>
  );
}



function Section2({ active, onHover }) {
  const stats = [
    { num: '4',   suffix: '',    label: 'Buildings mapped in 3D' },
    { num: '120', suffix: '+',   label: 'Rooms fully indexed' },
    { num: '360', suffix: '',    label: 'Residents navigated daily' },
    { num: '3',   suffix: ' sec', label: 'Average route calculation' },
  ];

  return (
    <section style={{ height: '100vh', scrollSnapAlign: 'start', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', background: 'var(--surf2)' }}>
      <NodeGrid active={active} />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 48px', width: '100%', position: 'relative', zIndex: 2, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>
        <div>
          <p style={{ fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--dusty)', marginBottom: 24, opacity: active ? 1 : 0, transition: 'opacity 0.6s ease' }}>Platform Overview</p>
          {stats.map((stat, i) => (
            <div key={i} style={{ marginBottom: 32, opacity: active ? 1 : 0, transform: active ? 'translateY(0)' : 'translateY(24px)', transition: `all 0.7s ease ${0.2 + i * 0.15}s` }}>
              <div style={{
                width: active ? '40px' : '0px',
                height: 2,
                background: `linear-gradient(to right, ${i===0?'var(--mint)':i===1?'var(--sage)':i===2?'var(--dusty)':'var(--warm-sage)'}, transparent)`,
                marginBottom: 8,
                transition: `width 0.8s ease ${0.2 + i * 0.15}s`,
              }} />
              <div style={{ 
                fontFamily: 'var(--font-display)', fontSize: 64, fontWeight: 900, lineHeight: 1, 
                color: i === 0 ? 'var(--mint)' : i === 1 ? 'var(--sage)' : i === 2 ? 'var(--dusty)' : 'var(--warm-sage)'
              }}>
                <span style={{
                  display: 'inline-block',
                  animation: active ? `numberRoll 0.6s ease ${0.2 + i * 0.15}s both` : 'none',
                }}>
                  {stat.num}
                </span>
                <span style={{ fontSize: 32, color: 'var(--muted)' }}>{stat.suffix}</span>
              </div>
              <div style={{ fontSize: 14, color: 'var(--text-sec)', marginTop: 4 }}>{stat.label}</div>
            </div>
          ))}
        </div>
        <div style={{ opacity: active ? 1 : 0, transform: active ? 'translateX(0)' : 'translateX(40px)', transition: 'all 0.9s ease 0.4s' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 700, lineHeight: 1.15, marginBottom: 24 }}>Your campus,<br /><span style={{ fontStyle: 'italic', color: 'var(--dusty)' }}>intelligently</span><br />mapped.</h2>
          <p style={{ fontSize: 16, color: 'var(--text-sec)', lineHeight: 1.8, marginBottom: 24 }}>The Smart Campus Platform creates a living digital twin of your institution — every building, floor, and room precisely mapped at real GPS coordinates.</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 32 }}>
            {['Boys Hostel I','Boys Hostel II','Girls Hostel I','Girls Hostel II'].map((b,i) => (
              <span key={i} 
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'rgba(141,184,122,0.5)';
                  e.currentTarget.style.background = 'rgba(141,184,122,0.08)';
                  e.currentTarget.style.color = 'var(--text)';
                  onHover(true);
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'rgba(126,196,168,0.2)';
                  e.currentTarget.style.background = 'rgba(126,196,168,0.04)';
                  e.currentTarget.style.color = 'var(--text-sec)';
                  onHover(false);
                }}
                style={{ 
                  padding: '6px 14px', 
                  border: '1px solid rgba(126,196,168,0.25)', 
                  borderRadius: 40, 
                  fontSize: 12, 
                  color: 'var(--text-sec)', 
                  background: 'rgba(126,196,168,0.08)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
              >
                {b}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Section3({ active, onHover }) {

  // Each cube has: position, rotation, delay, feature data
  const cubes = useMemo(() => [
    {
      feature: { icon: '◈', title: '3D Interactive Map',
        desc: 'Every building at exact GPS coords. Click any floor.',
        color: '#7EC4A8' },
      finalX: 62,  finalY: 18,  finalRot: -12,
      startX: 70,  startY: -30,
      delay: 0.1,  size: 220,
    },
    {
      feature: { icon: '⟡', title: 'Real-Time Navigation',
        desc: 'A* pathfinding. Accessible routes. Live path drawn.',
        color: '#6BA898' },
      finalX: 74,  finalY: 42,  finalRot: 8,
      startX: 80,  startY: -35,
      delay: 0.35, size: 200,
    },
    {
      feature: { icon: '◎', title: 'Room Intelligence',
        desc: 'Search by name, type, facility. Live timetable.',
        color: '#9DB882' },
      finalX: 55,  finalY: 52,  finalRot: -6,
      startX: 65,  startY: -25,
      delay: 0.55, size: 210,
    },
    {
      feature: { icon: '⚡', title: 'Emergency Response',
        desc: 'One-tap panic alert. Assembly routing. Live updates.',
        color: '#8DB87A' },
      finalX: 78,  finalY: 65,  finalRot: 14,
      startX: 85,  startY: -40,
      delay: 0.75, size: 190,
    },
  ], []);

  return (
    <section style={{
      height: '100vh',
      scrollSnapAlign: 'start',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      background: 'linear-gradient(135deg, #FFFFFF 0%, #FAFAE6 100%)',
    }}>

      {/* Subtle radial glow behind cube cluster */}
      <div style={{
        position: 'absolute',
        right: '10%', top: '20%',
        width: 500, height: 500,
        background: 'radial-gradient(ellipse, rgba(139,195,74,0.12) 0%, transparent 65%)',
        borderRadius: '50%',
        pointerEvents: 'none',
      }} />

      {/* ── LEFT SIDE: Title + description ─────────────────────────────── */}
      <div style={{
        position: 'absolute',
        left: '6%', top: '50%',
        transform: 'translateY(-50%)',
        maxWidth: 380,
        zIndex: 3,
      }}>
        {/* Eyebrow */}
        <p style={{
          fontSize: 11,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: 'var(--dusty)',
          marginBottom: 20,
          opacity: active ? 1 : 0,
          transition: 'opacity 0.6s ease',
          fontFamily: 'var(--font-mono)',
        }}>
          Core Features
        </p>

        {/* Large title — left aligned */}
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(36px, 4.5vw, 58px)',
          fontWeight: 900,
          lineHeight: 1.05,
          letterSpacing: '-0.02em',
          marginBottom: 28,
          opacity: active ? 1 : 0,
          transform: active ? 'translateX(0)' : 'translateX(-30px)',
          transition: 'all 0.8s ease 0.1s',
        }}>
          Everything<br />
          your campus<br />
          <span style={{
            fontStyle: 'italic',
            background: 'linear-gradient(135deg, #8BC34A, #AED581)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            needs.
          </span>
        </h2>

        <p style={{
          fontSize: 14,
          color: 'var(--text-sec)',
          lineHeight: 1.7,
          marginBottom: 32,
          opacity: active ? 1 : 0,
          transform: active ? 'translateX(0)' : 'translateX(-20px)',
          transition: 'all 0.8s ease 0.25s',
        }}>
          Four intelligent systems working in concert —
          navigation, tracking, information, and safety —
          unified in a single 3D digital twin.
        </p>

        {/* Feature count */}
        <div style={{
          display: 'flex',
          gap: 24,
          opacity: active ? 1 : 0,
          transition: 'opacity 0.8s ease 0.4s',
        }}>
          {[['4','Systems'],['120+','Rooms'],['360','Users']].map(([n,l]) => (
            <div key={l}>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: 28, fontWeight: 900,
                color: 'var(--mint)',
              }}>{n}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '0.08em' }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT SIDE: Physics-falling 3D cubes ────────────────────────── */}
      {cubes.map((cube, i) => (
        <PhysicsCube
          key={i}
          cube={cube}
          active={active}
          onHover={onHover}
          index={i}
        />
      ))}

      {/* Ground shadow line */}
      <div style={{
        position: 'absolute',
        bottom: 80,
        left: '50%', right: '3%',
        height: 1,
        background: 'radial-gradient(ellipse, rgba(107,168,152,0.25) 0%, transparent 70%)',
        opacity: active ? 1 : 0,
        transition: 'opacity 1s ease 1s',
      }} />
    </section>
  );
}

function Section4({ active }) {
  const steps = [
    { num: '01', title: 'Open the map',     desc: 'Launch the 3D campus view. All buildings appear at exact GPS locations on a live map base.' },
    { num: '02', title: 'Find your building', desc: 'Click any hostel or block. The Floor Manager opens showing all floors colour-coded.' },
    { num: '03', title: 'Select your floor', desc: 'Tap Ground, First or Second. Room grid cells appear. Dim floors stay visible for context.' },
    { num: '04', title: 'Navigate there',   desc: 'Tap any room. Hit Get Route. An animated path traces the fastest way to your destination.' },
  ];

  return (
    <section style={{
      height: '100vh',
      scrollSnapAlign: 'start',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      background: 'var(--surf3)',
    }}>

      {/* Interlocking gears background */}
      {active && (
        <div style={{
          position: 'absolute',
          right: '-5%', top: '50%',
          transform: 'translateY(-50%)',
          width: 580, height: 580,
          opacity: 0.5,
          zIndex: 1,
          animation: 'gearGlow 6s ease-in-out infinite',
          filter: 'drop-shadow(0 0 15px rgba(121,85,72,0.20))',
        }}>
          <GearSystem />
        </div>
      )}

      {/* Subtle gradient overlay so text is readable over gears */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to right, #F5F5DC 45%, transparent 75%)',
        zIndex: 1, pointerEvents: 'none',
      }} />

      <div style={{
        maxWidth: 1200, margin: '0 auto', padding: '0 48px',
        width: '100%', position: 'relative', zIndex: 2,
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        gap: 80, alignItems: 'center',
      }}>
        {/* Left: steps */}
        <div>
          <p style={{
            fontSize: 11, letterSpacing: '0.16em',
            textTransform: 'uppercase', color: 'var(--dusty)',
            marginBottom: 20,
            fontFamily: 'var(--font-mono)',
            opacity: active ? 1 : 0,
            transition: 'opacity 0.5s ease',
          }}>
            How it works
          </p>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(32px, 4vw, 52px)',
            fontWeight: 900, lineHeight: 1.1,
            marginBottom: 48,
            opacity: active ? 1 : 0,
            transform: active ? 'none' : 'translateY(20px)',
            transition: 'all 0.7s ease 0.1s',
          }}>
            From door to<br />
            <span style={{ fontStyle: 'italic', color: 'var(--dusty)' }}>
              destination
            </span>
            <span style={{ color: 'var(--muted)', fontStyle: 'italic' }}>
              {' '}in 4 steps.
            </span>
          </h2>

          {steps.map((step, i) => (
            <div key={i} style={{
              display: 'flex', gap: 20, marginBottom: 28,
              opacity: active ? 1 : 0,
              transform: active ? 'translateX(0)' : 'translateX(-24px)',
              transition: `all 0.6s ease ${0.3 + i * 0.12}s`,
            }}>
              {/* Step number */}
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11, color: 'var(--dusty)',
                minWidth: 28, paddingTop: 3,
                letterSpacing: '0.05em',
              }}>
                {step.num}
              </div>
              {/* Vertical connector */}
              <div style={{
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 6,
                minWidth: 16,
              }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: i === 0 ? 'var(--sage)' : 'transparent',
                  border: `1px solid ${i === 0 ? 'var(--sage)' : 'rgba(107,168,152,0.3)'}`,
                  flexShrink: 0,
                  animation: active && i === 0 ? 'dotPulse 2s ease-in-out infinite' : 'none',
                }} />
                {i < 3 && (
                  <div style={{
                    width: 1, height: 40,
                    background: 'linear-gradient(to bottom, var(--dusty), transparent)',
                  }} />
                )}
              </div>
              <div>
                <h3 style={{
                  fontSize: 15, fontWeight: 600,
                  marginBottom: 6, color: 'var(--text)',
                }}>
                  {step.title}
                </h3>
                <p style={{
                  fontSize: 13, color: 'var(--text-sec)', lineHeight: 1.6,
                }}>
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Right: gear visual placeholder (gears rendered absolutely) */}
        <div style={{ height: 400, position: 'relative' }} />
      </div>
    </section>
  );
}

function Section5({ onExplore, onHover }) {
  return (
    <section style={{ height: '100vh', scrollSnapAlign: 'start', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(160deg, #FDFCF0 0%, #FAFAE6 50%, #F5F5DC 100%)' }}>
      <ParticleField />
      <div style={{ position: 'absolute', width: 600, height: 600, border: '1px solid rgba(139,195,74,0.15)', borderRadius: '50%', animation: 'pulse 8s ease-in-out infinite' }} />
      <div style={{ position: 'relative', zIndex: 2, textAlign: 'center' }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--dusty)', letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 24 }}>Ready to explore</p>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(40px, 7vw, 96px)', fontWeight: 900, lineHeight: 0.95, marginBottom: 48, letterSpacing: '-0.02em' }}>Enter your<br />
          <span style={{
            fontStyle: 'italic',
            background: 'linear-gradient(135deg, #4E342E, #8BC34A, #AED581)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            campus.
          </span>
        </h2>
        
        <button 
          onClick={onExplore}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 14,
            padding: '22px 52px',
            background: 'transparent',
            color: 'var(--mint)',
            border: '2px solid var(--mint)',
            borderRadius: 3,
            fontSize: 16, fontWeight: 500,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            fontFamily: 'var(--font-mono)',
            cursor: 'pointer',
            position: 'relative',
            overflow: 'hidden',
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'linear-gradient(135deg, #8BC34A, #AED581)';
            e.currentTarget.style.color = 'var(--text)';
            e.currentTarget.style.borderColor = 'transparent';
            e.currentTarget.style.boxShadow = '0 8px 32px rgba(139,195,74,0.35)';
            onHover(true);
          }} 
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--mint)';
            e.currentTarget.style.borderColor = 'var(--mint)';
            e.currentTarget.style.boxShadow = 'none';
            onHover(false);
          }}
        >
          Open Campus Map <span style={{ marginLeft: 8 }}>→</span>
        </button>

        <div style={{ marginTop: 48, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--dusty)', display: 'flex', gap: 32, justifyContent: 'center' }}>
          <LiveCoord label="BH-I" lat={18.148724} lng={83.372788} color="var(--mint)" />
          <LiveCoord label="BH-II" lat={18.149012} lng={83.371485} color="var(--mint)" />
          <LiveCoord label="GH-I" lat={18.149089} lng={83.377667} color="var(--sage)" />
          <LiveCoord label="GH-II" lat={18.148546} lng={83.377642} color="var(--sage)" />
        </div>
      </div>
    </section>
  );
}

function CoordGrid() {
  return (
    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.04, animation: 'gridPulse 4s ease-in-out infinite', pointerEvents: 'none' }}>
      {Array.from({length: 20}).map((_,i) => <line key={`v${i}`} x1={`${i * 5}%`} y1="0" x2={`${i * 5}%`} y2="100%" stroke="var(--mint)" strokeWidth="0.5" />)}
      {Array.from({length: 15}).map((_,i) => <line key={`h${i}`} x1="0" y1={`${i * 7}%`} x2="100%" y2={`${i * 7}%`} stroke="var(--mint)" strokeWidth="0.5" />)}
      {Array.from({length: 6}).map((_,i) => (
        <line key={`d${i}`}
          x1={`${i * 20}%`} y1="0%"
          x2={`${i * 20 + 100}%`} y2="100%"
          stroke="var(--mint)" strokeWidth="0.3"
          opacity="0.02"
        />
      ))}
    </svg>
  );
}

function NodeGrid({ active }) {
  const [nodes] = useState(() => Array.from({length: 80}).map(() => ({
    x: Math.random() * 100,
    y: Math.random() * 100,
    r: Math.random() * 3 + 1,
    delay: Math.random() * 2,
    colorIdx: Math.floor(Math.random() * 3)
  })));

  const colors = ['#7EC4A8', '#8DB87A', '#6BA898'];

  return (
    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
      {nodes.map((n, i) => (
        <circle key={i} 
          cx={`${n.x}%`} cy={`${n.y}%`} r={n.r} 
          fill={colors[n.colorIdx]} 
          opacity={active ? 0.18 : 0} 
          style={{ transition: `opacity 1s ease ${n.delay}s` }} 
        />
      ))}
    </svg>
  );
}

function BuildingSilhouette() {
  return (
    <svg width="320" height="420" viewBox="0 0 320 420" style={{ opacity: 0.35 }}>
      {/* Ground shadow ellipse */}
      <ellipse cx="160" cy="380" rx="140" ry="20" fill="#7EC4A8" opacity="0.2" />
      
      {/* Ground floor slab */}
      <rect x="20" y="300" width="280" height="60" fill="#7EC4A8" rx="2" />
      {/* First floor slab */}
      <rect x="20" y="230" width="280" height="60" fill="#8DB87A" rx="2" style={{opacity:0.8}} />
      {/* Second floor slab */}
      <rect x="20" y="160" width="280" height="60" fill="#6BA898" rx="2" style={{opacity:0.8}} />
      
      {/* Band lines / Windows */}
      {Array.from({length:8}).map((_,i) => (
        <rect key={i} x={30 + i*33} y={312} width={20} height={38} fill="#795548" rx="2" opacity={0.55} />
      ))}
      {Array.from({length:8}).map((_,i) => (
        <rect key={`w1-${i}`} x={30 + i*33} y={242} width={20} height={38} fill="#795548" rx="2" opacity={0.55} />
      ))}
      {Array.from({length:8}).map((_,i) => (
        <rect key={`w2-${i}`} x={30 + i*33} y={172} width={20} height={38} fill="#795548" rx="2" opacity={0.55} />
      ))}

      {/* Finishing band lines */}
      <rect x="20" y="290" width="280" height="4" fill="#1A2E1A" opacity="0.5" />
      <rect x="20" y="220" width="280" height="4" fill="#1A2E1A" opacity="0.5" />
    </svg>
  );
}

function PhysicsCube({ cube, active, onHover, index }) {
  const [hovered, setHovered] = useState(false);
  const [landed, setLanded] = useState(false);

  useEffect(() => {
    if (active) {
      const timer = setTimeout(() => setLanded(true),
        (cube.delay + 0.8) * 1000);
      return () => {
        clearTimeout(timer);
        setLanded(false);
      };
    }
  }, [active, cube.delay]);

  const { feature, finalX, finalY, finalRot, startX, startY, delay, size } = cube;

  return (
    <>
      <style>{`
        @keyframes cubeFall-${index} {
          0% {
            left: ${startX}%;
            top: ${startY}%;
            transform: rotate(${finalRot + 40}deg) scale(0.6);
            opacity: 0;
          }
          60% {
            opacity: 1;
          }
          75% {
            left: ${finalX}%;
            top: ${finalY + 3}%;
            transform: rotate(${finalRot - 4}deg) scale(1.04);
          }
          85% {
            left: ${finalX + 0.5}%;
            top: ${finalY - 1}%;
            transform: rotate(${finalRot + 2}deg) scale(0.98);
          }
          92% {
            top: ${finalY + 0.5}%;
            transform: rotate(${finalRot - 1}deg) scale(1.01);
          }
          100% {
            left: ${finalX}%;
            top: ${finalY}%;
            transform: rotate(${finalRot}deg) scale(1);
            opacity: 1;
          }
        }
        .cube-${index}-shadow {
          transition: all 0.4s ease;
        }
      `}</style>

      <div
        onMouseEnter={() => { setHovered(true); onHover(true); }}
        onMouseLeave={() => { setHovered(false); onHover(false); }}
        style={{
          position: 'absolute',
          left: active ? `${finalX}%` : `${startX}%`,
          top:  active ? `${finalY}%`  : `${startY}%`,
          width:  size,
          height: size,
          borderRadius: 20,

          // The cube face styling
          background: hovered
            ? `linear-gradient(135deg, ${feature.color}18, #FFFFFF)`
            : 'rgba(255,255,255,0.9)',

          border: `1px solid ${hovered ? feature.color + '55' : 'rgba(107,168,152,0.18)'}`,

          // 3D cube feel via box-shadow
          boxShadow: hovered
            ? `0 20px 40px rgba(107,168,152,0.25), 0 8px 16px rgba(107,168,152,0.15), inset 0 0 20px ${feature.color}06`
            : `0 8px 24px rgba(107,168,152,0.12), 0 2px 8px rgba(107,168,152,0.08)`,

          // Animation
          animation: active
            ? `cubeFall-${index} 0.9s cubic-bezier(0.22, 0.61, 0.36, 1) ${delay}s both`
            : 'none',

          // Hover tilt
          transform: `rotate(${finalRot}deg) ${hovered ? 'scale(1.06) rotate(' + (finalRot - 2) + 'deg)' : ''}`,
          transition: landed
            ? 'transform 0.35s ease, box-shadow 0.35s ease, background 0.35s ease, border-color 0.35s ease'
            : 'none',

          cursor: 'pointer',
          zIndex: 10 - index,
          padding: 28,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',

          // Perspective for slight 3D feel
          perspective: '800px',
        }}
      >
        {/* Subtle noise texture on cube face */}
        <div style={{
          position: 'absolute', inset: 0,
          borderRadius: 20,
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
          opacity: 0.3, pointerEvents: 'none',
        }} />

        {/* Top-right glow spot on hover */}
        <div style={{
          position: 'absolute',
          top: -10, right: -10,
          width: hovered ? 80 : 0,
          height: hovered ? 80 : 0,
          background: `radial-gradient(circle, ${feature.color}40, transparent)`,
          borderRadius: '50%',
          transition: 'all 0.4s ease',
          pointerEvents: 'none',
        }} />

        {/* Icon */}
        <div style={{
          fontSize: hovered ? 36 : 30,
          color: hovered ? feature.color : 'var(--slate)',
          filter: hovered ? `drop-shadow(0 0 8px ${feature.color}80)` : 'none',
          transition: 'all 0.3s ease',
          lineHeight: 1,
        }}>
          {feature.icon}
        </div>

        {/* Feature name */}
        <div>
          <h3 style={{
            fontSize: 15,
            fontWeight: 600,
            color: hovered ? 'var(--text)' : 'var(--text-sec)',
            marginBottom: hovered ? 10 : 0,
            transition: 'all 0.3s ease',
            fontFamily: 'var(--font-body)',
          }}>
            {feature.title}
          </h3>

          {/* Description — only on hover */}
          <p style={{
            fontSize: 12,
            color: 'var(--muted)',
            lineHeight: 1.6,
            maxHeight: hovered ? 60 : 0,
            overflow: 'hidden',
            opacity: hovered ? 1 : 0,
            transition: 'all 0.3s ease',
          }}>
            {feature.desc}
          </p>
        </div>

        {/* Bottom accent line */}
        <div style={{
          position: 'absolute',
          bottom: 0, left: 20, right: 20,
          height: hovered ? 2 : 0,
          background: `linear-gradient(to right, transparent, ${feature.color}, transparent)`,
          borderRadius: 1,
          transition: 'height 0.3s ease',
        }} />
      </div>

      {/* Ground shadow beneath each landed cube */}
      {landed && (
        <div style={{
          position: 'absolute',
          left: `${finalX + size/800 * 4}%`,
          top:  `${finalY + size/window.innerHeight * 115}%`,
          width: size * 0.85,
          height: 20,
          background: 'radial-gradient(ellipse, rgba(0,0,0,0.4) 0%, transparent 70%)',
          transform: `rotate(${finalRot}deg)`,
          filter: 'blur(4px)',
          pointerEvents: 'none',
          transition: 'opacity 0.3s ease',
          opacity: hovered ? 0.3 : 0.5,
        }} />
      )}
    </>
  );
}

function GearSystem() {
  return (
    <div style={{
      position: 'absolute',
      right: '-5%', top: '50%',
      transform: 'translateY(-50%)',
      width: 580, height: 580,
      opacity: 0.35,
      zIndex: 1,
    }}>
      <svg viewBox="0 0 580 580" width="100%" height="100%">
        <defs>
          <style>{`
            .gear-large   { animation: rotateCW  12s linear infinite; transform-origin: 290px 290px; }
            .gear-medium1 { animation: rotateCCW  7s linear infinite; transform-origin: 440px 175px; }
            .gear-medium2 { animation: rotateCCW  9s linear infinite; transform-origin: 155px 175px; }
            .gear-small   { animation: rotateCW   5s linear infinite; transform-origin: 440px 400px; }
            @keyframes rotateCW  { from{transform:rotate(0deg)}  to{transform:rotate(360deg)}  }
            @keyframes rotateCCW { from{transform:rotate(0deg)}  to{transform:rotate(-360deg)} }
          `}</style>
        </defs>

        {/* Large center gear */}
        <g className="gear-large">
          <GearPath cx={290} cy={290} r={110} teeth={24} toothH={22} color="#7EC4A8" />
        </g>

        {/* Medium gear top-right */}
        <g className="gear-medium1">
          <GearPath cx={440} cy={175} r={65} teeth={14} toothH={16} color="#8DB87A" />
        </g>

        {/* Medium gear top-left */}
        <g className="gear-medium2">
          <GearPath cx={155} cy={175} r={65} teeth={14} toothH={16} color="#6BA898" />
        </g>

        {/* Small gear bottom-right */}
        <g className="gear-small">
          <GearPath cx={440} cy={400} r={48} teeth={10} toothH={14} color="#9DB882" />
        </g>

        {/* Center hub circles */}
        <circle cx={290} cy={290} r={28} fill="var(--bg,#0C1410)" stroke="#7EC4A8" strokeWidth="2" />
        <circle cx={290} cy={290} r={10} fill="#7EC4A8" opacity="0.6" />
        <circle cx={440} cy={175} r={16} fill="var(--bg,#0C1410)" stroke="#8DB87A" strokeWidth="1.5" />
        <circle cx={155} cy={175} r={16} fill="var(--bg,#0C1410)" stroke="#8DB87A" strokeWidth="1.5" />
        <circle cx={440} cy={400} r={12} fill="var(--bg,#0C1410)" stroke="#9DB882" strokeWidth="1.5" />
      </svg>
    </div>
  );
}

function GearPath({ cx, cy, r, teeth, toothH, color }) {
  const points = [];
  const total = teeth * 4;
  for (let i = 0; i < total; i++) {
    const angle = (i / total) * Math.PI * 2;
    const isOuter = i % 4 === 1 || i % 4 === 2;
    const rad = isOuter ? r + toothH : r;
    points.push([
      cx + Math.cos(angle) * rad,
      cy + Math.sin(angle) * rad,
    ]);
  }
  const d = points.map((p,i) => `${i===0?'M':'L'}${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(' ') + ' Z';
  return (
    <path
      d={d}
      fill="none"
      stroke={color}
      strokeWidth="2"
      opacity="0.7"
      strokeLinejoin="round"
    />
  );
}

function NatureParticles() {
  const [particles] = useState(() => Array.from({length: 18}, (_, i) => ({
    x:     10 + Math.random() * 80,
    size:  2 + Math.random() * 4,
    dur:   12 + Math.random() * 10,
    delay: Math.random() * 15,
    drift: (Math.random() - 0.5) * 80,  // horizontal drift
    shape: i % 3,  // 0=circle, 1=diamond, 2=line
  })));

  return (
    <div style={{position:'absolute',inset:0,pointerEvents:'none',overflow:'hidden', zIndex: 1}}>
      <style>{`
        @keyframes sporeFloat {
          0%   { transform: translateY(100vh) translateX(0)  rotate(0deg);   opacity: 0;   }
          5%   { opacity: 0.6; }
          95%  { opacity: 0.4; }
          100% { transform: translateY(-10vh) translateX(var(--drift)) rotate(360deg); opacity: 0; }
        }
      `}</style>
      {particles.map((p, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: `${p.x}%`,
          bottom: '-10px',
          '--drift': `${p.drift}px`,
          animation: `sporeFloat ${p.dur}s linear ${p.delay}s infinite`,
        }}>
          {p.shape === 0 && (
            <div style={{
              width: p.size, height: p.size, borderRadius: '50%',
              background: 'var(--mint)', opacity: 0.5,
            }} />
          )}
          {p.shape === 1 && (
            <div style={{
              width: p.size, height: p.size,
              background: 'var(--sage)', opacity: 0.45,
              transform: 'rotate(45deg)',
            }} />
          )}
          {p.shape === 2 && (
            <div style={{
              width: 1, height: p.size * 3,
              background: 'var(--dusty)', opacity: 0.35,
            }} />
          )}
        </div>
      ))}
    </div>
  );
}

function ParticleField() {
  const [particles] = useState(() => Array.from({length:30}).map(() => ({
    left: Math.random() * 100,
    width: Math.random() * 3 + 1,
    dur: 6 + Math.random() * 6,
    delay: Math.random() * 8
  })));

  return (
    <div style={{position:'absolute',inset:0,overflow:'hidden',pointerEvents:'none'}}>
      {particles.map((p,i) => (
        <div key={i} style={{ position:'absolute', left:`${p.left}%`, bottom:'-10px', width:p.width, height:p.width, borderRadius:'50%', background:'var(--mint)', opacity:0.5, animation:`particleFloat ${p.dur}s ease-in ${p.delay}s infinite` }} />
      ))}
    </div>
  );
}

function TickingCoord({ label, value }) {
  const [display, setDisplay] = useState(value.toFixed(6));
  useEffect(() => {
    const iv = setInterval(() => setDisplay((value + (Math.random() - 0.5) * 0.000001).toFixed(6)), 2000);
    return () => clearInterval(iv);
  }, [value]);
  return <span>{label}: <span style={{color:'var(--mint)'}}>{display}</span></span>;
}

function LiveCoord({ label, lat, lng, color }) {
  return (
    <div style={{textAlign:'center'}}>
      <div style={{color, marginBottom:4, fontSize:10, letterSpacing:'0.1em'}}>{label}</div>
      <div style={{fontSize:11}}>{lat.toFixed(4)}°N</div>
      <div style={{fontSize:11}}>{lng.toFixed(4)}°E</div>
    </div>
  );
}
