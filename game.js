// Game variables
const game = {
    isRunning: false,
    score: 0,
    lives: 40,
    highScore: localStorage.getItem('highScore') || 0,
    soundOn: true,
    enemies: [],
    bullets: [],
    powerUps: [],
    lastEnemySpawn: 0,
    lastPowerUpSpawn: 0,
    enemySpawnInterval: 1500,
    powerUpSpawnInterval: 5000, // 5 seconds (more frequent)
    powerUpActive: false,
    powerUpTimeLeft: 0,
    playerSpeed: 3,
    bulletSpeed: 7,
    enemySpeed: 2,
    keys: {}
};

// DOM elements
const elements = {
    startScreen: document.getElementById('start-screen'),
    gameScreen: document.getElementById('game-screen'),
    gameOverScreen: document.getElementById('game-over-screen'),
    gameArea: document.getElementById('game-area'),
    scoreDisplay: document.getElementById('score'),
    livesDisplay: document.getElementById('lives'),
    finalScoreDisplay: document.getElementById('final-score'),
    highScoreDisplay: document.getElementById('high-score'),
    playBtn: document.getElementById('play-btn'),
    restartBtn: document.getElementById('restart-btn'),
    soundToggle: document.getElementById('sound-toggle'),
    shootSound: document.getElementById('shoot-sound'),
    explosionSound: document.getElementById('explosion-sound'),
    bgMusic: document.getElementById('bg-music')
};

// Create audio context for sound effects
let audioContext;
try {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
} catch (e) {
    console.log('Web Audio API not supported');
}

// Sound effect functions
function playShootSound() {
    if (!audioContext || !game.soundOn) return;
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.2);
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.2);
}

function playExplosionSound() {
    if (!audioContext || !game.soundOn) return;
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    const noiseBuffer = createNoiseBuffer();
    const noise = audioContext.createBufferSource();
    
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(150, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(40, audioContext.currentTime + 0.5);
    
    gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    noise.buffer = noiseBuffer;
    
    oscillator.connect(gainNode);
    noise.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.start();
    noise.start();
    oscillator.stop(audioContext.currentTime + 0.5);
    noise.stop(audioContext.currentTime + 0.5);
}

function createNoiseBuffer() {
    const bufferSize = audioContext.sampleRate * 0.5;
    const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const output = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
    }
    
    return buffer;
}

function playBackgroundMusic() {
    if (!audioContext || !game.soundOn) return;
    
    // Stop any existing background music
    if (game.bgMusic) {
        game.bgMusic.stop();
    }
    
    // Create disco beat components
    const kickOsc = audioContext.createOscillator();
    const kickGain = audioContext.createGain();
    const hihatOsc = audioContext.createOscillator();
    const hihatGain = audioContext.createGain();
    const bassOsc = audioContext.createOscillator();
    const bassGain = audioContext.createGain();
    const mainGain = audioContext.createGain();
    
    // Set up kick drum
    kickOsc.frequency.setValueAtTime(150, audioContext.currentTime);
    kickGain.gain.setValueAtTime(0, audioContext.currentTime);
    
    // Set up hihat
    hihatOsc.type = 'square';
    hihatOsc.frequency.setValueAtTime(800, audioContext.currentTime);
    hihatGain.gain.setValueAtTime(0, audioContext.currentTime);
    
    // Set up bass
    bassOsc.type = 'sawtooth';
    bassOsc.frequency.setValueAtTime(55, audioContext.currentTime);
    bassGain.gain.setValueAtTime(0, audioContext.currentTime);
    
    // Connect everything
    kickOsc.connect(kickGain);
    hihatOsc.connect(hihatGain);
    bassOsc.connect(bassGain);
    kickGain.connect(mainGain);
    hihatGain.connect(mainGain);
    bassGain.connect(mainGain);
    mainGain.connect(audioContext.destination);
    
    // Set main volume
    mainGain.gain.setValueAtTime(0.1, audioContext.currentTime);
    
    // Start oscillators
    kickOsc.start();
    hihatOsc.start();
    bassOsc.start();
    
    // Disco bass line
    const bassNotes = [55, 55, 73.42, 82.41, 98];
    let bassIndex = 0;
    
    // Create disco beat pattern (120 BPM)
    const beatInterval = 60 / 120; // seconds per beat
    let beat = 0;
    
    const sequencer = setInterval(() => {
        if (!game.soundOn || !game.isRunning) {
            clearInterval(sequencer);
            return;
        }
        
        const now = audioContext.currentTime;
        
        // Four-on-the-floor kick pattern (disco staple)
        if (beat % 4 === 0) {
            kickOsc.frequency.setValueAtTime(150, now);
            kickOsc.frequency.exponentialRampToValueAtTime(50, now + 0.1);
            kickGain.gain.setValueAtTime(0.8, now);
            kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
            
            // Change bass note on main beats
            bassOsc.frequency.setValueAtTime(bassNotes[bassIndex], now);
            bassGain.gain.setValueAtTime(0.7, now);
            bassGain.gain.exponentialRampToValueAtTime(0.3, now + 0.3);
            bassIndex = (bassIndex + 1) % bassNotes.length;
        }
        
        // Hi-hat on every beat
        hihatOsc.frequency.setValueAtTime(800 + Math.random() * 500, now);
        hihatGain.gain.setValueAtTime(0.2, now);
        hihatGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        
        beat = (beat + 1) % 16;
    }, beatInterval * 1000);
    
    // Store references to stop later
    game.bgMusic = {
        stop: function() {
            kickOsc.stop();
            hihatOsc.stop();
            bassOsc.stop();
            clearInterval(sequencer);
        }
    };
}

