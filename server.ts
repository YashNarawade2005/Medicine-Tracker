/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import { createServer as createViteServer } from 'vite';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config({ path: '.env.local' });
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI;
let lastConnectionError: any = null;

if (!MONGODB_URI) {
  console.warn('MONGODB_URI is not defined. Features will be limited to mock data.');
} else {
  mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 5000, // Fast fail
  })
    .then(() => {
      console.log('Connected to MongoDB Atlas');
      lastConnectionError = null;
    })
    .catch(err => {
      console.error('MongoDB connection error:', err);
      lastConnectionError = err;
    });
}

// Mongoose Schemas
const MedicationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  dosage: { type: String, required: true },
  frequency: { type: String, required: true },
  nextDose: { type: String, required: true },
  status: { type: String, enum: ['active', 'paused', 'as-needed'], default: 'active' },
  adherence: { type: Number, default: 0 },
  type: { type: String, enum: ['pill', 'capsule', 'liquid', 'injection'], default: 'pill' },
  color: { type: String },
  schedule: [{
    time: { type: String, required: true },
    status: { type: String, enum: ['taken', 'missed', 'upcoming', 'due-now'], default: 'upcoming' },
    loggedTime: { type: String }
  }]
}, { timestamps: true });

// Prevent model overwrite error
const Medication: any = (mongoose.models.Medication as mongoose.Model<any>) || mongoose.model('Medication', MedicationSchema);

// In-Memory Fallback Store
let MOCK_STORE = [
  {
    _id: 'mock-1',
    name: 'Atorvastatin',
    dosage: '20mg',
    frequency: '1x Daily',
    nextDose: 'Scheduled for 08:00',
    status: 'active',
    adherence: 85,
    type: 'pill',
    color: '#005da7',
    schedule: [
      { time: '08:00', status: 'due-now' }
    ]
  },
  {
    _id: 'mock-2',
    name: 'Metformin',
    dosage: '500mg',
    frequency: '2x Daily',
    nextDose: 'Next dose 20:00',
    status: 'active',
    adherence: 66,
    type: 'capsule',
    color: '#007b5e',
    schedule: [
      { time: '08:00', status: 'taken', loggedTime: '08:05' },
      { time: '20:00', status: 'upcoming' }
    ]
  },
  {
    _id: 'mock-3',
    name: 'Lisinopril',
    dosage: '10mg',
    frequency: '1x Daily',
    nextDose: 'Scheduled for 09:00',
    status: 'active',
    adherence: 100,
    type: 'pill',
    color: '#d32f2f',
    schedule: [
      { time: '09:00', status: 'upcoming' }
    ]
  }
];

const getMode = () => mongoose.connection.readyState === 1 ? 'live' : 'local';

// API Routes
app.get('/api/medications', async (req, res) => {
  res.setHeader('X-Database-Mode', getMode());
  try {
    if (getMode() === 'live') {
      const medications = await Medication.find();
      return res.json(medications);
    }
    res.json(MOCK_STORE);
  } catch (error) {
    console.error('Fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch medications' });
  }
});

app.post('/api/medications', async (req, res) => {
  res.setHeader('X-Database-Mode', getMode());
  try {
    if (getMode() === 'live') {
      const med = new Medication(req.body);
      await med.save();
      return res.status(201).json(med);
    }
    const newMed = { ...req.body, _id: `mock-${Date.now()}` };
    MOCK_STORE.push(newMed);
    res.status(201).json(newMed);
  } catch (error) {
    res.status(400).json({ error: 'Failed to create medication' });
  }
});

app.patch('/api/medications/:id', async (req, res) => {
  res.setHeader('X-Database-Mode', getMode());
  try {
    if (getMode() === 'live') {
      const med = await Medication.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!med) return res.status(404).json({ error: 'Medication not found' });
      return res.json(med);
    }
    const idx = MOCK_STORE.findIndex(m => m._id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Medication not found' });
    MOCK_STORE[idx] = { ...MOCK_STORE[idx], ...req.body };
    res.json(MOCK_STORE[idx]);
  } catch (error) {
    res.status(400).json({ error: 'Failed to update medication' });
  }
});

app.post('/api/medications/:id/log', async (req, res) => {
  res.setHeader('X-Database-Mode', getMode());
  try {
    const { status, loggedTime, scheduleIndex } = req.body;
    
    if (getMode() === 'live') {
      const med = await Medication.findById(req.params.id);
      if (!med) return res.status(404).json({ error: 'Medication not found' });
      
      if (med.schedule[scheduleIndex]) {
        med.schedule[scheduleIndex].status = status;
        med.schedule[scheduleIndex].loggedTime = loggedTime;
      }

      const takenCount = med.schedule.filter((s: any) => s.status === 'taken').length;
      med.adherence = Math.round((takenCount / med.schedule.length) * 100);

      // Update nextDose based on the new state
      const nextUpcoming = med.schedule.find((s: any) => s.status === 'upcoming' || s.status === 'due-now');
      if (nextUpcoming) {
        med.nextDose = `Next dose ${nextUpcoming.time}`;
      } else {
        med.nextDose = 'All doses taken for today';
      }

      await med.save();
      return res.json(med);
    }

    const med = MOCK_STORE.find(m => m._id === req.params.id);
    if (!med) return res.status(404).json({ error: 'Medication not found' });

    if (med.schedule[scheduleIndex]) {
      med.schedule[scheduleIndex].status = status;
      med.schedule[scheduleIndex].loggedTime = loggedTime;
    }

    const takenCount = med.schedule.filter(s => s.status === 'taken').length;
    med.adherence = Math.round((takenCount / med.schedule.length) * 100);

    const nextUpcoming = med.schedule.find(s => s.status === 'upcoming' || s.status === 'due-now');
    if (nextUpcoming) {
      med.nextDose = `Next dose ${nextUpcoming.time}`;
    } else {
      med.nextDose = 'All doses taken for today';
    }

    res.json(med);
  } catch (error) {
    res.status(400).json({ error: 'Failed to log dose' });
  }
});

app.patch('/api/medications/:id/schedule/:index', async (req, res) => {
  res.setHeader('X-Database-Mode', getMode());
  try {
    const { time } = req.body;
    const scheduleIndex = parseInt(req.params.index);
    
    if (getMode() === 'live') {
      const med = await Medication.findById(req.params.id);
      if (!med) return res.status(404).json({ error: 'Medication not found' });
      
      if (med.schedule[scheduleIndex]) {
        med.schedule[scheduleIndex].time = time;
      }
      await med.save();
      return res.json(med);
    }

    const med = MOCK_STORE.find(m => m._id === req.params.id);
    if (!med) return res.status(404).json({ error: 'Medication not found' });

    if (med.schedule[scheduleIndex]) {
      med.schedule[scheduleIndex].time = time;
    }
    res.json(med);
  } catch (error) {
    res.status(400).json({ error: 'Failed to update dose time' });
  }
});

// Vite Middleware
if (process.env.NODE_ENV !== 'production') {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  const distPath = path.join(process.cwd(), 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://localhost:${PORT}`);
});