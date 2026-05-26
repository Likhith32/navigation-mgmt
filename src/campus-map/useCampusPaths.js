// useCampusPaths.js — manages campus road paths rendered as native MapLibre GL layers
// This gives us proper hover/highlight effects using MapLibre's feature-state system

import { useEffect, useRef, useCallback } from 'react';
import campusPathsData from './data/campus_paths.json';

// ── Style constants (Google Maps terrain-inspired) ────────────────────────
const PATH_STYLES = {
  primary: {
    casingColor: '#ffffff',
    casingWidth: 10,
    fillColor: '#4fc3f7',      // Bright teal-blue (GMaps terrain road)
    fillWidth: 7,
    hoverColor: '#fbbf24',     // Amber highlight on hover
    hoverWidth: 8,
    clickColor: '#f59e0b',
  },
  secondary: {
    casingColor: '#ffffff',
    casingWidth: 8,
    fillColor: '#81d4fa',      // Lighter teal
    fillWidth: 5,
    hoverColor: '#fbbf24',
    hoverWidth: 6,
    clickColor: '#f59e0b',
  },
  tertiary: {
    casingColor: '#ffffff',
    casingWidth: 6,
    fillColor: '#b3e5fc',      // Very light blue
    fillWidth: 3,
    hoverColor: '#fbbf24',
    hoverWidth: 4,
    clickColor: '#f59e0b',
  },
};

const SOURCE_ID = 'campus-paths-source';
const LAYERS = {
  casing:    'campus-paths-casing',
  fill:      'campus-paths-fill',
  hover:     'campus-paths-hover',
  highlight: 'campus-paths-highlight',
  labels:    'campus-paths-labels',
};