// Create player
function createPlayer() {
    const player = document.createElement('div');
    player.className = 'player';
    player.innerHTML = `
        <svg width="40" height="80" viewBox="0 0 40 80" style="position:absolute; z-index:100;">
            <!-- Rocket body -->
            <rect x="10" y="20" width="20" height="40" fill="silver" />
            
            <!-- Rocket nose -->
            <polygon points="10,20 30,20 20,0" fill="red" />
            
            <!-- Rocket fins -->
            <polygon points="0,60 10,60 10,40" fill="red" />
            <polygon points="40,60 30,60 30,40" fill="red" />
            
            <!-- Rocket window -->
            <circle cx="20" cy="30" r="5" fill="skyblue" />
            
            <!-- Rocket flame -->
            <polygon points="15,60 25,60 20,80" fill="orange" />
        </svg>
    `;
    
    elements.gameArea.appendChild(player);
    return player;
}

// Initialize game
function initGame() {
    // Reset game state
    game.isRunning = true;
    game.score = 0;
    game.lives = 40;
    game.enemies = [];
    game.bullets = [];
    game.powerUps = [];
    game.lastEnemySpawn = 0;
    game.lastPowerUpSpawn = 0;
    game.powerUpActive = false;
    game.powerUpTimeLeft = 0;
    game.keys = {}; // Reset key states
    
    // Update displays
    elements.scoreDisplay.textContent = `Score: ${game.score}`;
    elements.livesDisplay.textContent = `Lives: ${game.lives}`;
    elements.highScoreDisplay.textContent = `High Score: ${game.highScore}`;
    
    // Show game screen first so elements are visible
    elements.startScreen.classList.add('hidden');
    elements.gameOverScreen.classList.add('hidden');
    elements.gameScreen.classList.remove('hidden');
    
    // Clear game area
    elements.gameArea.innerHTML = '';
    
    // Create player
    game.player = createPlayer();
    
    // Position player at the bottom center
    const gameRect = elements.gameArea.getBoundingClientRect();
    const playerWidth = 40; // Width of SVG
    
    // Set initial position in pixels, not percentage
    game.player.style.position = 'absolute';
    game.player.style.left = `${(gameRect.width - playerWidth) / 2}px`;
    game.player.style.top = `${gameRect.height - 90}px`;
    // Remove any background color
    game.player.style.backgroundColor = 'transparent';
    
    // Get player rectangle after positioning
    game.playerRect = game.player.getBoundingClientRect();
    
    // Start background music
    if (game.soundOn) {
        // Initialize audio context on user interaction
        if (audioContext && audioContext.state === 'suspended') {
            audioContext.resume();
        }
        playBackgroundMusic();
    }
    
    // Start game loop
    requestAnimationFrame(gameLoop);
}

