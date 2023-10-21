const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const bodyParser = require('body-parser');
const os = require('os');
const { execSync } = require("child_process");
const { log } = require('console');
const { disconnect } = require('process');
const proxmox = require("proxmox")('API@pve', '', '');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const port = 9091;
const USERNAME = 'root';
const PASSWORD = '@root';

let isLogged = false;


app.use(express.static(__dirname + '/public'));
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/login.html');
});

app.post('/login', (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  if (username === USERNAME && password === PASSWORD) {
    res.redirect('/main.html');
    isLogged = true;
  } else {
    res.send('Identifiant ou mot de passe incorrect');
  }
});

app.get('/logout', (req, res) => {
  isLogged = false;
  res.redirect('/login.html'); 
});

app.post('/process1', (req, res) => {
  const value = req.body.value;
  proxmox.qemu.start('pve', value, function(err, response) {

  });
  res.sendStatus(200);
});

app.post('/process2', (req, res) => {
  const value = req.body.value;
  proxmox.qemu.shutdown('pve', value, function(err, response) {

  });
  res.sendStatus(200);
});



io.on('connection', function(socket) {


    console.log(isLogged);

    socket.on('disconnect', function(){
      // console.log("disconnect");
      isLogged = false;
      console.log(isLogged);
      socket.emit('redirect', '/public/login.html');
      //process.exit(0);
    });

    setInterval(function(){
      let data = {
        data: [{system: os.hostname(),
          uptime: os.uptime(),
          kernel: os.release(),
          arch: os.arch(),
          plateforme: os.platform(),
          cpu: execSync("sensors | grep Package | awk '{print $4}'").toString().trim(),
          process: execSync("ps aux --no-headers | wc -l").toString().trim()}]};
      let sortedData = JSON.stringify(data);
      data = JSON.parse(sortedData).data;
      io.emit('system', data);

      proxmox.getQemu('pve', function(err, response) {
        let data = JSON.parse(response).data;
        data.sort((a, b) => a.vmid - b.vmid);
        io.emit('update', data);
      });

      proxmox.getNodes(function(err, response) {
        let data = JSON.parse(response).data;
        data.sort((a, b) => a.node - b.node);
        io.emit('nodes', data);
      });

      proxmox.getNodeNetworks('pve', function(err, response) {
        let data = JSON.parse(response).data;
        data.sort((a, b) => a.iface.localeCompare(b.iface));
        io.emit('net', data);
      });

      proxmox.getNodeStorage('pve', function(err, response) {
        let data = JSON.parse(response).data;
        data.sort((a, b) => a.storage.localeCompare(b.storage));
        io.emit('storage', data);
      });


      for (let i = 2; i != 10; i++) {
        let service = {
          name: execSync(`ps -eo pid,comm,%cpu,%mem --sort=-%cpu,-%mem | sed -n '${i}p' | awk '{print $2}'`).toString().trim(),
          cpu: execSync(`ps -eo pid,comm,%cpu,%mem --sort=-%cpu,-%mem | sed -n '${i}p' | awk '{print $3}'`).toString().trim(),
          mem: execSync(`ps -eo pid,comm,%cpu,%mem --sort=-%cpu,-%mem | sed -n '${i}p' | awk '{print $4}'`).toString().trim(),
          position: `${i}`.toString().trim()
        };
        data.push(service);
      }
      io.emit('service', data);

      data = {data: [{time: execSync(`date +%d" "%b" "%H":"%M":"%S`).toString().trim()}]};
      sortedData = JSON.stringify(data);
      data = JSON.parse(sortedData).data;
      io.emit('times', data);
    },2000);
});

server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