export function useCampusPaths(mapRef, mapReady, { onPathClick, onPathHover } = {}) {
  const hoveredFeatureId = useRef(null);
  const clickedFeatureId = useRef(null);
  const listenersAttached = useRef(false);

  // ── Cleanup helper ────────────────────────────────────────────────────
  const cleanup = useCallback((map) => {
    if (!map) return;
    Object.values(LAYERS).forEach(id => {
      if (map.getLayer(id)) map.removeLayer(id);
    });
    if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);
  }, []);

  // ── Reset feature state ───────────────────────────────────────────────
  const clearHover = useCallback((map) => {
    if (hoveredFeatureId.current !== null) {
      map.setFeatureState(
        { source: SOURCE_ID, id: hoveredFeatureId.current },
        { hover: false }
      );
      hoveredFeatureId.current = null;
    }
  }, []);

  const clearClick = useCallback((map) => {
    if (clickedFeatureId.current !== null) {
      map.setFeatureState(
        { source: SOURCE_ID, id: clickedFeatureId.current },
        { clicked: false }
      );
      clickedFeatureId.current = null;
    }
  }, []);

  // ── Main effect: add source + layers when map is ready ───────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    // Wait for style to be fully loaded
    const addLayers = () => {
      // Clean up any existing layers first
      cleanup(map);

      // ── 1. Add GeoJSON source ──────────────────────────────────────
      map.addSource(SOURCE_ID, {
        type: 'geojson',
        data: campusPathsData,
        generateId: false, // We provide IDs in the GeoJSON
      });

      // ── 2. Casing layer (white border underneath) ──────────────────
      // This creates the Google Maps "road outline" effect
      map.addLayer({
        id: LAYERS.casing,
        type: 'line',
        source: SOURCE_ID,
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#ffffff',
          'line-width': [
            'interpolate', ['linear'], ['zoom'],
            14, ['match', ['get', 'type'],
              'primary', 8,
              'secondary', 6,
              'tertiary', 4,
              4
            ],
            18, ['match', ['get', 'type'],
              'primary', 14,
              'secondary', 10,
              'tertiary', 7,
              6
            ],
            20, ['match', ['get', 'type'],
              'primary', 20,
              'secondary', 14,
              'tertiary', 10,
              8
            ],
          ],
          'line-opacity': [
            'case',
            ['boolean', ['feature-state', 'hover'], false], 1.0,
            ['boolean', ['feature-state', 'clicked'], false], 1.0,
            0.85
          ],
        },
      });

      // ── 3. Main fill layer ─────────────────────────────────────────
      map.addLayer({
        id: LAYERS.fill,
        type: 'line',
        source: SOURCE_ID,
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': [
            'case',
            ['boolean', ['feature-state', 'clicked'], false],
            '#f59e0b',  // Amber when clicked
            ['boolean', ['feature-state', 'hover'], false],
            '#fbbf24',  // Yellow on hover
            // Default: type-based teal color
            ['match', ['get', 'type'],
              'primary',   '#29b6f6',
              'secondary', '#4dd0e1',
              'tertiary',  '#80deea',
              '#29b6f6'
            ]
          ],
          'line-width': [
            'interpolate', ['linear'], ['zoom'],
            14, ['match', ['get', 'type'],
              'primary', 5,
              'secondary', 3,
              'tertiary', 2,
              2
            ],
            18, ['match', ['get', 'type'],
              'primary', 9,
              'secondary', 6,
              'tertiary', 4,
              4
            ],
            20, ['match', ['get', 'type'],
              'primary', 14,
              'secondary', 9,
              'tertiary', 6,
              5
            ],
          ],
          'line-opacity': [
            'case',
            ['boolean', ['feature-state', 'hover'], false], 1.0,
            ['boolean', ['feature-state', 'clicked'], false], 1.0,
            0.88
          ],
        },
      });

      // ── 4. Glow/highlight layer (rendered on top when hovered) ─────
      // This creates the Google Maps "selected road" glow effect
      map.addLayer({
        id: LAYERS.highlight,
        type: 'line',
        source: SOURCE_ID,
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#fbbf24',
          'line-width': [
            'interpolate', ['linear'], ['zoom'],
            14, 12,
            18, 20,
            20, 28,
          ],
          'line-opacity': [
            'case',
            ['boolean', ['feature-state', 'clicked'], false], 0.35,
            ['boolean', ['feature-state', 'hover'], false], 0.22,
            0
          ],
          'line-blur': 4,
        },
      });

      // ── 5. Road name labels ────────────────────────────────────────
      map.addLayer({
        id: LAYERS.labels,
        type: 'symbol',
        source: SOURCE_ID,
        minzoom: 17,
        layout: {
          'symbol-placement': 'line',
          'symbol-spacing': 250,
          'text-field': ['get', 'name'],
          'text-font': ['Open Sans Regular'],
          'text-size': [
            'interpolate', ['linear'], ['zoom'],
            17, 9,
            19, 13,
          ],
          'text-max-angle': 30,
          'text-pitch-alignment': 'map',
          'text-rotation-alignment': 'map',
          'text-offset': [0, -0.8],
        },
        paint: {
          'text-color': '#0d47a1',
          'text-halo-color': '#ffffff',
          'text-halo-width': 2,
          'text-opacity': [
            'case',
            ['boolean', ['feature-state', 'hover'], false], 1.0,
            0.75
          ],
        },
      });

      listenersAttached.current = false;
    };

    if (map.isStyleLoaded()) {
      addLayers();
    } else {
      map.once('style.load', addLayers);
    }

    return () => {
      const m = mapRef.current;
      if (m) cleanup(m);
    };
  }, [mapRef, mapReady, cleanup]);

  // ── Event listeners effect ─────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || listenersAttached.current) return;

    // Small delay to make sure layers exist
    const timer = setTimeout(() => {
      if (!map.getLayer(LAYERS.fill)) return;

      // ── Mouse move: hover effect ─────────────────────────────────────
      const onMouseMove = (e) => {
        if (!e.features || e.features.length === 0) return;

        map.getCanvas().style.cursor = 'pointer';
        const feature = e.features[0];
        const featureId = feature.id;

        if (featureId === hoveredFeatureId.current) return;

        clearHover(map);

        hoveredFeatureId.current = featureId;
        map.setFeatureState(
          { source: SOURCE_ID, id: featureId },
          { hover: true }
        );

        onPathHover?.({
          id: featureId,
          name: feature.properties.name,
          type: feature.properties.type,
          lngLat: e.lngLat,
        });
      };

      // ── Mouse leave: clear hover ─────────────────────────────────────
      const onMouseLeave = () => {
        map.getCanvas().style.cursor = '';
        clearHover(map);
        onPathHover?.(null);
      };

      // ── Click: highlight / select ────────────────────────────────────
      const onClick = (e) => {
        if (!e.features || e.features.length === 0) return;

        const feature = e.features[0];
        const featureId = feature.id;

        // Toggle off if same feature clicked again
        if (featureId === clickedFeatureId.current) {
          clearClick(map);
          onPathClick?.(null);
          return;
        }

        clearClick(map);
        clickedFeatureId.current = featureId;
        map.setFeatureState(
          { source: SOURCE_ID, id: featureId },
          { clicked: true }
        );

        onPathClick?.({
          id: featureId,
          name: feature.properties.name,
          type: feature.properties.type,
          lngLat: e.lngLat,
        });
      };

      map.on('mousemove', LAYERS.fill, onMouseMove);
      map.on('mouseleave', LAYERS.fill, onMouseLeave);
      map.on('click', LAYERS.fill, onClick);
      listenersAttached.current = true;

      // Store cleanup refs
      map._pathListeners = { onMouseMove, onMouseLeave, onClick };
    }, 100);

    return () => {
      clearTimeout(timer);
      const m = mapRef.current;
      if (m && m._pathListeners) {
        m.off('mousemove', LAYERS.fill, m._pathListeners.onMouseMove);
        m.off('mouseleave', LAYERS.fill, m._pathListeners.onMouseLeave);
        m.off('click', LAYERS.fill, m._pathListeners.onClick);
        delete m._pathListeners;
        listenersAttached.current = false;
      }
    };
  }, [mapRef, mapReady, clearHover, clearClick, onPathClick, onPathHover]);

  // ── Public API ─────────────────────────────────────────────────────────
  const clearSelection = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    clearHover(map);
    clearClick(map);
  }, [mapRef, clearHover, clearClick]);

  const highlightPath = useCallback((featureId) => {
    const map = mapRef.current;
    if (!map) return;
    clearClick(map);
    if (featureId !== null) {
      clickedFeatureId.current = featureId;
      map.setFeatureState(
        { source: SOURCE_ID, id: featureId },
        { clicked: true }
      );
    }
  }, [mapRef, clearClick]);

  return { clearSelection, highlightPath, SOURCE_ID, LAYERS };
}