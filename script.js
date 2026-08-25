const tarjeta = document.getElementById('tarjeta');
const canvas = document.getElementById('confetti-canvas');
const ctx = canvas.getContext('2d');

let particles = [];
let animationId = null;

// Redimensionar canvas al tamaño de la pantalla
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// --- SISTEMA DE MÚSICA DE CUMPLEAÑOS (Web Audio API) ---
let audioCtx = null;
let isMusicPlaying = false;
let melodyTimeouts = [];

function getAudioContext() {
    if (!audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    return audioCtx;
}

// Frecuencias de notas musicales (Hz)
const NOTES = {
    'G3': 196.00, 'A3': 220.00, 'B3': 246.94,
    'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23, 'G4': 392.00, 'A4': 440.00, 'B4': 493.88,
    'C5': 523.25, 'D5': 587.33, 'E5': 659.25, 'F5': 698.46, 'G5': 783.99, 'A5': 880.00, 'B5': 987.77,
    'C6': 1046.50
};

// Duración base del beat en segundos (Tempo alegre de cajita musical)
const BEAT_DURATION = 0.48;

// Partitura de "Cumpleaños Feliz" con notas principales y armonías
const MELODY = [
    // Frase 1: Cum-ple-a-ños fe-liz
    { note: 'G4', beats: 0.75, chord: ['C4', 'G4'] },
    { note: 'G4', beats: 0.25 },
    { note: 'A4', beats: 1.0 },
    { note: 'G4', beats: 1.0 },
    { note: 'C5', beats: 1.0, chord: ['C4', 'E4', 'G4'] },
    { note: 'B4', beats: 2.0, chord: ['G3', 'D4', 'G4'] },

    // Frase 2: Cum-ple-a-ños fe-liz
    { note: 'G4', beats: 0.75, chord: ['G3', 'D4'] },
    { note: 'G4', beats: 0.25 },
    { note: 'A4', beats: 1.0 },
    { note: 'G4', beats: 1.0 },
    { note: 'D5', beats: 1.0, chord: ['G3', 'B3', 'D4'] },
    { note: 'C5', beats: 2.0, chord: ['C4', 'E4', 'G4'] },

    // Frase 3: Cum-ple-a-ños, que-ri-da Evee
    { note: 'G4', beats: 0.75, chord: ['C4', 'G4'] },
    { note: 'G4', beats: 0.25 },
    { note: 'G5', beats: 1.0, chord: ['C4', 'E4', 'G4'] },
    { note: 'E5', beats: 1.0 },
    { note: 'C5', beats: 1.0, chord: ['F3', 'C4', 'F4'] },
    { note: 'B4', beats: 1.0 },
    { note: 'A4', beats: 2.0, chord: ['F3', 'A3', 'C4'] },

    // Frase 4: Cum-ple-a-ños fe-liz
    { note: 'F5', beats: 0.75, chord: ['F3', 'A3', 'D4'] },
    { note: 'F5', beats: 0.25 },
    { note: 'E5', beats: 1.0, chord: ['C4', 'G4'] },
    { note: 'C5', beats: 1.0 },
    { note: 'D5', beats: 1.0, chord: ['G3', 'D4', 'B4'] },
    { note: 'C5', beats: 2.5, chord: ['C4', 'E4', 'G4', 'C5'] }
];

function playMusicBoxTone(freq, time, duration, isChord = false) {
    const ctx = getAudioContext();
    if (!ctx) return;

    // Oscilador principal (tono puro sinusoidal)
    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, time);

    // Oscilador de brillo armónico (campanilla / caja de música)
    const osc2 = ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 2, time);

    // Envolvente de volumen tipo campana
    const gainNode = ctx.createGain();
    const volume = isChord ? 0.07 : 0.20;

    gainNode.gain.setValueAtTime(0, time);
    gainNode.gain.linearRampToValueAtTime(volume, time + 0.015);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, time + duration * 1.5);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start(time);
    osc2.start(time);
    osc1.stop(time + duration * 1.5);
    osc2.stop(time + duration * 1.5);
}

function stopMusic() {
    melodyTimeouts.forEach(t => clearTimeout(t));
    melodyTimeouts = [];
    isMusicPlaying = false;
    actualizarBotonMusica();
}

