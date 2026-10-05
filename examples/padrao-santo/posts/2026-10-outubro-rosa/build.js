// Gera o carrossel Outubro Rosa da Padrão Santo (6 telas, 1080x1350).
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const si = require('simple-icons');

const D = __dirname;
const FS = 'node_modules/@fontsource';
const C = { claro: '#F6C9D4', forte: '#D9658A', vinho: '#8E3456', branco: '#FFFFFF', cinza: '#2E3338' };
const HANDLE = '@padraosantoparaempresas';

const wa = (fill) => `<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="${fill}" d="${si.siWhatsapp.path}"/></svg>`;

// Laço do Outubro Rosa
const ribbon = (fill, w, extra = '') => `
<svg viewBox="0 0 200 300" width="${w}" style="${extra}">
  <path fill="${fill}" d="M100 18c-30 0-52 22-52 52 0 20 9 38 22 58L22 262l44 20 34-70 34 70 44-20-48-134c13-20 22-38 22-58 0-30-22-52-52-52zm0 34c12 0 20 8 20 20 0 12-8 26-20 44-12-18-20-32-20-44 0-12 8-20 20-20z"/>
</svg>`;

// Halftone: bolinhas que diminuem até sumir, a partir de um canto
function halftone(w, h, color, corner = 'tr', step = 34, maxR = 13) {
  let dots = '';
  const diag = Math.hypot(w, h);
  for (let y = step / 2; y < h; y += step) {
    for (let x = step / 2; x < w; x += step) {
      const cx = corner.includes('r') ? w - x : x;
      const cy = corner.includes('b') ? h - y : y;
      const t = 1 - Math.hypot(x, y) / (diag * 0.95);
      const r = maxR * t * t;
      if (r > 0.8) dots += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(1)}"/>`;
    }
  }
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" fill="${color}">${dots}</svg>`;
}

const icon = {
  olho: (c) => `<svg viewBox="0 0 100 100" width="96"><path d="M8 50c12-20 26-30 42-30s30 10 42 30c-12 20-26 30-42 30S20 70 8 50z" fill="none" stroke="${c}" stroke-width="7" stroke-linejoin="round"/><circle cx="50" cy="50" r="13" fill="${c}"/></svg>`,
  conversa: (c) => `<svg viewBox="0 0 100 100" width="96"><path d="M14 18h72a6 6 0 0 1 6 6v40a6 6 0 0 1-6 6H44L26 86V70H14a6 6 0 0 1-6-6V24a6 6 0 0 1 6-6z" fill="none" stroke="${c}" stroke-width="7" stroke-linejoin="round"/><path d="M50 30v28M36 44h28" stroke="${c}" stroke-width="8" stroke-linecap="round"/></svg>`,
  alerta: (c) => `<svg viewBox="0 0 100 100" width="96"><path d="M50 8C33 8 20 21 20 38c0 22 30 52 30 52s30-30 30-52C80 21 67 8 50 8z" fill="none" stroke="${c}" stroke-width="7" stroke-linejoin="round"/><path d="M50 24v18M50 52v1" stroke="${c}" stroke-width="8" stroke-linecap="round"/></svg>`,
};

const calendario = `
<svg viewBox="0 0 420 380" width="420">
  <rect x="10" y="40" width="400" height="330" rx="28" fill="${C.branco}"/>
  <path d="M10 68a28 28 0 0 1 28-28h344a28 28 0 0 1 28 28v52H10z" fill="${C.forte}"/>
  <rect x="100" y="10" width="22" height="64" rx="11" fill="${C.vinho}"/>
  <rect x="298" y="10" width="22" height="64" rx="11" fill="${C.vinho}"/>
  <text x="210" y="105" text-anchor="middle" font-family="Poppins" font-weight="800" font-size="40" fill="${C.branco}" letter-spacing="4">OUTUBRO</text>
  ${Array.from({ length: 15 }, (_, i) => {
    const col = i % 5, row = Math.floor(i / 5);
    return `<rect x="${48 + col * 68}" y="${150 + row * 70}" width="50" height="46" rx="10" fill="${C.claro}"/>`;
  }).join('')}
  <g transform="translate(250 228) scale(0.42)">${ribbon(C.forte, 200).replace(/<\/?svg[^>]*>/g, '')}</g>
</svg>`;

const mesa = `
<svg viewBox="0 0 760 360" width="760">
  <rect x="150" y="30" width="330" height="210" rx="18" fill="${C.claro}"/>
  <rect x="172" y="52" width="286" height="166" rx="8" fill="${C.forte}"/>
  <g transform="translate(278 70) scale(0.42)">${ribbon(C.branco, 200).replace(/<\/?svg[^>]*>/g, '')}</g>
  <rect x="295" y="240" width="40" height="50" fill="${C.claro}"/>
  <rect x="250" y="285" width="130" height="16" rx="8" fill="${C.claro}"/>
  <rect x="20" y="300" width="720" height="22" rx="11" fill="${C.branco}"/>
  <path d="M560 210h96l-10 90h-76z" fill="${C.branco}"/>
  <path d="M652 228c30 0 30 46 0 46" fill="none" stroke="${C.branco}" stroke-width="12"/>
  <g transform="translate(590 226) scale(0.17)">${ribbon(C.forte, 200).replace(/<\/?svg[^>]*>/g, '')}</g>
  <rect x="80" y="270" width="110" height="30" rx="6" fill="${C.claro}" opacity=".7"/>
  <rect x="92" y="246" width="96" height="24" rx="6" fill="${C.forte}"/>
</svg>`;

