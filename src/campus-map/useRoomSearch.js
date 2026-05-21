// useRoomSearch.js
import { useState, useMemo, useCallback } from 'react';
import Fuse from 'fuse.js';
import campusData from './data/campus_data.json';

export function useRoomSearch(rooms) {
  const [query, setQuery]     = useState('');
  const [results, setResults] = useState([]);

  const combinedRooms = useMemo(() => {
    const mappedEntities = (campusData.entities || []).map(ent => ({
      id: ent.id,
      building_id: ent.building_name || '',
      building_name: ent.building_name || 'Campus Outskirts',
      floor: ent.floor_number !== undefined ? ent.floor_number : 0,
      floor_label: ent.floor_number !== undefined 
        ? (ent.floor_number === 0 ? "Ground" : ent.floor_number === 1 ? "First" : ent.floor_number === 2 ? "Second" : ent.floor_number + "th") 
        : "Ground",
      name: ent.name,
      type: ent.entity_type,
      category: ent.category,
      capacity: ent.capacity || null,
      area_sqm: ent.area_sqm || null,
      attributes: ent.category ? [ent.category.toLowerCase()] : [],
      entrance_lat: ent.latitude,
      entrance_lng: ent.longitude,
      description: ent.description || `${ent.name} (${ent.category || ent.entity_type})`,
      is_contextual_entity: true,
      role_access: ent.role_access || 'all',
      allowed_roles: ent.allowed_roles || ['student', 'faculty', 'admin', 'visitor'],
      open_time: ent.open_time || null,
      close_time: ent.close_time || null
    }));
    return [...rooms, ...mappedEntities];
  }, [rooms]);

  const fuse = useMemo(() => new Fuse(combinedRooms, {
    keys: ['name', 'building_id', 'building_name', 'type', 'category', 'attributes', 'description'],
    threshold: 0.35,
    includeScore: true,
  }), [combinedRooms]);

  const search = useCallback((q) => {
    const KNOWN_ATTRS = ['quiet', 'ac', 'wifi', 'projector', 'accessible', 'lab', 'tv', 'fan', 'classroom', 'office', 'administrative', 'food', 'medical', 'restroom', 'parking'];
    setQuery(q);
    if (!q.trim()) { setResults([]); return; }

    // Extract known attribute keywords from query
    const attrs = KNOWN_ATTRS.filter(a => q.toLowerCase().includes(a));

    let candidates = combinedRooms;
    if (attrs.length > 0) {
      candidates = combinedRooms.filter(r =>
        attrs.every(a => (r.attributes || []).includes(a) || r.type === a || (r.category && r.category.toLowerCase().includes(a)))
      );
    }

    const hits = fuse.search(q, { list: candidates.length > 0 ? candidates : combinedRooms });
    setResults(hits.slice(0, 8).map(h => h.item));
  }, [fuse, combinedRooms]);

  return { query, results, search, combinedRooms };
}
