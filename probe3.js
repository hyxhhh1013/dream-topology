const { NodeSSH } = require('node-ssh');

async function probe() {
  const users = ['root', 'ubuntu', 'lighthouse'];
  const passwords = ['huang2005', 'huang2005!'];
  const host = '42.194.162.51';

  let ssh = new NodeSSH();
  let connectedUser = null;

  for (let user of users) {
    for (let password of passwords) {
      try {
        console.log(`Trying user: ${user} with pass: ${password}...`);
        await ssh.connect({
          host,
          username: user,
          password,
          tryKeyboard: true,
        });
        console.log(`Connected successfully as ${user}!`);
        connectedUser = user;
        break;
      } catch (e) {
        console.log(`Failed: ${e.message}`);
      }
    }
    if (connectedUser) break;
  }

  if (!connectedUser) {
    console.error('All authentication methods failed for all attempted users.');
    process.exit(1);
  }

  try {
    let os = await ssh.execCommand('cat /etc/os-release | grep PRETTY_NAME');
    console.log('OS:', os.stdout);

    let webServer = await ssh.execCommand('sudo netstat -tulnp | grep -E "(80|443)"');
    console.log('Ports 80/443 Usage:\n', webServer.stdout);

    let nginx = await ssh.execCommand('ls -la /etc/nginx/sites-enabled/ || ls -la /etc/nginx/conf.d/');
    console.log('Nginx Sites:\n', nginx.stdout);

    let pm2 = await ssh.execCommand('pm2 status || echo "PM2 not installed"');
    console.log('PM2 Status:\n', pm2.stdout);

    process.exit(0);
  } catch (error) {
    console.error('Execution Error:', error);
    process.exit(1);
  }
}

probe();
