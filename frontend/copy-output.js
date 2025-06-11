const fs = require('fs-extra');
const path = require('path');

async function copyOutput() {
  try {
    const backendDir = path.join(__dirname, '../backend/frontend');
    const standaloneDir = path.join(__dirname, '.next/standalone');
    const staticDir = path.join(__dirname, '.next/static');
    const publicDir = path.join(__dirname, 'public');
    
    // Create backend/frontend directory if it doesn't exist
    await fs.ensureDir(backendDir);
    
    // Copy standalone files
    if (await fs.pathExists(standaloneDir)) {
      console.log('Copying standalone files...');
      await fs.copy(standaloneDir, backendDir, { recursive: true });
    }
    
    // Ensure .next/static exists in the target
    const targetStaticDir = path.join(backendDir, '.next/static');
    await fs.ensureDir(path.dirname(targetStaticDir));
    
    // Copy static files
    if (await fs.pathExists(staticDir)) {
      console.log('Copying static files...');
      await fs.copy(staticDir, targetStaticDir, { recursive: true });
    }
    
    // Copy public files
    if (await fs.pathExists(publicDir)) {
      console.log('Copying public files...');
      await fs.copy(publicDir, path.join(backendDir, 'public'), { recursive: true });
    }
    
    console.log('All files copied successfully!');
  } catch (error) {
    console.error('Error copying files:', error);
    process.exit(1);
  }
}

copyOutput();
