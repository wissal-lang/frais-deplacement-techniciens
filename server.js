import express from 'express'
import pg from 'pg'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config()

const { Pool } = pg

const app = express()
app.use(express.json())
app.use(cors())

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'gestion_frais',
  password: process.env.DB_PASSWORD || '',
  port: Number(process.env.DB_PORT) || 5432,
})

const AUTH_TABLE_CANDIDATES = ['users', 'techniciens']
const LOGIN_COLUMN_CANDIDATES = ['email', 'mail', 'adresse_email', 'username', 'login']
const PASSWORD_COLUMN_CANDIDATES = ['mot_de_passe', 'password', 'mdp']
const ROLE_TECHNICIEN = 'TECHNICIEN'
const ROLE_GESTIONNAIRE = 'GESTIONNAIRE'
const EXPENSE_STATUS_PENDING = 'EN_ATTENTE'
const EXPENSE_STATUS_VALIDATED = 'VALIDEE'
const EXPENSE_STATUS_PAID = 'PAYEE'

let authConfig = null

function looksLikeBcryptHash(value) {
  return typeof value === 'string' && /^\$2[aby]\$\d{2}\$/.test(value)
}

async function verifyPassword(plainPassword, storedPassword) {
  if (typeof storedPassword !== 'string') return false
  if (looksLikeBcryptHash(storedPassword)) {
    return bcrypt.compare(plainPassword, storedPassword)
  }
  return plainPassword === storedPassword
}

function normalizeRole(value) {
  return typeof value === 'string' ? value.trim().toUpperCase() : ''
}

function quoteIdent(identifier) {
  return `"${String(identifier).replace(/"/g, '""')}"`
}

function parseInteger(value) {
  const number = Number.parseInt(String(value), 10)
  return Number.isFinite(number) ? number : null
}

function formatDate(value) {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

function formatExpenseRow(row) {
  return {
    id: row.id,
    interventionId: row.intervention_id,
    typeFrais: row.type_frais,
    montant: Number(row.montant),
    devise: row.devise || 'MAD',
    dateFrais: row.date_frais,
    description: row.description || '',
    statutValidation: row.statut_validation || EXPENSE_STATUS_PENDING,
    mission: row.mission || row.titre || '',
    technicien: row.technicien || '',
    technicianId: row.technicien_id,
    createdAt: formatDate(row.created_at),
    decision: row.decision || null,
    validatedAt: formatDate(row.date_decision),
  }
}

function formatInterventionRow(row) {
  return {
    id: row.id,
    technicienId: row.technicien_id,
    titre: row.titre,
    description: row.description || '',
    lieuDepart: row.lieu_depart,
    lieuArrivee: row.lieu_arrivee,
    dateDepart: formatDate(row.date_depart),
    dateRetour: formatDate(row.date_retour),
    distanceKm: row.distance_km !== null && row.distance_km !== undefined ? Number(row.distance_km) : null,
    statut: row.statut || null,
    createdAt: formatDate(row.created_at),
  }
}

function formatPlanningInterventionRow(row) {
  return {
    ...formatInterventionRow(row),
    technicien: row.technicien_nom
      ? {
          id: row.technicien_id,
          nom: row.technicien_nom,
          prenom: row.technicien_prenom || null,
          email: row.technicien_email || null,
        }
      : null,
  }
}

function parseActiveFilter(value) {
  if (value === undefined || value === null || value === '') return null
  const normalized = String(value).trim().toLowerCase()
  if (['true', '1', 'actif', 'active', 'oui', 'yes'].includes(normalized)) return true
  if (['false', '0', 'inactif', 'inactive', 'non', 'no'].includes(normalized)) return false
  return null
}

function parseRoleFilter(value) {
  const normalized = normalizeRole(value)
  if (normalized === ROLE_TECHNICIEN || normalized === ROLE_GESTIONNAIRE) {
    return normalized
  }
  return null
}

function formatUserRow(row) {
  return {
    id: row.id,
    nom: row.nom,
    prenom: row.prenom,
    email: row.email,
    role: normalizeRole(row.role),
    actif: row.actif === true,
    statut: row.actif === true ? 'actif' : 'inactif',
    telephone: row.telephone || null,
    matricule: row.matricule || null,
    service: row.service || null,
    ville: row.ville || null,
    departement: row.departement || null,
    technicienId: row.technicien_id || null,
    gestionnaireId: row.gestionnaire_id || null,
    createdAt: formatDate(row.created_at),
  }
}

function formatTechnicianRow(row) {
  return {
    id: row.technicien_id,
    userId: row.user_id,
    nom: row.nom,
    prenom: row.prenom,
    email: row.email,
    role: normalizeRole(row.role),
    actif: row.actif === true,
    statut: row.actif === true ? 'actif' : 'inactif',
    matricule: row.matricule || null,
    telephone: row.telephone || null,
    service: row.service || null,
    ville: row.ville || null,
    createdAt: formatDate(row.created_at),
  }
}

function formatManagerRow(row) {
  return {
    id: row.gestionnaire_id,
    userId: row.user_id,
    nom: row.nom,
    prenom: row.prenom,
    email: row.email,
    role: normalizeRole(row.role),
    actif: row.actif === true,
    statut: row.actif === true ? 'actif' : 'inactif',
    departement: row.departement || null,
    createdAt: formatDate(row.created_at),
  }
}

function formatProjectRow(row) {
  return {
    id: row.id,
    nom: row.nom,
    client: row.client,
    localisation: row.localisation,
    description: row.description || '',
    statut: row.statut,
    creePar: row.cree_par || null,
    creeParNom: row.cree_par_nom || null,
    createdAt: formatDate(row.created_at),
  }
}

function normalizeReportStatus(value) {
  const normalized = typeof value === 'string' ? value.trim().toUpperCase() : ''
  if (normalized === 'VALIDE' || normalized === 'VALIDATED') return 'VALIDE'
  if (normalized === 'REJETE' || normalized === 'REJECTED') return 'REJETE'
  return 'EN_ATTENTE'
}

function parseJsonField(value, fallback) {
  if (value === undefined || value === null || value === '') {
    return fallback
  }

  if (typeof value === 'object') {
    return value
  }

  if (typeof value === 'string') {
    try {
      return JSON.parse(value)
    } catch {
      return fallback
    }
  }

  return fallback
}

function formatReportRow(row) {
  return {
    id: row.id,
    interventionId: row.intervention_id,
    technicienId: row.technicien_id,
    date: formatDate(row.date),
    presenceConfirmee: Boolean(row.presence_confirmee),
    gpsLatitude: row.gps_latitude !== null && row.gps_latitude !== undefined ? Number(row.gps_latitude) : null,
    gpsLongitude: row.gps_longitude !== null && row.gps_longitude !== undefined ? Number(row.gps_longitude) : null,
    gpsAdresse: row.gps_adresse || null,
    materielUtilise: parseJsonField(row.materiel_utilise, []),
    etapes: parseJsonField(row.etapes, {}),
    tempsPasse: row.temps_passe || null,
    notes: row.notes || null,
    photoUrl: row.photo_url || null,
    statut: normalizeReportStatus(row.statut),
    validatePar: row.validate_par || null,
    dateValidation: formatDate(row.date_validation),
    commentaireValidation: row.commentaire_validation || null,
    createdAt: formatDate(row.created_at),
    intervention: row.intervention_titre
      ? {
          id: row.intervention_id,
          titre: row.intervention_titre,
          description: row.intervention_description || '',
          lieuDepart: row.lieu_depart || null,
          lieuArrivee: row.lieu_arrivee || null,
          dateDepart: formatDate(row.date_depart),
          statut: row.intervention_statut || null,
        }
      : null,
    technicien: row.technicien_nom
      ? {
          id: row.technicien_id,
          nom: row.technicien_nom,
          prenom: row.technicien_prenom || null,
          email: row.technicien_email || null,
        }
      : null,
    validateParUser: row.validate_nom
      ? {
          id: row.validate_par,
          nom: row.validate_nom,
          prenom: row.validate_prenom || null,
          email: row.validate_email || null,
        }
      : null,
  }
}

function parseReportDecision(value) {
  const normalized = typeof value === 'string' ? value.trim().toUpperCase() : ''
  if (normalized === 'VALIDE' || normalized === 'VALIDATED') return 'VALIDE'
  if (normalized === 'REJETE' || normalized === 'REJECTED') return 'REJETE'
  return null
}

async function runTransaction(work) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await work(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

async function fetchUserDetailsById(userId) {
  const result = await pool.query(
    `
      SELECT
        u.id,
        u.nom,
        u.prenom,
        u.email,
        u.role,
        u.actif,
        u.created_at,
        t.id AS technicien_id,
        t.matricule,
        t.telephone,
        t.service,
        t.ville,
        g.id AS gestionnaire_id,
        g.departement
      FROM users u
      LEFT JOIN techniciens t ON t.user_id = u.id
      LEFT JOIN gestionnaires g ON g.user_id = u.id
      WHERE u.id = $1
      LIMIT 1
    `,
    [userId],
  )

  return result.rows[0] || null
}

async function fetchTechnicianDetailsByTechnicianId(technicianId) {
  const result = await pool.query(
    `
      SELECT
        t.id AS technicien_id,
        t.user_id,
        u.nom,
        u.prenom,
        u.email,
        u.role,
        u.actif,
        u.created_at,
        t.matricule,
        t.telephone,
        t.service,
        t.ville
      FROM techniciens t
      JOIN users u ON u.id = t.user_id
      WHERE t.id = $1
      LIMIT 1
    `,
    [technicianId],
  )

  return result.rows[0] || null
}

async function fetchManagerDetailsByManagerId(managerId) {
  const result = await pool.query(
    `
      SELECT
        g.id AS gestionnaire_id,
        g.user_id,
        u.nom,
        u.prenom,
        u.email,
        u.role,
        u.actif,
        u.created_at,
        g.departement
      FROM gestionnaires g
      JOIN users u ON u.id = g.user_id
      WHERE g.id = $1
      LIMIT 1
    `,
    [managerId],
  )

  return result.rows[0] || null
}

async function syncTechnicianProfile(client, userId, payload) {
  await client.query('DELETE FROM gestionnaires WHERE user_id = $1', [userId])
  const existing = await client.query('SELECT id FROM techniciens WHERE user_id = $1 LIMIT 1', [userId])
  const matricule = typeof payload.matricule === 'string' && payload.matricule.trim()
    ? payload.matricule.trim()
    : `TECH-${String(userId).padStart(4, '0')}`
  const values = [
    matricule,
    payload.telephone || null,
    payload.service || null,
    payload.ville || null,
    userId,
  ]

  if (existing.rows[0]) {
    await client.query(
      `
        UPDATE techniciens
        SET matricule = $1, telephone = $2, service = $3, ville = $4
        WHERE user_id = $5
      `,
      values,
    )
    return existing.rows[0].id
  }

  const created = await client.query(
    `
      INSERT INTO techniciens (matricule, telephone, service, ville, user_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `,
    values,
  )
  return created.rows[0].id
}

async function syncManagerProfile(client, userId, payload) {
  await client.query('DELETE FROM techniciens WHERE user_id = $1', [userId])
  const existing = await client.query('SELECT id FROM gestionnaires WHERE user_id = $1 LIMIT 1', [userId])
  const values = [payload.departement || null, userId]

  if (existing.rows[0]) {
    await client.query(
      `
        UPDATE gestionnaires
        SET departement = $1
        WHERE user_id = $2
      `,
      values,
    )
    return existing.rows[0].id
  }

  const created = await client.query(
    `
      INSERT INTO gestionnaires (departement, user_id)
      VALUES ($1, $2)
      RETURNING id
    `,
    values,
  )
  return created.rows[0].id
}


async function resolveAuthConfig() {
  for (const tableName of AUTH_TABLE_CANDIDATES) {
    const columnsResult = await pool.query(
      "SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1",
      [tableName],
    )

    if (!columnsResult.rows.length) continue

    const availableColumns = new Set(columnsResult.rows.map((row) => row.column_name))
    const loginColumn = LOGIN_COLUMN_CANDIDATES.find((col) => availableColumns.has(col))
    const passwordColumn = PASSWORD_COLUMN_CANDIDATES.find((col) => availableColumns.has(col))

    if (loginColumn && passwordColumn) {
      return { tableName, loginColumn, passwordColumn }
    }
  }

  return null
}

async function ensureAuthConfig() {
  if (!authConfig) {
    authConfig = await resolveAuthConfig()
  }
  return authConfig
}

async function fetchUserById(userId) {
  const result = await pool.query(
    'SELECT id, nom, prenom, email, role, actif, created_at FROM users WHERE id = $1 LIMIT 1',
    [userId],
  )
  return result.rows[0] || null
}

async function fetchTechnicianContext(userId) {
  const result = await pool.query(
    `
      SELECT t.id AS technician_id, t.user_id, t.matricule, t.telephone, t.service, t.ville
      FROM techniciens t
      WHERE t.user_id = $1
      LIMIT 1
    `,
    [userId],
  )
  return result.rows[0] || null
}

async function fetchManagerContext(userId) {
  const result = await pool.query(
    `
      SELECT g.id AS manager_id, g.user_id, g.departement
      FROM gestionnaires g
      WHERE g.user_id = $1
      LIMIT 1
    `,
    [userId],
  )
  return result.rows[0] || null
}

async function authFromRequest(req) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    throw new Error('Token manquant')
  }

  const token = header.slice('Bearer '.length)
  const jwtSecret = process.env.JWT_SECRET || 'dev_secret_change_me'
  const payload = jwt.verify(token, jwtSecret)

  if (typeof payload !== 'object' || payload === null) {
    throw new Error('Token invalide')
  }

  const user = await fetchUserById(payload.id)
  if (!user) {
    throw new Error('Utilisateur introuvable')
  }

  return {
    user,
    role: normalizeRole(payload.role || user.role),
  }
}

