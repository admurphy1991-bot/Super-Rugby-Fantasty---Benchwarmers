require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { Pool } = require('pg');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// ─── DB init ────────────────────────────────────────────────────────────────

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS teams (
      manager_id TEXT PRIMARY KEY,
      picks JSONB NOT NULL DEFAULT '{}'
    );
    CREATE TABLE IF NOT EXISTS scores (
      player_id TEXT PRIMARY KEY,
      points NUMERIC NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS meta (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);
  console.log('DB ready');
}

// ─── Players (source of truth lives in backend too) ──────────────────────────

const PLAYERS = [
  { id: 'p1',  name: 'Brodie McAlister',      team: 'Chiefs',     pos: 'HOK' },
  { id: 'p2',  name: 'Benét Kumeroa',          team: 'Chiefs',     pos: 'PR'  },
  { id: 'p3',  name: 'George Dyer',            team: 'Chiefs',     pos: 'PR'  },
  { id: 'p4',  name: 'Fiti Sa',                team: 'Chiefs',     pos: 'LF'  },
  { id: 'p5',  name: 'Samipeni Finau',         team: 'Chiefs',     pos: 'LF'  },
  { id: 'p6',  name: 'Cortez Ratima',          team: 'Chiefs',     pos: 'HB'  },
  { id: 'p7',  name: 'Daniel Rona',            team: 'Chiefs',     pos: 'UB'  },
  { id: 'p8',  name: 'Isaac Hutchinson',       team: 'Chiefs',     pos: 'UB'  },
  { id: 'p9',  name: 'Henry Bell',             team: 'Highlanders',pos: 'HOK' },
  { id: 'p10', name: 'Daniel Lienert-Brown',   team: 'Highlanders',pos: 'PR'  },
  { id: 'p11', name: "Saula Ma'u",             team: 'Highlanders',pos: 'PR'  },
  { id: 'p12', name: 'Oliver Haig',            team: 'Highlanders',pos: 'LF'  },
  { id: 'p13', name: 'Sean Withy',             team: 'Highlanders',pos: 'LF'  },
  { id: 'p14', name: 'Veveni Lasaqa',          team: 'Highlanders',pos: 'HB'  },
  { id: 'p15', name: 'Folau Fakatava',         team: 'Highlanders',pos: 'UB'  },
  { id: 'p16', name: 'Taine Robinson',         team: 'Highlanders',pos: 'UB'  },
  { id: 'p17', name: 'Kavaia Tagivetaua',      team: 'Drua',       pos: 'HOK' },
  { id: 'p18', name: 'Emosi Tuqiri',           team: 'Drua',       pos: 'PR'  },
  { id: 'p19', name: 'Samuela Tawake',         team: 'Drua',       pos: 'PR'  },
  { id: 'p20', name: 'Mesake Vocevoce',        team: 'Drua',       pos: 'LF'  },
  { id: 'p21', name: 'Vilive Miramira',        team: 'Drua',       pos: 'LF'  },
  { id: 'p22', name: 'Isoa Tuwai',             team: 'Drua',       pos: 'HB'  },
  { id: 'p23', name: 'Philip Baselala',        team: 'Drua',       pos: 'UB'  },
  { id: 'p24', name: 'Kemu Valetini',          team: 'Drua',       pos: 'UB'  },
  { id: 'p25', name: 'Oniti Finau',            team: 'Waratahs',   pos: 'HOK' },
  { id: 'p26', name: 'Isaac Kailea',           team: 'Waratahs',   pos: 'PR'  },
  { id: 'p27', name: 'Apolosi Ranawai',        team: 'Waratahs',   pos: 'PR'  },
  { id: 'p28', name: 'Ben Grant',              team: 'Waratahs',   pos: 'LF'  },
  { id: 'p29', name: 'Jamie Adamson',          team: 'Waratahs',   pos: 'LF'  },
  { id: 'p30', name: 'Michael McDonald',       team: 'Waratahs',   pos: 'HB'  },
  { id: 'p31', name: 'Jack Debreczeni',        team: 'Waratahs',   pos: 'UB'  },
  { id: 'p32', name: 'Sid Harvey',             team: 'Waratahs',   pos: 'UB'  },
  { id: 'p33', name: 'Kurt Eklund',            team: 'Blues',      pos: 'HOK' },
  { id: 'p34', name: 'Mason Tupaea',           team: 'Blues',      pos: 'PR'  },
  { id: 'p35', name: 'Flyn Yates',             team: 'Blues',      pos: 'PR'  },
  { id: 'p36', name: 'Laghlan McWhannell',     team: 'Blues',      pos: 'LF'  },
  { id: 'p37', name: 'Torian Barnes',          team: 'Blues',      pos: 'LF'  },
  { id: 'p38', name: 'Che Clark',              team: 'Blues',      pos: 'HB'  },
  { id: 'p39', name: 'Finlay Christie',        team: 'Blues',      pos: 'UB'  },
  { id: 'p40', name: 'Stephen Perofeta',       team: 'Blues',      pos: 'UB'  },
  { id: 'p41', name: 'Raymond Tuputupu',       team: 'Hurricanes', pos: 'HOK' },
  { id: 'p42', name: 'Pouri Rakete-Stones',    team: 'Hurricanes', pos: 'PR'  },
  { id: 'p43', name: 'Siale Lauaki',           team: 'Hurricanes', pos: 'PR'  },
  { id: 'p44', name: 'Isaia Walker-Leawere',   team: 'Hurricanes', pos: 'LF'  },
  { id: 'p45', name: 'Brayden Iose',           team: 'Hurricanes', pos: 'LF'  },
  { id: 'p46', name: 'Jordi Viljoen',          team: 'Hurricanes', pos: 'HB'  },
  { id: 'p47', name: 'Jone Rova',              team: 'Hurricanes', pos: 'UB'  },
  { id: 'p48', name: 'Bailyn Sullivan',        team: 'Hurricanes', pos: 'UB'  },
  { id: 'p49', name: 'Nic Dolly',              team: 'Force',      pos: 'HOK' },
  { id: 'p50', name: 'Marley Pearce',          team: 'Force',      pos: 'PR'  },
  { id: 'p51', name: "Sef Fa'agase",           team: 'Force',      pos: 'PR'  },
  { id: 'p52', name: 'Franco Molina',          team: 'Force',      pos: 'LF'  },
  { id: 'p53', name: 'Will Harris',            team: 'Force',      pos: 'LF'  },
  { id: 'p54', name: 'Agustin Moyano',         team: 'Force',      pos: 'HB'  },
  { id: 'p55', name: 'Bayley Kuenzle',         team: 'Force',      pos: 'UB'  },
  { id: 'p56', name: 'Kurtley Beale',          team: 'Force',      pos: 'UB'  },
  { id: 'p57', name: 'Matt Faessler',          team: 'Reds',       pos: 'HOK' },
  { id: 'p58', name: 'Jeffery Toomaga-Allen',  team: 'Reds',       pos: 'PR'  },
  { id: 'p59', name: 'Zane Nonggorr',          team: 'Reds',       pos: 'PR'  },
  { id: 'p60', name: 'Charlie Brosnan',        team: 'Reds',       pos: 'LF'  },
  { id: 'p61', name: 'Vaiuta Latu',            team: 'Reds',       pos: 'LF'  },
  { id: 'p62', name: 'Kalani Thomas',          team: 'Reds',       pos: 'HB'  },
  { id: 'p63', name: 'Ben Volavola',           team: 'Reds',       pos: 'UB'  },
  { id: 'p64', name: 'Treyvon Pritchard',      team: 'Reds',       pos: 'UB'  }
];