// Spawn power-up
function spawnPowerUp() {
    const powerUp = document.createElement('div');
    powerUp.style.position = 'absolute';
    powerUp.style.width = '30px';
    powerUp.style.height = '30px';
    powerUp.style.borderRadius = '50%';
    powerUp.style.backgroundColor = '#ff9900';
    powerUp.style.boxShadow = '0 0 15px #ff9900';
    powerUp.style.zIndex = '2';
    
    // Add pulsating animation with inline styles
    powerUp.style.animation = 'pulse 1s infinite alternate';
    
    // Create star shape inside
    const star = document.createElement('div');
    star.style.position = 'absolute';
    star.style.top = '5px';
    star.style.left = '5px';
    star.style.width = '20px';
    star.style.height = '20px';
    star.style.backgroundColor = '#ffff00';
    star.style.clipPath = 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)';
    powerUp.appendChild(star);
    
    const gameRect = elements.gameArea.getBoundingClientRect();
    const powerUpLeft = Math.random() * (gameRect.width - 30);
    
    powerUp.style.left = `${Math.floor(powerUpLeft)}px`;
    powerUp.style.top = '0px';
    
    elements.gameArea.appendChild(powerUp);
    game.powerUps.push(powerUp);
    
    console.log('Power-up spawned!', powerUp);
}

// Move power-ups
function movePowerUps() {
    const powerUps = [...game.powerUps];
    
    powerUps.forEach((powerUp, index) => {
        const powerUpTop = powerUp.offsetTop + game.enemySpeed;
        const gameRect = elements.gameArea.getBoundingClientRect();
        
        if (powerUpTop > gameRect.height) {
            powerUp.remove();
            if (game.powerUps.includes(powerUp)) {
                game.powerUps.splice(game.powerUps.indexOf(powerUp), 1);
            }
        } else {
            powerUp.style.top = `${powerUpTop}px`;
        }
    });
}

// Update power-up timer
function updatePowerUpTimer(timestamp) {
    if (game.powerUpActive) {
        game.powerUpTimeLeft -= 16; // Approximate ms per frame
        
        if (game.powerUpTimeLeft <= 0) {
            game.powerUpActive = false;
            game.powerUpTimeLeft = 0;
        }
    }
}

// Game loop
function gameLoop(timestamp) {
    if (!game.isRunning) return;
    
    // Spawn enemies
    if (timestamp - game.lastEnemySpawn > game.enemySpawnInterval) {
        spawnEnemy();
        game.lastEnemySpawn = timestamp;
    }
    
    // Spawn power-ups - ensure we have a timestamp to compare against
    if (!game.lastPowerUpSpawn) {
        game.lastPowerUpSpawn = timestamp;
    }
    
    // Force spawn a power-up if none exist and it's time
    if (timestamp - game.lastPowerUpSpawn > game.powerUpSpawnInterval) {
        spawnPowerUp();
        game.lastPowerUpSpawn = timestamp;
        console.log('Power-up spawn triggered at', timestamp);
    }
    
    // Move player
    movePlayer();
    
    // Move bullets
    moveBullets();
    
    // Move enemies
    moveEnemies();
    
    // Move power-ups
    movePowerUps();
    
    // Update power-up timer
    updatePowerUpTimer(timestamp);
    
    // Check collisions
    checkCollisions();
    
    // Continue game loop
    requestAnimationFrame(gameLoop);
}

