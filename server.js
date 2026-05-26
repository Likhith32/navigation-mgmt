// server.js - v1: Resilient Express Backend with PostgreSQL Connection
import express from 'express';
import cors from 'cors';
import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Initialize PostgreSQL Connection Pool
const { Pool } = pg;
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'postgres',
});

// Test Connection and Setup Tables
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Error connecting to PostgreSQL database:', err.message);
    console.log('⚠️ Running in Dynamic Fallback Mode: App will serve local JSON files but database features will use localStorage.');
  } else {
    console.log('✅ Successfully connected to PostgreSQL database!');
    release();
    initializeTables();
  }
});

// Helper to load static JSON assets for fallbacks
const readStaticJson = (fileName) => {
  try {
    const filePath = path.join(__dirname, 'src', 'campus-map', 'data', fileName);
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
  } catch (error) {
    console.error(`Error reading static JSON file ${fileName}:`, error.message);
  }
  return null;
};

// ── Database Setup ──────────────────────────────────────────────────────────
async function initializeTables() {
  try {
    // 1. Create events table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS public.events (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        location VARCHAR(255) NOT NULL,
        description TEXT,
        latitude DOUBLE PRECISION NOT NULL,
        longitude DOUBLE PRECISION NOT NULL,
        floor_number INTEGER DEFAULT 0,
        open_time VARCHAR(50),
        close_time VARCHAR(50),
        event_date VARCHAR(50) NOT NULL,
        category VARCHAR(100) DEFAULT 'Event',
        allowed_roles TEXT[] DEFAULT ARRAY['student', 'faculty', 'admin', 'visitor']
      );
    `);
    console.log('🏢 PostgreSQL "events" table verified/created.');

    // 2. Check if events table is empty, if so, seed sample events
    const res = await pool.query('SELECT COUNT(*) FROM public.events');
    if (parseInt(res.rows[0].count) === 0) {
      console.log('🌱 Seeding initial sample events into PostgreSQL "events" table...');
      await pool.query(`
        INSERT INTO public.events 
        (name, location, description, latitude, longitude, floor_number, open_time, close_time, event_date, category, allowed_roles)
        VALUES 
        (
          'National Coding Hackathon 2026', 
          'YSR Central Library', 
          'The ultimate 24-hour programming challenge at the campus digital hub. Teams from all blocks compete for the grand prize.', 
          18.149725, 
          83.376083, 
          0, 
          '09:00:00', 
          '21:00:00', 
          '2026-06-15', 
          'Event', 
          ARRAY['student', 'faculty', 'admin', 'visitor']
        ),
        (
          'Tech Exhibition & Robotics Showcase', 
          'AB2 Classroom 3rd Floor', 
          'Live demonstration of innovative internet-of-things (IoT) automation nodes, drones, and smart campus sensor systems.', 
          18.151389, 
          83.373611, 
          2, 
          '10:00:00', 
          '17:00:00', 
          '2026-06-16', 
          'Event', 
          ARRAY['student', 'faculty', 'admin', 'visitor']
        ),
        (
          'Alumni Networking & Dinner', 
          'Guest House Garden', 
          'An evening of professional networking, dinner, and experience sharing with prominent alumni of the institution.', 
          18.150300, 
          83.375500, 
          0, 
          '18:00:00', 
          '22:00:00', 
          '2026-06-18', 
          'Event', 
          ARRAY['student', 'faculty', 'admin']
        )
      `);
      console.log('✅ Seeded 3 sample events into PostgreSQL.');
    }
  } catch (error) {
    console.error('❌ Error initializing database tables:', error.message);
  }
}

// ── API ENDPOINTS ───────────────────────────────────────────────────────────

// 1. Events CRUD Endpoints (PostgreSQL primary)
app.get('/api/events', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM public.events ORDER BY id ASC');
    // Map standard postgres array syntax to JS array if necessary
    const events = result.rows.map(row => ({
      ...row,
      allowed_roles: Array.isArray(row.allowed_roles) ? row.allowed_roles : ['student', 'faculty', 'admin', 'visitor']
    }));
    return res.json(events);
  } catch (error) {
    console.warn('⚠️ Fetching events from DB failed, returning empty list:', error.message);
    return res.json([]); // Client will fall back to localStorage
  }
});

app.post('/api/events', async (req, res) => {
  const { name, location, description, latitude, longitude, floor_number, open_time, close_time, event_date, category, allowed_roles } = req.body;
  try {
    const query = `
      INSERT INTO public.events 
      (name, location, description, latitude, longitude, floor_number, open_time, close_time, event_date, category, allowed_roles)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;
    const values = [
      name, 
      location, 
      description || '', 
      parseFloat(latitude), 
      parseFloat(longitude), 
      parseInt(floor_number || 0), 
      open_time || '09:00:00', 
      close_time || '17:00:00', 
      event_date, 
      category || 'Event', 
      allowed_roles || ['student', 'faculty', 'admin', 'visitor']
    ];
    const result = await pool.query(query, values);
    return res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('❌ Error creating event in DB:', error.message);
    return res.status(500).json({ error: error.message });
  }
});

