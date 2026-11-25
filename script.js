const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const hpText = document.getElementById('hpText');
const scoreText = document.getElementById('scoreText');
const levelText = document.getElementById('levelText');
const targetText = document.getElementById('targetText');
const hpFill = document.getElementById('hpFill');
const msg = document.getElementById('msg');
const overlay = document.getElementById('overlay');

let gameStarted = false;
let gameOver = false;
let score = 0;
let hp = 100;
let level = 1;
let kills = 0;
let keys = {};
let frameCount = 0;

const LEVELS = [
  { level: 1, target: 5, speed: 1 },
  { level: 2, target: 7, speed: 1.6 },
  { level: 3, target: 10, speed: 2.2 }
];
let targetKills = LEVELS[0].target;

let hero = { x: 80, y: 340, w: 44, h: 70, vy: 0, jumping: false, facing: 1, attacking: 0 };
let enemies = [];
let particles = [];

function spawnEnemy() {
  const cfg = LEVELS[level - 1];
  enemies.push({ x: 850 + Math.random() * 100, y: 350, w: 40, h: 60, hp: 2, speed: cfg.speed, hitTimer: 0 });
}
for (let i = 0; i < 3; i++) spawnEnemy();

function drawBackground() {
  ctx.fillStyle = '#1a1a35'; ctx.fillRect(0, 0, 900, 480);
  ctx.fillStyle = '#f5c518'; ctx.beginPath(); ctx.arc(750, 70, 28, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#2a2a4a';
  for (let i = 0; i < 5; i++) { ctx.fillRect(i * 190, 220, 90, 180); }
  ctx.fillStyle = '#7c3aed'; ctx.fillRect(820, 180, 70, 240);
  ctx.fillStyle = '#f5c518'; ctx.font = 'bold 12px Arial'; ctx.fillText('KINGDOM', 818, 170);
  ctx.fillStyle = '#3a3a5a'; ctx.fillRect(0, 420, 900, 60);
  ctx.fillStyle = '#f5c518'; ctx.fillRect(0, 418, 900, 4);
}

function drawHero() {
  ctx.save();
  ctx.translate(hero.x + hero.w / 2, hero.y + hero.h / 2);
  if (hero.facing === -1) ctx.scale(-1, 1);
  ctx.fillStyle = '#1e3a8a'; ctx.fillRect(-22, -10, 44, 50);
  ctx.fillStyle = '#f5c518'; ctx.fillRect(-22, -30, 44, 22);
  ctx.fillStyle = '#ffdbac'; ctx.beginPath(); ctx.arc(0, -38, 14, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#111'; ctx.fillRect(-14, -48, 28, 8);
  if (hero.attacking > 0) {
    ctx.fillStyle = '#fff'; ctx.fillRect(20, -20, 38, 6);
    ctx.fillStyle = '#f5c518'; ctx.fillRect(52, -22, 8, 10);
  }
  ctx.restore();
}

function drawEnemies() {
  enemies.forEach(e => {
    ctx.fillStyle = '#7f1d1d'; ctx.fillRect(e.x, e.y, e.w, e.h);
    ctx.fillStyle = '#111'; ctx.fillRect(e.x, e.y - 8, e.w, 6);
    ctx.fillStyle = '#ef4444'; ctx.fillRect(e.x, e.y - 8, e.w * (e.hp / 2), 6);
    ctx.fillStyle = '#fff'; ctx.fillRect(e.x + 8, e.y + 12, 8, 8); ctx.fillRect(e.x + 24, e.y + 12, 8, 8);
    ctx.fillStyle = '#000'; ctx.fillRect(e.x + 8, e.y + 28, 24, 4);
  });
}

function drawParticles() {
  particles = particles.filter(p => p.life > 0);
  particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.life--; ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, 6, 6); });
}

