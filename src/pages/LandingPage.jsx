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
        background: 'radial-gradient(ellipse, rgba(141,110,99,0.18) 0%, rgba(139,195,74,0.06) 50%, transparent 70%)',
        borderRadius: '50%',
        animation: 'orbFloat1 8s ease-in-out infinite',
        pointerEvents: 'none',
        zIndex: 1,
      }} />

      {/* Orb 2 — Sprout bloom */}
      <div style={{
        position: 'absolute', left: '5%', bottom: '10%',
        width: 350, height: 350,
        background: 'radial-gradient(ellipse, rgba(139,195,74,0.15) 0%, transparent 65%)',
        borderRadius: '50%',
        animation: 'orbFloat2 11s ease-in-out infinite 3s',
        pointerEvents: 'none',
        zIndex: 1,
      }} />

      {/* Orb 3 — Dusty Bean accent */}
      <div style={{
        position: 'absolute', left: '25%', top: '8%',
        width: 200, height: 200,
        background: 'radial-gradient(ellipse, rgba(121,85,72,0.12) 0%, transparent 65%)',
        borderRadius: '50%',
        animation: 'orbFloat1 14s ease-in-out infinite 6s',
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

      <div style={{ position: 'relative', zIndex: 2, maxWidth: 1200, margin: '0 auto', padding: '0 48px', transform: `translateY(${textY}px)`, width: '100%' }}>
        <div style={{ paddingTop: 0 }} />

        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(56px, 9vw, 128px)', fontWeight: 900, lineHeight: 0.92, margin: '0 0 24px', letterSpacing: '-0.02em', opacity: loaded ? 1 : 0, transform: loaded ? 'translateY(0)' : 'translateY(40px)', transition: 'all 1s ease 0.4s' }}>
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

        <p style={{ fontSize: 18, color: 'var(--text-sec)', maxWidth: 480, lineHeight: 1.7, marginBottom: 48, opacity: loaded ? 1 : 0, transform: loaded ? 'translateY(0)' : 'translateY(30px)', transition: 'all 1s ease 0.6s' }}>
          A Digital Twin–based platform that integrates 3D navigation, real-time mobility tracking, and emergency response into one unified intelligent system.
        </p>

        <div style={{ display: 'flex', gap: 16, alignItems: 'center', opacity: loaded ? 1 : 0, transform: loaded ? 'translateY(0)' : 'translateY(30px)', transition: 'all 1s ease 0.8s' }}>
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
              padding: '16px 36px', 
              background: 'linear-gradient(135deg, #8BC34A, #AED581)', 
              color: 'var(--slate)', 
              border: 'none', 
              borderRadius: 48, 
              fontSize: 15, 
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
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'var(--mint)';
              e.currentTarget.style.color = 'var(--text)';
              e.currentTarget.style.background = 'rgba(139,195,74,0.06)';
              onHover(true);
            }} 
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'rgba(121,85,72,0.4)';
              e.currentTarget.style.color = 'var(--dusty)';
              e.currentTarget.style.background = 'transparent';
              onHover(false);
            }} 
            style={{ 
              padding: '16px 36px', 
              background: 'transparent', 
              color: 'var(--dusty)', 
              border: '1.5px solid rgba(121,85,72,0.4)', 
              borderRadius: 48, 
              fontSize: 15, 
              fontFamily: 'var(--font-body)', 
              cursor: 'pointer', 
              transition: 'all 0.3s ease' 
            }}
          >
            Watch Demo
          </button>
        </div>

        <div style={{ marginTop: 64, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', display: 'flex', gap: 24, opacity: loaded ? 0.6 : 0, transition: 'opacity 1s ease 1.2s' }}>
          <TickingCoord label="LAT" value={18.148724} />
          <TickingCoord label="LNG" value={83.372788} />
          <span>ELEV 143.95m</span>
          <span>4 BUILDINGS · 120 ROOMS</span>
        </div>
      </div>

      <div style={{ position: 'absolute', right: '4%', bottom: 0, opacity: loaded ? 1 : 0, transition: 'opacity 1.2s ease 1s' }}>
        <BuildingSilhouette />
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
        @keyframes pulse { 0%,100%{opacity:0.6;transform:scale(1)} 50%{opacity:1;transform:scale(1.05)} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes float { 0.100%{transform:translateX(-50%) translateY(0)} 50%{transform:translateX(-50%) translateY(-8px)} }
        @keyframes walkX { 0%{transform:translateX(-80px)} 100%{transform:translateX(calc(100vw + 80px))} }
        @keyframes gridPulse { 0%,100%{opacity:0.03} 50%{opacity:0.07} }
        @keyframes particleFloat { 0%{transform:translateY(0) translateX(0);opacity:0} 10%{opacity:1} 90%{opacity:1} 100%{transform:translateY(-100vh) translateX(40px);opacity:0} }
      `}</style>
    </section>
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
