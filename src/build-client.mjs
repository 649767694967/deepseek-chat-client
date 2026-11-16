import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// 兼容两种布局：
//   独立客户端仓库： root/index.html + src/{template,app,core,prompts,zipkit,core-lib,device}(.js|.mjs)
//   转换器工作目录： root/{zipkit.js, core.mjs, chat/{template,app,core,prompts}, _build/device.js}
const here = path.dirname(fileURLToPath(import.meta.url));
const root = process.argv[2] || path.resolve(here, '..');
const isRepoLayout = path.basename(here) === 'src';

const SHARED_DIR = isRepoLayout ? here : root;                 // zipkit / 转换器解析器
const CHAT_DIR = isRepoLayout ? here : path.join(root, 'chat'); // 聊天客户端源码
const BUILD_DIR = here;                                        // device.js 等构建期资源

function findIn(names, dirs) {
  for (const name of names) {
    for (const dir of dirs) {
      const p = path.join(dir, name);
      if (fs.existsSync(p)) return p;
    }
  }
  return null;
}

const templatePath = findIn(['template.html'], [CHAT_DIR]);
if (!templatePath) {
  console.error('找不到聊天客户端模板（template.html / chat/template.html）');
  process.exit(1);
}

const MODULES = [
  { file: 'zipkit.js', slot: '<!--INLINE:zipkit.js-->', path: findIn(['zipkit.js'], [SHARED_DIR]) },
  // 转换器那套解析器（parseDeepSeekSession 等）：独立仓库叫 core-lib.mjs，工作目录里是 core.mjs
  { file: 'core-lib.mjs', slot: '<!--INLINE:core-lib.mjs-->', path: findIn(['core-lib.mjs', 'core.mjs'], [SHARED_DIR]) },
  { file: 'prompts.mjs', slot: '<!--INLINE:prompts.mjs-->', path: findIn(['prompts.mjs'], [CHAT_DIR]) },
  // 聊天客户端自己的核心逻辑（cc* 前缀）
  { file: 'chat-core.mjs', slot: '<!--INLINE:chat-core.mjs-->', path: findIn(['core.mjs', 'chat-core.mjs'], [CHAT_DIR]) },
  { file: 'chat-app.mjs', slot: '<!--INLINE:chat-app.mjs-->', path: findIn(['app.mjs', 'chat-app.mjs'], [CHAT_DIR]) },
];

const DEVICE_SLOT = '/*__INLINE_DEVICE__*/';

function stripModuleSyntax(name, code) {
  if (/^\s*import\s/m.test(code)) throw new Error(`${name} 含 import，不能内联`);
  let out = code;
  out = out.replace(/^\s*export\s*\{[^}]*\}\s*;?\s*$/gm, '');
  out = out.replace(/^(\s*)export\s+default\s+/gm, '$1const __defaultExport = ');
  out = out.replace(/^(\s*)export\s+(?=(async\s+)?(function|const|let|var|class)\b)/gm, '$1');
  return out;
}

function topLevelNames(code) {
  const names = new Set();
  for (const m of code.matchAll(/^(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/gm)) names.add(m[1]);
  for (const m of code.matchAll(/^(?:export\s+)?(?:const|let|var|class)\s+([A-Za-z_$][\w$]*)/gm)) names.add(m[1]);
  return [...names];
}

let html = fs.readFileSync(templatePath, 'utf8');
const seen = new Map();
const report = [];

for (const mod of MODULES) {
  if (!mod.path) {
    console.log('missing:', mod.file, '(跳过，功能不完整)');
    html = html.replace(mod.slot, `/* [missing] ${mod.file} */`);
    continue;
  }
  const src = fs.readFileSync(mod.path, 'utf8');
  const names = topLevelNames(src);
  const clash = names.filter((n) => seen.has(n));
  if (clash.length) {
    throw new Error(
      `${mod.file} 与 ${[...new Set(clash.map((c) => seen.get(c)))].join(',')} 重名: ${clash.slice(0, 8).join(', ')}`
    );
  }
  for (const n of names) seen.set(n, mod.file);
  const code = stripModuleSyntax(mod.file, src);
  html = html.replace(mod.slot, `/* ===== ${mod.file} ===== */\n${code}`);
  report.push(`${mod.file} (${code.length} bytes) ← ${path.relative(root, mod.path) || mod.file}`);
}

const devicePath = findIn(['device.js'], [BUILD_DIR, SHARED_DIR]);
if (devicePath) {
  const dev = fs.readFileSync(devicePath, 'utf8');
  html = html.replace(DEVICE_SLOT, dev);
  report.unshift(`device.js (${dev.length} bytes) ← ${path.relative(root, devicePath) || 'device.js'}`);
} else {
  html = html.replace(DEVICE_SLOT, '/* device.js missing */');
  console.log('warning: 找不到 device.js，设备档位不会自动切换');
}

const outName = process.env.OUT || (isRepoLayout ? 'index.html' : 'chat.html');
const out = path.join(root, outName);
fs.writeFileSync(out, html, 'utf8');
console.log('inlined: ' + report.join('\n         '));
console.log('wrote', out, html.length, 'bytes');
