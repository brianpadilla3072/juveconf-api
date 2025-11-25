#!/usr/bin/env node

/**
 * Script de Backup de Base de Datos PostgreSQL
 * Soporta múltiples formatos: SQL plano, custom, tar, y directory
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Cargar variables de entorno desde .env
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...values] = trimmed.split('=');
        if (key && values.length > 0) {
          const value = values.join('=').replace(/^["']|["']$/g, '');
          if (!process.env[key]) {
            process.env[key] = value;
          }
        }
      }
    });
  }
}

loadEnv();

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

const log = {
  info: (msg) => console.log(`${colors.blue}[INFO]${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}[SUCCESS]${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}[WARNING]${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}[ERROR]${colors.reset} ${msg}`),
};

// Configuración
const FORMAT = process.env.BACKUP_FORMAT || 'custom';
const BACKUP_DIR = process.env.BACKUP_DIR || './backups';
const RETENTION_DAYS = parseInt(process.env.RETENTION_DAYS || '30', 10);

// Parsear DATABASE_URL
function parseDatabaseUrl(url) {
  if (!url) {
    throw new Error('DATABASE_URL no encontrada en las variables de entorno');
  }

  // Formato: postgresql://user:password@host:port/database
  const regex = /postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/;
  const match = url.match(regex);

  if (!match) {
    throw new Error('Formato de DATABASE_URL inválido');
  }

  return {
    user: match[1],
    password: match[2],
    host: match[3],
    port: match[4],
    database: match[5],
  };
}

// Crear directorio de backups
function createBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    log.info(`Creando directorio de backups: ${BACKUP_DIR}`);
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
}

// Obtener nombre de archivo de backup
function getBackupFilename(format) {
  const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, '-')
    .replace('T', '_')
    .substring(0, 19);
  const filename = `backup_${timestamp}`;

  switch (format) {
    case 'sql':
      return path.join(BACKUP_DIR, `${filename}.sql`);
    case 'custom':
      return path.join(BACKUP_DIR, `${filename}.custom`);
    case 'tar':
      return path.join(BACKUP_DIR, `${filename}.tar`);
    case 'directory':
      return path.join(BACKUP_DIR, filename);
    default:
      throw new Error(`Formato desconocido: ${format}`);
  }
}

// Realizar backup
function performBackup(dbConfig, backupFile, format) {
  log.info(`Iniciando backup en formato: ${format}`);
  log.info(`Archivo de salida: ${backupFile}`);

  const env = {
    ...process.env,
    PGPASSWORD: dbConfig.password,
  };

  const baseArgs = [
    `-h ${dbConfig.host}`,
    `-p ${dbConfig.port}`,
    `-U ${dbConfig.user}`,
    `-d ${dbConfig.database}`,
    '--no-owner',
    '--no-acl',
  ];

  let command;

  switch (format) {
    case 'sql':
      command = `pg_dump ${baseArgs.join(' ')} -F p > "${backupFile}"`;
      break;
    case 'custom':
      command = `pg_dump ${baseArgs.join(' ')} -F c -f "${backupFile}"`;
      break;
    case 'tar':
      command = `pg_dump ${baseArgs.join(' ')} -F t -f "${backupFile}"`;
      break;
    case 'directory':
      if (!fs.existsSync(backupFile)) {
        fs.mkdirSync(backupFile, { recursive: true });
      }
      command = `pg_dump ${baseArgs.join(' ')} -F d -f "${backupFile}"`;
      break;
  }

  try {
    execSync(command, { env, stdio: 'inherit' });
    const stats = fs.statSync(backupFile);
    const size = (stats.size / 1024 / 1024).toFixed(2);
    log.success('Backup completado exitosamente');
    log.info(`Tamaño: ${size} MB`);
    return true;
  } catch (error) {
    log.error('Backup falló');
    log.error(error.message);
    return false;
  }
}

// Limpiar backups antiguos
function cleanupOldBackups() {
  log.info(`Limpiando backups antiguos (más de ${RETENTION_DAYS} días)...`);

  const now = Date.now();
  const retentionMs = RETENTION_DAYS * 24 * 60 * 60 * 1000;
  let deleted = 0;

  try {
    const files = fs.readdirSync(BACKUP_DIR);

    files.forEach((file) => {
      if (file.startsWith('backup_')) {
        const filePath = path.join(BACKUP_DIR, file);
        const stats = fs.statSync(filePath);
        const age = now - stats.mtimeMs;

        if (age > retentionMs) {
          log.info(`Eliminando: ${filePath}`);
          if (stats.isDirectory()) {
            fs.rmSync(filePath, { recursive: true, force: true });
          } else {
            fs.unlinkSync(filePath);
          }
          deleted++;
        }
      }
    });

    if (deleted > 0) {
      log.info(`Se eliminaron ${deleted} backup(s) antiguo(s)`);
    } else {
      log.info('No hay backups antiguos para eliminar');
    }
  } catch (error) {
    log.warning(`Error al limpiar backups antiguos: ${error.message}`);
  }
}

// Verificar requisitos
function checkRequirements() {
  try {
    execSync('pg_dump --version', { stdio: 'ignore' });
  } catch (error) {
    log.error('pg_dump no está instalado. Por favor instala postgresql-client');
    process.exit(1);
  }
}

// Mostrar uso
function showUsage() {
  console.log(`
Script de Backup de Base de Datos PostgreSQL

VARIABLES DE ENTORNO:
  DATABASE_URL      URL de conexión a PostgreSQL (requerido)
  BACKUP_FORMAT     Formato del backup (sql|custom|tar|directory) [default: custom]
  BACKUP_DIR        Directorio donde guardar backups [default: ./backups]
  RETENTION_DAYS    Días de retención de backups [default: 30]

FORMATOS:
  sql        SQL plano (texto legible)
  custom     Formato custom de PostgreSQL (comprimido, recomendado)
  tar        Formato tar
  directory  Directorio con archivos separados

EJEMPLOS:
  # Backup en formato custom (recomendado)
  npm run backup:custom

  # Backup en formato SQL plano
  npm run backup:sql

  # Backup en formato tar
  npm run backup:tar

  # Backup en formato directorio
  npm run backup:dir

  # Backup personalizado
  BACKUP_FORMAT=custom RETENTION_DAYS=7 node scripts/backup-database.js
`);
}

// Función principal
function main() {
  // Mostrar ayuda si se solicita
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    showUsage();
    process.exit(0);
  }

  console.log('\n=== Iniciando Backup de Base de Datos ===');
  log.info(`Formato: ${FORMAT}`);
  log.info(`Directorio: ${BACKUP_DIR}`);
  log.info(`Retención: ${RETENTION_DAYS} días`);
  console.log();

  // Verificar requisitos
  checkRequirements();

  try {
    // Parsear DATABASE_URL
    const dbConfig = parseDatabaseUrl(process.env.DATABASE_URL);
    log.info(`Base de datos: ${dbConfig.database}`);
    log.info(`Host: ${dbConfig.host}:${dbConfig.port}`);
    log.info(`Usuario: ${dbConfig.user}`);
    console.log();

    // Crear directorio de backups
    createBackupDir();

    // Obtener nombre de archivo
    const backupFile = getBackupFilename(FORMAT);

    // Realizar backup
    if (performBackup(dbConfig, backupFile, FORMAT)) {
      console.log();
      cleanupOldBackups();
      console.log();
      log.success('=== Backup completado ===');
      log.info(`Ubicación: ${backupFile}`);
      process.exit(0);
    } else {
      console.log();
      log.error('=== Backup falló ===');
      process.exit(1);
    }
  } catch (error) {
    log.error(error.message);
    console.log();
    log.error('=== Backup falló ===');
    process.exit(1);
  }
}

// Ejecutar
main();
