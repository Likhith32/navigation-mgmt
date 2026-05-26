// AdminPage.jsx - v1: Premium Cyber Admin Dashboard with Dynamic Sync
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Plus, Trash2, Edit2, MapPin, Calendar, Clock, 
  Shield, Check, AlertTriangle, RefreshCw, Layers, ExternalLink 
} from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

export default function AdminPage() {
  const navigate = useNavigate();
  
  // Events state
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dbActive, setDbActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Form states
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [eventName, setEventName] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventLatitude, setEventLatitude] = useState('18.150300');
  const [eventLongitude, setEventLongitude] = useState('83.375500');
  const [eventFloor, setEventFloor] = useState('0');
  const [eventDate, setEventDate] = useState('2026-06-15');
  const [eventOpenTime, setEventOpenTime] = useState('09:00:00');
  const [eventCloseTime, setEventCloseTime] = useState('17:00:00');
  const [allowedRoles, setAllowedRoles] = useState(['student', 'faculty', 'admin', 'visitor']);

  // Load events on mount
  useEffect(() => {
    fetchEvents();
  }, []);

  const showSuccess = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  const showError = (msg) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(''), 5000);
  };

  // Fetch events from PostgreSQL (Express API) with localStorage fallback
  const fetchEvents = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/events`);
      if (response.ok) {
        const data = await response.json();
        setEvents(data);
        setDbActive(true);
      } else {
        throw new Error('API server returned error code');
      }
    } catch (error) {
      console.warn('⚠️ Server offline or credentials error. Falling back to local storage.');
      setDbActive(false);
      
      // LocalStorage fallback
      const localEventsStr = localStorage.getItem('college_events');
      if (localEventsStr) {
        setEvents(JSON.parse(localEventsStr));
      } else {
        // Seed default events in localStorage if empty
        const defaultEvents = [
          {
            id: 'event-local-1',
            name: 'National Coding Hackathon 2026',
            location: 'YSR Central Library',
            description: 'The ultimate 24-hour programming challenge at the campus digital hub. Teams from all blocks compete for the grand prize.',
            latitude: 18.149725,
            longitude: 83.376083,
            floor_number: 0,
            open_time: '09:00:00',
            close_time: '21:00:00',
            event_date: '2026-06-15',
            category: 'Event',
            allowed_roles: ['student', 'faculty', 'admin', 'visitor']
          },
          {
            id: 'event-local-2',
            name: 'Tech Exhibition & Robotics Showcase',
            location: 'AB2 Classroom 3rd Floor',
            description: 'Live demonstration of innovative internet-of-things (IoT) automation nodes, drones, and smart campus sensor systems.',
            latitude: 18.151389,
            longitude: 83.373611,
            floor_number: 2,
            open_time: '10:00:00',
            close_time: '17:00:00',
            event_date: '2026-06-16',
            category: 'Event',
            allowed_roles: ['student', 'faculty', 'admin', 'visitor']
          },
          {
            id: 'event-local-3',
            name: 'Alumni Networking & Dinner',
            location: 'Guest House Garden',
            description: 'An evening of professional networking, dinner, and experience sharing with prominent alumni of the institution.',
            latitude: 18.150300,
            longitude: 83.375500,
            floor_number: 0,
            open_time: '18:00:00',
            close_time: '22:00:00',
            event_date: '2026-06-18',
            category: 'Event',
            allowed_roles: ['student', 'faculty', 'admin']
          }
        ];
        localStorage.setItem('college_events', JSON.stringify(defaultEvents));
        setEvents(defaultEvents);
      }
    } finally {
      setLoading(false);
    }
  };

  // Add or Edit Event
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!eventName.trim() || !eventLocation.trim() || !eventDate || !eventLatitude || !eventLongitude) {
      showError('Please fill out all required fields.');
      return;
    }

    const eventPayload = {
      name: eventName,
      location: eventLocation,
      description: eventDescription,
      latitude: parseFloat(eventLatitude),
      longitude: parseFloat(eventLongitude),
      floor_number: parseInt(eventFloor),
      open_time: eventOpenTime,
      close_time: eventCloseTime,
      event_date: eventDate,
      category: 'Event',
      allowed_roles: allowedRoles
    };

    if (dbActive) {
      // API Database Mode
      try {
        let response;
        if (isEditing) {
          response = await fetch(`${API_BASE}/events/${editId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(eventPayload)
          });
        } else {
          response = await fetch(`${API_BASE}/events`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(eventPayload)
          });
        }

        if (response.ok) {
          showSuccess(isEditing ? 'Event updated successfully in PostgreSQL!' : 'Event created successfully in PostgreSQL!');
          resetForm();
          fetchEvents();
        } else {
          const errData = await response.json();
          throw new Error(errData.error || 'Failed to sync with PostgreSQL database');
        }
      } catch (error) {
        showError(`PostgreSQL Sync Error: ${error.message}`);
      }
    } else {
      // LocalStorage Mode
      let updatedEvents = [...events];
      if (isEditing) {
        updatedEvents = updatedEvents.map(evt => 
          evt.id === editId ? { ...evt, ...eventPayload } : evt
        );
        showSuccess('Event updated in Local Browser Storage!');
      } else {
        const newEvent = {
          id: `event-local-${Date.now()}`,
          ...eventPayload
        };
        updatedEvents.push(newEvent);
        showSuccess('Event saved in Local Browser Storage!');
      }
      
      localStorage.setItem('college_events', JSON.stringify(updatedEvents));
      setEvents(updatedEvents);
      resetForm();
    }
  };

  // Populate form for editing
  const handleEditStart = (evt) => {
    setIsEditing(true);
    setEditId(evt.id);
    setEventName(evt.name);
    setEventLocation(evt.location);
    setEventDescription(evt.description || '');
    setEventLatitude(evt.latitude.toString());
    setEventLongitude(evt.longitude.toString());
    setEventFloor((evt.floor_number || 0).toString());
    setEventDate(evt.event_date || '2026-06-15');
    setEventOpenTime(evt.open_time || '09:00:00');
    setEventCloseTime(evt.close_time || '17:00:00');
    setAllowedRoles(evt.allowed_roles || ['student', 'faculty', 'admin', 'visitor']);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Delete event
  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    if (dbActive) {
      try {
        const response = await fetch(`${API_BASE}/events/${id}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          showSuccess('Event deleted successfully from PostgreSQL!');
          fetchEvents();
        } else {
          throw new Error('Failed to delete event from database');
        }
      } catch (error) {
        showError(`PostgreSQL Error: ${error.message}`);
      }
    } else {
      const updatedEvents = events.filter(evt => evt.id !== id);
      localStorage.setItem('college_events', JSON.stringify(updatedEvents));
      setEvents(updatedEvents);
      showSuccess('Event removed from Local Browser Storage!');
    }
  };

  const resetForm = () => {
    setIsEditing(false);
    setEditId(null);
    setEventName('');
    setEventLocation('');
    setEventDescription('');
    setEventLatitude('18.150300');
    setEventLongitude('83.375500');
    setEventFloor('0');
    setEventDate('2026-06-15');
    setEventOpenTime('09:00:00');
    setEventCloseTime('17:00:00');
    setAllowedRoles(['student', 'faculty', 'admin', 'visitor']);
  };

  const handleRoleToggle = (role) => {
    if (allowedRoles.includes(role)) {
      setAllowedRoles(allowedRoles.filter(r => r !== role));
    } else {
      setAllowedRoles([...allowedRoles, role]);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at top, #0f172a 0%, #020617 100%)',
      color: '#f8fafc',
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
      padding: '24px 16px',
      boxSizing: 'border-box'
    }}>
      
      {/* HEADER SECTION */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '20px',
        padding: '16px 24px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button 
            onClick={() => navigate('/map')}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              color: '#38bdf8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
            onMouseOver={e => e.currentTarget.style.background = 'rgba(56, 189, 248, 0.15)'}
            onMouseOut={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700, letterSpacing: '-0.02em', background: 'linear-gradient(to right, #38bdf8, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Campus Event Manager
            </h1>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#94a3b8' }}>Admin Control Center & Spatial Synchronization</p>
          </div>
        </div>

        {/* CONNECTION STATUS BADGE */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: dbActive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
          border: `1px solid ${dbActive ? 'rgba(16, 185, 129, 0.25)' : 'rgba(245, 158, 11, 0.25)'}`,
          borderRadius: '12px',
          padding: '8px 14px',
          fontSize: '12px',
          fontWeight: 600,
          color: dbActive ? '#34d399' : '#fbbf24',
          cursor: 'pointer'
        }}
        onClick={fetchEvents}
        title="Click to check connection and reload"
        >
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: dbActive ? '#10b981' : '#f59e0b',
            display: 'inline-block',
            boxShadow: dbActive ? '0 0 10px #10b981' : '0 0 10px #f59e0b'
          }} />
          {dbActive ? 'PostgreSQL Active' : 'LocalStorage Mode'}
          <RefreshCw size={12} style={{ marginLeft: '4px', opacity: 0.7 }} />
        </div>
      </div>

      {/* NOTIFICATIONS CONTAINER */}
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {successMessage && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            borderRadius: '12px',
            padding: '12px 18px',
            marginBottom: '20px',
            fontSize: '14px',
            color: '#34d399',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            animation: 'fadeIn 0.3s'
          }}>
            <Check size={18} />
            {successMessage}
          </div>
        )}
        
        {errorMessage && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: '12px',
            padding: '12px 18px',
            marginBottom: '20px',
            fontSize: '14px',
            color: '#f87171',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            animation: 'fadeIn 0.3s'
          }}>
            <AlertTriangle size={18} />
            {errorMessage}
          </div>
        )}
      </div>

      {/* MAIN TWO-COLUMN DASHBOARD */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '24px',
      }} className="dashboard-grid">
        
        {/* MEDIA QUERY FOR TWO COLUMNS ON DESKTOP */}
        <style dangerouslySetInnerHTML={{__html: `
          @media (min-width: 900px) {
            .dashboard-grid {
              grid-template-columns: 420px 1fr !important;
            }
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-5px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}} />

        {/* COLUMN 1: EVENT CREATE/EDIT FORM */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.35)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '24px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          height: 'fit-content'
        }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', color: '#f1f5f9' }}>
            <Plus size={18} style={{ color: '#38bdf8' }} />
            {isEditing ? 'Edit Campus Event' : 'Schedule New Event'}
          </h2>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            
            {/* Input field: Event name */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>Event Title *</label>
              <input 
                type="text" 
                placeholder="e.g. Annual Sci-Tech Summit"
                value={eventName}
                onChange={e => setEventName(e.target.value)}
                required
                style={{
                  background: 'rgba(15, 23, 42, 0.65)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  color: 'white',
                  outline: 'none',
                  fontSize: '14px',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            {/* Input field: Event location */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>Location / Room Name *</label>
              <input 
                type="text" 
                placeholder="e.g. Library Seminar Room 102"
                value={eventLocation}
                onChange={e => setEventLocation(e.target.value)}
                required
                style={{
                  background: 'rgba(15, 23, 42, 0.65)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  color: 'white',
                  outline: 'none',
                  fontSize: '14px',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            {/* Input field: Description */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>Description</label>
              <textarea 
                rows={3}
                placeholder="Write a brief overview of the event, itinerary, or speakers..."
                value={eventDescription}
                onChange={e => setEventDescription(e.target.value)}
                style={{
                  background: 'rgba(15, 23, 42, 0.65)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  color: 'white',
                  outline: 'none',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  resize: 'none'
                }}
              />
            </div>

            {/* Double grid: Coordinates selector */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>Latitude *</label>
                <input 
                  type="number" 
                  step="0.000001"
                  value={eventLatitude}
                  onChange={e => setEventLatitude(e.target.value)}
                  required
                  style={{
                    background: 'rgba(15, 23, 42, 0.65)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '10px',
                    padding: '10px 14px',
                    color: 'white',
                    outline: 'none',
                    fontSize: '13px',
                    fontFamily: 'monospace'
                  }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>Longitude *</label>
                <input 
                  type="number" 
                  step="0.000001"
                  value={eventLongitude}
                  onChange={e => setEventLongitude(e.target.value)}
                  required
                  style={{
                    background: 'rgba(15, 23, 42, 0.65)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '10px',
                    padding: '10px 14px',
                    color: 'white',
                    outline: 'none',
                    fontSize: '13px',
                    fontFamily: 'monospace'
                  }}
                />
              </div>
            </div>

            {/* Quick Helper Banner */}
            <div style={{
              background: 'rgba(56, 189, 248, 0.05)',
              border: '1px solid rgba(56, 189, 248, 0.15)',
              borderRadius: '10px',
              padding: '10px 12px',
              fontSize: '11px',
              color: '#38bdf8',
              lineHeight: 1.4
            }}>
              💡 <strong>GPS Coordinate Pro-Tip:</strong> Go to the <a href="/map" target="_blank" style={{ color: '#60a5fa', fontWeight: 'bold' }}>Interactive Map <ExternalLink size={10} style={{ display:'inline' }} /></a>, right-click anywhere, copy the coordinates from the popup, and paste them here!
            </div>

            {/* Grid for: Floor & Date */}
            <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '10px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>Floor No.</label>
                <select 
                  value={eventFloor}
                  onChange={e => setEventFloor(e.target.value)}
                  style={{
                    background: 'rgba(15, 23, 42, 0.65)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '10px',
                    padding: '10px 14px',
                    color: 'white',
                    outline: 'none',
                    fontSize: '13px',
                    fontFamily: 'inherit',
                    cursor: 'pointer'
                  }}
                >
                  <option value="0" style={{ background: '#0a0f1d' }}>G (Ground)</option>
                  <option value="1" style={{ background: '#0a0f1d' }}>1st Floor</option>
                  <option value="2" style={{ background: '#0a0f1d' }}>2nd Floor</option>
                  <option value="3" style={{ background: '#0a0f1d' }}>3rd Floor</option>
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>Date *</label>
                <input 
                  type="date" 
                  value={eventDate}
                  onChange={e => setEventDate(e.target.value)}
                  required
                  style={{
                    background: 'rgba(15, 23, 42, 0.65)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '10px',
                    padding: '9px 14px',
                    color: 'white',
                    outline: 'none',
                    fontSize: '13px',
                    fontFamily: 'inherit'
                  }}
                />
              </div>
            </div>

            {/* Grid for: Timings */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>Start Time</label>
                <input 
                  type="time" 
                  value={eventOpenTime}
                  onChange={e => setEventOpenTime(e.target.value)}
                  style={{
                    background: 'rgba(15, 23, 42, 0.65)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '10px',
                    padding: '9px 14px',
                    color: 'white',
                    outline: 'none',
                    fontSize: '13px',
                    fontFamily: 'inherit'
                  }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>End Time</label>
                <input 
                  type="time" 
                  value={eventCloseTime}
                  onChange={e => setEventCloseTime(e.target.value)}
                  style={{
                    background: 'rgba(15, 23, 42, 0.65)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '10px',
                    padding: '9px 14px',
                    color: 'white',
                    outline: 'none',
                    fontSize: '13px',
                    fontFamily: 'inherit'
                  }}
                />
              </div>
            </div>

            {/* Role-based Access Control */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
              <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Shield size={13} style={{ color: '#a78bfa' }} />
                Allowed Roles Access (RBAC)
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {['student', 'faculty', 'admin', 'visitor'].map(role => {
                  const isChecked = allowedRoles.includes(role);
                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => handleRoleToggle(role)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '20px',
                        fontSize: '11px',
                        fontWeight: 600,
                        textTransform: 'capitalize',
                        border: isChecked ? '1px solid #c084fc' : '1px solid rgba(255,255,255,0.08)',
                        background: isChecked ? 'rgba(192, 132, 252, 0.15)' : 'rgba(255,255,255,0.03)',
                        color: isChecked ? '#e9d5ff' : '#94a3b8',
                        cursor: 'pointer',
                        transition: 'all 0.15s'
                      }}
                    >
                      {role}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Actions button */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button
                type="submit"
                style={{
                  flex: 1,
                  background: 'linear-gradient(135deg, #0284c7 0%, #4f46e5 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '12px',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)',
                  transition: 'all 0.2s'
                }}
                onMouseOver={e => e.currentTarget.style.filter = 'brightness(1.15)'}
                onMouseOut={e => e.currentTarget.style.filter = 'none'}
              >
                {isEditing ? 'Update Event Details' : 'Deploy Event to Campus'}
              </button>
              
              {isEditing && (
                <button
                  type="button"
                  onClick={resetForm}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#e2e8f0',
                    borderRadius: '10px',
                    padding: '12px 16px',
                    fontWeight: 600,
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              )}
            </div>

          </form>
        </div>

        {/* COLUMN 2: ACTIVE EVENTS GRID */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.25)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: '24px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={18} style={{ color: '#818cf8' }} />
              Active Campus Events ({events.length})
            </h2>
            <span style={{ fontSize: '12px', color: '#64748b' }}>
              {dbActive ? 'Synced with DB' : 'Saved locally'}
            </span>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center', padding: '60px 0' }}>
              <div style={{
                width: '32px',
                height: '32px',
                border: '3px solid rgba(255,255,255,0.05)',
                borderTopColor: '#38bdf8',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
              <span style={{ fontSize: '13px', color: '#64748b' }}>Loading spatial events...</span>
              <style dangerouslySetInnerHTML={{__html: `@keyframes spin { to { transform: rotate(360deg); } }`}} />
            </div>
          ) : events.length === 0 ? (
            <div style={{
              border: '1px dashed rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '40px 20px',
              textAlign: 'center',
              color: '#64748b'
            }}>
              <MapPin size={36} style={{ marginBottom: '12px', opacity: 0.3 }} />
              <p style={{ margin: 0, fontSize: '14px', fontWeight: 500 }}>No scheduled events found.</p>
              <p style={{ margin: '4px 0 0', fontSize: '12px' }}>Use the form on the left to schedule the first event.</p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '16px',
              maxHeight: '75vh',
              overflowY: 'auto',
              paddingRight: '4px'
            }}>
              {events.map(evt => (
                <div 
                  key={evt.id}
                  style={{
                    background: 'rgba(15, 23, 42, 0.45)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '16px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '12px',
                    transition: 'all 0.25s',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onMouseOver={e => {
                    e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.25)';
                    e.currentTarget.style.background = 'rgba(15, 23, 42, 0.6)';
                  }}
                  onMouseOut={e => {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
                    e.currentTarget.style.background = 'rgba(15, 23, 42, 0.45)';
                  }}
                >
                  {/* Card top-colored accent line */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '3px',
                    background: 'linear-gradient(to right, #38bdf8, #818cf8)'
                  }} />

                  <div>
                    {/* Event name & view link */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                      <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#f1f5f9', lineHeight: 1.3 }}>
                        {evt.name}
                      </h3>
                      <button 
                        onClick={() => navigate(`/map?select=${evt.id}`)}
                        title="Locate event on 3D map"
                        style={{
                          background: 'rgba(56, 189, 248, 0.1)',
                          border: 'none',
                          color: '#38bdf8',
                          borderRadius: '8px',
                          padding: '4px 8px',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        Map <ExternalLink size={10} />
                      </button>
                    </div>

                    <p style={{ margin: '8px 0 12px', fontSize: '12px', color: '#94a3b8', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {evt.description || 'No description provided.'}
                    </p>

                    {/* Metadata chips */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {/* Location details */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#cbd5e1' }}>
                        <MapPin size={13} style={{ color: '#38bdf8', flexShrink: 0 }} />
                        <span>{evt.location} <span style={{ opacity: 0.5 }}>· Floor {evt.floor_number}</span></span>
                      </div>

                      {/* Date details */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#cbd5e1' }}>
                        <Calendar size={13} style={{ color: '#818cf8', flexShrink: 0 }} />
                        <span>{evt.event_date}</span>
                      </div>

                      {/* Timings */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#cbd5e1' }}>
                        <Clock size={13} style={{ color: '#a78bfa', flexShrink: 0 }} />
                        <span>{evt.open_time.slice(0,5)} - {evt.close_time.slice(0,5)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Divider line */}
                  <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '4px 0' }} />

                  {/* Actions row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    
                    {/* GPS Coordinates readout */}
                    <div style={{ fontFamily: 'monospace', fontSize: '10px', color: '#64748b' }}>
                      📍 {evt.latitude.toFixed(5)}N, {evt.longitude.toFixed(5)}E
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      {/* Edit button */}
                      <button
                        onClick={() => handleEditStart(evt)}
                        style={{
                          background: 'rgba(255, 255, 255, 0.04)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          color: '#e2e8f0',
                          borderRadius: '8px',
                          width: '32px',
                          height: '32px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.15s'
                        }}
                        onMouseOver={e => {
                          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                          e.currentTarget.style.color = '#38bdf8';
                        }}
                        onMouseOut={e => {
                          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                          e.currentTarget.style.color = '#e2e8f0';
                        }}
                        title="Edit event"
                      >
                        <Edit2 size={13} />
                      </button>

                      {/* Delete button */}
                      <button
                        onClick={() => handleDelete(evt.id)}
                        style={{
                          background: 'rgba(239, 68, 68, 0.05)',
                          border: '1px solid rgba(239, 68, 68, 0.15)',
                          color: '#f87171',
                          borderRadius: '8px',
                          width: '32px',
                          height: '32px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.15s'
                        }}
                        onMouseOver={e => {
                          e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
                          e.currentTarget.style.color = '#ef4444';
                        }}
                        onMouseOut={e => {
                          e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)';
                          e.currentTarget.style.color = '#f87171';
                        }}
                        title="Delete event"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
