const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

const output = fs.createWriteStream(path.join(__dirname, 'backend.zip'));
const archive = archiver('zip', { zlib: { level: 9 } });

output.on('close', () => {
  console.log(archive.pointer() + ' total bytes');
  console.log('Archiver has been finalized and the output file descriptor has closed.');
});

archive.on('error', (err) => {
  throw err;
});

archive.pipe(output);

// add files/directories
const sourceDir = path.join(__dirname, 'dream-topology-backend');

archive.glob('**/*', {
  cwd: sourceDir,
  ignore: ['node_modules/**', 'prisma/dev.db', 'prisma/dev.db-journal', '.env']
});

archive.finalize();
