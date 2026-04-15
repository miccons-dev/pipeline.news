'use strict';

require('dotenv').config();

const express      = require('express');
const cors         = require('cors');
const rateLimit    = require('express-rate-limit');
const inviteRoutes = require('./routes/invites');
const pool         = require('./db/pool');

const app  = express();

/* ── Startup migration ───────────────────────────────────── */
(async function migrate() {
  try {
    await pool.query(
      `ALTER TABLE invites ADD COLUMN IF NOT EXISTS referrer_name VARCHAR(60)`
    );
    console.log('✅  Migration: referrer_name column ensured');
  } catch (err) {
    console.error('⚠️   Migration warning:', err.message);
  }
})();
const PORT = process.env.PORT || 3000;

/* ── Trust proxy (Render / Railway / Fly.io / Vercel) ────── */
app.set('trust proxy', 1);

/* ── CORS ────────────────────────────────────────────────── */
const ALLOWED = [
  'https://www.pipeline.news',
  'https://pipeline.news',
  ...(process.env.NODE_ENV !== 'production'
    ? ['http://localhost:3000', 'http://127.0.0.1:5500', 'http://localhost:5500']
    : []),
];
app.use(cors({
  origin: (origin, cb) =>
    (!origin || ALLOWED.includes(origin)) ? cb(null, true) : cb(new Error('CORS')),
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
}));

/* ── Body parsing ────────────────────────────────────────── */
app.use(express.json({ limit: '16kb' }));

/* ── Global rate limit (per IP) ─────────────────────────── */
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 minutes
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Troppe richieste. Riprova tra 15 minuti.' },
}));

/* ── Routes ──────────────────────────────────────────────── */
app.use('/api/v1', inviteRoutes);

/* ── Health check ────────────────────────────────────────── */
app.get('/health', (_, res) => res.json({ ok: true, ts: new Date().toISOString() }));

/* ── 404 ─────────────────────────────────────────────────── */
app.use((_, res) => res.status(404).json({ error: 'Not found' }));

/* ── Error handler ───────────────────────────────────────── */
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () =>
  console.log(`✅  Pipeline API running on http://localhost:${PORT}`)
);
