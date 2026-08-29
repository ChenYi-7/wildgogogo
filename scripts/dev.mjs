import { mkdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';

const dirs = ['data/sessions', 'public/uploads/images', 'public/uploads/stickers', 'public/uploads/backgrounds'];
await Promise.all(dirs.map((dir) => mkdir(dir, { recursive: true })));

const isWindows = process.platform === 'win32';
const command = isWindows ? (process.env.ComSpec || 'cmd.exe') : 'npx';
const args = isWindows ? ['/d', '/s', '/c', 'npx next dev'] : ['next', 'dev'];
const child = spawn(command, args, { stdio: 'inherit', shell: false });
child.on('exit', (code) => process.exit(code ?? 0));
