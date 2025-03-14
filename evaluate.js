// vite_server_and_command.mjs
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


// --- Configuration ---
const commandToRun = 'npx playwright test'; //  Your command (e.g., 'npm run test', 'cypress run', etc.)

async function startViteServer(projectRoot) {
  return new Promise((resolve, reject) => {
    const viteProcess = spawn('npm', ['run', 'dev:pw'], {
      cwd: projectRoot, // Important: Set the working directory
      // stdio: 'inherit',   // Show Vite output in the console
      stdio: 'pipe',
      shell: true // For windows to understand `npm`
    });

    viteProcess.on('error', (err) => {
      reject(new Error(`Failed to start Vite server: ${err}`));
    });

    // Wait for the server to be ready.  We listen for the standard Vite output message.
    viteProcess.stdout.on('data', (data) => {
      process.stdout.write(data);
      if (data.toString().includes(`ready in`)) { // or 'running at'
        resolve(viteProcess);
      }
    });
    setTimeout(resolve, 2000);

    // If vite fails to start, it's an immediate error
    viteProcess.on('exit', (code) => {
      if (code !== 0 && code !== null) {
        reject(new Error(`Vite server exited unexpectedly with code ${code}`));
      }
    });
  });
}

async function runCommand(command, projectRoot) {
  return new Promise((resolve, reject) => {
    const commandProcess = spawn(command, {
      cwd: projectRoot,
      stdio: 'pipe',
      shell: true,
    });

    commandProcess.stdout.on('data', (data) => {
      process.stdout.write(data);
    });

    commandProcess.on('exit', (code) => {
      if (code === 0 || code === null) {
        resolve();
      } else {
        reject(new Error(`Command "${command}" failed with code ${code}`));
      }
    });

    commandProcess.on('error', (err) => {
      process.error.write(err);
      reject(new Error(`Failed to execute "${command}": ${err}`));
    });
  });
}

async function main() {
  const folderName = process.argv[2];

  if (!folderName) {
    console.error('Error: Please provide a folder name as an argument.');
    process.exit(1);
  }

  // Resolve the absolute path to the project root
  const projectRoot = resolve(__dirname, "./test-projects", folderName); // Use 'resolve'
  console.log(`Project root: ${projectRoot}`);

  let viteProcess;

  try {
    console.log('Starting Vite server...');
    viteProcess = await startViteServer(projectRoot);
    console.log('Vite server started. Running command...');

    await runCommand(commandToRun, projectRoot);
    console.log('Command completed successfully.');
  } catch (error) {
    console.error(error);
    process.exitCode = 1; // Set a non-zero exit code to indicate failure
  } finally {
    if (viteProcess) {
      console.log('Stopping Vite server...');
      process.kill(viteProcess.pid, 'SIGTERM', (err) => {
        if (err) {
          console.error('Error stopping Vite server:', err);
        } else {
          console.log('Vite server stopped.');
        }
        process.exit(); // Ensure the script exits after cleanup
      });
    } else {
      process.exit();
    }
  }
}


main();