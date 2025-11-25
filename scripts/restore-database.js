#!/usr/bin/env node

/**
 * Script de Restauración de Base de Datos PostgreSQL
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

// Detectar formato del backup
function detectBackupFormat(filePath) {
  if (fs.statSync(filePath).isDirectory()) {
    return 'directory';
  }

  const ext = path.extname(filePath);
  switch (ext) {
    case '.sql':
      return 'sql';
    case '.custom':
      return 'custom';
    case '.tar':
      return 'tar';
    default:
      throw new Error(`No se pudo detectar el formato del archivo: ${filePath}`);
  }
}

// Restaurar backup
function performRestore(dbConfig, backupFile, format) {
  log.info(`Iniciando restauración desde formato: ${format}`);
  log.info(`Archivo de entrada: ${backupFile}`);

  const env = {
    ...process.env,
    PGPASSWORD: dbConfig.password,
  };

  const baseArgs = [
    `-h ${dbConfig.host}`,
    `-p ${dbConfig.port}`,
    `-U ${dbConfig.user}`,
    `-d ${dbConfig.database}`,
  ];

  let command;

  switch (format) {
    case 'sql':
      command = `psql ${baseArgs.join(' ')} < "${backupFile}"`;
      break;
    case 'custom':
      command = `pg_restore ${baseArgs.join(' ')} --no-owner --no-acl --clean --if-exists "${backupFile}"`;
      break;
    case 'tar':
      command = `pg_restore ${baseArgs.join(' ')} --no-owner --no-acl --clean --if-exists -F t "${backupFile}"`;
      break;
    case 'directory':
      command = `pg_restore ${baseArgs.join(' ')} --no-owner --no-acl --clean --if-exists -F d "${backupFile}"`;
      break;
  }

  try {
    log.warning('Esta operación sobrescribirá la base de datos actual');
    log.warning('Asegúrate de tener un backup antes de continuar');
    console.log();

    execSync(command, { env, stdio: 'inherit' });
    log.success('Restauración completada exitosamente');
    return true;
  } catch (error) {
    log.error('Restauración falló');
    log.error(error.message);
    return false;
  }
}

// Verificar requisitos
function checkRequirements() {
  try {
    execSync('pg_restore --version', { stdio: 'ignore' });
  } catch (error) {
    log.error('pg_restore no está instalado. Por favor instala postgresql-client');
    process.exit(1);
  }
}

// Mostrar uso
function showUsage() {
  console.log(`
Script de Restauración de Base de Datos PostgreSQL

USO:
  node scripts/restore-database.js <archivo_backup> [database_url]

ARGUMENTOS:
  archivo_backup    Ruta al archivo o directorio de backup a restaurar
  database_url      (Opcional) URL de base de datos alternativa para restaurar
                    Si no se proporciona, usa DATABASE_URL del .env

VARIABLES DE ENTORNO:
  DATABASE_URL      URL de conexión a PostgreSQL (requerido si no se pasa database_url)
  RESTORE_DB_URL    URL alternativa para restauración (opcional)

EJEMPLOS:
  # Restaurar en la base de datos principal (desde .env)
  node scripts/restore-database.js backups/backup_2024-01-15_10-30-00.custom

  # Restaurar en base de datos de prueba (variable de entorno)
  RESTORE_DB_URL="postgresql://user:pass@localhost:5432/test_db" node scripts/restore-database.js backups/backup_2024-01-15_10-30-00.custom

  # Restaurar en base de datos de prueba (argumento)
  node scripts/restore-database.js backups/backup_2024-01-15_10-30-00.custom "postgresql://user:pass@localhost:5432/test_db"

  # Usando npm scripts
  npm run restore backups/backup_2024-01-15_10-30-00.custom
  RESTORE_DB_URL="postgresql://user:pass@localhost:5432/test_db" npm run restore backups/backup_2024-01-15_10-30-00.custom

ADVERTENCIA:
  Esta operación sobrescribirá la base de datos especificada.
  Asegúrate de usar una base de datos de prueba o tener un backup antes de continuar.
`);
}

// Función principal
function main() {
  // Mostrar ayuda si se solicita
  if (
    process.argv.includes('--help') ||
    process.argv.includes('-h') ||
    process.argv.length < 3
  ) {
    showUsage();
    process.exit(process.argv.length < 3 ? 1 : 0);
  }

  const backupFile = process.argv[2];
  const customDbUrl = process.argv[3] || process.env.RESTORE_DB_URL;

  console.log('\n=== Iniciando Restauración de Base de Datos ===');
  console.log();

  // Verificar requisitos
  checkRequirements();

  try {
    // Verificar que el archivo existe
    if (!fs.existsSync(backupFile)) {
      throw new Error(`Archivo de backup no encontrado: ${backupFile}`);
    }

    // Detectar formato
    const format = detectBackupFormat(backupFile);
    log.info(`Formato detectado: ${format}`);
    console.log();

    // Parsear DATABASE_URL (usar custom URL si se proporciona, sino usar la del .env)
    const dbUrl = customDbUrl || process.env.DATABASE_URL;
    const dbConfig = parseDatabaseUrl(dbUrl);
    log.info(`Base de datos: ${dbConfig.database}`);
    log.info(`Host: ${dbConfig.host}:${dbConfig.port}`);
    log.info(`Usuario: ${dbConfig.user}`);
    console.log();

    // Realizar restauración
    if (performRestore(dbConfig, backupFile, format)) {
      console.log();
      log.success('=== Restauración completada ===');
      process.exit(0);
    } else {
      console.log();
      log.error('=== Restauración falló ===');
      process.exit(1);
    }
  } catch (error) {
    log.error(error.message);
    console.log();
    log.error('=== Restauración falló ===');
    process.exit(1);
  }
}

// Ejecutar
main();