function requireRole(role) {
  return async (req, res, next) => {
    try {
      const auth = await authFromRequest(req)
      if (role && auth.role !== role) {
        return res.status(403).json({ error: 'Acces refuse pour ce role' })
      }

      req.auth = auth
      next()
    } catch (error) {
      return res.status(401).json({ error: error.message || 'Non autorise' })
    }
  }
}

async function getManagerOrFail(userId) {
  const manager = await fetchManagerContext(userId)
  if (!manager) {
    throw new Error('Profil gestionnaire introuvable')
  }
  return manager
}

async function getTechnicianOrFail(userId) {
  const technician = await fetchTechnicianContext(userId)
  if (!technician) {
    throw new Error('Profil technicien introuvable')
  }
  return technician
}

async function handleLogin(req, res, expectedRole) {
  const { email, mot_de_passe } = req.body

  if (!email || !mot_de_passe) {
    return res.status(400).json({ message: 'Champs requis manquants' })
  }

  try {
    const config = await ensureAuthConfig()
    if (!config) {
      return res.status(500).json({
        error: 'Configuration login introuvable dans la base (table/colonnes).',
      })
    }

    const loginQuery = `SELECT * FROM ${quoteIdent(config.tableName)} WHERE ${quoteIdent(config.loginColumn)} = $1 LIMIT 1`
    const result = await pool.query(loginQuery, [email])

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Utilisateur non trouvé' })
    }

    const user = result.rows[0]
    const storedPassword = user[config.passwordColumn]
    const userRole = normalizeRole(user.role)
    const valid = await verifyPassword(mot_de_passe, storedPassword)

    if (!valid) {
      return res.status(401).json({ message: 'Mot de passe incorrect' })
    }

    if (expectedRole && userRole !== expectedRole) {
      return res.status(403).json({ message: 'Acces refuse pour ce role' })
    }

    const jwtSecret = process.env.JWT_SECRET || 'dev_secret_change_me'
    const token = jwt.sign({ id: user.id, role: userRole || null }, jwtSecret, {
      expiresIn: '12h',
    })

    return res.json({
      message: 'Connexion reussie',
      token,
      role: userRole || null,
    })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

app.post('/login', async (req, res) => handleLogin(req, res, null))
app.post('/login/technicien', async (req, res) => handleLogin(req, res, ROLE_TECHNICIEN))
app.post('/login/gestionnaire', async (req, res) => handleLogin(req, res, ROLE_GESTIONNAIRE))

app.get('/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() AS now')
    return res.json(result.rows[0])
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
})

