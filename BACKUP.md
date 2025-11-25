# Guía de Backup y Restauración de Base de Datos

Esta guía explica cómo usar los scripts de backup y restauración de la base de datos PostgreSQL.

## Tabla de Contenidos

- [Requisitos](#requisitos)
- [Comandos de Backup](#comandos-de-backup)
- [Comandos de Restauración](#comandos-de-restauración)
- [Configuración en Producción](#configuración-en-producción)
- [Mejores Prácticas](#mejores-prácticas)

## Requisitos

- `postgresql-client` instalado en el servidor
- Acceso a la base de datos PostgreSQL
- Variables de entorno configuradas en `.env`

Para instalar postgresql-client en Ubuntu/Debian:

```bash
sudo apt-get update
sudo apt-get install postgresql-client
```

## Comandos de Backup

### Formatos Disponibles

1. **Custom** (Recomendado para producción)
   - Formato comprimido y optimizado
   - Restauración rápida
   - Soporta restauración selectiva

```bash
npm run backup:custom
# o simplemente
npm run backup
```

2. **SQL Plano**
   - Archivo de texto legible
   - Útil para inspección manual
   - Mayor tamaño

```bash
npm run backup:sql
```

3. **TAR**
   - Formato tar sin comprimir
   - Útil para transferencias

```bash
npm run backup:tar
```

4. **Directory**
   - Múltiples archivos en un directorio
   - Útil para bases de datos muy grandes

```bash
npm run backup:dir
```

### Variables de Entorno

Puedes personalizar el comportamiento del backup:

```bash
# Directorio donde guardar backups (default: ./backups)
BACKUP_DIR=/ruta/a/backups npm run backup

# Días de retención (default: 30)
RETENTION_DAYS=7 npm run backup

# Formato personalizado
BACKUP_FORMAT=sql npm run backup
```

### Archivos Generados

Los backups se guardan con el formato:

```
backups/backup_YYYY-MM-DD_HH-MM-SS.<formato>
```

Ejemplos:
- `backups/backup_2024-01-15_10-30-00.custom`
- `backups/backup_2024-01-15_10-30-00.sql`
- `backups/backup_2024-01-15_10-30-00.tar`
- `backups/backup_2024-01-15_10-30-00/` (directorio)

## Comandos de Restauración

### Restauración Básica

Para restaurar un backup en la base de datos principal (la del `.env`):

```bash
npm run restore backups/backup_2024-01-15_10-30-00.custom
```

### Restauración en Base de Datos Alternativa

**IMPORTANTE**: Para probar backups en producción, siempre usa una base de datos de prueba:

#### Opción 1: Variable de entorno

```bash
RESTORE_DB_URL="postgresql://user:pass@localhost:5432/test_db" npm run restore backups/backup_2024-01-15_10-30-00.custom
```

#### Opción 2: Argumento directo

```bash
node scripts/restore-database.js backups/backup_2024-01-15_10-30-00.custom "postgresql://user:pass@localhost:5432/test_db"
```

### Crear Base de Datos de Prueba

Para crear una base de datos de prueba:

```bash
# Conectarse a PostgreSQL
psql -h localhost -U postgres

# Crear base de datos de prueba
CREATE DATABASE test_juveconf;

# Salir
\q
```

Luego restaurar el backup en esa base de datos:

```bash
RESTORE_DB_URL="postgresql://user:password@localhost:5432/test_juveconf" npm run restore backups/backup_2024-01-15_10-30-00.custom
```

## Configuración en Producción

### 1. Backups Automáticos con Cron

Edita el crontab:

```bash
crontab -e
```

Agrega una de estas líneas según la frecuencia deseada:

```bash
# Backup diario a las 2:00 AM
0 2 * * * cd /var/www/juveconf-api && /root/.nvm/versions/node/v20.18.2/bin/node scripts/backup-database.js >> /var/log/backup.log 2>&1

# Backup cada 6 horas
0 */6 * * * cd /var/www/juveconf-api && /root/.nvm/versions/node/v20.18.2/bin/node scripts/backup-database.js >> /var/log/backup.log 2>&1

# Backup diario a las 3:00 AM con retención de 7 días
0 3 * * * cd /var/www/juveconf-api && RETENTION_DAYS=7 /root/.nvm/versions/node/v20.18.2/bin/node scripts/backup-database.js >> /var/log/backup.log 2>&1
```

**Nota**: Asegúrate de usar la ruta completa a node. Para encontrarla:

```bash
which node
# o si usas nvm:
source ~/.nvm/nvm.sh && which node
```

### 2. Script de Backup con Notificación

Crea un script que haga backup y te notifique:

```bash
#!/bin/bash
# /var/www/juveconf-api/scripts/backup-with-notification.sh

cd /var/www/juveconf-api
source ~/.nvm/nvm.sh

if node scripts/backup-database.js; then
    echo "Backup exitoso $(date)" | mail -s "Backup JuveConf OK" admin@example.com
else
    echo "Backup falló $(date)" | mail -s "Backup JuveConf FALLÓ" admin@example.com
fi
```

### 3. Backup Remoto con rsync

Para enviar backups a un servidor remoto:

```bash
#!/bin/bash
# scripts/backup-remote.sh

# Hacer backup local
cd /var/www/juveconf-api
node scripts/backup-database.js

# Sincronizar con servidor remoto
rsync -avz --delete backups/ user@backup-server:/backups/juveconf/
```

Agrega a cron:

```bash
0 4 * * * /var/www/juveconf-api/scripts/backup-remote.sh >> /var/log/backup-remote.log 2>&1
```

### 4. Usar con PM2 (Recomendado)

Si usas PM2, puedes configurar backups en el ecosystem:

```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    // ... tu aplicación
  ],
  // Scripts programados
  cron_restart: {
    name: 'backup',
    script: 'scripts/backup-database.js',
    cron_restart: '0 2 * * *', // Diario a las 2 AM
    autorestart: false,
    watch: false,
  }
};
```

## Mejores Prácticas

### 1. Estrategia de Backup

**Recomendación para Producción:**

- **Backups frecuentes**: Cada 6 horas durante el día
- **Backups nocturnos**: 1 vez por día a las 2-3 AM
- **Backups semanales**: Mantener backups semanales por 3 meses
- **Backups mensuales**: Mantener backups mensuales por 1 año

Ejemplo de configuración de cron:

```bash
# Backup cada 6 horas (retención 2 días)
0 */6 * * * cd /var/www/juveconf-api && RETENTION_DAYS=2 BACKUP_DIR=/var/backups/hourly node scripts/backup-database.js

# Backup diario (retención 30 días)
0 2 * * * cd /var/www/juveconf-api && RETENTION_DAYS=30 BACKUP_DIR=/var/backups/daily node scripts/backup-database.js

# Backup semanal cada domingo (retención 90 días)
0 3 * * 0 cd /var/www/juveconf-api && RETENTION_DAYS=90 BACKUP_DIR=/var/backups/weekly node scripts/backup-database.js

# Backup mensual el día 1 (retención 365 días)
0 4 1 * * cd /var/www/juveconf-api && RETENTION_DAYS=365 BACKUP_DIR=/var/backups/monthly node scripts/backup-database.js
```

### 2. Monitoreo

Verifica que los backups se están ejecutando:

```bash
# Ver logs del último backup
tail -f /var/log/backup.log

# Verificar backups recientes
ls -lth backups/ | head -10

# Verificar espacio en disco
df -h
```

### 3. Pruebas de Restauración

**IMPORTANTE**: Prueba tus backups regularmente:

```bash
# 1. Crear base de datos de prueba
sudo -u postgres psql -c "CREATE DATABASE test_restore;"

# 2. Restaurar el backup más reciente
LATEST_BACKUP=$(ls -t backups/*.custom | head -1)
RESTORE_DB_URL="postgresql://user:pass@localhost:5432/test_restore" npm run restore $LATEST_BACKUP

# 3. Verificar los datos
sudo -u postgres psql test_restore -c "SELECT COUNT(*) FROM \"User\";"

# 4. Eliminar base de datos de prueba
sudo -u postgres psql -c "DROP DATABASE test_restore;"
```

### 4. Seguridad

- **Permisos**: Los archivos de backup deben tener permisos restrictivos:

```bash
chmod 600 backups/*
chown www-data:www-data backups/*
```

- **Cifrado**: Para backups muy sensibles, considera cifrarlos:

```bash
# Cifrar backup
gpg --symmetric --cipher-algo AES256 backups/backup_2024-01-15_10-30-00.custom

# Descifrar cuando necesites restaurar
gpg backups/backup_2024-01-15_10-30-00.custom.gpg
```

- **Almacenamiento externo**: No confíes solo en backups locales. Usa:
  - AWS S3
  - Google Cloud Storage
  - Servidor de backups dedicado
  - Dropbox/Google Drive (para desarrollo)

### 5. Espacio en Disco

Monitorea el espacio:

```bash
# Ver tamaño de backups
du -sh backups/

# Ver backups más grandes
du -h backups/* | sort -h
```

### 6. Documentación de Incidentes

Mantén un log de cuándo restauras desde backups:

```bash
# scripts/restore-with-log.sh
#!/bin/bash

BACKUP_FILE=$1
REASON=$2

echo "$(date): Restaurando $BACKUP_FILE - Razón: $REASON" >> restore_log.txt

if npm run restore "$BACKUP_FILE"; then
    echo "$(date): Restauración exitosa" >> restore_log.txt
else
    echo "$(date): Restauración falló" >> restore_log.txt
fi
```

Uso:

```bash
./scripts/restore-with-log.sh backups/backup_2024-01-15_10-30-00.custom "Recuperación de datos corruptos"
```

## Solución de Problemas

### Error: "pg_dump: command not found"

```bash
# Instalar postgresql-client
sudo apt-get update
sudo apt-get install postgresql-client
```

### Error: "PGPASSWORD authentication failed"

Verifica que tu `DATABASE_URL` en el `.env` sea correcta:

```bash
DATABASE_URL="postgresql://user:password@host:port/database"
```

### Backup muy lento

Si los backups son muy lentos, considera:

1. Usar formato `custom` (más rápido que SQL plano)
2. Ejecutar backups durante horas de bajo tráfico
3. Verificar la velocidad del disco

### Espacio en disco lleno

```bash
# Reducir retención de backups
RETENTION_DAYS=7 npm run backup

# Mover backups antiguos a almacenamiento externo
rsync -av backups/ user@backup-server:/backups/
rm -rf backups/backup_2024-01-*
```

## Contacto y Soporte

Para problemas o dudas sobre los backups, contacta al equipo de desarrollo.