// Move player
function movePlayer() {
    const playerRect = game.player.getBoundingClientRect();
    const gameRect = elements.gameArea.getBoundingClientRect();
    
    // Get current position relative to game area
    let currentLeft = playerRect.left - gameRect.left;
    let currentTop = playerRect.top - gameRect.top;
    
    // Calculate new position
    if (game.keys['ArrowLeft'] || game.keys['a'] || game.keys['A']) {
        currentLeft = Math.max(0, currentLeft - game.playerSpeed);
    }
    
    if (game.keys['ArrowRight'] || game.keys['d'] || game.keys['D']) {
        currentLeft = Math.min(gameRect.width - 40, currentLeft + game.playerSpeed);
    }
    
    if (game.keys['ArrowUp'] || game.keys['w'] || game.keys['W']) {
        currentTop = Math.max(0, currentTop - game.playerSpeed);
    }
    
    if (game.keys['ArrowDown'] || game.keys['s'] || game.keys['S']) {
        currentTop = Math.min(gameRect.height - 80, currentTop + game.playerSpeed);
    }
    
    // Apply new position
    game.player.style.left = `${currentLeft}px`;
    game.player.style.top = `${currentTop}px`;
    
    // Update player rectangle
    game.playerRect = game.player.getBoundingClientRect();
    
    // Add rocket flame animation
    const flame = game.player.querySelector('polygon[fill="orange"]');
    if (flame) {
        flame.setAttribute('points', Math.random() > 0.5 ? '15,60 25,60 20,75' : '15,60 25,60 20,80');
    }
}

// Shoot bullet
function shootBullet() {
    const playerRect = game.playerRect;
    const gameRect = elements.gameArea.getBoundingClientRect();
    
    if (game.powerUpActive) {
        // Triple shot with power-up
        for (let i = -1; i <= 1; i++) {
            const bullet = document.createElement('div');
            
            // Calculate bullet position relative to game area
            const bulletLeft = playerRect.left - gameRect.left + 20 - 4 + (i * 10); // Spread bullets
            const bulletTop = playerRect.top - gameRect.top; // Top of rocket
            
            bullet.style.position = 'absolute';
            bullet.style.left = `${bulletLeft}px`;
            bullet.style.top = `${bulletTop}px`;
            bullet.style.width = '8px';
            bullet.style.height = '20px';
            bullet.style.backgroundColor = '#ff3300';
            bullet.style.borderRadius = '2px';
            bullet.style.zIndex = '1';
            bullet.style.boxShadow = '0 0 10px #ff3300';
            
            elements.gameArea.appendChild(bullet);
            game.bullets.push(bullet);
        }
    } else {
        // Normal single shot
        const bullet = document.createElement('div');
        
        // Calculate bullet position relative to game area
        const bulletLeft = playerRect.left - gameRect.left + 20 - 2.5; // Center of rocket (40/2)
        const bulletTop = playerRect.top - gameRect.top; // Top of rocket
        
        bullet.style.position = 'absolute';
        bullet.style.left = `${bulletLeft}px`;
        bullet.style.top = `${bulletTop}px`;
        bullet.style.backgroundColor = '#ff0';
        bullet.style.width = '5px';
        bullet.style.height = '15px';
        bullet.style.borderRadius = '2px';
        bullet.style.zIndex = '1';
        bullet.style.boxShadow = '0 0 5px #ff0';
        
        elements.gameArea.appendChild(bullet);
        game.bullets.push(bullet);
    }
    
    // Play shoot sound
    playShootSound();
}

// Move bullets
function moveBullets() {
    // Create a copy of the bullets array to avoid modification issues during iteration
    const bullets = [...game.bullets];
    
    bullets.forEach((bullet, index) => {
        const bulletTop = bullet.offsetTop - game.bulletSpeed;
        
        if (bulletTop < 0) {
            bullet.remove();
            game.bullets.splice(game.bullets.indexOf(bullet), 1);
        } else {
            bullet.style.top = `${bulletTop}px`;
        }
    });
}

// Spawn enemy
function spawnEnemy() {
    const enemy = document.createElement('div');
    enemy.style.position = 'absolute';
    enemy.style.zIndex = '1';
    
    // Create enemy ship with SVG
    enemy.innerHTML = `
        <svg width="40" height="60" viewBox="0 0 40 60">
            <!-- Enemy body (inverted triangle) -->
            <polygon points="20,0 40,40 0,40" fill="#ff4d4d" />
            
            <!-- Enemy cockpit -->
            <circle cx="20" cy="20" r="5" fill="#8a2be2" />
            
            <!-- Enemy wings -->
            <rect x="0" y="30" width="40" height="10" fill="#990000" />
            
            <!-- Enemy thrusters -->
            <rect x="10" y="40" width="5" height="10" fill="#666" />
            <rect x="25" y="40" width="5" height="10" fill="#666" />
        </svg>
    `;
    
    const gameRect = elements.gameArea.getBoundingClientRect();
    const enemyLeft = Math.random() * (gameRect.width - 40);
    
    // Set exact pixel position to ensure straight movement
    enemy.style.left = `${Math.floor(enemyLeft)}px`;
    enemy.style.top = '0px';
    
    elements.gameArea.appendChild(enemy);
    game.enemies.push(enemy);
    
    // Increase difficulty over time
    if (game.enemySpawnInterval > 500) {
        game.enemySpawnInterval -= 10;
    }
}