function playHappyBirthday() {
    stopMusic();
    const ctx = getAudioContext();
    if (!ctx) return;

    isMusicPlaying = true;
    actualizarBotonMusica();

    let accumulatedMs = 120;

    MELODY.forEach((item) => {
        const noteDuration = item.beats * BEAT_DURATION;
        const noteFreq = NOTES[item.note];

        const tId = setTimeout(() => {
            if (!isMusicPlaying) return;
            playMusicBoxTone(noteFreq, ctx.currentTime, noteDuration, false);

            if (item.chord) {
                item.chord.forEach(cNote => {
                    const cFreq = NOTES[cNote];
                    if (cFreq) {
                        playMusicBoxTone(cFreq, ctx.currentTime, noteDuration * 1.2, true);
                    }
                });
            }
        }, accumulatedMs);

        melodyTimeouts.push(tId);
        accumulatedMs += noteDuration * 1000;
    });

    // Programar repetición mientras la tarjeta siga abierta
    const loopTimeout = setTimeout(() => {
        if (isMusicPlaying && tarjeta.classList.contains('abierta')) {
            const restartTimeout = setTimeout(() => {
                if (isMusicPlaying && tarjeta.classList.contains('abierta')) {
                    playHappyBirthday();
                }
            }, 1800);
            melodyTimeouts.push(restartTimeout);
        } else {
            isMusicPlaying = false;
            actualizarBotonMusica();
        }
    }, accumulatedMs);

    melodyTimeouts.push(loopTimeout);
}

function toggleMusica(event) {
    if (event) {
        event.stopPropagation();
    }
    if (isMusicPlaying) {
        stopMusic();
    } else {
        getAudioContext();
        playHappyBirthday();
    }
}

function actualizarBotonMusica() {
    const btn = document.getElementById('btnMusica');
    const icono = document.getElementById('iconoMusica');
    if (!btn || !icono) return;

    if (isMusicPlaying) {
        btn.classList.add('sonando');
        icono.textContent = '🎵';
        btn.setAttribute('title', 'Pausar música');
    } else {
        btn.classList.remove('sonando');
        icono.textContent = '🔇';
        btn.setAttribute('title', 'Reproducir música');
    }
}

// Abrir la tarjeta al hacer clic en ella
function abrirTarjeta(event) {
    if (event) {
        event.stopPropagation();
    }

    if (!tarjeta.classList.contains('abierta')) {
        tarjeta.classList.add('abierta');
        document.body.classList.add('tarjeta-abierta');
        lanzarEfectoCelebracion();

        // Iniciar música automáticamente con el clic de apertura
        getAudioContext();
        playHappyBirthday();
    }
}

// Cerrar la tarjeta al hacer clic fuera de ella
document.addEventListener('click', function (event) {
    const btnMusica = document.getElementById('btnMusica');
    if (btnMusica && btnMusica.contains(event.target)) {
        return;
    }

    if (tarjeta.classList.contains('abierta') && !tarjeta.contains(event.target)) {
        tarjeta.classList.remove('abierta');
        document.body.classList.remove('tarjeta-abierta');
        stopMusic();
    }
});

// --- SISTEMA DE CONFETI Y DESTELLOS MÁGICOS ---
class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 8 + 4;
        this.speedX = (Math.random() - 0.5) * 12;
        this.speedY = Math.random() * -10 - 5;
        this.gravity = 0.35;
        this.color = [
            '#ffd700', // Oro
            '#e84393', // Rosa intenso
            '#6c5ce7', // Púrpura suave
            '#a29bfe', // Lila
            '#00cec9', // Turquesa
            '#ffffff'  // Blanco destello
        ][Math.floor(Math.random() * 6)];
        this.rotation = Math.random() * 360;
        this.rotationSpeed = (Math.random() - 0.5) * 10;
        this.opacity = 1;
        this.decay = Math.random() * 0.015 + 0.008;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.speedY += this.gravity;
        this.speedX *= 0.98;
        this.rotation += this.rotationSpeed;
        this.opacity -= this.decay;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate((this.rotation * Math.PI) / 180);
        ctx.globalAlpha = Math.max(this.opacity, 0);
        ctx.fillStyle = this.color;
        
        // Formas alternadas (estrellitas o rectángulos)
        ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size * 0.7);
        ctx.restore();
    }
}

function lanzarEfectoCelebracion() {
    // Origen desde el centro de la pantalla
    const rect = tarjeta.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    particles = [];
    for (let i = 0; i < 90; i++) {
        particles.push(new Particle(centerX, centerY));
    }

    if (animationId) {
        cancelAnimationFrame(animationId);
    }
    animarParticulas();
}

function animarParticulas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.update();
        p.draw();

        if (p.opacity <= 0 || p.y > canvas.height) {
            particles.splice(i, 1);
        }
    }

    if (particles.length > 0) {
        animationId = requestAnimationFrame(animarParticulas);
    } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        animationId = null;
    }
}
