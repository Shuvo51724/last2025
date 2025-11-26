import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import logger from '../config/logger';
import { config } from '../config/env';

const execAsync = promisify(exec);

export async function backupDatabase(): Promise<string> {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(process.cwd(), 'backups');
    
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const backupPath = path.join(backupDir, `dob-backup-${timestamp}.db`);
    
    const dbPath = config.DB_PATH;
    
    if (!fs.existsSync(dbPath)) {
      throw new Error(`Database file not found at ${dbPath}`);
    }

    fs.copyFileSync(dbPath, backupPath);
    
    logger.info(`Database backed up successfully to ${backupPath}`);
    
    cleanOldBackups(backupDir);
    
    return backupPath;
  } catch (error) {
    logger.error('Database backup failed', { error });
    throw error;
  }
}

function cleanOldBackups(backupDir: string, maxBackups: number = 30): void {
  try {
    const files = fs.readdirSync(backupDir)
      .filter(file => file.startsWith('dob-backup-') && file.endsWith('.db'))
      .map(file => ({
        name: file,
        path: path.join(backupDir, file),
        time: fs.statSync(path.join(backupDir, file)).mtime.getTime(),
      }))
      .sort((a, b) => b.time - a.time);

    if (files.length > maxBackups) {
      const filesToDelete = files.slice(maxBackups);
      filesToDelete.forEach(file => {
        fs.unlinkSync(file.path);
        logger.info(`Deleted old backup: ${file.name}`);
      });
    }
  } catch (error) {
    logger.error('Failed to clean old backups', { error });
  }
}

export async function restoreDatabase(backupPath: string): Promise<void> {
  try {
    if (!fs.existsSync(backupPath)) {
      throw new Error(`Backup file not found at ${backupPath}`);
    }

    const dbPath = config.DB_PATH;
    const tempPath = `${dbPath}.temp`;
    
    fs.copyFileSync(dbPath, tempPath);
    
    try {
      fs.copyFileSync(backupPath, dbPath);
      logger.info(`Database restored successfully from ${backupPath}`);
      
      fs.unlinkSync(tempPath);
    } catch (error) {
      fs.copyFileSync(tempPath, dbPath);
      fs.unlinkSync(tempPath);
      throw error;
    }
  } catch (error) {
    logger.error('Database restore failed', { error });
    throw error;
  }
}
