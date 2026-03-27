// utils/aStar.js
// A* pathfinding over the navgraph structure

export function aStar(nodes, edges, startId, endId, accessibleOnly = false) {
  const nodeMap = Object.fromEntries(nodes.map(n => [n.id, n]));

  // Build adjacency list from edges
  const adj = {};
  nodes.forEach(n => { adj[n.id] = []; });
  edges.forEach(e => {
    if (accessibleOnly && !e.accessible) return;
    if (!adj[e.from]) adj[e.from] = [];
    adj[e.from].push({ nodeId: e.to, cost: e.dist_m, type: e.type });
  });

  // Heuristic: Haversine distance in metres
  function heuristic(aId, bId) {
    const a = nodeMap[aId];
    const b = nodeMap[bId];
    if (!a || !b) return 0;
    const R = 6371000;
    const dLat = (b.lat - a.lat) * Math.PI / 180;
    const dLng = (b.lng - a.lng) * Math.PI / 180;
    const sin2 = Math.sin(dLat/2)**2 + Math.cos(a.lat*Math.PI/180) * Math.cos(b.lat*Math.PI/180) * Math.sin(dLng/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(sin2), Math.sqrt(1 - sin2));
  }

  const openSet = new Set([startId]);
  const cameFrom = {};
  const gScore = { [startId]: 0 };
  const fScore = { [startId]: heuristic(startId, endId) };

  while (openSet.size > 0) {
    // Get node with lowest fScore
    let current = [...openSet].reduce((a, b) =>
      (fScore[a] ?? Infinity) < (fScore[b] ?? Infinity) ? a : b
    );

    if (current === endId) {
      // Reconstruct path
      const path = [];
      while (current) {
        path.unshift(nodeMap[current]);
        current = cameFrom[current];
      }
      return path;
    }

    openSet.delete(current);

    for (const neighbor of (adj[current] || [])) {
      const tentativeG = (gScore[current] ?? Infinity) + neighbor.cost;
      if (tentativeG < (gScore[neighbor.nodeId] ?? Infinity)) {
        cameFrom[neighbor.nodeId] = current;
        gScore[neighbor.nodeId] = tentativeG;
        fScore[neighbor.nodeId] = tentativeG + heuristic(neighbor.nodeId, endId);
        openSet.add(neighbor.nodeId);
      }
    }
  }
  return []; // No path found
}

// For multi-floor routing: find nearest stairwell/elevator node
export function nearestConnector(nodes, fromNodeId, type = 'stairwell') {
  const from = nodes.find(n => n.id === fromNodeId);
  if (!from) return null;
  const connectors = nodes.filter(n => n.type === type);
  return connectors.reduce((nearest, node) => {
    const d = Math.hypot(node.lat - from.lat, node.lng - from.lng);
    return (!nearest || d < nearest.dist) ? { ...node, dist: d } : nearest;
  }, null);
}