app.get('/api/users', requireRole(ROLE_GESTIONNAIRE), async (req, res) => {
  try {
    const filters = []
    const params = []

    const role = parseRoleFilter(req.query.role)
    if (role) {
      params.push(role)
      filters.push(`u.role = $${params.length}`)
    }

    const actif = parseActiveFilter(req.query.actif ?? req.query.statut)
    if (actif !== null) {
      params.push(actif)
      filters.push(`u.actif = $${params.length}`)
    }

    const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : ''

    const result = await pool.query(
      `
        SELECT
          u.id,
          u.nom,
          u.prenom,
          u.email,
          u.role,
          u.actif,
          u.created_at,
          t.id AS technicien_id,
          t.matricule,
          t.telephone,
          t.service,
          t.ville,
          g.id AS gestionnaire_id,
          g.departement
        FROM users u
        LEFT JOIN techniciens t ON t.user_id = u.id
        LEFT JOIN gestionnaires g ON g.user_id = u.id
        ${whereClause}
        ORDER BY u.created_at DESC, u.id DESC
      `,
      params,
    )

    return res.json({
      success: true,
      count: result.rows.length,
      users: result.rows.map(formatUserRow),
    })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
})

app.get('/api/users/:id', requireRole(ROLE_GESTIONNAIRE), async (req, res) => {
  try {
    const userId = parseInteger(req.params.id)
    if (!userId) {
      return res.status(400).json({ error: 'Identifiant invalide' })
    }

    const user = await fetchUserDetailsById(userId)
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur introuvable' })
    }

    return res.json({ success: true, user: formatUserRow(user) })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
})

app.post('/api/users', requireRole(ROLE_GESTIONNAIRE), async (req, res) => {
  try {
    const nom = typeof req.body.nom === 'string' ? req.body.nom.trim() : ''
    const prenom = typeof req.body.prenom === 'string' ? req.body.prenom.trim() : null
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : ''
    const password = typeof req.body.password === 'string' ? req.body.password : typeof req.body.mot_de_passe === 'string' ? req.body.mot_de_passe : ''
    const role = parseRoleFilter(req.body.role) || ROLE_TECHNICIEN
    const actif = req.body.actif === undefined ? true : Boolean(req.body.actif)

    if (!nom || !email || !password) {
      return res.status(400).json({ error: 'nom, email et password sont obligatoires' })
    }

    const existing = await pool.query('SELECT id FROM users WHERE email = $1 LIMIT 1', [email])
    if (existing.rows.length) {
      return res.status(409).json({ error: 'Cet email existe déjà' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const createdUser = await runTransaction(async (client) => {
      const userInsert = await client.query(
        `
          INSERT INTO users (nom, prenom, email, mot_de_passe, role, actif)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING id
        `,
        [nom, prenom, email, hashedPassword, role, actif],
      )

      const userId = userInsert.rows[0].id

      if (role === ROLE_TECHNICIEN) {
        await syncTechnicianProfile(client, userId, {
          matricule: req.body.matricule,
          telephone: req.body.telephone,
          service: req.body.service,
          ville: req.body.ville,
        })
      } else if (role === ROLE_GESTIONNAIRE) {
        await syncManagerProfile(client, userId, {
          departement: req.body.departement,
        })
      }

      const user = await client.query('SELECT id FROM users WHERE id = $1', [userId])
      return user.rows[0]
    })

    const user = await fetchUserDetailsById(createdUser.id)
    return res.status(201).json({ success: true, user: formatUserRow(user) })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
})

app.put('/api/users/:id', requireRole(ROLE_GESTIONNAIRE), async (req, res) => {
  try {
    const userId = parseInteger(req.params.id)
    if (!userId) {
      return res.status(400).json({ error: 'Identifiant invalide' })
    }

    const existingUser = await fetchUserDetailsById(userId)
    if (!existingUser) {
      return res.status(404).json({ error: 'Utilisateur introuvable' })
    }

    const nom = typeof req.body.nom === 'string' ? req.body.nom.trim() : existingUser.nom
    const prenom = typeof req.body.prenom === 'string' ? req.body.prenom.trim() : existingUser.prenom
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : existingUser.email
    const role = parseRoleFilter(req.body.role) || normalizeRole(existingUser.role)
    const actif = req.body.actif === undefined ? Boolean(existingUser.actif) : Boolean(req.body.actif)
    const password = typeof req.body.password === 'string' ? req.body.password : typeof req.body.mot_de_passe === 'string' ? req.body.mot_de_passe : ''

    const duplicateEmail = await pool.query('SELECT id FROM users WHERE email = $1 AND id <> $2 LIMIT 1', [email, userId])
    if (duplicateEmail.rows.length) {
      return res.status(409).json({ error: 'Cet email existe déjà' })
    }

    const hashedPassword = password ? await bcrypt.hash(password, 10) : null

    await runTransaction(async (client) => {
      const values = [nom, prenom, email, role, actif, userId]
      let updateQuery = `
        UPDATE users
        SET nom = $1, prenom = $2, email = $3, role = $4, actif = $5
      `
      if (hashedPassword) {
        updateQuery += ', mot_de_passe = $6 WHERE id = $7'
        values.push(hashedPassword, userId)
      } else {
        updateQuery += ' WHERE id = $6'
      }

      await client.query(updateQuery, values)

      if (role === ROLE_TECHNICIEN) {
        await syncTechnicianProfile(client, userId, {
          matricule: req.body.matricule ?? existingUser.matricule,
          telephone: req.body.telephone ?? existingUser.telephone,
          service: req.body.service ?? existingUser.service,
          ville: req.body.ville ?? existingUser.ville,
        })
      } else if (role === ROLE_GESTIONNAIRE) {
        await syncManagerProfile(client, userId, {
          departement: req.body.departement ?? existingUser.departement,
        })
      }
    })

    const user = await fetchUserDetailsById(userId)
    return res.json({ success: true, user: formatUserRow(user) })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
})

app.delete('/api/users/:id', requireRole(ROLE_GESTIONNAIRE), async (req, res) => {
  try {
    const userId = parseInteger(req.params.id)
    if (!userId) {
      return res.status(400).json({ error: 'Identifiant invalide' })
    }

    const result = await pool.query(
      'UPDATE users SET actif = false WHERE id = $1 RETURNING id',
      [userId],
    )

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Utilisateur introuvable' })
    }

    return res.json({ success: true, message: 'Utilisateur désactivé' })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
})

app.get('/api/techniciens', requireRole(ROLE_GESTIONNAIRE), async (req, res) => {
  try {
    const result = await pool.query(
      `
        SELECT
          t.id AS technicien_id,
          t.user_id,
          u.nom,
          u.prenom,
          u.email,
          u.role,
          u.actif,
          u.created_at,
          t.matricule,
          t.telephone,
          t.service,
          t.ville
        FROM techniciens t
        JOIN users u ON u.id = t.user_id
        ORDER BY u.created_at DESC, t.id DESC
      `,
    )

    return res.json({
      success: true,
      count: result.rows.length,
      techniciens: result.rows.map(formatTechnicianRow),
    })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
})

app.get('/api/techniciens/:id', requireRole(ROLE_GESTIONNAIRE), async (req, res) => {
  try {
    const technicienId = parseInteger(req.params.id)
    if (!technicienId) {
      return res.status(400).json({ error: 'Identifiant invalide' })
    }

    const technician = await fetchTechnicianDetailsByTechnicianId(technicienId)
    if (!technician) {
      return res.status(404).json({ error: 'Technicien introuvable' })
    }

    return res.json({ success: true, technicien: formatTechnicianRow(technician) })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
})

app.post('/api/techniciens', requireRole(ROLE_GESTIONNAIRE), async (req, res) => {
  try {
    const nom = typeof req.body.nom === 'string' ? req.body.nom.trim() : ''
    const prenom = typeof req.body.prenom === 'string' ? req.body.prenom.trim() : null
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : ''
    const password = typeof req.body.password === 'string' ? req.body.password : typeof req.body.mot_de_passe === 'string' ? req.body.mot_de_passe : ''
    const actif = req.body.actif === undefined ? true : Boolean(req.body.actif)

    if (!nom || !email || !password) {
      return res.status(400).json({ error: 'nom, email et password sont obligatoires' })
    }

    const existing = await pool.query('SELECT id FROM users WHERE email = $1 LIMIT 1', [email])
    if (existing.rows.length) {
      return res.status(409).json({ error: 'Cet email existe déjà' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const created = await runTransaction(async (client) => {
      const userInsert = await client.query(
        `
          INSERT INTO users (nom, prenom, email, mot_de_passe, role, actif)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING id
        `,
        [nom, prenom, email, hashedPassword, ROLE_TECHNICIEN, actif],
      )

      const userId = userInsert.rows[0].id
      await syncTechnicianProfile(client, userId, {
        matricule: req.body.matricule,
        telephone: req.body.telephone,
        service: req.body.service,
        ville: req.body.ville,
      })

      return userId
    })

    const technician = await fetchUserDetailsById(created)
    return res.status(201).json({ success: true, user: formatUserRow(technician) })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
})

app.put('/api/techniciens/:id', requireRole(ROLE_GESTIONNAIRE), async (req, res) => {
  try {
    const technicienId = parseInteger(req.params.id)
    if (!technicienId) {
      return res.status(400).json({ error: 'Identifiant invalide' })
    }

    const current = await fetchTechnicianDetailsByTechnicianId(technicienId)
    if (!current) {
      return res.status(404).json({ error: 'Technicien introuvable' })
    }

    const userId = current.user_id
    const nom = typeof req.body.nom === 'string' ? req.body.nom.trim() : current.nom
    const prenom = typeof req.body.prenom === 'string' ? req.body.prenom.trim() : current.prenom
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : current.email
    const actif = req.body.actif === undefined ? Boolean(current.actif) : Boolean(req.body.actif)
    const password = typeof req.body.password === 'string' ? req.body.password : typeof req.body.mot_de_passe === 'string' ? req.body.mot_de_passe : ''

    const duplicateEmail = await pool.query('SELECT id FROM users WHERE email = $1 AND id <> $2 LIMIT 1', [email, userId])
    if (duplicateEmail.rows.length) {
      return res.status(409).json({ error: 'Cet email existe déjà' })
    }

    const hashedPassword = password ? await bcrypt.hash(password, 10) : null

    await runTransaction(async (client) => {
      const values = [nom, prenom, email, actif, userId]
      let updateQuery = `
        UPDATE users
        SET nom = $1, prenom = $2, email = $3, actif = $4
      `
      if (hashedPassword) {
        updateQuery += ', mot_de_passe = $5 WHERE id = $6'
        values.push(hashedPassword, userId)
      } else {
        updateQuery += ' WHERE id = $5'
      }

      await client.query(updateQuery, values)

      await syncTechnicianProfile(client, userId, {
        matricule: req.body.matricule ?? current.matricule,
        telephone: req.body.telephone ?? current.telephone,
        service: req.body.service ?? current.service,
        ville: req.body.ville ?? current.ville,
      })
    })

    const technician = await fetchTechnicianDetailsByTechnicianId(technicienId)
    return res.json({ success: true, technicien: formatTechnicianRow(technician) })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
})

app.delete('/api/techniciens/:id', requireRole(ROLE_GESTIONNAIRE), async (req, res) => {
  try {
    const technicienId = parseInteger(req.params.id)
    if (!technicienId) {
      return res.status(400).json({ error: 'Identifiant invalide' })
    }

    const technician = await fetchTechnicianDetailsByTechnicianId(technicienId)
    if (!technician) {
      return res.status(404).json({ error: 'Technicien introuvable' })
    }

    await pool.query('UPDATE users SET actif = false WHERE id = $1', [technician.user_id])
    return res.json({ success: true, message: 'Technicien désactivé' })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
})

app.get('/api/gestionnaires', requireRole(ROLE_GESTIONNAIRE), async (req, res) => {
  try {
    const result = await pool.query(
      `
        SELECT
          g.id AS gestionnaire_id,
          g.user_id,
          u.nom,
          u.prenom,
          u.email,
          u.role,
          u.actif,
          u.created_at,
          g.departement
        FROM gestionnaires g
        JOIN users u ON u.id = g.user_id
        ORDER BY u.created_at DESC, g.id DESC
      `,
    )

    return res.json({
      success: true,
      count: result.rows.length,
      gestionnaires: result.rows.map(formatManagerRow),
    })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
})

app.get('/api/gestionnaires/:id', requireRole(ROLE_GESTIONNAIRE), async (req, res) => {
  try {
    const managerId = parseInteger(req.params.id)
    if (!managerId) {
      return res.status(400).json({ error: 'Identifiant invalide' })
    }

    const manager = await fetchManagerDetailsByManagerId(managerId)
    if (!manager) {
      return res.status(404).json({ error: 'Gestionnaire introuvable' })
    }

    return res.json({ success: true, gestionnaire: formatManagerRow(manager) })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
})

app.post('/api/gestionnaires', requireRole(ROLE_GESTIONNAIRE), async (req, res) => {
  try {
    const nom = typeof req.body.nom === 'string' ? req.body.nom.trim() : ''
    const prenom = typeof req.body.prenom === 'string' ? req.body.prenom.trim() : null
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : ''
    const password = typeof req.body.password === 'string' ? req.body.password : typeof req.body.mot_de_passe === 'string' ? req.body.mot_de_passe : ''
    const actif = req.body.actif === undefined ? true : Boolean(req.body.actif)

    if (!nom || !email || !password) {
      return res.status(400).json({ error: 'nom, email et password sont obligatoires' })
    }

    const existing = await pool.query('SELECT id FROM users WHERE email = $1 LIMIT 1', [email])
    if (existing.rows.length) {
      return res.status(409).json({ error: 'Cet email existe déjà' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const created = await runTransaction(async (client) => {
      const userInsert = await client.query(
        `
          INSERT INTO users (nom, prenom, email, mot_de_passe, role, actif)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING id
        `,
        [nom, prenom, email, hashedPassword, ROLE_GESTIONNAIRE, actif],
      )

      const userId = userInsert.rows[0].id
      await syncManagerProfile(client, userId, {
        departement: req.body.departement,
      })

      return userId
    })

    const manager = await fetchUserDetailsById(created)
    return res.status(201).json({ success: true, user: formatUserRow(manager) })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
})

app.put('/api/gestionnaires/:id', requireRole(ROLE_GESTIONNAIRE), async (req, res) => {
  try {
    const managerId = parseInteger(req.params.id)
    if (!managerId) {
      return res.status(400).json({ error: 'Identifiant invalide' })
    }

    const current = await fetchManagerDetailsByManagerId(managerId)
    if (!current) {
      return res.status(404).json({ error: 'Gestionnaire introuvable' })
    }

    const userId = current.user_id
    const nom = typeof req.body.nom === 'string' ? req.body.nom.trim() : current.nom
    const prenom = typeof req.body.prenom === 'string' ? req.body.prenom.trim() : current.prenom
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : current.email
    const actif = req.body.actif === undefined ? Boolean(current.actif) : Boolean(req.body.actif)
    const password = typeof req.body.password === 'string' ? req.body.password : typeof req.body.mot_de_passe === 'string' ? req.body.mot_de_passe : ''

    const duplicateEmail = await pool.query('SELECT id FROM users WHERE email = $1 AND id <> $2 LIMIT 1', [email, userId])
    if (duplicateEmail.rows.length) {
      return res.status(409).json({ error: 'Cet email existe déjà' })
    }

    const hashedPassword = password ? await bcrypt.hash(password, 10) : null

    await runTransaction(async (client) => {
      const values = [nom, prenom, email, actif, userId]
      let updateQuery = `
        UPDATE users
        SET nom = $1, prenom = $2, email = $3, actif = $4
      `
      if (hashedPassword) {
        updateQuery += ', mot_de_passe = $5 WHERE id = $6'
        values.push(hashedPassword, userId)
      } else {
        updateQuery += ' WHERE id = $5'
      }

      await client.query(updateQuery, values)

      await syncManagerProfile(client, userId, {
        departement: req.body.departement ?? current.departement,
      })
    })

    const manager = await fetchManagerDetailsByManagerId(managerId)
    return res.json({ success: true, gestionnaire: formatManagerRow(manager) })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
})

app.delete('/api/gestionnaires/:id', requireRole(ROLE_GESTIONNAIRE), async (req, res) => {
  try {
    const managerId = parseInteger(req.params.id)
    if (!managerId) {
      return res.status(400).json({ error: 'Identifiant invalide' })
    }

    const manager = await fetchManagerDetailsByManagerId(managerId)
    if (!manager) {
      return res.status(404).json({ error: 'Gestionnaire introuvable' })
    }

    await pool.query('UPDATE users SET actif = false WHERE id = $1', [manager.user_id])
    return res.json({ success: true, message: 'Gestionnaire désactivé' })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
})

app.get('/api/projets', requireRole(null), async (req, res) => {
  try {
    const filters = []
    const params = []
    const statut = typeof req.query.statut === 'string' ? req.query.statut.trim() : ''
    if (statut) {
      params.push(statut)
      filters.push(`p.statut = $${params.length}`)
    }

    const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : ''

    const result = await pool.query(
      `
        SELECT
          p.id,
          p.nom,
          p.client,
          p.localisation,
          p.description,
          p.statut,
          p.cree_par,
          p.created_at,
          CONCAT(u.nom, ' ', u.prenom) AS cree_par_nom
        FROM projets p
        LEFT JOIN users u ON u.id = p.cree_par
        ${whereClause}
        ORDER BY p.created_at DESC, p.id DESC
      `,
      params,
    )

    return res.json({
      success: true,
      count: result.rows.length,
      projets: result.rows.map(formatProjectRow),
    })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
})

app.get('/api/projets/:id', requireRole(null), async (req, res) => {
  try {
    const projetId = parseInteger(req.params.id)
    if (!projetId) {
      return res.status(400).json({ error: 'Identifiant invalide' })
    }

    const result = await pool.query(
      `
        SELECT
          p.id,
          p.nom,
          p.client,
          p.localisation,
          p.description,
          p.statut,
          p.cree_par,
          p.created_at,
          CONCAT(u.nom, ' ', u.prenom) AS cree_par_nom
        FROM projets p
        LEFT JOIN users u ON u.id = p.cree_par
        WHERE p.id = $1
        LIMIT 1
      `,
      [projetId],
    )

    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Projet introuvable' })
    }

    return res.json({ success: true, projet: formatProjectRow(result.rows[0]) })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
})

app.post('/api/projets', requireRole(ROLE_GESTIONNAIRE), async (req, res) => {
  try {
    const nom = typeof req.body.nom === 'string' ? req.body.nom.trim() : ''
    const client = typeof req.body.client === 'string' ? req.body.client.trim() : ''
    const localisation = typeof req.body.localisation === 'string' ? req.body.localisation.trim() : ''
    const description = typeof req.body.description === 'string' ? req.body.description.trim() : null
    const statut = typeof req.body.statut === 'string' ? req.body.statut.trim() : 'planifie'

    if (!nom || !client || !localisation) {
      return res.status(400).json({ error: 'nom, client et localisation sont obligatoires' })
    }

    const created = await pool.query(
      `
        INSERT INTO projets (nom, client, localisation, description, statut, cree_par)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `,
      [nom, client, localisation, description, statut, req.auth.user.id],
    )

    const result = await pool.query(
      `
        SELECT
          p.id,
          p.nom,
          p.client,
          p.localisation,
          p.description,
          p.statut,
          p.cree_par,
          p.created_at,
          CONCAT(u.nom, ' ', u.prenom) AS cree_par_nom
        FROM projets p
        LEFT JOIN users u ON u.id = p.cree_par
        WHERE p.id = $1
        LIMIT 1
      `,
      [created.rows[0].id],
    )

    return res.status(201).json({ success: true, projet: formatProjectRow(result.rows[0]) })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
})

app.put('/api/projets/:id', requireRole(ROLE_GESTIONNAIRE), async (req, res) => {
  try {
    const projetId = parseInteger(req.params.id)
    if (!projetId) {
      return res.status(400).json({ error: 'Identifiant invalide' })
    }

    const current = await pool.query('SELECT id FROM projets WHERE id = $1 LIMIT 1', [projetId])
    if (!current.rows[0]) {
      return res.status(404).json({ error: 'Projet introuvable' })
    }

    const result = await pool.query(
      `
        UPDATE projets
        SET
          nom = COALESCE($1, nom),
          client = COALESCE($2, client),
          localisation = COALESCE($3, localisation),
          description = COALESCE($4, description),
          statut = COALESCE($5, statut)
        WHERE id = $6
        RETURNING id
      `,
      [
        typeof req.body.nom === 'string' ? req.body.nom.trim() : null,
        typeof req.body.client === 'string' ? req.body.client.trim() : null,
        typeof req.body.localisation === 'string' ? req.body.localisation.trim() : null,
        typeof req.body.description === 'string' ? req.body.description.trim() : null,
        typeof req.body.statut === 'string' ? req.body.statut.trim() : null,
        projetId,
      ],
    )

    const updated = await pool.query(
      `
        SELECT
          p.id,
          p.nom,
          p.client,
          p.localisation,
          p.description,
          p.statut,
          p.cree_par,
          p.created_at,
          CONCAT(u.nom, ' ', u.prenom) AS cree_par_nom
        FROM projets p
        LEFT JOIN users u ON u.id = p.cree_par
        WHERE p.id = $1
        LIMIT 1
      `,
      [result.rows[0].id],
    )

    return res.json({ success: true, projet: formatProjectRow(updated.rows[0]) })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
})

app.delete('/api/projets/:id', requireRole(ROLE_GESTIONNAIRE), async (req, res) => {
  try {
    const projetId = parseInteger(req.params.id)
    if (!projetId) {
      return res.status(400).json({ error: 'Identifiant invalide' })
    }

    const result = await pool.query('DELETE FROM projets WHERE id = $1 RETURNING id', [projetId])
    if (!result.rows.length) {
      return res.status(404).json({ error: 'Projet introuvable' })
    }

    return res.json({ success: true, message: 'Projet supprimé' })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
})

app.get('/api/interventions', requireRole(ROLE_GESTIONNAIRE), async (req, res) => {
  try {
    const params = []
    const filters = []

    const technicienValue = req.query.technicien_id ?? req.query.technicien
    if (technicienValue !== undefined && technicienValue !== null && technicienValue !== '') {
      const technicienId = parseInteger(technicienValue)
      if (!technicienId) {
        return res.status(400).json({ error: 'technicien invalide' })
      }
      params.push(technicienId)
      filters.push(`i.technicien_id = $${params.length}`)
    }

    const statut = typeof req.query.statut === 'string' ? req.query.statut.trim() : ''
    if (statut) {
      params.push(statut)
      filters.push(`i.statut = $${params.length}`)
    }

    const semaine = typeof req.query.semaine === 'string' ? req.query.semaine.trim() : ''
    const dateDebut = typeof req.query.dateDebut === 'string' ? req.query.dateDebut.trim() : ''
    const dateFin = typeof req.query.dateFin === 'string' ? req.query.dateFin.trim() : ''

    if (semaine) {
      const startDate = new Date(semaine)
      if (Number.isNaN(startDate.getTime())) {
        return res.status(400).json({ error: 'semaine invalide' })
      }
      const endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + 6)
      params.push(startDate.toISOString())
      filters.push(`i.date_depart >= $${params.length}`)
      params.push(endDate.toISOString())
      filters.push(`i.date_depart < ($${params.length}::timestamptz + interval '1 day')`)
    } else if (dateDebut || dateFin) {
      if (dateDebut) {
        const startDate = new Date(dateDebut)
        if (Number.isNaN(startDate.getTime())) {
          return res.status(400).json({ error: 'dateDebut invalide' })
        }
        params.push(startDate.toISOString())
        filters.push(`i.date_depart >= $${params.length}`)
      }
      if (dateFin) {
        const endDate = new Date(dateFin)
        if (Number.isNaN(endDate.getTime())) {
          return res.status(400).json({ error: 'dateFin invalide' })
        }
        params.push(endDate.toISOString())
        filters.push(`i.date_depart < ($${params.length}::timestamptz + interval '1 day')`)
      }
    }

    const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : ''

    const result = await pool.query(
      `
        SELECT
          i.*,
          u.nom AS technicien_nom,
          u.prenom AS technicien_prenom,
          u.email AS technicien_email
        FROM interventions i
        JOIN techniciens t ON t.id = i.technicien_id
        JOIN users u ON u.id = t.user_id
        ${whereClause}
        ORDER BY i.date_depart ASC, i.id ASC
      `,
      params,
    )

    return res.json({
      success: true,
      count: result.rows.length,
      interventions: result.rows.map(formatPlanningInterventionRow),
    })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
})

app.get('/api/interventions/:id', requireRole(ROLE_GESTIONNAIRE), async (req, res) => {
  try {
    const interventionId = parseInteger(req.params.id)
    if (!interventionId) {
      return res.status(400).json({ error: 'Identifiant invalide' })
    }

    const result = await pool.query(
      `
        SELECT
          i.*,
          u.nom AS technicien_nom,
          u.prenom AS technicien_prenom,
          u.email AS technicien_email
        FROM interventions i
        JOIN techniciens t ON t.id = i.technicien_id
        JOIN users u ON u.id = t.user_id
        WHERE i.id = $1
        LIMIT 1
      `,
      [interventionId],
    )

    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Intervention introuvable' })
    }

    return res.json({ success: true, intervention: formatPlanningInterventionRow(result.rows[0]) })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
})

app.post('/api/interventions', requireRole(ROLE_GESTIONNAIRE), async (req, res) => {
  try {
    const technicienId = parseInteger(req.body.technicien_id ?? req.body.technicien)
    const titre = typeof req.body.titre === 'string' ? req.body.titre.trim() : ''
    const description = typeof req.body.description === 'string' ? req.body.description.trim() : null
    const lieuDepart = typeof req.body.lieu_depart === 'string' ? req.body.lieu_depart.trim() : typeof req.body.lieuDepart === 'string' ? req.body.lieuDepart.trim() : ''
    const lieuArrivee = typeof req.body.lieu_arrivee === 'string' ? req.body.lieu_arrivee.trim() : typeof req.body.lieuArrivee === 'string' ? req.body.lieuArrivee.trim() : ''
    const dateDepartInput = req.body.date_depart ?? req.body.dateDepart
    const statut = typeof req.body.statut === 'string' ? req.body.statut.trim() : 'PLANIFIEE'

    if (!technicienId || !titre || !lieuDepart || !lieuArrivee || !dateDepartInput) {
      return res.status(400).json({
        error: 'technicien_id, titre, lieu_depart, lieu_arrivee et date_depart sont obligatoires',
      })
    }

    const technicianCheck = await pool.query(
      'SELECT t.id FROM techniciens t WHERE t.id = $1 LIMIT 1',
      [technicienId],
    )

    if (!technicianCheck.rows[0]) {
      return res.status(404).json({ error: 'Technicien introuvable' })
    }

    const dateDepart = new Date(dateDepartInput)
    if (Number.isNaN(dateDepart.getTime())) {
      return res.status(400).json({ error: 'date_depart invalide' })
    }

    const result = await pool.query(
      `
        INSERT INTO interventions (
          technicien_id,
          titre,
          description,
          lieu_depart,
          lieu_arrivee,
          date_depart,
          statut
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
      `,
      [technicienId, titre, description, lieuDepart, lieuArrivee, dateDepart.toISOString(), statut],
    )

    const created = await pool.query(
      `
        SELECT
          i.*,
          u.nom AS technicien_nom,
          u.prenom AS technicien_prenom,
          u.email AS technicien_email
        FROM interventions i
        JOIN techniciens t ON t.id = i.technicien_id
        JOIN users u ON u.id = t.user_id
        WHERE i.id = $1
        LIMIT 1
      `,
      [result.rows[0].id],
    )

    return res.status(201).json({ success: true, intervention: formatPlanningInterventionRow(created.rows[0]) })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
})

app.put('/api/interventions/:id', requireRole(ROLE_GESTIONNAIRE), async (req, res) => {
  try {
    const interventionId = parseInteger(req.params.id)
    if (!interventionId) {
      return res.status(400).json({ error: 'Identifiant invalide' })
    }

    const current = await pool.query('SELECT id FROM interventions WHERE id = $1 LIMIT 1', [interventionId])
    if (!current.rows[0]) {
      return res.status(404).json({ error: 'Intervention introuvable' })
    }

    const technicienId = req.body.technicien_id !== undefined || req.body.technicien !== undefined
      ? parseInteger(req.body.technicien_id ?? req.body.technicien)
      : null
    const titre = typeof req.body.titre === 'string' ? req.body.titre.trim() : null
    const description = typeof req.body.description === 'string' ? req.body.description.trim() : null
    const lieuDepart = typeof req.body.lieu_depart === 'string' ? req.body.lieu_depart.trim() : typeof req.body.lieuDepart === 'string' ? req.body.lieuDepart.trim() : null
    const lieuArrivee = typeof req.body.lieu_arrivee === 'string' ? req.body.lieu_arrivee.trim() : typeof req.body.lieuArrivee === 'string' ? req.body.lieuArrivee.trim() : null
    const statut = typeof req.body.statut === 'string' ? req.body.statut.trim() : null
    const dateDepartInput = req.body.date_depart ?? req.body.dateDepart

    let dateDepart = null
    if (dateDepartInput !== undefined && dateDepartInput !== null && dateDepartInput !== '') {
      const parsed = new Date(dateDepartInput)
      if (Number.isNaN(parsed.getTime())) {
        return res.status(400).json({ error: 'date_depart invalide' })
      }
      dateDepart = parsed.toISOString()
    }

    if (technicienId) {
      const technicianCheck = await pool.query('SELECT id FROM techniciens WHERE id = $1 LIMIT 1', [technicienId])
      if (!technicianCheck.rows[0]) {
        return res.status(404).json({ error: 'Technicien introuvable' })
      }
    }

    const result = await pool.query(
      `
        UPDATE interventions
        SET
          technicien_id = COALESCE($1, technicien_id),
          titre = COALESCE($2, titre),
          description = COALESCE($3, description),
          lieu_depart = COALESCE($4, lieu_depart),
          lieu_arrivee = COALESCE($5, lieu_arrivee),
          date_depart = COALESCE($6, date_depart),
          statut = COALESCE($7, statut)
        WHERE id = $8
        RETURNING id
      `,
      [technicienId, titre, description, lieuDepart, lieuArrivee, dateDepart, statut, interventionId],
    )

    const updated = await pool.query(
      `
        SELECT
          i.*,
          u.nom AS technicien_nom,
          u.prenom AS technicien_prenom,
          u.email AS technicien_email
        FROM interventions i
        JOIN techniciens t ON t.id = i.technicien_id
        JOIN users u ON u.id = t.user_id
        WHERE i.id = $1
        LIMIT 1
      `,
      [result.rows[0].id],
    )

    return res.json({ success: true, intervention: formatPlanningInterventionRow(updated.rows[0]) })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
})

app.delete('/api/interventions/:id', requireRole(ROLE_GESTIONNAIRE), async (req, res) => {
  try {
    const interventionId = parseInteger(req.params.id)
    if (!interventionId) {
      return res.status(400).json({ error: 'Identifiant invalide' })
    }

    const result = await pool.query('DELETE FROM interventions WHERE id = $1 RETURNING id', [interventionId])
    if (!result.rows.length) {
      return res.status(404).json({ error: 'Intervention introuvable' })
    }

    return res.json({ success: true, message: 'Intervention supprimée' })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
})

app.get('/api/rapports/stats', requireRole(ROLE_GESTIONNAIRE), async (req, res) => {
  try {
    const [enAttente, valides, rejetes] = await Promise.all([
      pool.query('SELECT COUNT(*)::int AS count FROM rapports WHERE statut = $1', ['EN_ATTENTE']),
      pool.query('SELECT COUNT(*)::int AS count FROM rapports WHERE statut = $1', ['VALIDE']),
      pool.query('SELECT COUNT(*)::int AS count FROM rapports WHERE statut = $1', ['REJETE']),
    ])

    return res.json({
      success: true,
      stats: {
        enAttente: enAttente.rows[0].count,
        valides: valides.rows[0].count,
        rejetes: rejetes.rows[0].count,
      },
    })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
})

app.get('/api/rapports', requireRole(null), async (req, res) => {
  try {
    const params = []
    const filters = []
    const role = normalizeRole(req.auth.role)

    if (role === ROLE_TECHNICIEN) {
      const technician = await getTechnicianOrFail(req.auth.user.id)
      params.push(technician.technician_id)
      filters.push(`t.id = $${params.length}`)
    } else {
      const technicienValue = req.query.technicien_id ?? req.query.technicien
      if (technicienValue !== undefined && technicienValue !== null && technicienValue !== '') {
        const technicienId = parseInteger(technicienValue)
        if (!technicienId) {
          return res.status(400).json({ error: 'technicien invalide' })
        }
        params.push(technicienId)
        filters.push(`(t.id = $${params.length} OR t.user_id = $${params.length})`)
      }
    }

    const statut = typeof req.query.statut === 'string' ? normalizeReportStatus(req.query.statut) : ''
    if (statut) {
      params.push(statut)
      filters.push(`r.statut = $${params.length}`)
    }

    const interventionValue = req.query.intervention_id ?? req.query.intervention
    if (interventionValue !== undefined && interventionValue !== null && interventionValue !== '') {
      const interventionId = parseInteger(interventionValue)
      if (!interventionId) {
        return res.status(400).json({ error: 'intervention invalide' })
      }
      params.push(interventionId)
      filters.push(`r.intervention_id = $${params.length}`)
    }

    const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : ''

    const result = await pool.query(
      `
        SELECT
          r.*,
          i.titre AS intervention_titre,
          i.description AS intervention_description,
          i.lieu_depart,
          i.lieu_arrivee,
          i.date_depart,
          i.statut AS intervention_statut,
          u.nom AS technicien_nom,
          u.prenom AS technicien_prenom,
          u.email AS technicien_email,
          uv.nom AS validate_nom,
          uv.prenom AS validate_prenom,
          uv.email AS validate_email
        FROM rapports r
        JOIN interventions i ON i.id = r.intervention_id
        JOIN techniciens t ON t.id = r.technicien_id
        JOIN users u ON u.id = t.user_id
        LEFT JOIN users uv ON uv.id = r.validate_par
        ${whereClause}
        ORDER BY r.date DESC, r.id DESC
      `,
      params,
    )

    return res.json({
      success: true,
      count: result.rows.length,
      rapports: result.rows.map(formatReportRow),
    })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
})

app.get('/api/rapports/:id', requireRole(null), async (req, res) => {
  try {
    const reportId = parseInteger(req.params.id)
    if (!reportId) {
      return res.status(400).json({ error: 'Identifiant invalide' })
    }

    const params = [reportId]
    const filters = ['r.id = $1']
    const role = normalizeRole(req.auth.role)
    if (role === ROLE_TECHNICIEN) {
      const technician = await getTechnicianOrFail(req.auth.user.id)
      params.push(technician.technician_id)
      filters.push(`t.id = $2`)
    }

    const result = await pool.query(
      `
        SELECT
          r.*,
          i.titre AS intervention_titre,
          i.description AS intervention_description,
          i.lieu_depart,
          i.lieu_arrivee,
          i.date_depart,
          i.statut AS intervention_statut,
          u.nom AS technicien_nom,
          u.prenom AS technicien_prenom,
          u.email AS technicien_email,
          uv.nom AS validate_nom,
          uv.prenom AS validate_prenom,
          uv.email AS validate_email
        FROM rapports r
        JOIN interventions i ON i.id = r.intervention_id
        JOIN techniciens t ON t.id = r.technicien_id
        JOIN users u ON u.id = t.user_id
        LEFT JOIN users uv ON uv.id = r.validate_par
        WHERE ${filters.join(' AND ')}
        LIMIT 1
      `,
      params,
    )

    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Rapport introuvable' })
    }

    return res.json({ success: true, rapport: formatReportRow(result.rows[0]) })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
})

app.post('/api/rapports', requireRole(ROLE_TECHNICIEN), async (req, res) => {
  try {
    const technician = await getTechnicianOrFail(req.auth.user.id)
    const interventionId = parseInteger(req.body.intervention_id ?? req.body.intervention)
    if (!interventionId) {
      return res.status(400).json({ error: 'intervention est obligatoire' })
    }

    const ownership = await pool.query(
      'SELECT id, date_depart FROM interventions WHERE id = $1 AND technicien_id = $2 LIMIT 1',
      [interventionId, technician.technician_id],
    )

    if (!ownership.rows[0]) {
      return res.status(403).json({ error: 'Cette intervention ne vous appartient pas' })
    }

    const dateValue = req.body.date ? new Date(req.body.date) : new Date()
    if (Number.isNaN(dateValue.getTime())) {
      return res.status(400).json({ error: 'date invalide' })
    }

    const etapesInput = parseJsonField(req.body.etapes, {})
    const materielInput = parseJsonField(req.body.materielUtilise, [])
    const presenceConfirmee =
      req.body.presenceConfirmee === undefined ? false : Boolean(req.body.presenceConfirmee)
    const gpsLatitude = req.body.gpsLatitude ?? null
    const gpsLongitude = req.body.gpsLongitude ?? null
    const gpsAdresse = typeof req.body.gpsAdresse === 'string' ? req.body.gpsAdresse.trim() : null
    const tempsPasse = typeof req.body.tempsPasse === 'string' ? req.body.tempsPasse.trim() : null
    const notes = typeof req.body.notes === 'string' ? req.body.notes.trim() : null
    const photoUrl =
      typeof req.body.photoUrl === 'string'
        ? req.body.photoUrl.trim() || null
        : typeof req.body.photo_url === 'string'
          ? req.body.photo_url.trim() || null
          : null

    const created = await runTransaction(async (client) => {
      const insert = await client.query(
        `
          INSERT INTO rapports (
            intervention_id,
            technicien_id,
            date,
            presence_confirmee,
            gps_latitude,
            gps_longitude,
            gps_adresse,
            materiel_utilise,
            etapes,
            temps_passe,
            notes,
            photo_url,
            statut
          )
          VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::jsonb, $10, $11, $12, $13
          )
          RETURNING id
        `,
        [
          interventionId,
          technician.technician_id,
          dateValue.toISOString().slice(0, 10),
          presenceConfirmee,
          gpsLatitude,
          gpsLongitude,
          gpsAdresse,
          JSON.stringify(materielInput),
          JSON.stringify(etapesInput),
          tempsPasse,
          notes,
          photoUrl,
          'EN_ATTENTE',
        ],
      )

      await client.query(
        `UPDATE interventions SET statut = $1 WHERE id = $2`,
        ['TERMINEE', interventionId],
      )

      return insert.rows[0].id
    })

    const result = await pool.query(
      `
        SELECT
          r.*,
          i.titre AS intervention_titre,
          i.description AS intervention_description,
          i.lieu_depart,
          i.lieu_arrivee,
          i.date_depart,
          i.statut AS intervention_statut,
          u.nom AS technicien_nom,
          u.prenom AS technicien_prenom,
          u.email AS technicien_email,
          uv.nom AS validate_nom,
          uv.prenom AS validate_prenom,
          uv.email AS validate_email
        FROM rapports r
        JOIN interventions i ON i.id = r.intervention_id
        JOIN techniciens t ON t.id = r.technicien_id
        JOIN users u ON u.id = t.user_id
        LEFT JOIN users uv ON uv.id = r.validate_par
        WHERE r.id = $1
        LIMIT 1
      `,
      [created],
    )

    return res.status(201).json({ success: true, rapport: formatReportRow(result.rows[0]) })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
})

app.put('/api/rapports/:id/valider', requireRole(ROLE_GESTIONNAIRE), async (req, res) => {
  try {
    const reportId = parseInteger(req.params.id)
    if (!reportId) {
      return res.status(400).json({ error: 'Identifiant invalide' })
    }

    const decision = parseReportDecision(req.body.decision)
    if (!decision) {
      return res.status(400).json({ error: 'Décision invalide' })
    }

    const commentaire =
      typeof req.body.commentaire === 'string'
        ? req.body.commentaire.trim() || null
        : typeof req.body.commentaire_validation === 'string'
          ? req.body.commentaire_validation.trim() || null
          : null

    const updated = await runTransaction(async (client) => {
      const result = await client.query(
        `
          UPDATE rapports
          SET
            statut = $1,
            validate_par = $2,
            date_validation = NOW(),
            commentaire_validation = $3
          WHERE id = $4
          RETURNING id
        `,
        [decision, req.auth.user.id, commentaire, reportId],
      )

      return result.rows[0] ? result.rows[0].id : null
    })

    if (!updated) {
      return res.status(404).json({ error: 'Rapport introuvable' })
    }

    const result = await pool.query(
      `
        SELECT
          r.*,
          i.titre AS intervention_titre,
          i.description AS intervention_description,
          i.lieu_depart,
          i.lieu_arrivee,
          i.date_depart,
          i.statut AS intervention_statut,
          u.nom AS technicien_nom,
          u.prenom AS technicien_prenom,
          u.email AS technicien_email,
          uv.nom AS validate_nom,
          uv.prenom AS validate_prenom,
          uv.email AS validate_email
        FROM rapports r
        JOIN interventions i ON i.id = r.intervention_id
        JOIN techniciens t ON t.id = r.technicien_id
        JOIN users u ON u.id = t.user_id
        LEFT JOIN users uv ON uv.id = r.validate_par
        WHERE r.id = $1
        LIMIT 1
      `,
      [updated],
    )

    return res.json({ success: true, rapport: formatReportRow(result.rows[0]) })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
})

app.get('/api/technicien/me', requireRole(ROLE_TECHNICIEN), async (req, res) => {
  try {
    const technician = await getTechnicianOrFail(req.auth.user.id)
    return res.json({
      user: req.auth.user,
      technician,
    })
  } catch (error) {
    return res.status(404).json({ error: error.message })
  }
})

app.get('/api/technicien/interventions', requireRole(ROLE_TECHNICIEN), async (req, res) => {
  try {
    const technician = await getTechnicianOrFail(req.auth.user.id)
    const result = await pool.query(
      `
        SELECT i.*
        FROM interventions i
        WHERE i.technicien_id = $1
        ORDER BY i.date_depart DESC, i.id DESC
      `,
      [technician.technician_id],
    )

    return res.json(result.rows.map(formatInterventionRow))
  } catch (error) {
    return res.status(404).json({ error: error.message })
  }
})

app.get('/api/technicien/frais', requireRole(ROLE_TECHNICIEN), async (req, res) => {
  try {
    const technician = await getTechnicianOrFail(req.auth.user.id)
    const result = await pool.query(
      `
        SELECT
          f.*,
          i.titre AS mission,
          i.technicien_id,
          CONCAT(u.nom, ' ', u.prenom) AS technicien,
          v.decision,
          v.date_decision
        FROM frais_deplacement f
        JOIN interventions i ON i.id = f.intervention_id
        JOIN techniciens t ON t.id = i.technicien_id
        JOIN users u ON u.id = t.user_id
        LEFT JOIN LATERAL (
          SELECT decision, date_decision
          FROM validations
          WHERE frais_id = f.id
          ORDER BY date_decision DESC, id DESC
          LIMIT 1
        ) v ON true
        WHERE t.id = $1
        ORDER BY f.date_frais DESC, f.id DESC
      `,
      [technician.technician_id],
    )

    return res.json(result.rows.map(formatExpenseRow))
  } catch (error) {
    return res.status(404).json({ error: error.message })
  }
})

app.post('/api/technicien/frais', requireRole(ROLE_TECHNICIEN), async (req, res) => {
  try {
    const technician = await getTechnicianOrFail(req.auth.user.id)
    const {
      intervention_id: providedInterventionId,
      type_frais,
      montant,
      date_frais,
      description = null,
      devise = 'MAD',
    } = req.body

    if (!type_frais || montant === undefined || !date_frais) {
      return res.status(400).json({
        error: 'type_frais, montant et date_frais sont obligatoires',
      })
    }

    let interventionId = parseInteger(providedInterventionId)
    if (!interventionId) {
      const fallback = await pool.query(
        `
          SELECT id
          FROM interventions
          WHERE technicien_id = $1
          ORDER BY date_depart DESC, id DESC
          LIMIT 1
        `,
        [technician.technician_id],
      )

      interventionId = fallback.rows[0]?.id || null
    }

    if (!interventionId) {
      return res.status(400).json({
        error: 'Aucune intervention disponible pour rattacher cette note de frais',
      })
    }

    const ownershipCheck = await pool.query(
      'SELECT id FROM interventions WHERE id = $1 AND technicien_id = $2 LIMIT 1',
      [interventionId, technician.technician_id],
    )

    if (!ownershipCheck.rows.length) {
      return res.status(403).json({
        error: 'Cette intervention ne vous appartient pas',
      })
    }

    const insertResult = await pool.query(
      `
        INSERT INTO frais_deplacement (
          intervention_id,
          type_frais,
          montant,
          devise,
          date_frais,
          description,
          statut_validation
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `,
      [
        interventionId,
        type_frais,
        montant,
        devise,
        date_frais,
        description,
        EXPENSE_STATUS_PENDING,
      ],
    )

    const createdExpense = insertResult.rows[0]
    return res.status(201).json({
      ...formatExpenseRow({
        ...createdExpense,
        mission: null,
        technicien: null,
        technicien_id: technician.technician_id,
      }),
      message: 'Demande de frais enregistree',
    })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
})

app.get('/api/manager/dashboard', requireRole(ROLE_GESTIONNAIRE), async (req, res) => {
  try {
    const manager = await getManagerOrFail(req.auth.user.id)

    const [
      technicianCount,
      interventionCount,
      expenseCount,
      pendingExpenseCount,
      validatedExpenseCount,
      recentInterventions,
      recentExpenses,
    ] = await Promise.all([
      pool.query('SELECT COUNT(*)::int AS count FROM techniciens'),
      pool.query('SELECT COUNT(*)::int AS count FROM interventions'),
      pool.query('SELECT COUNT(*)::int AS count FROM frais_deplacement'),
      pool.query(
        `SELECT COUNT(*)::int AS count FROM frais_deplacement WHERE statut_validation = $1`,
        [EXPENSE_STATUS_PENDING],
      ),
      pool.query(
        `SELECT COUNT(*)::int AS count FROM frais_deplacement WHERE statut_validation = $1`,
        [EXPENSE_STATUS_VALIDATED],
      ),
      pool.query(
        `
          SELECT
            i.id,
            i.titre,
            i.statut,
            i.date_depart,
            CONCAT(u.nom, ' ', u.prenom) AS technicien
          FROM interventions i
          JOIN techniciens t ON t.id = i.technicien_id
          JOIN users u ON u.id = t.user_id
          ORDER BY i.created_at DESC, i.id DESC
          LIMIT 5
        `,
      ),
      pool.query(
        `
          SELECT
            f.id,
            f.type_frais,
            f.montant,
            f.devise,
            f.date_frais,
            f.statut_validation,
            i.titre AS mission,
            CONCAT(u.nom, ' ', u.prenom) AS technicien
          FROM frais_deplacement f
          JOIN interventions i ON i.id = f.intervention_id
          JOIN techniciens t ON t.id = i.technicien_id
          JOIN users u ON u.id = t.user_id
          ORDER BY f.created_at DESC, f.id DESC
          LIMIT 5
        `,
      ),
    ])

    return res.json({
      manager,
      stats: {
        techniciens: technicianCount.rows[0].count,
        interventions: interventionCount.rows[0].count,
        frais: expenseCount.rows[0].count,
        fraisEnAttente: pendingExpenseCount.rows[0].count,
        fraisValides: validatedExpenseCount.rows[0].count,
      },
      recentInterventions: recentInterventions.rows.map(formatInterventionRow),
      recentExpenses: recentExpenses.rows.map(formatExpenseRow),
    })
  } catch (error) {
    return res.status(404).json({ error: error.message })
  }
})

app.get('/api/manager/expenses', requireRole(ROLE_GESTIONNAIRE), async (req, res) => {
  try {
    const status = typeof req.query.status === 'string' ? req.query.status.trim() : ''
    const params = []
    let whereClause = ''
    if (status) {
      params.push(status)
      whereClause = `WHERE f.statut_validation = $1`
    }

    const result = await pool.query(
      `
        SELECT
          f.*,
          i.titre AS mission,
          i.technicien_id,
          CONCAT(u.nom, ' ', u.prenom) AS technicien,
          v.decision,
          v.date_decision
        FROM frais_deplacement f
        JOIN interventions i ON i.id = f.intervention_id
        JOIN techniciens t ON t.id = i.technicien_id
        JOIN users u ON u.id = t.user_id
        LEFT JOIN LATERAL (
          SELECT decision, date_decision
          FROM validations
          WHERE frais_id = f.id
          ORDER BY date_decision DESC, id DESC
          LIMIT 1
        ) v ON true
        ${whereClause}
        ORDER BY f.created_at DESC, f.id DESC
      `,
      params,
    )

    return res.json(result.rows.map(formatExpenseRow))
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
})

app.patch('/api/manager/expenses/pay', requireRole(ROLE_GESTIONNAIRE), async (req, res) => {
  try {
    const { ids = [], reference = null } = req.body
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'ids doit contenir au moins un element' })
    }

    const expenseIds = ids.map(parseInteger).filter(Boolean)
    if (expenseIds.length === 0) {
      return res.status(400).json({ error: 'Aucun identifiant valide fourni' })
    }

    const manager = await getManagerOrFail(req.auth.user.id)

    const updated = await pool.query(
      `
        UPDATE frais_deplacement
        SET statut_validation = $1
        WHERE id = ANY($2::int[])
        RETURNING id
      `,
      [EXPENSE_STATUS_PAID, expenseIds],
    )

    await pool.query(
      `
        INSERT INTO validations (frais_id, gestionnaire_id, decision, commentaire)
        SELECT f.id, $1, $2, $3
        FROM frais_deplacement f
        WHERE f.id = ANY($4::int[])
      `,
      [
        manager.manager_id,
        EXPENSE_STATUS_PAID,
        reference ? `Paiement effectue. Reference: ${reference}` : 'Paiement effectue',
        expenseIds,
      ],
    )

    return res.json({
      message: 'Paiement enregistre',
      updatedIds: updated.rows.map((row) => row.id),
    })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
})

pool
  .query('SELECT 1')
  .then(() => console.log('Connecte a PostgreSQL'))
  .catch((error) => console.error('Erreur de connexion :', error))

ensureAuthConfig()
  .then((config) => {
    authConfig = config
    if (config) {
      console.log(
        `Auth config: table=${config.tableName}, login=${config.loginColumn}, password=${config.passwordColumn}`,
      )
    } else {
      console.error('Auth config introuvable. Verifie le schema de la base.')
    }
  })
  .catch((error) => console.error('Erreur lors de la detection du schema auth :', error))

app.listen(3000, () => {
  console.log('Serveur lance sur http://localhost:3000')
})
