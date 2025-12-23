// --- SEエンジン ---
const audioFiles = { spawn: 'spawn.mp3', click: 'click.mp3', evolve: 'evolve.mp3', war: 'war.mp3', win: 'win.mp3' };
const SE = {}; let audioInitialized = false;
function initAudio() {
    if (audioInitialized) return;
    for (const key in audioFiles) { SE[key] = new Audio(audioFiles[key]); SE[key].load(); }
    audioInitialized = true;
}
function playSE(key) { if (audioInitialized && SE[key]) { SE[key].pause(); SE[key].currentTime = 0; SE[key].play().catch(() => {}); } }

// --- データベース & 特性ロジック ---
const EVO_DATABASE = {
    red: { names: ["紅ポム", "焔苺", "緋殻", "烈風丸", "紅蓮獣", "獄炎龍", "阿修羅", "不知火", "朱雀", "始源の炎"], ability: "攻撃力強化" },
    blue: { names: ["蒼しずく", "水玉", "流転", "氷結", "深海魚", "大渦", "天叢雲", "絶対零度", "海神", "終焉の氷"], ability: "演算能力強化" },
    green: { names: ["翠めぶき", "若葉", "蔦巻", "大樹", "森守", "翡翠獣", "古木霊", "世界樹", "神農", "万物の緑"], ability: "機動性強化" },
    yellow: { names: ["黄ピカ", "稲妻", "帯電", "雷光", "鳴神", "金剛", "麒麟", "天雷", "雷帝", "万雷の核"], ability: "全能力平均強化" }
};

const CHAT_TEMPLATES = {
    red: ["闘争本能が昂ぶる。", "周囲を焼き尽くすのみ。", "温度上昇、警告域。", "炎の壁を展開。", "朱き意志を継承する。"],
    blue: ["流体密度を計算中。", "静寂の中に沈む。", "深淵からの呼び声。", "絶対零度を検知。", "流転する生命。"],
    green: ["大地と共鳴中...", "光合成効率を最大化。", "生態系の最適化を完了。", "根系が領土を拡大。", "緑の静寂。"],
    yellow: ["高電圧を維持中...", "光速の思考回路。", "雷撃の予兆を感知。", "神速の演算を開始。", "回路の同期を確認。"]
};

let GAME_STATE = {
    pivot: { x: 50, y: 50 },
    BLOODLINES: {
        red: { monsters: [], atk: 15, int: 15, agi: 15, log: [], rank: 0, color: '#ef4444', label: '赤色勢力' },
        blue: { monsters: [], atk: 15, int: 15, agi: 15, log: [], rank: 0, color: '#3b82f6', label: '青色勢力' },
        green: { monsters: [], atk: 15, int: 15, agi: 15, log: [], rank: 0, color: '#22c55e', label: '緑色勢力' },
        yellow: { monsters: [], atk: 15, int: 15, agi: 15, log: [], rank: 0, color: '#eab308', label: '黄色勢力' }
    },
    selected: 'red', actions: 5, warTimer: 30,
    discovered: { red: [0], blue: [0], green: [0], yellow: [0] }
};

// --- ログ出力（硬派カラーリング：戦争勝敗は赤） ---
function safeLog(k, message, type = 'normal') {
    const b = GAME_STATE.BLOODLINES[k];
    let style = "color:#94a3b8;";
    if (type === 'war-result') style = "color:#ef4444; font-weight:bold;"; // 勝敗は赤に統一
    if (type === 'union') style = "color:#fb923c; font-weight:bold; border-bottom:1px solid #fb923c;";
    if (type === 'omen') style = "color:#c084fc; font-style:italic;";
    if (type === 'evolve') style = "color:#f472b6; font-weight:bold; text-shadow:0 0 4px #f472b6;";
    if (type === 'boost') style = "color:#22d3ee;"; 
    if (type === 'warning') style = "color:#fbbf24;";

    const html = `<span style="${style}">${message}</span>`;
    if (b.log[0] === html) return;
    b.log.unshift(html);
    if (b.log.length > 20) b.log.pop();
    render();
}

