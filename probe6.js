const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('Client :: ready');
  conn.end();
}).on('error', (err) => {
  console.error('Client :: error :: ' + err);
}).on('keyboard-interactive', (name, instructions, instructionsLang, prompts, finish) => {
  console.log('Client :: keyboard-interactive', prompts);
  finish(['huang2005!']);
}).connect({
  host: '42.194.162.51',
  port: 22,
  username: 'ubuntu',
  password: 'huang2005!',
  tryKeyboard: true,
  debug: console.log
});
