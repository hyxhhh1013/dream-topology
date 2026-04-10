const { NodeSSH } = require('node-ssh');

async function deploy() {
  const ssh = new NodeSSH();
  
  try {
    console.log('Connecting to server...');
    await ssh.connect({
      host: '42.194.162.51',
      username: 'ubuntu',
      password: 'huang2005!',
      tryKeyboard: true,
    });
    console.log('Connected successfully!');

    // 1. Check existing ports and services
    const portCheck = await ssh.execCommand('sudo netstat -tulnp | grep -E "(80|443|3000|5173)"');
    console.log('\nPort Usage:\n', portCheck.stdout);

    // 2. Prepare directories
    console.log('\nPreparing directories...');
    await ssh.execCommand('sudo mkdir -p /var/www/dream-topology-frontend');
    await ssh.execCommand('sudo mkdir -p /var/www/dream-topology-backend');
    await ssh.execCommand('sudo chown -R ubuntu:ubuntu /var/www/dream-topology*');
    
    // 3. Upload files
    console.log('\nUploading frontend dist...');
    await ssh.putDirectory('D:/project/黑客松/dream-topology-web/dist', '/var/www/dream-topology-frontend');
    
    console.log('Uploading backend files...');
    // Only upload necessary backend files
    await ssh.putDirectory('D:/project/黑客松/dream-topology-backend/src', '/var/www/dream-topology-backend/src');
    await ssh.putDirectory('D:/project/黑客松/dream-topology-backend/prisma', '/var/www/dream-topology-backend/prisma');
    await ssh.putFile('D:/project/黑客松/dream-topology-backend/package.json', '/var/www/dream-topology-backend/package.json');
    await ssh.putFile('D:/project/黑客松/dream-topology-backend/tsconfig.json', '/var/www/dream-topology-backend/tsconfig.json');
    await ssh.putFile('D:/project/黑客松/dream-topology-backend/.env', '/var/www/dream-topology-backend/.env');

    // 4. Setup Backend
    console.log('\nSetting up backend (this may take a minute)...');
    const backendSetup = await ssh.execCommand('npm install && npx prisma db push && npm run build', { cwd: '/var/www/dream-topology-backend' });
    console.log(backendSetup.stdout);
    if (backendSetup.stderr) console.error(backendSetup.stderr);

    // 5. Start Backend with PM2 (Using port 3001 to avoid conflicts if 3000 is used)
    console.log('\nStarting backend with PM2...');
    await ssh.execCommand('sudo npm install -g pm2');
    const pm2Start = await ssh.execCommand('PORT=3001 pm2 start dist/index.js --name "dream-topology-api" -f', { cwd: '/var/www/dream-topology-backend' });
    console.log(pm2Start.stdout);

    // 6. Setup Nginx
    console.log('\nConfiguring Nginx...');
    const nginxConfig = `
server {
    listen 8080; # Using 8080 since 80 might be used by the existing website
    server_name 42.194.162.51;

    location / {
        root /var/www/dream-topology-frontend;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:3001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
`;
    await ssh.execCommand(`echo "${nginxConfig}" > /tmp/dream-topology`);
    await ssh.execCommand('sudo mv /tmp/dream-topology /etc/nginx/sites-available/dream-topology');
    await ssh.execCommand('sudo ln -sf /etc/nginx/sites-available/dream-topology /etc/nginx/sites-enabled/');
    const nginxTest = await ssh.execCommand('sudo nginx -t');
    console.log(nginxTest.stdout || nginxTest.stderr);
    
    await ssh.execCommand('sudo systemctl restart nginx');
    console.log('\nDeployment Complete! Access the site at http://42.194.162.51:8080');

    ssh.dispose();
  } catch (error) {
    console.error('\nDeployment failed:', error);
    ssh.dispose();
  }
}

deploy();