const img = (f) => 'cut/' + f;
// SEU LOGO: rótulo rosa na área de impressão de cada brinde
const produtos = [
  { f: 'copo.png', nome: 'Copo Inox 500ml com Abridor', cod: '09252', h: 330, logo: { top: '46%', left: '49%', size: 22 } },
  { f: 'guarda.png', nome: 'Guarda-Chuva Automático', cod: '19197', h: 300, logo: { top: '40%', left: '58%', size: 30, rot: -24, cor: '#B83A68' } },
  { f: 'necessaire.png', nome: 'Nécessaire Poliéster', cod: '19075', h: 270, logo: { top: '34%', left: '50%', size: 30, cor: '#B83A68' } },
  { f: 'escova.png', nome: 'Escova com Espelho', cod: '10342', h: 270, logo: { top: '50%', left: '50%', size: 26, chip: true } },
];

const footer = `<div class="handle">${HANDLE}</div>`;

const slides = [
  // 1. Capa
  `<section class="s" style="background:${C.forte}">
    <div class="ht" style="top:0;right:0">${halftone(500, 400, C.vinho, 'tr')}</div>
    <img class="logo" src="logo.png" style="top:80px;left:80px;width:230px">
    <div style="position:absolute;left:80px;top:430px;width:640px">
      <h1 style="font-size:150px;line-height:.98;color:${C.branco}">OUTUBRO<br>ROSA</h1>
      <p class="serif" style="font-size:54px;line-height:1.3;color:${C.branco};margin-top:40px">Cuidar de si também<br>entra na rotina.</p>
    </div>
    <div style="position:absolute;right:70px;bottom:80px">${ribbon(C.branco, 300)}</div>
  </section>`,

  // 2. Conscientização
  `<section class="s" style="background:${C.claro}">
    <div style="position:absolute;left:90px;right:90px;top:120px">
      <h1 style="font-size:84px;line-height:1.05;color:${C.vinho}">UM MÊS PARA<br>LEMBRAR DA<br>PREVENÇÃO</h1>
      <p class="serif" style="font-size:44px;line-height:1.4;color:${C.cinza};margin-top:48px">O Outubro Rosa chama atenção para o câncer de mama. Quanto antes ele é descoberto, maiores as chances de tratamento.</p>
    </div>
    <div style="position:absolute;left:50%;transform:translateX(-50%);bottom:130px">${calendario}</div>
    ${footer}
  </section>`,

  // 3. Atitudes
  `<section class="s" style="background:${C.branco}">
    <div style="position:absolute;left:90px;right:90px;top:120px">
      <h1 style="font-size:80px;line-height:1.05;color:${C.forte}">3 ATITUDES<br>QUE VALEM<br>O ANO TODO</h1>
      ${[
        ['olho', 'Conheça o seu corpo e observe mudanças.'],
        ['conversa', 'Converse com o seu médico sobre a mamografia.'],
        ['alerta', 'Notou um nódulo ou uma mudança na pele? Procure atendimento.'],
      ].map(([ic, t], i) => `
        <div style="display:flex;align-items:center;gap:40px;margin-top:${i ? 60 : 80}px">
          <div style="flex:none;width:150px;height:150px;border-radius:50%;background:${C.claro};display:flex;align-items:center;justify-content:center;position:relative">
            ${icon[ic](C.vinho)}
            <span style="position:absolute;top:-6px;left:-6px;width:56px;height:56px;border-radius:50%;background:${C.forte};color:${C.branco};font:800 30px/56px Poppins;text-align:center">${i + 1}</span>
          </div>
          <p class="serif" style="font-size:46px;line-height:1.35;color:${C.cinza}">${t}</p>
        </div>`).join('')}
    </div>
    ${footer.replace('class="handle"', `class="handle" style="color:${C.vinho}"`)}
  </section>`,

  // 4. Na empresa
  `<section class="s" style="background:${C.vinho}">
    <div style="position:absolute;left:90px;right:90px;top:120px">
      <h1 style="font-size:84px;line-height:1.05;color:${C.branco}">A CONVERSA<br>TAMBÉM CABE<br>NO TRABALHO</h1>
      <p class="serif" style="font-size:44px;line-height:1.4;color:${C.branco};margin-top:48px">Uma ação interna de Outubro Rosa lembra a equipe de se cuidar. E o brinde com a marca da empresa segue lembrando depois do mês.</p>
    </div>
    <div style="position:absolute;left:50%;transform:translateX(-50%);bottom:140px">${mesa}</div>
    ${footer.replace('class="handle"', `class="handle" style="color:${C.claro}"`)}
  </section>`,

  // 5. Brindes
  `<section class="s" style="background:${C.claro}">
    <div style="position:absolute;left:70px;right:70px;top:80px">
      <h1 style="font-size:66px;line-height:1.06;color:${C.vinho};text-align:center">BRINDES PARA A SUA<br>AÇÃO DE OUTUBRO ROSA</h1>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:26px;margin-top:44px">
        ${produtos.map((p) => `
          <div style="background:${C.branco};border-radius:30px;height:420px;position:relative;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;padding-bottom:26px">
            <div style="flex:1;display:flex;align-items:center;justify-content:center">
              <div style="position:relative;height:${p.h}px">
                <img src="${img(p.f)}" style="height:100%;display:block">
                <span class="seulogo${p.logo.chip ? ' chip' : ''}" style="top:${p.logo.top};left:${p.logo.left};font-size:${p.logo.size}px;${p.logo.cor ? 'color:' + p.logo.cor + ';' : ''}transform:translate(-50%,-50%) rotate(${p.logo.rot || 0}deg)">SEU LOGO</span>
              </div>
            </div>
            <p style="font:600 26px/1.2 Poppins;color:${C.cinza};text-align:center;margin-top:10px">${p.nome}</p>
            <p style="font:800 24px/1.2 Poppins;color:${C.forte};letter-spacing:2px;margin-top:6px">CÓD. ${p.cod}</p>
          </div>`).join('')}
      </div>
      <p class="serif" style="font-size:38px;color:${C.vinho};text-align:center;margin-top:30px">Personalizamos com a sua arte.</p>
    </div>
    ${footer.replace('class="handle"', `class="handle" style="color:${C.vinho}"`)}
  </section>`,

  // 6. Chamado
  `<section class="s" style="background:${C.forte}">
    <div class="ht" style="bottom:0;left:0">${halftone(520, 250, C.vinho, 'bl')}</div>
    <img class="logo" src="logo.png" style="top:130px;left:50%;transform:translateX(-50%);width:340px">
    <div style="position:absolute;left:90px;right:90px;top:480px;text-align:center">
      <h1 style="font-size:66px;line-height:1.12;color:${C.branco}">CHAME NO WHATSAPP E PEÇA O ORÇAMENTO DOS BRINDES DA SUA CAMPANHA</h1>
      <div style="display:inline-flex;align-items:center;gap:26px;background:${C.branco};border-radius:999px;padding:24px 50px 24px 30px;margin-top:64px">
        <span style="width:76px;height:76px;display:block">${wa('#' + si.siWhatsapp.hex)}</span>
        <span style="font:800 58px/1 Poppins;color:${C.vinho}">(51) 3060-7100</span>
      </div>
    </div>
  </section>`,
];

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:Poppins;font-weight:600;src:url(${FS}/poppins/files/poppins-latin-600-normal.woff2)}
@font-face{font-family:Poppins;font-weight:800;src:url(${FS}/poppins/files/poppins-latin-800-normal.woff2)}
@font-face{font-family:Lora;font-weight:400;src:url(${FS}/lora/files/lora-latin-400-normal.woff2)}
@font-face{font-family:Lora;font-weight:500;src:url(${FS}/lora/files/lora-latin-500-normal.woff2)}
*{margin:0;padding:0;box-sizing:border-box}
body{background:#000}
.s{width:1080px;height:1350px;position:relative;overflow:hidden;margin-bottom:20px}
h1{font-family:Poppins;font-weight:800;text-transform:uppercase;letter-spacing:-1px}
.serif{font-family:Lora;font-weight:400}
.logo{position:absolute}
.ht{position:absolute;line-height:0}
.handle{position:absolute;bottom:44px;left:0;right:0;text-align:center;font:600 24px Poppins;color:${C.vinho};opacity:.85}
.seulogo{position:absolute;white-space:nowrap;font-family:Poppins;font-weight:800;color:${C.forte};letter-spacing:1px}
.seulogo.chip{background:${C.branco};color:${C.forte};padding:6px 14px;border-radius:10px;border:3px dashed ${C.forte}}
</style></head><body>${slides.join('\n')}</body></html>`;

fs.copyFileSync('/home/user/instagram-agent-skill/examples/padrao-santo/assets/logo/padrao-santo-branco.png', path.join(D, 'logo.png'));
fs.writeFileSync(path.join(D, 'slides.html'), html);

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1080, height: 1350 } });
  await p.goto('file://' + path.join(D, 'slides.html'));
  await p.evaluate(() => document.fonts.ready);
  fs.mkdirSync(path.join(D, 'out'), { recursive: true });
  const els = await p.$$('section.s');
  for (let i = 0; i < els.length; i++) await els[i].screenshot({ path: path.join(D, 'out', `outubro-rosa-${i + 1}.png`) });
  await b.close();
  console.log('ok', els.length);
})();
