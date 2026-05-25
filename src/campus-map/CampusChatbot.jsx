// CampusChatbot.jsx - v1: Futuristic RAG Chatbot with Local Ollama Llama3.1 Support & Smart Fallback
import { useState, useEffect, useRef, useCallback } from 'react';
import { MessageSquare, Send, X, Bot, Sparkles, HelpCircle, CornerDownLeft, MapPin, Eye, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import campusData from './data/campus_data.json';
import roomsData from './data/rooms.json';

export default function CampusChatbot({ events = [], onSelectEntity, activeRole }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hello! I am **Campus Nav-AI**, your spatial intelligence assistant. 🌟\n\nAsk me anything about **live events**, **rooms**, **departments**, or **navigation** in our college. (e.g., *"Where is the Coding Hackathon?"* or *"What is happening today?"*)`,
      isSystem: true
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [ollamaStatus, setOllamaStatus] = useState('checking'); // checking, online, offline
  const [apiEndpoint, setApiEndpoint] = useState('http://localhost:11434/api/chat');
  const [showConfig, setShowConfig] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const recognitionRef = useRef(null);
  
  const chatEndRef = useRef(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput((prev) => prev + (prev ? ' ' : '') + transcript);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } else {
      console.warn("Speech Recognition API not supported in this browser.");
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const speakText = useCallback((text) => {
    if (!speechEnabled || !window.speechSynthesis) return;
    
    // Strip markdown formatting for cleaner speech
    const cleanText = text
      .replace(/\*\*(.*?)\*\*/g, '$1') // bold
      .replace(/\*(.*?)\*/g, '$1')     // italic
      .replace(/### (.*?)\n/g, '$1. ') // headers
      .replace(/`/g, '')               // code
      .replace(/📍|📅|⏰|🌐|📝|🛡️|📚|🏫|🎯|🔍/g, ''); // emojis
      
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'en-US';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  }, [speechEnabled]);

  // Stop speaking if chat is closed or unmounted
  useEffect(() => {
    if (!isOpen) {
      window.speechSynthesis?.cancel();
    }
  }, [isOpen]);

  useEffect(() => {
    return () => window.speechSynthesis?.cancel();
  }, []);

  // Auto-scroll on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  // Check if Ollama is online on load
  useEffect(() => {
    checkOllamaOnline();
  }, [apiEndpoint]);

  const checkOllamaOnline = async () => {
    try {
      setOllamaStatus('checking');
      const response = await fetch('http://localhost:11434', { 
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      if (response.ok || response.status === 200) {
        setOllamaStatus('online');
      } else {
        setOllamaStatus('offline');
      }
    } catch (e) {
      setOllamaStatus('offline');
    }
  };

  // Compile prompt context (RAG)
  const compileContext = () => {
    // 1. Format Buildings
    const bldgs = Object.values(roomsData?.rooms || []).reduce((acc, r) => {
      if (r.building_id && !acc.includes(r.building_id)) acc.push(r.building_id);
      return acc;
    }, []);

    // 2. Format Events
    const evtsStr = events.map(e => (
      `- EVENT: "${e.name}" at location "${e.location}" on floor ${e.floor_number}. Coordinates: Lat ${e.latitude.toFixed(6)}, Lng ${e.longitude.toFixed(6)}. Date: ${e.event_date}. Schedule: ${e.open_time} to ${e.close_time}. Description: ${e.description}. Roles Allowed: ${e.allowed_roles ? e.allowed_roles.join(',') : 'all'}`
    )).join('\n');

    // 3. Format Services and Landmark Entities
    const landmarksStr = (campusData?.entities || []).map(ent => (
      `- LANDMARK: "${ent.name}" (${ent.category}) located at Lat ${ent.latitude.toFixed(6)}, Lng ${ent.longitude.toFixed(6)}. Open: ${ent.open_time || '24/7'}. Description: ${ent.description || 'Campus Facility'}`
    )).join('\n');

    return `You are "Campus Nav-AI", the real-time cognitive assistant for our 3D Smart Campus platform.
Your primary role is to guide students, faculty, and visitors through our campus layout and schedules using the database provided below.

--- ACTIVE CAMPUS DATABASE ---
DYNAMIC EVENTS SCHEDULED:
${evtsStr || 'No dynamic events currently scheduled.'}

LANDMARKS & CAMPUS FACILITIES:
${landmarksStr}

BUILDINGS LIST:
${bldgs.join(', ')} (with classrooms, restrooms, and labs spread across Ground, First, and Second floors).
------------------------------

YOUR RULES:
1. Answer the user's questions truthfully and concisely using the campus database above.
2. If asked where an event or building is, name its location, floor, coordinates, and timings. Keep answers highly informative!
3. Be professional and friendly.
4. If a room or event is not found, state that it is not scheduled in our database. Do not hallucinate.
5. Remind visitors or students about role access restrictions if an event is restricted (e.g. if allowed_roles doesn't include visitor).
6. Present coordinates in standard "latitude, longitude" format.`;
  };

  // Smart client-side keyword Q&A matching (Fallback RAG)
  const handleLocalFallbackSearch = (query) => {
    const q = query.toLowerCase();
    
    // 1. Search in dynamic events
    for (const evt of events) {
      if (q.includes(evt.name.toLowerCase()) || 
          evt.name.toLowerCase().split(' ').some(w => w.length > 3 && q.includes(w)) ||
          q.includes('event') || q.includes('happen') || q.includes('schedule')) {
        
        // Return event answer
        return {
          content: `### 🎯 Event Found: ${evt.name}\n\nI found a matching event in our live database:\n\n* **📍 Location:** ${evt.location} (Floor ${evt.floor_number})\n* **📅 Date:** ${evt.event_date}\n* **⏰ Timing:** ${evt.open_time.slice(0,5)} - ${evt.close_time.slice(0,5)}\n* **🌐 Coordinates:** \`${evt.latitude.toFixed(6)}, ${evt.longitude.toFixed(6)}\`\n* **📝 Description:** ${evt.description || 'No description added.'}\n* **🛡️ Access:** Allowed for *${(evt.allowed_roles || []).join(', ').toUpperCase()}*\n\nWould you like me to pinpoint this on the 3D map for you?`,
          actionEntity: {
            id: evt.id.toString(),
            name: evt.name,
            entrance_lat: evt.latitude,
            entrance_lng: evt.longitude,
            floor: evt.floor_number || 0,
            is_contextual_entity: true,
            is_event: true,
            building_name: evt.location,
            allowed_roles: evt.allowed_roles || ['student', 'faculty', 'admin', 'visitor'],
            description: evt.description
          }
        };
      }
    }

    // 2. Search in landmarks (campus_data.json)
    for (const ent of campusData?.entities || []) {
      if (q.includes(ent.name.toLowerCase()) || q.includes(ent.category.toLowerCase())) {
        return {
          content: `### 🏫 Landmark Found: ${ent.name}\n\nHere are the details for this campus facility:\n\n* **Category:** ${ent.category}\n* **Description:** ${ent.description || 'Main campus landmark.'}\n* **Open Hours:** ${ent.open_time ? `${ent.open_time} - ${ent.close_time}` : '24/7 Available'}\n* **📍 GPS Coords:** \`${ent.latitude.toFixed(6)}, ${ent.longitude.toFixed(6)}\`\n\nClick the button below to fly your 3D view to this place!`,
          actionEntity: {
            id: ent.id,
            name: ent.name,
            entrance_lat: ent.latitude,
            entrance_lng: ent.longitude,
            floor: ent.floor_number || 0,
            is_contextual_entity: true,
            category: ent.category,
            description: ent.description || `${ent.name} (${ent.category})`
          }
        };
      }
    }

    // 3. Search in buildings
    if (q.includes('library') || q.includes('central library')) {
      return {
        content: `### 📚 YSR Central Library\n\nThe YSR Central Library is our central campus knowledge repository. It is a multi-story architectural marvel housing archives, research journals, and a digital hub. \n\n* **Floor Count:** 3 Stories\n* **📍 GPS Coords:** \`18.149725, 83.376083\`\n* **⏰ Hours:** 08:00 to 22:00\n\nYou can click below to fly to the Library on the map or click 'Launch 3D Explorer' in the side panel to explore its internal rooms!`,
        actionEntity: {
          id: 'entity-12',
          name: 'YSR Central Library',
          entrance_lat: 18.149725,
          entrance_lng: 83.376083,
          floor: 0,
          is_contextual_entity: true,
          category: 'Academic Building',
          description: 'Central Campus Library.'
        }
      };
    }

    // 4. Default helpful fallback response
    return {
      content: `I analyzed our live campus registry but couldn't find a direct match for your question. 🔍\n\nTry asking queries like:\n* *"Where is the National Coding Hackathon?"*\n* *"Tell me about the Canteen"* \n* *"Show me the YSR Library coordinates"*`
    };
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userText }]);
    setInput('');
    setLoading(true);

    // 1. Ollama LLM RAG pathway
    if (ollamaStatus === 'online') {
      try {
        const sysPrompt = compileContext();
        const response = await fetch(apiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'llama3.1:8b',
            messages: [
              { role: 'system', content: sysPrompt },
              { role: 'user', content: userText }
            ],
            stream: false
          })
        });

        if (response.ok) {
          const data = await response.json();
          const reply = data.message?.content || data.response || 'Sorry, I got an empty response from local Llama.';
          
          // Check if we can bind a map pin dynamically based on keywords in Llama reply
          let actionEntity = null;
          const combinedSearchPool = [...(campusData?.entities || []), ...events];
          for (const ent of combinedSearchPool) {
            if (reply.toLowerCase().includes(ent.name.toLowerCase())) {
              actionEntity = {
                id: ent.id.toString(),
                name: ent.name,
                entrance_lat: ent.latitude,
                entrance_lng: ent.longitude,
                floor: ent.floor_number || 0,
                is_contextual_entity: true,
                is_event: !!ent.event_date,
                building_name: ent.location || ent.building_name || '',
                allowed_roles: ent.allowed_roles || ['student', 'faculty', 'admin', 'visitor'],
                description: ent.description
              };
              break;
            }
          }

          setMessages(prev => [...prev, { role: 'assistant', content: reply, actionEntity }]);
          setLoading(false);
          speakText(reply);
          return;
        } else {
          console.warn('Ollama API error, falling back to local QA matcher.');
        }
      } catch (err) {
        console.warn('Could not contact local Ollama server, falling back to client-side QA model.', err.message);
      }
    }

    // 2. Client-side Local fallback pathway
    setTimeout(() => {
      const match = handleLocalFallbackSearch(userText);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: match.content, 
        actionEntity: match.actionEntity,
        isFallback: true 
      }]);
      setLoading(false);
      speakText(match.content);
    }, 600);
  };

  const executeActionPin = (entity) => {
    if (!entity) return;
    onSelectEntity(entity);
    // Optionally close chat on narrow screens
    if (window.innerWidth < 768) {
      setIsOpen(false);
    }
  };

  return (
    <div style={{ position: 'absolute', bottom: '24px', right: '80px', zIndex: 1000 }}>
      
      {/* AI FLOATING ORB ASSISTANT */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="ai-floating-orb"
          title="Click to talk to Campus Nav-AI Assistant"
        >
          <Bot size={26} style={{ filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.5))', zIndex: 2 }} />
          <span style={{
            position: 'absolute',
            top: '2px',
            right: '2px',
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            background: ollamaStatus === 'online' ? '#10b981' : ollamaStatus === 'checking' ? '#f59e0b' : '#f43f5e',
            border: '2px solid #0f172a',
            boxShadow: ollamaStatus === 'online' ? '0 0 8px #10b981' : 'none',
            zIndex: 3
          }} />
        </button>
      )}

      {/* CHAT WINDOW INTERFACE */}
      {isOpen && (
        <div style={{
          width: '360px',
          height: '480px',
          background: 'rgba(10, 15, 28, 0.94)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '24px',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.6), 0 0 20px rgba(2, 132, 199, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'fadeInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }} className="chatbot-window">

          <style dangerouslySetInnerHTML={{__html: `
            @keyframes fadeInUp {
              from { opacity: 0; transform: translateY(20px) scale(0.95); }
              to { opacity: 1; transform: translateY(0) scale(1); }
            }
            .chat-scroll::-webkit-scrollbar { width: 5px; }
            .chat-scroll::-webkit-scrollbar-track { background: transparent; }
            .chat-scroll::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 4px; }
            .chat-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.2); }
          `}} />

          {/* CHAT HEADER */}
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'linear-gradient(to right, rgba(2, 132, 199, 0.12), rgba(79, 70, 229, 0.04))'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'rgba(56, 189, 248, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(56, 189, 248, 0.2)'
              }}>
                <Sparkles size={18} style={{ color: '#38bdf8' }} />
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  Campus Nav-AI
                  <span style={{
                    fontSize: '9px',
                    fontWeight: 600,
                    padding: '1px 5px',
                    borderRadius: '20px',
                    background: ollamaStatus === 'online' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.06)',
                    color: ollamaStatus === 'online' ? '#34d399' : 'rgba(255,255,255,0.4)',
                    border: ollamaStatus === 'online' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(255,255,255,0.1)'
                  }}>
                    {ollamaStatus === 'online' ? 'Llama 3.1' : 'Local QA'}
                  </span>
                </div>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '1px' }}>
                  <span style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: ollamaStatus === 'online' ? '#10b981' : ollamaStatus === 'checking' ? '#f59e0b' : '#ef4444'
                  }} />
                  {ollamaStatus === 'online' ? 'Ollama Online' : ollamaStatus === 'checking' ? 'Connecting...' : 'Ollama Offline (Using Fallback)'}
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Voice toggle */}
              <button 
                onClick={() => setSpeechEnabled(!speechEnabled)}
                title={speechEnabled ? "Mute Voice Assistant" : "Enable Voice Assistant"}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: speechEnabled ? '#34d399' : 'rgba(255,255,255,0.5)',
                  cursor: 'pointer',
                  width: '28px', height: '28px',
                  borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s'
                }}
              >
                {speechEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </button>

              {/* Help/Config toggle */}
              <button 
                onClick={() => setShowConfig(!showConfig)}
                title="Connection instructions & setup"
                style={{
                  background: showConfig ? 'rgba(255,255,255,0.15)' : 'transparent',
                  border: 'none',
                  color: 'rgba(255,255,255,0.5)',
                  cursor: 'pointer',
                  width: '28px', height: '28px',
                  borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s'
                }}
              >
                <HelpCircle size={16} />
              </button>

              <button 
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'rgba(255,255,255,0.5)',
                  cursor: 'pointer',
                  width: '28px', height: '28px',
                  borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* OLLAMA SETUP & INFO CONFIG OVERLAY */}
          {showConfig && (
            <div style={{
              background: '#0c1122',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              padding: '16px',
              fontSize: '12px',
              lineHeight: 1.4,
              color: '#94a3b8',
              maxHeight: '220px',
              overflowY: 'auto'
            }} className="chat-scroll">
              <h4 style={{ margin: '0 0 8px', color: '#f1f5f9', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                🔌 Local Ollama Llama 3.1 Setup
              </h4>
              <p style={{ margin: '0 0 8px' }}>
                To connect the chatbot to your local <strong>Llama3.1:8b</strong> model, you need to enable CORS in Ollama:
              </p>
              <div style={{
                background: 'rgba(0,0,0,0.4)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px',
                padding: '8px 10px',
                fontFamily: 'monospace',
                fontSize: '11px',
                color: '#38bdf8',
                marginBottom: '8px',
                whiteSpace: 'pre-wrap'
              }}>
                {`# On Windows PowerShell:
$env:OLLAMA_ORIGINS="*"
ollama run llama3.1:8b`}
              </div>
              <p style={{ margin: '0 0 6px' }}>
                Ensure your Ollama app is running at <code>http://localhost:11434</code>. 
              </p>
              <button
                onClick={() => { checkOllamaOnline(); setShowConfig(false); }}
                style={{
                  background: 'linear-gradient(to right, #0284c7, #4f46e5)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontWeight: 600,
                  fontSize: '11px',
                  cursor: 'pointer',
                  width: '100%',
                  marginTop: '4px'
                }}
              >
                🔄 Recheck Ollama Connection
              </button>
            </div>
          )}

          {/* CHAT MESSAGES PANEL */}
          <div 
            style={{
              flex: 1,
              padding: '20px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
            className="chat-scroll"
          >
            {messages.map((msg, index) => {
              const isUser = msg.role === 'user';
              return (
                <div 
                  key={index}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isUser ? 'flex-end' : 'flex-start',
                    maxWidth: '85%',
                    alignSelf: isUser ? 'flex-end' : 'flex-start',
                    gap: '4px'
                  }}
                >
                  <div style={{
                    background: isUser ? 'rgba(2, 132, 199, 0.85)' : 'rgba(255, 255, 255, 0.05)',
                    border: isUser ? '1px solid rgba(2, 132, 199, 0.5)' : '1px solid rgba(255, 255, 255, 0.08)',
                    color: '#f8fafc',
                    borderRadius: isUser ? '18px 18px 2px 18px' : '18px 18px 18px 2px',
                    padding: '12px 14px',
                    fontSize: '13px',
                    lineHeight: 1.45,
                    whiteSpace: 'pre-wrap',
                    boxShadow: isUser ? '0 4px 12px rgba(2, 132, 199, 0.2)' : 'none'
                  }}>
                    {/* Render basic markdown/styling */}
                    {msg.content.split('\n\n').map((paragraph, pIdx) => {
                      // Handle markdown bullets
                      if (paragraph.startsWith('* ')) {
                        return (
                          <ul key={pIdx} style={{ margin: '4px 0', paddingLeft: '16px' }}>
                            {paragraph.split('\n').map((li, liIdx) => (
                              <li key={liIdx} style={{ marginBottom: '2px' }}>
                                {li.replace('* ', '').replace(/\*\*(.*?)\*\*/g, '$1')}
                              </li>
                            ))}
                          </ul>
                        );
                      }
                      
                      // Handle headers
                      if (paragraph.startsWith('### ')) {
                        return <h4 key={pIdx} style={{ margin: '0 0 6px', color: '#38bdf8', fontSize: '14px', fontWeight: 700 }}>{paragraph.replace('### ', '')}</h4>;
                      }

                      // Bold text regex replacements
                      const formatted = paragraph.replace(/\*\*(.*?)\*\*/g, '$1');
                      return <p key={pIdx} style={{ margin: '0 0 6px' }}>{formatted}</p>;
                    })}
                  </div>

                  {/* Dynamic Action Trigger Button */}
                  {msg.actionEntity && (
                    <button
                      onClick={() => executeActionPin(msg.actionEntity)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '11px',
                        fontWeight: 700,
                        color: 'white',
                        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                        border: 'none',
                        borderRadius: '12px',
                        padding: '6px 12px',
                        cursor: 'pointer',
                        marginTop: '4px',
                        boxShadow: '0 4px 10px rgba(217, 119, 6, 0.25)',
                        transition: 'all 0.15s'
                      }}
                      onMouseOver={e => e.currentTarget.style.filter = 'brightness(1.1)'}
                      onMouseOut={e => e.currentTarget.style.filter = 'none'}
                    >
                      <MapPin size={11} /> Pin on Map 🎯
                    </button>
                  )}

                  {/* Fallback label indicator */}
                  {msg.isFallback && (
                    <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.2)', marginLeft: '4px' }}>
                      🤖 AI local scanner
                    </span>
                  )}
                </div>
              );
            })}

            {loading && (
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '12px', padding: '10px 14px', width: 'fit-content' }}>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ display: 'flex', gap: '3px' }}>
                    <span className="dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#38bdf8', animation: 'bounce 1s infinite alternate' }} />
                    <span className="dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#38bdf8', animation: 'bounce 1s infinite alternate 0.2s' }} />
                    <span className="dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#38bdf8', animation: 'bounce 1s infinite alternate 0.4s' }} />
                  </span>
                  AI is reading live coordinates...
                </span>
                <style dangerouslySetInnerHTML={{__html: `
                  @keyframes bounce {
                    from { transform: translateY(0); }
                    to { transform: translateY(-5px); }
                  }
                `}} />
              </div>
            )}
            
            <div ref={chatEndRef} />
          </div>

          {/* CHAT INPUT FORM */}
          <form 
            onSubmit={handleSendMessage}
            style={{
              padding: '14px 18px',
              borderTop: '1px solid rgba(255, 255, 255, 0.06)',
              background: 'rgba(10, 15, 28, 0.96)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            <input 
              type="text" 
              placeholder={ollamaStatus === 'online' ? "Ask about events or rooms..." : "Ask me anything..."}
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={loading}
              style={{
                flex: 1,
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '10px 14px',
                color: 'white',
                outline: 'none',
                fontSize: '13px',
                fontFamily: 'inherit'
              }}
            />
            <button
              type="button"
              onClick={toggleListening}
              title={isListening ? "Stop listening" : "Start speaking"}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: isListening ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255,255,255,0.05)',
                color: isListening ? '#ef4444' : 'rgba(255,255,255,0.5)',
                border: isListening ? '1px solid rgba(239, 68, 68, 0.4)' : 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s'
              }}
            >
              {isListening ? <Mic size={15} /> : <MicOff size={15} />}
            </button>
            <button
              type="submit"
              disabled={!input.trim() || loading}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: input.trim() && !loading ? 'linear-gradient(135deg, #0284c7 0%, #4f46e5 100%)' : 'rgba(255,255,255,0.05)',
                color: input.trim() && !loading ? 'white' : 'rgba(255,255,255,0.2)',
                border: 'none',
                cursor: input.trim() && !loading ? 'pointer' : 'default',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s'
              }}
            >
              <Send size={15} />
            </button>
          </form>

        </div>
      )}

    </div>
  );
}
