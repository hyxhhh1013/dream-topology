const { NodeSSH } = require('node-ssh');

async function probe() {
  const users = ['lighthouse', 'administrator', 'debian', 'opc', 'pi', 'root'];
  const host = '42.194.162.51';
  const password = 'huang2005!';

  let ssh = new NodeSSH();
  let connectedUser = null;

  for (let user of users) {
    try {
      console.log(`Trying user: ${user}...`);
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
      console.log(`Failed for user ${user}: ${e.message}`);
    }
  }

  if (!connectedUser) {
    console.error('All authentication methods failed for all attempted users.');
    process.exit(1);
  }

  try {
    let os = await ssh.execCommand('cat /etc/os-release | grep PRETTY_NAME');
    console.log('OS:', os.stdout);

    process.exit(0);
  } catch (error) {
    console.error('Execution Error:', error);
    process.exit(1);
  }
}

probe();
