'use strict';

require('dotenv').config();

const express      = require('express');
const cors         = require('cors');
const rateLimit    = require('express-rate-limit');
const inviteRoutes  = require('./routes/invites');
const contactRoutes = require('./routes/contact');
const shareRoutes   = require('./routes/share');
const pool         = require('./db/pool');

const app  = express();

/* ── Startup migrations ──────────────────────────────────── */
(async function migrate() {
  try {
    await pool.query(
      `ALTER TABLE invites ADD COLUMN IF NOT EXISTS referrer_name VARCHAR(60)`
    );
    console.log('✅  Migration: referrer_name column ensured');
  } catch (err) {
    console.error('⚠️   Migration warning (referrer_name):', err.message);
  }

  // Tracked one-time migrations. Each entry runs exactly once across the
  // lifetime of the database; the id is recorded in schema_migrations.
  const migrations = [
    {
      id: '2026_04_28_reset_invite_cooldown',
      sql: `UPDATE invites
            SET created_at = NOW() - INTERVAL '31 days'
            WHERE created_at > NOW() - INTERVAL '31 days'`,
    },
  ];

  try {
    await pool.query(
      `CREATE TABLE IF NOT EXISTS schema_migrations (
         id          TEXT PRIMARY KEY,
         applied_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
       )`
    );

    for (const m of migrations) {
      const inserted = await pool.query(
        `INSERT INTO schema_migrations (id) VALUES ($1)
         ON CONFLICT (id) DO NOTHING RETURNING id`,
        [m.id]
      );
      if (inserted.rowCount === 0) continue;
      const result = await pool.query(m.sql);
      console.log(`✅  Migration ${m.id} applied (${result.rowCount ?? 0} row(s))`);
    }
  } catch (err) {
    console.error('⚠️   Migration warning (tracked):', err.message);
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
app.use('/', shareRoutes);
app.use('/api/v1', inviteRoutes);
app.use('/api/v1', contactRoutes);

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
