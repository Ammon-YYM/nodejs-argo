const express = require("express");
const app = express();
const axios = require("axios");
const os = require('os');
const fs = require("fs");
const path = require("path");
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);

/* =========================
   ✅ Zeabur 标准端口处理
========================= */
const PORT = Number(process.env.PORT);
if (!PORT) {
  console.error("❌ PORT is not provided by platform");
  process.exit(1);
}

/* =========================
   环境变量
========================= */
const UPLOAD_URL = process.env.UPLOAD_URL || '';
const PROJECT_URL = process.env.PROJECT_URL || '';
const AUTO_ACCESS = process.env.AUTO_ACCESS === 'true';
const FILE_PATH = process.env.FILE_PATH || './tmp';
const SUB_PATH = process.env.SUB_PATH || '225ce164-f183-4c3c-80a1-9626a0b8f71a';
const UUID = process.env.UUID || '225ce164-f183-4c3c-80a1-9626a0b8f71a';

const NEZHA_SERVER = process.env.NEZHA_SERVER || '';
const NEZHA_PORT = process.env.NEZHA_PORT || '';
const NEZHA_KEY = process.env.NEZHA_KEY || '';

const ARGO_DOMAIN = process.env.ARGO_DOMAIN || 'tunnel.ammon.de5.net';
const ARGO_AUTH = process.env.ARGO_AUTH || '';
const ARGO_PORT = Number(process.env.ARGO_PORT || 8001);

const CFIP = process.env.CFIP || 'cdns.doon.eu.org';
const CFPORT = process.env.CFPORT || 443;
const NAME = process.env.NAME || 'Zeabur';

/* =========================
   HTTP 服务（必须最先启动）
========================= */
app.get("/", (req, res) => {
  res.status(200).send("OK");
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ HTTP server listening on 0.0.0.0:${PORT}`);
});

/* =========================
   创建运行目录
========================= */
if (!fs.existsSync(FILE_PATH)) {
  fs.mkdirSync(FILE_PATH, { recursive: true });
}

/* =========================
   工具函数
========================= */
function randomName() {
  return Math.random().toString(36).substring(2, 8);
}

const webName = randomName();
const botName = randomName();
const phpName = randomName();
const npmName = randomName();

const webPath = path.join(FILE_PATH, webName);
const botPath = path.join(FILE_PATH, botName);
const phpPath = path.join(FILE_PATH, phpName);
const npmPath = path.join(FILE_PATH, npmName);
const subPath = path.join(FILE_PATH, 'sub.txt');
const bootLogPath = path.join(FILE_PATH, 'boot.log');
const configPath = path.join(FILE_PATH, 'config.json');

/* =========================
   系统架构
========================= */
function getArch() {
  return os.arch().includes('arm') ? 'arm' : 'amd';
}

/* =========================
   生成 xray 配置
========================= */
function generateConfig() {
  const config = {
    log: { loglevel: "none" },
    inbounds: [
      {
        port: ARGO_PORT,
        protocol: "vless",
        settings: {
          clients: [{ id: UUID }],
          decryption: "none",
          fallbacks: [
            { dest: 3001 },
            { path: "/vless-argo", dest: 3002 },
            { path: "/vmess-argo", dest: 3003 },
            { path: "/trojan-argo", dest: 3004 }
          ]
        },
        streamSettings: { network: "tcp" }
      }
    ],
    outbounds: [{ protocol: "freedom", tag: "direct" }]
  };
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

/* =========================
   下载文件
========================= */
async function download(file, url) {
  const writer = fs.createWriteStream(file);
  const res = await axios.get(url, { responseType: 'stream' });
  res.data.pipe(writer);
  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}

/* =========================
   主逻辑（后台运行）
========================= */
async function startserver() {
  try {
    generateConfig();

    const arch = getArch();
    await download(webPath, arch === 'arm'
      ? "https://arm64.ssss.nyc.mn/web"
      : "https://amd64.ssss.nyc.mn/web");

    await download(botPath, arch === 'arm'
      ? "https://arm64.ssss.nyc.mn/bot"
      : "https://amd64.ssss.nyc.mn/bot");

    await exec(`chmod +x ${webPath} ${botPath}`);

    // xray
    await exec(`nohup ${webPath} -c ${configPath} >/dev/null 2>&1 &`);
    console.log("✅ xray running");

    // cloudflared
    await exec(`nohup ${botPath} tunnel --url http://localhost:${ARGO_PORT} --logfile ${bootLogPath} >/dev/null 2>&1 &`);
    console.log("✅ cloudflared running");

  } catch (err) {
    console.error("❌ startserver error:", err);
  }
}

/* =========================
   🚀 后台启动（不阻塞 HTTP）
========================= */
startserver();