// Move enemies
function moveEnemies() {
    // Create a copy of the enemies array to avoid modification issues during iteration
    const enemies = [...game.enemies];
    
    enemies.forEach((enemy, index) => {
        const enemyTop = enemy.offsetTop + game.enemySpeed;
        const gameRect = elements.gameArea.getBoundingClientRect();
        
        if (enemyTop > gameRect.height) {
            enemy.remove();
            if (game.enemies.includes(enemy)) {
                game.enemies.splice(game.enemies.indexOf(enemy), 1);
            }
            decreaseLives();
        } else {
            enemy.style.top = `${enemyTop}px`;
            // No wiggle or rotation - enemies move straight down
        }
    });
}

// Check collisions
function checkCollisions() {
    const gameRect = elements.gameArea.getBoundingClientRect();
    
    // Update player rectangle
    game.playerRect = game.player.getBoundingClientRect();
    
    // Create copies of arrays to avoid modification issues during iteration
    const bullets = [...game.bullets];
    const enemies = [...game.enemies];
    const powerUps = [...game.powerUps];
    
    // Check bullet-enemy collisions and bullet-powerUp collisions
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        const bulletRect = bullet.getBoundingClientRect();
        
        // Check bullet-powerUp collisions first
        let powerUpHit = false;
        for (let j = powerUps.length - 1; j >= 0; j--) {
            const powerUp = powerUps[j];
            const powerUpRect = powerUp.getBoundingClientRect();
            
            if (isColliding(bulletRect, powerUpRect)) {
                // Create special effect
                createExplosion(powerUpRect.left - gameRect.left, powerUpRect.top - gameRect.top);
                
                // Remove bullet and power-up
                bullet.remove();
                powerUp.remove();
                
                // Remove from original arrays
                if (game.bullets.includes(bullet)) {
                    game.bullets.splice(game.bullets.indexOf(bullet), 1);
                }
                
                if (game.powerUps.includes(powerUp)) {
                    game.powerUps.splice(game.powerUps.indexOf(powerUp), 1);
                }
                
                // Activate power-up
                activatePowerUp();
                
                // Play power-up sound
                playPowerUpSound();
                
                powerUpHit = true;
                break;
            }
        }
        
        // If bullet hit a power-up, skip enemy collision checks
        if (powerUpHit) continue;
        
        // Check bullet-enemy collisions
        for (let j = enemies.length - 1; j >= 0; j--) {
            const enemy = enemies[j];
            const enemyRect = enemy.getBoundingClientRect();
            
            if (isColliding(bulletRect, enemyRect)) {
                // Create explosion
                createExplosion(enemyRect.left - gameRect.left, enemyRect.top - gameRect.top);
                
                // Remove bullet and enemy
                bullet.remove();
                enemy.remove();
                
                // Remove from original arrays
                if (game.bullets.includes(bullet)) {
                    game.bullets.splice(game.bullets.indexOf(bullet), 1);
                }
                
                if (game.enemies.includes(enemy)) {
                    game.enemies.splice(game.enemies.indexOf(enemy), 1);
                }
                
                // Increase score
                increaseScore();
                
                // Play explosion sound
                playExplosionSound();
                
                // Break inner loop since bullet is gone
                break;
            }
        }
    }
    
    // Check player-enemy collisions
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        const enemyRect = enemy.getBoundingClientRect();
        
        if (isColliding(game.playerRect, enemyRect)) {
            // Create explosion
            createExplosion(enemyRect.left - gameRect.left, enemyRect.top - gameRect.top);
            
            // Remove enemy
            enemy.remove();
            
            if (game.enemies.includes(enemy)) {
                game.enemies.splice(game.enemies.indexOf(enemy), 1);
            }
            
            // Decrease lives
            decreaseLives();
            
            // Play explosion sound
            playExplosionSound();
        }
    }
    
    // Player can still collect power-ups by touching them too
    for (let i = powerUps.length - 1; i >= 0; i--) {
        const powerUp = powerUps[i];
        const powerUpRect = powerUp.getBoundingClientRect();
        
        if (isColliding(game.playerRect, powerUpRect)) {
            // Remove power-up
            powerUp.remove();
            
            if (game.powerUps.includes(powerUp)) {
                game.powerUps.splice(game.powerUps.indexOf(powerUp), 1);
            }
            
            // Activate power-up
            activatePowerUp();
            
            // Play power-up sound
            playPowerUpSound();
        }
    }
}

