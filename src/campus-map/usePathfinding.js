// usePathfinding.js
import { useState, useCallback } from 'react';
import { aStar, nearestConnector } from './utils/aStar';

function findNearestNode(nodes, lat, lng) {
  if (!lat || !lng) return null;
  let nearestNode = null;
  let minDistance = Infinity;

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const dLat = node.lat - lat;
    const dLng = node.lng - lng;
    const dist = dLat * dLat + dLng * dLng;
    if (dist < minDistance) {
      minDistance = dist;
      nearestNode = node;
    }
  }

  return nearestNode;
}

export function usePathfinding(navgraph) {
  const [route, setRoute]           = useState(null);  // array of nodes
  const [routeGeoJson, setRouteGeoJson] = useState(null);
  const [accessibleOnly, setAccessibleOnly] = useState(false);

  const findRoute = useCallback((fromRoom, toRoom) => {
    if (!navgraph || !fromRoom || !toRoom) return;

    // Improved concatenation
    const allNodes = Object.values(navgraph.graphs).flatMap(g => g.nodes);
    const allEdges = Object.values(navgraph.graphs).flatMap(g => g.edges);

    const startNodeId = fromRoom.navgraph_node_id || findNearestNode(allNodes, fromRoom.entrance_lat, fromRoom.entrance_lng)?.id;
    const endNodeId = toRoom.navgraph_node_id || findNearestNode(allNodes, toRoom.entrance_lat, toRoom.entrance_lng)?.id;

    if (!startNodeId || !endNodeId) {
      console.warn("Could not find start or end navigation node.");
      return;
    }

    let path = [];

    // Check if both are standard rooms in the same building on the same floor
    const isSameBuildingFloor = fromRoom.building_id && toRoom.building_id && 
                                fromRoom.building_id === toRoom.building_id && 
                                fromRoom.floor === toRoom.floor;

    if (isSameBuildingFloor) {
      // Same floor: direct A*
      path = aStar(allNodes, allEdges, startNodeId, endNodeId, accessibleOnly);
    } else {
      // Different floor/building or contextual entity: try finding elevator/stairwell vertical chain
      const connType = accessibleOnly ? 'elevator' : 'stairwell';
      const exitConn  = nearestConnector(allNodes, startNodeId, connType);
      const entryConn = nearestConnector(allNodes, endNodeId, connType);

      if (!exitConn || !entryConn || fromRoom.is_contextual_entity || toRoom.is_contextual_entity) {
        // Fallback to outdoor/direct A* if no vertical connector path or if it's outdoor contextual
        path = aStar(allNodes, allEdges, startNodeId, endNodeId, accessibleOnly);
      } else {
        const seg1 = aStar(allNodes, allEdges, startNodeId, exitConn.id,  accessibleOnly);
        const seg2 = aStar(allNodes, allEdges, entryConn.id, endNodeId,   accessibleOnly);
        path = [...seg1, ...seg2];
      }
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
