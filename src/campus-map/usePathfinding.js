// usePathfinding.js
import { useState, useCallback } from 'react';
import { aStar, nearestConnector } from './utils/aStar';

export function usePathfinding(navgraph) {
  const [route, setRoute]           = useState(null);  // array of nodes
  const [routeGeoJson, setRouteGeoJson] = useState(null);
  const [accessibleOnly, setAccessibleOnly] = useState(false);

  const findRoute = useCallback((fromRoom, toRoom) => {
    if (!navgraph || !fromRoom || !toRoom) return;

    // let allNodes = [];
    // let allEdges = [];
    // Object.values(navgraph.graphs).forEach(g => {
    //   allNodes = [...allNodes, ...g.nodes];
    //   allEdges = [...allEdges, ...g.edges];
    // });
    
    // Improved concatenation
    const allNodes = Object.values(navgraph.graphs).flatMap(g => g.nodes);
    const allEdges = Object.values(navgraph.graphs).flatMap(g => g.edges);

    let path;

    if (fromRoom.floor === toRoom.floor && fromRoom.building_id === toRoom.building_id) {
      // Same floor: direct A*
      path = aStar(allNodes, allEdges, fromRoom.navgraph_node_id, toRoom.navgraph_node_id, accessibleOnly);
    } else {
      // Different floor: route via stairwell
      const connType = accessibleOnly ? 'elevator' : 'stairwell';
      const exitConn  = nearestConnector(allNodes, fromRoom.navgraph_node_id, connType);
      const entryConn = nearestConnector(allNodes, toRoom.navgraph_node_id, connType);
      if (!exitConn || !entryConn) { setRoute([]); return; }

      const seg1 = aStar(allNodes, allEdges, fromRoom.navgraph_node_id, exitConn.id,  accessibleOnly);
      const seg2 = aStar(allNodes, allEdges, entryConn.id, toRoom.navgraph_node_id,   accessibleOnly);
      path = [...seg1, ...seg2];
    }

    setRoute(path);

    // Build GeoJSON LineString for MapLibre rendering
    if (path && path.length > 1) {
      setRouteGeoJson({
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: path.map(n => [n.lng, n.lat]),
        }
      });
    }
  }, [navgraph, accessibleOnly]);

  const clearRoute = useCallback(() => {
    setRoute(null);
    setRouteGeoJson(null);
  }, []);

  return { route, routeGeoJson, findRoute, clearRoute, accessibleOnly, setAccessibleOnly };
}