// Activate power-up
function activatePowerUp() {
    game.powerUpActive = true;
    game.powerUpTimeLeft = 15000; // 15 seconds
    
    // Show power-up indicator
    const powerUpIndicator = document.createElement('div');
    powerUpIndicator.id = 'power-up-indicator';
    powerUpIndicator.style.position = 'absolute';
    powerUpIndicator.style.top = '40px';
    powerUpIndicator.style.left = '20px';
    powerUpIndicator.style.color = '#ff3300';
    powerUpIndicator.style.fontWeight = 'bold';
    powerUpIndicator.style.zIndex = '10';
    powerUpIndicator.textContent = 'POWER-UP ACTIVE!';
    elements.gameScreen.appendChild(powerUpIndicator);
    
    // Remove indicator when power-up ends
    setTimeout(() => {
        if (powerUpIndicator.parentNode) {
            powerUpIndicator.remove();
        }
    }, 15000);
}

// Play power-up sound
function playPowerUpSound() {
    if (!audioContext || !game.soundOn) return;
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(880, audioContext.currentTime + 0.1);
    oscillator.frequency.exponentialRampToValueAtTime(1760, audioContext.currentTime + 0.2);
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.3);
}

// Check if two rectangles are colliding
function isColliding(rect1, rect2) {
    return !(
        rect1.right < rect2.left ||
        rect1.left > rect2.right ||
        rect1.bottom < rect2.top ||
        rect1.top > rect2.bottom
    );
}

// Create explosion effect
function createExplosion(x, y) {
    const explosion = document.createElement('div');
    explosion.style.position = 'absolute';
    explosion.style.width = '50px';
    explosion.style.height = '50px';
    explosion.style.left = `${x}px`;
    explosion.style.top = `${y}px`;
    explosion.style.background = 'radial-gradient(circle, #ffff00, #ff8800, #ff4400, transparent)';
    explosion.style.borderRadius = '50%';
    explosion.style.zIndex = '3';
    explosion.style.transform = 'scale(0.5)';
    explosion.style.opacity = '1';
    
    elements.gameArea.appendChild(explosion);
    
    // Animate explosion
    let scale = 0.5;
    let opacity = 1;
    const animateExplosion = setInterval(() => {
        scale += 0.1;
        opacity -= 0.05;
        explosion.style.transform = `scale(${scale})`;
        explosion.style.opacity = opacity;
        
        if (opacity <= 0) {
            clearInterval(animateExplosion);
            if (explosion.parentNode) {
                explosion.remove();
            }
        }
    }, 25);
}

// Increase score
function increaseScore() {
    game.score += 10;
    elements.scoreDisplay.textContent = `Score: ${game.score}`;
    
    // Check if score reached 500
    if (game.score === 500) {
        showVictoryScreen();
    }
}