function logAll(m, type) { Object.keys(GAME_STATE.BLOODLINES).forEach(k => safeLog(k, m, type)); }

// --- ゲームコアロジック ---
function tick() {
    GAME_STATE.warTimer--;
    if (GAME_STATE.warTimer === 29) situationalChat();
    if (GAME_STATE.warTimer === 20) announceWarOmen();
    if (GAME_STATE.warTimer <= 0) { executeWar(); GAME_STATE.warTimer = 30; GAME_STATE.actions = 5; }
    checkEvolution();
    updateUI();
}

function getPower(k) {
    const b = GAME_STATE.BLOODLINES[k];
    const territory = getTerritorySize(k);
    let basePower = (b.monsters.length * 20) + b.atk + b.int + b.agi;
    let bonusPercent = 0.02 + (b.rank * 0.02);
    return (territory > 0.30) ? basePower : basePower * (1 + bonusPercent);
}

function executeWar() {
    const keys = Object.keys(GAME_STATE.BLOODLINES);
    const sorted = [...keys].sort((a,b) => getTerritorySize(b) - getTerritorySize(a));
    const tyrant = sorted[0];
    const victims = sorted.slice(1);

    playSE('war');
    document.getElementById('war-overlay').classList.add('active');

    setTimeout(() => {
        let loser;
        if (getTerritorySize(tyrant) > 0.35) {
            playSE('win');
            logAll(`🤝 連合軍：強大化した【${GAME_STATE.BLOODLINES[tyrant].label}】の制圧作戦を完遂。`, 'union');
            applyPivot(victims[0], 5); applyPivot(victims[1], 3); applyPivot(victims[2], 2);
            loser = tyrant;
        } else {
            const aK = keys[Math.floor(Math.random()*4)];
            const dK = keys.find(k => k !== aK);
            const pA = GAME_STATE.BLOODLINES[aK];
            const pD = GAME_STATE.BLOODLINES[dK];
            let bonus = 1.0;
            if (pA.atk > pD.int) bonus += 0.2; 
            if (pA.int > pD.agi) bonus += 0.2;
            if (pA.agi > pD.atk) bonus += 0.2;

            const win = (getPower(aK) * bonus) >= getPower(dK) ? aK : dK;
            loser = (win === aK) ? dK : aK;
            safeLog(win, `⚔️ 紛争勝利：敵領域を接収。`, 'war-result');
            safeLog(loser, `⚔️ 紛争敗北：防衛線が崩壊。`, 'war-result');
            applyPivot(win, 10);
        }
        if (GAME_STATE.BLOODLINES[loser].monsters.length > 1) {
            const m = GAME_STATE.BLOODLINES[loser].monsters.pop();
            if(m) m.el.remove();
        }
        document.getElementById('war-overlay').classList.remove('active');
        render();
    }, 2000);
}

// --- 戦略アクション ---
function feed() {
    initAudio(); if (GAME_STATE.actions <= 0) return;
    const territory = getTerritorySize(GAME_STATE.selected);
    let chance = 1.0;
    if (territory > 0.40) chance = 0.2; else if (territory > 0.35) chance = 0.3; else if (territory > 0.30) chance = 0.5;

    if (Math.random() <= chance) {
        spawn(GAME_STATE.selected); safeLog(GAME_STATE.selected, "個体のクローニングに成功。", 'boost'); playSE('spawn');
    } else {
        safeLog(GAME_STATE.selected, "生成エラー：リソース供給不足。", 'warning');
    }
    GAME_STATE.actions--; render();
}

function boost(type) {
    initAudio(); if (GAME_STATE.actions <= 0) return;
    const territory = getTerritorySize(GAME_STATE.selected);
    let gain = (territory > 0.30) ? 3 : 15;
    GAME_STATE.BLOODLINES[GAME_STATE.selected][type] += gain;
    GAME_STATE.actions--;
    
    let msg = "";
    if (type === 'atk') msg = "筋力トレーニングにより攻撃能力を強化。";
    if (type === 'int') msg = "高度な演算処理を学習。";
    if (type === 'agi') msg = "隠密訓練により機動性を向上。";
    
    safeLog(GAME_STATE.selected, msg, gain > 3 ? 'boost' : 'warning');
    playSE('click'); render();
}

