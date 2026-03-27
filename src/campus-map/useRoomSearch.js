// useRoomSearch.js
import { useState, useMemo, useCallback } from 'react';
import Fuse from 'fuse.js';

export function useRoomSearch(rooms) {
  const [query, setQuery]     = useState('');
  const [results, setResults] = useState([]);

  const fuse = useMemo(() => new Fuse(rooms, {
    keys: ['name', 'building_id', 'type', 'attributes', 'department', 'description'],
    threshold: 0.35,
    includeScore: true,
  }), [rooms]);

  const search = useCallback((q) => {
    const KNOWN_ATTRS = ['quiet', 'ac', 'wifi', 'projector', 'accessible', 'lab', 'tv', 'fan'];
    setQuery(q);
    if (!q.trim()) { setResults([]); return; }

    // Extract known attribute keywords from query
    const attrs = KNOWN_ATTRS.filter(a => q.toLowerCase().includes(a));

    let candidates = rooms;
    if (attrs.length > 0) {
      candidates = rooms.filter(r =>
        attrs.every(a => (r.attributes || []).includes(a))
      );
    }

    const hits = fuse.search(q, { list: candidates.length > 0 ? candidates : rooms });
    setResults(hits.slice(0, 8).map(h => h.item));
  }, [fuse, rooms]);

  return { query, results, search };
}