// Show victory screen
function showVictoryScreen() {
    game.isRunning = false;
    
    // Stop background music
    if (game.bgMusic) {
        game.bgMusic.stop();
    }
    
    // Create victory screen
    const victoryScreen = document.createElement('div');
    victoryScreen.style.position = 'absolute';
    victoryScreen.style.top = '0';
    victoryScreen.style.left = '0';
    victoryScreen.style.width = '100%';
    victoryScreen.style.height = '100%';
    victoryScreen.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    victoryScreen.style.display = 'flex';
    victoryScreen.style.flexDirection = 'column';
    victoryScreen.style.justifyContent = 'center';
    victoryScreen.style.alignItems = 'center';
    victoryScreen.style.zIndex = '100';
    
    // Add congratulations message
    const message = document.createElement('h1');
    message.textContent = 'CONGRATULATIONS!';
    message.style.color = 'gold';
    message.style.fontSize = '3rem';
    message.style.textShadow = '0 0 10px gold';
    message.style.marginBottom = '20px';
    
    // Add score display
    const scoreText = document.createElement('p');
    scoreText.textContent = `You reached 500 points!`;
    scoreText.style.color = 'white';
    scoreText.style.fontSize = '1.5rem';
    scoreText.style.marginBottom = '30px';
    
    // Add restart button
    const restartBtn = document.createElement('button');
    restartBtn.textContent = 'Play Again';
    restartBtn.style.backgroundColor = '#4a90e2';
    restartBtn.style.color = 'white';
    restartBtn.style.border = 'none';
    restartBtn.style.padding = '12px 24px';
    restartBtn.style.fontSize = '1.2rem';
    restartBtn.style.borderRadius = '5px';
    restartBtn.style.cursor = 'pointer';
    
    restartBtn.addEventListener('click', () => {
        victoryScreen.remove();
        initGame();
    });
    
    // Add elements to victory screen
    victoryScreen.appendChild(message);
    victoryScreen.appendChild(scoreText);
    victoryScreen.appendChild(restartBtn);
    
    // Add victory screen to game container
    document.querySelector('.game-container').appendChild(victoryScreen);
    
    // Create fireworks effect
    createFireworks();
    
    // Play victory sound
    playVictorySound();
}

// Create fireworks effect
function createFireworks() {
    for (let i = 0; i < 20; i++) {
        setTimeout(() => {
            const firework = document.createElement('div');
            firework.style.position = 'absolute';
            firework.style.width = '5px';
            firework.style.height = '5px';
            firework.style.borderRadius = '50%';
            firework.style.backgroundColor = getRandomColor();
            firework.style.boxShadow = `0 0 10px ${getRandomColor()}`;
            
            const gameContainer = document.querySelector('.game-container');
            const left = Math.random() * gameContainer.offsetWidth;
            const top = Math.random() * gameContainer.offsetHeight;
            
            firework.style.left = `${left}px`;
            firework.style.top = `${top}px`;
            
            gameContainer.appendChild(firework);
            
            // Animate explosion
            setTimeout(() => {
                createFireworkExplosion(left, top, getRandomColor());
                firework.remove();
            }, Math.random() * 1000);
            
        }, i * 200);
    }
}

// Create firework explosion
function createFireworkExplosion(x, y, color) {
    const gameContainer = document.querySelector('.game-container');
    
    for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.style.position = 'absolute';
        particle.style.width = '3px';
        particle.style.height = '3px';
        particle.style.backgroundColor = color;
        particle.style.boxShadow = `0 0 5px ${color}`;
        particle.style.borderRadius = '50%';
        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;
        particle.style.zIndex = '101';
        
        const angle = Math.random() * Math.PI * 2;
        const speed = 1 + Math.random() * 3;
        const dx = Math.cos(angle) * speed;
        const dy = Math.sin(angle) * speed;
        
        gameContainer.appendChild(particle);
        
        let frameCount = 0;
        const animateParticle = () => {
            if (frameCount > 50) {
                particle.remove();
                return;
            }
            
            const currentLeft = parseFloat(particle.style.left);
            const currentTop = parseFloat(particle.style.top);
            
            particle.style.left = `${currentLeft + dx}px`;
            particle.style.top = `${currentTop + dy}px`;
            particle.style.opacity = 1 - frameCount / 50;
            
            frameCount++;
            requestAnimationFrame(animateParticle);
        };
        
        requestAnimationFrame(animateParticle);
    }
}

// Get random color for fireworks
function getRandomColor() {
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffffff'];
    return colors[Math.floor(Math.random() * colors.length)];
}