const MANAGERS = [
  { id: 'chautauqua',  name: 'Chautauqua',   first: 'Anthony' },
  { id: 'davec',       name: 'Dave C',        first: 'David'   },
  { id: 'jaimelee',    name: 'Jaime Lee',     first: 'Jaime'   },
  { id: 'martinkinney',name: 'Martin Kinney', first: 'Martin'  },
  { id: 'johnmurphy',  name: 'John Murphy',   first: 'John'    },
  { id: 'martylee',    name: 'Marty Lee',     first: 'Marty'   }
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function calcManagerTotal(picks, scoreMap) {
  return Object.values(picks).reduce((acc, pid) => {
    if (!pid) return acc;
    const player = PLAYERS.find(p => p.id === pid);
    const pts = parseFloat(scoreMap[pid] || 0);
    return acc + (player?.pos === 'PR' ? pts * 2 : pts);
  }, 0);
}

// ─── Routes ──────────────────────────────────────────────────────────────────

// GET /api/state — everything the frontend needs in one call
app.get('/api/state', async (req, res) => {
  try {
    const [teamsRes, scoresRes, metaRes] = await Promise.all([
      pool.query('SELECT manager_id, picks FROM teams'),
      pool.query('SELECT player_id, points FROM scores'),
      pool.query("SELECT value FROM meta WHERE key = 'last_updated'")
    ]);

    const teams = {};
    teamsRes.rows.forEach(r => { teams[r.manager_id] = r.picks; });

    const scoreMap = {};
    scoresRes.rows.forEach(r => { scoreMap[r.player_id] = parseFloat(r.points); });

    const leaderboard = MANAGERS.map(m => ({
      ...m,
      picks: teams[m.id] || {},
      total: calcManagerTotal(teams[m.id] || {}, scoreMap)
    })).sort((a, b) => b.total - a.total);

    res.json({
      players: PLAYERS,
      managers: MANAGERS,
      teams,
      scoreMap,
      leaderboard,
      lastUpdated: metaRes.rows[0]?.value || null
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/team — save a manager's picks
app.post('/api/team', async (req, res) => {
  const { managerId, picks } = req.body;
  if (!managerId || !picks) return res.status(400).json({ error: 'Missing fields' });
  if (!MANAGERS.find(m => m.id === managerId)) return res.status(400).json({ error: 'Unknown manager' });

  try {
    await pool.query(
      `INSERT INTO teams (manager_id, picks) VALUES ($1, $2)
       ON CONFLICT (manager_id) DO UPDATE SET picks = $2`,
      [managerId, JSON.stringify(picks)]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/template.csv — download pre-filled CSV template
app.get('/api/template.csv', (req, res) => {
  const lines = ['player_id,player_name,team,position,points'];
  PLAYERS.forEach(p => {
    lines.push(`${p.id},"${p.name}",${p.team},${p.pos},0`);
  });
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="bench-boss-round14.csv"');
  res.send(lines.join('\n'));
});

// POST /api/scores — upload CSV with player points (admin only)
app.post('/api/scores', upload.single('file'), async (req, res) => {
  const adminKey = req.headers['x-admin-key'];
  if (adminKey !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: 'Unauthorised' });
  }

  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  try {
    const csv = req.file.buffer.toString('utf8');
    const lines = csv.trim().split('\n').slice(1); // skip header
    const updates = [];

    for (const line of lines) {
      if (!line.trim()) continue;
      // handle quoted fields
      const cols = line.match(/(".*?"|[^,]+)(?=,|$)/g) || line.split(',');
      const pid = cols[0]?.trim().replace(/"/g, '');
      const pts = parseFloat(cols[4]?.trim()) || 0;
      if (pid) updates.push({ pid, pts });
    }

    // upsert all scores in one transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const { pid, pts } of updates) {
        await client.query(
          `INSERT INTO scores (player_id, points) VALUES ($1, $2)
           ON CONFLICT (player_id) DO UPDATE SET points = $2`,
          [pid, pts]
        );
      }
      await client.query(
        `INSERT INTO meta (key, value) VALUES ('last_updated', $1)
         ON CONFLICT (key) DO UPDATE SET value = $1`,
        [new Date().toISOString()]
      );
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }

    // build updated leaderboard for response
    const teamsRes = await pool.query('SELECT manager_id, picks FROM teams');
    const teams = {};
    teamsRes.rows.forEach(r => { teams[r.manager_id] = r.picks; });
    const scoreMap = {};
    updates.forEach(({ pid, pts }) => { scoreMap[pid] = pts; });

    const leaderboard = MANAGERS.map(m => ({
      name: m.name,
      total: Math.round(calcManagerTotal(teams[m.id] || {}, scoreMap))
    })).sort((a, b) => b.total - a.total);

    res.json({ ok: true, updated: updates.length, leaderboard });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Health check
app.get('/health', (_, res) => res.json({ ok: true }));

// ─── Start ───────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3000;
initDb().then(() => {
  app.listen(PORT, () => console.log(`Bench Boss running on :${PORT}`));
});
