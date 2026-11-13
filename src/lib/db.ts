import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

const ca = process.env.DB_SSL_CA
    ? process.env.DB_SSL_CA.replace(/\\n/g, '\n')
    : fs.readFileSync(
        path.join(process.cwd(), 'certs', 'ca.pem'),
        'utf8'
    );

const db = mysql.createPool({
    host: process.env.DB_HOST!,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER!,
    password: process.env.DB_PASS!,
    database: process.env.DB_NAME!,

    ssl: {
        ca,
        rejectUnauthorized: true,
    },

    waitForConnections: true,
    connectionLimit: 5,
    maxIdle: 2,
    idleTimeout: 60000,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
});

export default db;