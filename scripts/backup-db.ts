#!/usr/bin/env tsx

import { backupDatabase } from '../server/utils/dbBackup';

async function main() {
  try {
    console.log('Starting database backup...');
    const backupPath = await backupDatabase();
    console.log(`✓ Database backed up successfully to: ${backupPath}`);
    process.exit(0);
  } catch (error) {
    console.error('✗ Database backup failed:', error);
    process.exit(1);
  }
}

main();
