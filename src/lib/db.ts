
import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

const caBase64 = process.env.DB_SSL_CA_BASE64;

const ssl = caBase64
    ? {
          ca: Buffer.from(caBase64, 'base64').toString('utf8'),
          rejectUnauthorized: true,
      }
    : undefined;

if (ssl && !ssl.ca.includes('-----BEGIN CERTIFICATE-----')) {
    throw new Error('MySQL CA certificate is invalid');
}

const db = mysql.createPool({
    host: process.env.DB_HOST!,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER!,
    password: process.env.DB_PASS!,
    database: process.env.DB_NAME!,

    ...(ssl ? { ssl } : {}),

    waitForConnections: true,
    connectionLimit: 5,
    maxIdle: 2,
    idleTimeout: 60000,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
});

export default db;
