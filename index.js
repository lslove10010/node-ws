const os = require('os');
const http = require('http');
const fs = require('fs');
const axios = require('axios');
const net = require('net');
const { Buffer } = require('buffer');
const { exec, execSync } = require('child_process');
const { WebSocket, createWebSocketStream } = require('ws');
const path = require('path');

const UUID = process.env.UUID || '1df85032-66e9-45c6-9937-0546415dc18b'; 
const NEZHA_SERVER = process.env.NEZHA_SERVER || ''; 
const NEZHA_PORT = process.env.NEZHA_PORT || '';   
const NEZHA_KEY = process.env.NEZHA_KEY || '';              
const DOMAIN = process.env.DOMAIN || 'luna.pylex.software'; 
const AUTO_ACCESS = process.env.AUTO_ACCESS || false;
const SUB_PATH = process.env.SUB_PATH || 'websub';  
const NAME = process.env.NAME || 'swispbyte-nodews-Vls'; 
const PORT = process.env.PORT || 11600;  

const metaInfo = execSync(
  'curl -s https://speed.cloudflare.com/meta | awk -F\\" \'{print $26"-"$18}\' | sed -e \'s/ /_/g\'',
  { encoding: 'utf-8' }
);
const ISP = metaInfo.trim();

const httpServer = http.createServer((req, res) => {
  if (req.url === '/') {
    const filePath = path.join(__dirname, 'public', 'index.html');
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal Server Error\n');
      } else {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(data);
      }
    });
  } else if (req.url === `/${SUB_PATH}`) {
    const vlessURL = `vless://${UUID}@www.wto.org:443?encryption=none&security=tls&sni=${DOMAIN}&type=ws&host=${DOMAIN}&path=%2F#${NAME}-${ISP}`;
    
    const base64Content = Buffer.from(vlessURL).toString('base64');

    fs.writeFileSync('web.txt', base64Content + '\n');

    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end(base64Content + '\n');
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found\n');
  }
});

const wss = new WebSocket.Server({ server: httpServer });
const uuid = UUID.replace(/-/g, "");
wss.on('connection', ws => {
  ws.once('message', msg => {
    const [VERSION] = msg;
    const id = msg.slice(1, 17);
    if (!id.every((v, i) => v == parseInt(uuid.substr(i * 2, 2), 16))) return;
    let i = msg.slice(17, 18).readUInt8() + 19;
    const port = msg.slice(i, i += 2).readUInt16BE(0);
    const ATYP = msg.slice(i, i += 1).readUInt8();
    const host = ATYP == 1 ? msg.slice(i, i += 4).join('.') :
    (ATYP == 2 ? new TextDecoder().decode(msg.slice(i + 1, i += 1 + msg.slice(i, i + 1).readUInt8())) :
    (ATYP == 3 ? msg.slice(i, i += 16).reduce((s, b, i, a) => (i % 2 ? s.concat(a.slice(i - 1, i + 1)) : s), []).map(b => b.readUInt16BE(0).toString(16)).join(':') : ''));
    ws.send(new Uint8Array([VERSION, 0]));
    const duplex = createWebSocketStream(ws);
    net.connect({ host, port }, function() {
      this.write(msg.slice(i));
      duplex.on('error', () => {}).pipe(this).on('error', () => {}).pipe(duplex);
    }).on('error', () => {});
  }).on('error', () => {});
});

const getDownloadUrl = () => {
  const arch = os.arch(); 
  if (arch === 'arm' || arch === 'arm64' || arch === 'aarch64') {
    if (!NEZHA_PORT) {
      return 'https://arm64.ssss.nyc.mn/v1';
    } else {
        return 'https://arm64.ssss.nyc.mn/agent';
    }
  } else {
    if (!NEZHA_PORT) {
      return 'https://amd64.ssss.nyc.mn/v1';
    } else {
        return 'https://amd64.ssss.nyc.mn/agent';
    }
  }
};

const downloadFile = async () => {
  try {
    const url = getDownloadUrl();
    const response = await axios({
      method: 'get',
      url: url,
      responseType: 'stream'
    });

    const writer = fs.createWriteStream('npm');
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', () => {
        console.log('npm download successfully');
        exec('chmod +x npm', (err) => {
          if (err) reject(err);
          resolve();
        });
      });
      writer.on('error', reject);
    });
  } catch (err) {
    throw err;
  }
};

const runnz = async () => {
  await downloadFile();
  let NEZHA_TLS = '';
  let command = '';

  if (NEZHA_SERVER && NEZHA_PORT && NEZHA_KEY) {
    const tlsPorts = ['443', '8443', '2096', '2087', '2083', '2053'];
    NEZHA_TLS = tlsPorts.includes(NEZHA_PORT) ? '--tls' : '';
    command = `nohup ./npm -s ${NEZHA_SERVER}:${NEZHA_PORT} -p ${NEZHA_KEY} ${NEZHA_TLS} >/dev/null 2>&1 &`;
  } else if (NEZHA_SERVER && NEZHA_KEY) {
    if (!NEZHA_PORT) {
      const port = NEZHA_SERVER.includes(':') ? NEZHA_SERVER.split(':').pop() : '';
      const tlsPorts = new Set(['443', '8443', '2096', '2087', '2083', '2053']);
      const nezhatls = tlsPorts.has(port) ? 'tls' : 'false';
      const configYaml = `
client_secret: ${NEZHA_KEY}
debug: false
disable_auto_update: true
disable_command_execute: false
disable_force_update: true
disable_nat: false
disable_send_query: false
gpu: false
insecure_tls: false
ip_report_period: 1800
report_delay: 1
server: ${NEZHA_SERVER}
skip_connection_count: false
skip_procs_count: false
temperature: false
tls: ${nezhatls}
use_gitee_to_upgrade: false
use_ipv6_country_code: false
uuid: ${UUID}`;
      
      fs.writeFileSync('config.yaml', configYaml);
    }
    command = `nohup ./npm -c config.yaml >/dev/null 2>&1 &`;
  } else {
    console.log('NEZHA variable is empty, skip running');
    return;
  }

  try {
    exec(command, { 
      shell: '/bin/bash'
    });
    console.log('npm is running');
  } catch (error) {
    console.error(`npm running error: ${error}`);
  } 
};

async function addAccessTask() {
  if (!AUTO_ACCESS) return;
  try {
    if (!DOMAIN) {
      console.log('URL is empty. Skip Adding Automatic Access Task');
      return;
    } else {
      const fullURL = `https://${DOMAIN}`;
      const command = `curl -X POST "https://gifted-steel-cheek.glitch.me/add-url" -H "Content-Type: application/json" -d '{"url": "${fullURL}"}'`;
      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error('Error sending request:', error.message);
          return;
        }
        console.log('Automatic Access Task added successfully:', stdout);
      });
    }
  } catch (error) {
    console.error('Error added Task:', error.message);
  }
}

const delFiles = () => {
  fs.unlink('npm', () => {});
  fs.unlink('config.yaml', () => {}); 
};

const getPublicIp = async () => {
  try {
    const response = await axios.get('https://api.ipify.org?format=json');
    return response.data.ip;
  } catch (error) {
    console.error('Error fetching public IP:', error);
    return 'localhost';
  }
};

httpServer.listen(PORT, async () => {
  const publicIp = await getPublicIp();
  runnz();
  setTimeout(() => {
    delFiles();
  }, 30000);
  addAccessTask();
  console.log(`Server is running on http://${publicIp}:${PORT}`);
});
