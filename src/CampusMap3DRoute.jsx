// CampusMap3DRoute.jsx
// Drop this into your App.jsx / router to add the 3D map at /map3d

import { lazy, Suspense } from 'react';

const CampusMap3D = lazy(() => import('./campus-3d/CampusMap3D'));

export function CampusMap3DRoute() {
  return (
    <Suspense fallback={
      <div style={{
        width: '100%',
        height: '100vh',
        background: '#0a0f1e',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        color: '#38bdf8',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <div style={{
          width: 48,
          height: 48,
          border: '3px solid rgba(56,189,248,0.2)',
          borderTop: '3px solid #38bdf8',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ fontSize: 14, opacity: 0.6 }}>Loading 3D Campus…</div>
      </div>
    }>
      <CampusMap3D />
    </Suspense>
  );
}