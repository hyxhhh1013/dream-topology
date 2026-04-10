const { NodeSSH } = require('node-ssh');

async function probe() {
  const users = ['root', 'ubuntu', 'lighthouse'];
  const passwords = ['huang2005!', 'huang2005！', 'huang2005'];
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

  if (connectedUser) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

probe();