// --- 描画・システム ---
function announceWarOmen() {
    const keys = Object.keys(GAME_STATE.BLOODLINES);
    const aK = keys[Math.floor(Math.random()*4)];
    const dK = keys.find(k => k !== aK);
    safeLog(aK, `📡 侵攻準備：【${GAME_STATE.BLOODLINES[dK].label}】を標的に設定。`, 'omen');
    safeLog(dK, `📡 警告：【${GAME_STATE.BLOODLINES[aK].label}】による軍事行動を検知。`, 'omen');
}

function getTerritorySize(k) {
    const p = GAME_STATE.pivot;
    if (k === 'red') return (p.x * p.y) / 10000;
    if (k === 'blue') return ((100-p.x) * p.y) / 10000;
    if (k === 'green') return (p.x * (100-p.y)) / 10000;
    return ((100-p.x) * (100-p.y)) / 10000;
}
function applyPivot(wK, s) {
    const p = GAME_STATE.pivot;
    if (wK === 'red') { p.x += s; p.y += s; }
    if (wK === 'blue') { p.x -= s; p.y += s; }
    if (wK === 'green') { p.x += s; p.y -= s; }
    if (wK === 'yellow') { p.x -= s; p.y -= s; }
    p.x = Math.max(20, Math.min(80, p.x)); p.y = Math.max(20, Math.min(80, p.y));
}
function spawn(key) {
    const b = GAME_STATE.BLOODLINES[key]; const mEl = document.createElement('div');
    mEl.className = `monster shape-${b.rank}`; mEl.style.color = b.color;
    const pos = getRandomPos(key); mEl.style.left = pos.x + "%"; mEl.style.top = pos.y + "%";
    document.getElementById('monster-layer').appendChild(mEl);
    b.monsters.push({ el: mEl, type: key });
}
function getRandomPos(key) {
    const p = GAME_STATE.pivot; let minX, maxX, minY, maxY;
    if (key === 'red') { minX = 0; maxX = p.x; minY = 0; maxY = p.y; }
    if (key === 'blue') { minX = p.x; maxX = 100; minY = 0; maxY = p.y; }
    if (key === 'green') { minX = 0; maxX = p.x; minY = p.y; maxY = 100; }
    if (key === 'yellow') { minX = p.x; maxX = 100; minY = p.y; maxY = 100; }
    return { x: Math.random()*(maxX-minX-10)+minX+5, y: Math.random()*(maxY-minY-10)+minY+5 };
}
function checkEvolution() {
    Object.keys(GAME_STATE.BLOODLINES).forEach(k => {
        const b = GAME_STATE.BLOODLINES[k]; const next = b.rank + 1;
        if (next < 10 && (b.atk + b.int + b.agi) > (next * 140)) {
            b.rank = next;
            b.monsters.forEach(m => m.el.className = `monster shape-${next}`);
            if (!GAME_STATE.discovered[k].includes(next)) GAME_STATE.discovered[k].push(next);
            safeLog(k, `✨ 特異進化：第${next+1}階位【${EVO_DATABASE[k].names[next]}】へ昇格。`, 'evolve');
            playSE('evolve');
        }
    });
}
function situationalChat() {
    Object.keys(GAME_STATE.BLOODLINES).forEach(k => {
        const msg = CHAT_TEMPLATES[k][Math.floor(Math.random()*5)];
        safeLog(k, `💬 ${msg}`, 'normal');
    });
}
function render() {
    const p = GAME_STATE.pivot;
    document.getElementById('z-red').style.width = p.x + "%"; document.getElementById('z-red').style.height = p.y + "%";
    document.getElementById('z-blue').style.width = (100-p.x) + "%"; document.getElementById('z-blue').style.height = p.y + "%"; document.getElementById('z-blue').style.left = p.x + "%";
    document.getElementById('z-green').style.width = p.x + "%"; document.getElementById('z-green').style.height = (100-p.y) + "%"; document.getElementById('z-green').style.top = p.y + "%";
    document.getElementById('z-yellow').style.width = (100-p.x) + "%"; document.getElementById('z-yellow').style.height = (100-p.y) + "%"; document.getElementById('z-yellow').style.left = p.x + "%"; document.getElementById('z-yellow').style.top = p.y + "%";
    Object.keys(GAME_STATE.BLOODLINES).forEach(k => {
        const size = Math.round(getTerritorySize(k) * 100);
        document.getElementById(`bar-${k}`).style.width = size + "%";
        document.getElementById(`bar-${k}`).innerText = `${GAME_STATE.BLOODLINES[k].label}: ${size}%`;
    });
    document.getElementById('panels').innerHTML = Object.keys(GAME_STATE.BLOODLINES).map(k => {
        const b = GAME_STATE.BLOODLINES[k];
        return `<div class="panel ${GAME_STATE.selected === k ? 'selected' : ''}" onclick="selectLine('${k}')">
            <strong>${EVO_DATABASE[k].names[b.rank]}</strong><br>
            <small>攻撃:${b.atk} 論理:${b.int} 機動:${b.agi} (${b.monsters.length})</small>
            <div class="log-display">${b.log.join('<br>')}</div>
        </div>`;
    }).join('');
}