app.put('/api/events/:id', async (req, res) => {
  const { id } = req.params;
  const { name, location, description, latitude, longitude, floor_number, open_time, close_time, event_date, category, allowed_roles } = req.body;
  try {
    const query = `
      UPDATE public.events 
      SET name = $1, location = $2, description = $3, latitude = $4, longitude = $5, 
          floor_number = $6, open_time = $7, close_time = $8, event_date = $9, 
          category = $10, allowed_roles = $11
      WHERE id = $12
      RETURNING *
    `;
    const values = [
      name, 
      location, 
      description, 
      parseFloat(latitude), 
      parseFloat(longitude), 
      parseInt(floor_number), 
      open_time, 
      close_time, 
      event_date, 
      category, 
      allowed_roles,
      id
    ];
    const result = await pool.query(query, values);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    return res.json(result.rows[0]);
  } catch (error) {
    console.error('❌ Error updating event in DB:', error.message);
    return res.status(500).json({ error: error.message });
  }
});

app.delete('/api/events/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM public.events WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    return res.json({ message: 'Event successfully deleted', deletedEvent: result.rows[0] });
  } catch (error) {
    console.error('❌ Error deleting event from DB:', error.message);
    return res.status(500).json({ error: error.message });
  }
});

// 2. Buildings Endpoint (Reads from PostgreSQL buildings table if present, else falls back to static buildings.json)
app.get('/api/buildings', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM public.buildings ORDER BY id ASC');
    if (result.rows.length > 0) {
      return res.json(result.rows);
    }
  } catch (error) {
    console.warn('⚠️ Fetching buildings from PostgreSQL failed. Falling back to static JSON.', error.message);
  }
  
  // Fallback to static JSON
  const staticBuildings = readStaticJson('buildings.json');
  return res.json(staticBuildings || {});
});

// 3. Rooms Endpoint (Reads from PostgreSQL public.rooms if present, else falls back to static rooms.json)
app.get('/api/rooms', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM public.rooms ORDER BY id ASC');
    if (result.rows.length > 0) {
      return res.json({ rooms: result.rows });
    }
  } catch (error) {
    console.warn('⚠️ Fetching rooms from PostgreSQL failed. Falling back to static JSON.', error.message);
  }
  
  // Fallback to static JSON
  const staticRooms = readStaticJson('rooms.json');
  return res.json(staticRooms || { rooms: [] });
});

// 4. Campus Data / Searchable Entities (Reads from public.searchable_entities if present, else falls back to static campus_data.json)
app.get('/api/campus-data', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM public.searchable_entities ORDER BY id ASC');
    if (result.rows.length > 0) {
      return res.json({ entities: result.rows });
    }
  } catch (error) {
    console.warn('⚠️ Fetching searchable entities from PostgreSQL failed. Falling back to static JSON.', error.message);
  }
  
  // Fallback to static JSON
  const staticCampusData = readStaticJson('campus_data.json');
  return res.json(staticCampusData || { entities: [] });
});

// Start Express Server
app.listen(PORT, () => {
  console.log(`🚀 Express Backend Server is running at http://localhost:${PORT}`);
  console.log(`📡 Serving API routes at http://localhost:${PORT}/api/`);
});