// Play victory sound
function playVictorySound() {
    if (!audioContext || !game.soundOn) return;
    
    const oscillator1 = audioContext.createOscillator();
    const oscillator2 = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator1.type = 'triangle';
    oscillator2.type = 'square';
    
    // Play fanfare
    const notes = [
        { note: 523.25, duration: 0.2 }, // C5
        { note: 659.25, duration: 0.2 }, // E5
        { note: 783.99, duration: 0.2 }, // G5
        { note: 1046.50, duration: 0.6 }  // C6
    ];
    
    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
    
    oscillator1.connect(gainNode);
    oscillator2.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator1.start();
    oscillator2.start();
    
    let time = audioContext.currentTime;
    
    notes.forEach(note => {
        oscillator1.frequency.setValueAtTime(note.note, time);
        oscillator2.frequency.setValueAtTime(note.note / 2, time);
        time += note.duration;
    });
    
    oscillator1.stop(time);
    oscillator2.stop(time);
}

// Decrease lives
function decreaseLives() {
    game.lives--;
    elements.livesDisplay.textContent = `Lives: ${game.lives}`;
    
    if (game.lives <= 0) {
        endGame();
    }
}

// End game
function endGame() {
    game.isRunning = false;
    
    // Stop background music
    if (game.bgMusic) {
        game.bgMusic.stop();
    }
    
    // Update high score
    if (game.score > game.highScore) {
        game.highScore = game.score;
        localStorage.setItem('highScore', game.highScore);
    }
    
    // Update game over screen
    elements.finalScoreDisplay.textContent = `Score: ${game.score}`;
    elements.highScoreDisplay.textContent = `High Score: ${game.highScore}`;
    
    // Show game over screen
    elements.gameScreen.classList.add('hidden');
    elements.gameOverScreen.classList.remove('hidden');
}

// Event listeners
elements.playBtn.addEventListener('click', initGame);
elements.restartBtn.addEventListener('click', initGame);

elements.soundToggle.addEventListener('click', () => {
    game.soundOn = !game.soundOn;
    
    if (game.soundOn) {
        elements.soundToggle.classList.remove('sound-off');
        elements.soundToggle.classList.add('sound-on');
        elements.soundToggle.textContent = 'Sound: ON';
        
        // Initialize audio context on user interaction
        if (audioContext && audioContext.state === 'suspended') {
            audioContext.resume();
        }
        
        if (game.isRunning) {
            playBackgroundMusic();
        }
    } else {
        elements.soundToggle.classList.remove('sound-on');
        elements.soundToggle.classList.add('sound-off');
        elements.soundToggle.textContent = 'Sound: OFF';
        
        // Stop background music
        if (game.bgMusic) {
            game.bgMusic.stop();
        }
    }
});

// Keyboard events
document.addEventListener('keydown', (e) => {
    game.keys[e.key] = true;
    
    // Shoot with spacebar
    if (e.key === ' ' && game.isRunning) {
        shootBullet();
        e.preventDefault(); // Prevent page scrolling with spacebar
    }
});

document.addEventListener('keyup', (e) => {
    game.keys[e.key] = false;
});

// Mobile touch controls
let touchStartX = 0;
let touchStartY = 0;

elements.gameArea.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    
    // Shoot on tap
    if (game.isRunning) {
        shootBullet();
    }
});

elements.gameArea.addEventListener('touchmove', (e) => {
    if (!game.isRunning) return;
    
    e.preventDefault();
    
    const touchX = e.touches[0].clientX;
    const touchY = e.touches[0].clientY;
    const gameRect = elements.gameArea.getBoundingClientRect();
    
    // Move player to touch position
    const playerRect = game.player.getBoundingClientRect();
    const newLeft = Math.min(
        gameRect.width - playerRect.width,
        Math.max(0, touchX - gameRect.left - playerRect.width / 2)
    );
    const newTop = Math.min(
        gameRect.height - playerRect.height,
        Math.max(0, touchY - gameRect.top - playerRect.height / 2)
    );
    
    game.player.style.left = `${newLeft}px`;
    game.player.style.top = `${newTop}px`;
    
    // Update player rectangle
    game.playerRect = game.player.getBoundingClientRect();
});

// Initialize high score display
elements.highScoreDisplay.textContent = `High Score: ${game.highScore}`;