// --- UI操作系（図鑑・ミッション・ヒント復旧） ---
function selectLine(k) { initAudio(); GAME_STATE.selected = k; render(); }
function updateUI() { document.getElementById('act-count').innerText = GAME_STATE.actions; document.getElementById('next-war').innerText = GAME_STATE.warTimer; }

function openDex() {
    initAudio(); const body = document.getElementById('dex-body');
    body.innerHTML = Object.keys(EVO_DATABASE).map(k => {
        const blood = EVO_DATABASE[k];
        return blood.names.map((name, i) => {
            const found = GAME_STATE.discovered[k].includes(i);
            const bonus = 2 + (i * 2);
            return `<tr>
                <td><div class="monster shape-${i}" style="position:static; color:${found?GAME_STATE.BLOODLINES[k].color:'#444'}"></div></td>
                <td><strong>${found ? name : '？？？'}</strong><br><small>${found ? blood.ability + ' (+' + bonus + '%)' : '特性：未知'}</small></td>
            </tr>`;
        }).join('');
    }).join('');
    document.getElementById('dex-modal').style.display = 'flex';
}

function openMissions() {
    initAudio();
    const list = document.getElementById('missions-list');
    list.innerHTML = `
        <li>🚩 均衡の維持：支配率を30%以下に保ち成長鈍化を回避せよ</li>
        <li>🚩 属性相性：攻撃(Red) ＞ 論理(Blue) ＞ 機動(Green) ＞ 攻撃</li>
        <li>🚩 特異点：第10階位「始源/終焉」への到達</li>
    `;
    document.getElementById('missions-modal').style.display = 'flex';
}

function showHint() {
    initAudio();
    alert("【戦略提言】\n支配率が30%を超えると「マナ枯渇」によりトレーニング効率が激減します。\nまた、35%を超えると他勢力による「制圧連合」が結成されるため、あえて領土を譲る勇気も必要です。");
}

function closeDex() { document.getElementById('dex-modal').style.display='none'; }
function closeMissions() { document.getElementById('missions-modal').style.display='none'; }
function restartGame() { if(confirm("システムをリセットし、最初からやり直しますか？")) location.reload(); }

window.onload = () => {
    Object.keys(GAME_STATE.BLOODLINES).forEach(k => spawn(k));
    setInterval(tick, 1000); 
    setInterval(() => {
        Object.values(GAME_STATE.BLOODLINES).forEach(b => b.monsters.forEach(m => {
            const pos = getRandomPos(m.type); m.el.style.left = pos.x + "%"; m.el.style.top = pos.y + "%";
        }));
    }, 2100);
    render();
};