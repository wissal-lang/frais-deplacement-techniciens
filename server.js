import express from "express";
import pg from "pg";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();
const { Pool } = pg;

const app = express();
app.use(express.json());
app.use(cors());

const AUTH_TABLE_CANDIDATES = ["users", "techniciens"];
const LOGIN_COLUMN_CANDIDATES = ["email", "mail", "adresse_email", "username", "login"];
const PASSWORD_COLUMN_CANDIDATES = ["mot_de_passe", "password", "mdp"];
let authConfig = null;
const ROLE_TECHNICIEN = "TECHNICIEN";
const ROLE_GESTIONNAIRE = "GESTIONNAIRE";

function looksLikeBcryptHash(value) {
    return typeof value === "string" && /^\$2[aby]\$\d{2}\$/.test(value);
}

async function verifyPassword(plainPassword, storedPassword) {
    if (typeof storedPassword !== "string") return false;
    if (looksLikeBcryptHash(storedPassword)) {
        return bcrypt.compare(plainPassword, storedPassword);
    }
    // Compat mode for legacy plain-text passwords stored in DB.
    return plainPassword === storedPassword;
}

function normalizeRole(value) {
    return typeof value === "string" ? value.trim().toUpperCase() : "";
}

function quoteIdent(identifier) {
    return `"${String(identifier).replace(/"/g, "\"\"")}"`;
}

async function resolveAuthConfig() {
    for (const tableName of AUTH_TABLE_CANDIDATES) {
        const columnsResult = await pool.query(
            "SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1",
            [tableName]
        );

        if (!columnsResult.rows.length) continue;

        const availableColumns = new Set(columnsResult.rows.map((row) => row.column_name));
        const loginColumn = LOGIN_COLUMN_CANDIDATES.find((col) => availableColumns.has(col));
        const passwordColumn = PASSWORD_COLUMN_CANDIDATES.find((col) => availableColumns.has(col));

        if (loginColumn && passwordColumn) {
            return { tableName, loginColumn, passwordColumn };
        }
    }
    return null;
}

// 🔌 Connexion PostgreSQL
const pool = new Pool({
    user: process.env.DB_USER || "postgres",
    host: process.env.DB_HOST || "localhost",
    database: process.env.DB_NAME || "gestion_frais",
    password: process.env.DB_PASSWORD || "",
    port: Number(process.env.DB_PORT) || 5432,
});

//  Test de connexion
pool.query("SELECT 1")
    .then(() => console.log("Connecte a PostgreSQL"))
    .catch(err => console.error(" Erreur de connexion :", err));

resolveAuthConfig()
    .then((config) => {
        authConfig = config;
        if (config) {
            console.log(`Auth config: table=${config.tableName}, login=${config.loginColumn}, password=${config.passwordColumn}`);
        } else {
            console.error("Auth config introuvable. Verifie le schema de la base.");
        }
    })
    .catch((err) => console.error("Erreur lors de la detection du schema auth :", err));


async function handleLogin(req, res, expectedRole) {
    const { email, mot_de_passe } = req.body;

    // Vérification basique
    if (!email || !mot_de_passe) {
        return res.status(400).json({ message: "Champs requis manquants" });
    }

    try {
        if (!authConfig) {
            authConfig = await resolveAuthConfig();
        }

        if (!authConfig) {
            return res.status(500).json({
                error: "Configuration login introuvable dans la base (table/colonnes)."
            });
        }

        const loginQuery = `SELECT * FROM ${quoteIdent(authConfig.tableName)} WHERE ${quoteIdent(authConfig.loginColumn)} = $1 LIMIT 1`;
        const result = await pool.query(
            loginQuery,
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ message: "Utilisateur non trouvé" });
        }

        const user = result.rows[0];
        const storedPassword = user[authConfig.passwordColumn];
        const userRole = normalizeRole(user.role);

        const valid = await verifyPassword(mot_de_passe, storedPassword);

        if (!valid) {
            return res.status(401).json({ message: "Mot de passe incorrect" });
        }

        if (expectedRole && userRole !== expectedRole) {
            return res.status(403).json({ message: "Accès refusé pour ce rôle" });
        }

        // Génération token
        const jwtSecret = process.env.JWT_SECRET || "dev_secret_change_me";
        const token = jwt.sign({ id: user.id, role: userRole || null }, jwtSecret, { expiresIn: "12h" });

        res.json({
            message: "Connexion réussie",
            token,
            role: userRole || null
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

// =========================
//  ROUTE LOGIN
// =========================
app.post("/login", async (req, res) => {
    return handleLogin(req, res, null);
});

app.post("/login/technicien", async (req, res) => {
    return handleLogin(req, res, ROLE_TECHNICIEN);
});

app.post("/login/gestionnaire", async (req, res) => {
    return handleLogin(req, res, ROLE_GESTIONNAIRE);
});


// =========================
//  TEST DB
// =========================
app.get("/test-db", async (req, res) => {
    try {
        const result = await pool.query("SELECT NOW()");
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// =========================
//  LANCEMENT
// =========================
app.listen(3000, () => {
    console.log(" Serveur lancé sur http://localhost:3000");
});