function update() {
  if (!gameStarted || gameOver) return;
  frameCount++;
  if (keys['ArrowLeft']) { hero.x -= 5; hero.facing = -1; }
  if (keys['ArrowRight']) { hero.x += 5; hero.facing = 1; }
  hero.x = Math.max(0, Math.min(856, hero.x));
  if (keys['ArrowUp'] && !hero.jumping) { hero.vy = -13; hero.jumping = true; }
  hero.y += hero.vy; hero.vy += 0.7;
  if (hero.y >= 340) { hero.y = 340; hero.vy = 0; hero.jumping = false; }
  if (hero.attacking > 0) hero.attacking--;

  enemies.forEach((e, idx) => {
    e.x -= e.speed;
    if (e.x < -50) {
      e.x = 900; e.hp = 2; hp -= 10;
      msg.textContent = 'Enemy Passed You! HP -10! Do Not Let Them Pass!';
    }
    if (hero.attacking > 0 && Math.abs((hero.x + hero.w) - e.x) < 60 && Math.abs(hero.y - e.y) < 60) {
      e.hp--; hero.attacking = 0;
      for (let i = 0; i < 12; i++) particles.push({ x: e.x + 20, y: e.y + 20, vx: (Math.random() - 0.5) * 8, vy: (Math.random() - 0.5) * 8, life: 20, color: '#f5c518' });
      if (e.hp <= 0) {
        enemies.splice(idx, 1); score += 10; kills++; spawnEnemy();
        if (kills >= targetKills) {
          if (level === 3) {
            score += 100;
            gameOver = true;
            overlay.style.display = 'flex';
            overlay.innerHTML = `<h1>🏆 YOU WIN!</h1><p>You Reached The Kingdom!</p><p>Score: ${score} | Kingdom Is Yours!</p><button onclick="location.reload()">🔄 PLAY AGAIN</button>`;
            return;
          } else {
            level++;
            kills = 0;
            targetKills = LEVELS[level - 1].target;
            levelText.textContent = level;
            targetText.textContent = targetKills;
            score += 50;
            hp = Math.min(100, hp + 20);
            msg.textContent = `Level ${level} Started! Defeat ${targetKills} Enemies! HP +20 Bonus! Score +50!`;
          }
        }
      }
    }
    if (Math.abs(hero.x - e.x) < 35 && Math.abs(hero.y - e.y) < 40) {
      hp -= 0.4;
      e.hitTimer++;
      if (e.hitTimer > 60) {
        hp -= 15;
        e.hitTimer = 0;
        msg.textContent = 'Enemy Hit You! HP -15! Jump To Dodge Or Attack Fast!';
      }
    } else {
      e.hitTimer = 0;
    }
  });

  hp = Math.max(0, hp);
  hpText.textContent = Math.ceil(hp);
  hpFill.style.width = hp + '%';
  scoreText.textContent = score;
  if (hp <= 0) {
    gameOver = true;
    overlay.style.display = 'flex';
    overlay.innerHTML = `<h1>💀 GAME OVER</h1><p>You Lost The Battle</p><p>Score: ${score} | Level: ${level}</p><button onclick="location.reload()">🔄 TRY AGAIN</button>`;
  }
}

function loop() {
  drawBackground(); drawEnemies(); drawHero(); drawParticles(); update();
  requestAnimationFrame(loop);
}
loop();

document.addEventListener('keydown', e => {
  keys[e.key] = true;
  if (e.code === 'Space') { hero.attacking = 12; e.preventDefault(); }
});
document.addEventListener('keyup', e => keys[e.key] = false);

document.getElementById('startBtn').onclick = () => { gameStarted = true; overlay.style.display = 'none'; msg.textContent = 'Defeat 5 Enemies To Clear Level 1!'; };
document.getElementById('restartBtn').onclick = () => location.reload();
document.getElementById('btnLeft').onclick = () => { hero.x -= 30; hero.facing = -1; };
document.getElementById('btnRight').onclick = () => { hero.x += 30; hero.facing = 1; };
document.getElementById('btnJump').onclick = () => { if (!hero.jumping) { hero.vy = -13; hero.jumping = true; } };
document.getElementById('btnAttack').onclick = () => { hero.attacking = 12; };