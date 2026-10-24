export function isMuted() {
    if (muted === null) {
        try {
            if (typeof localStorage !== 'undefined') {
                const value = localStorage.getItem('xp-muted');
                muted = value === '1';
            } else {
                muted = false;
            }
        } catch {
            muted = false;
        }
    }
    return muted;
}

export function setMuted(value) {
    muted = !!value;
    try {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('xp-muted', String(muted));
        }
    } catch {
        // ignore
    }
    return muted;
}

export function toggleMuted() {
    return setMuted(!isMuted());
}

let muted = null;

function getCtx() {
    if (isMuted()) return null;
    if (typeof window === 'undefined') return null;
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return null;
    if (!ctx) {
        ctx = new Ctor();
    }
    if (ctx.state === 'suspended') {
        ctx.resume();
    }
    return ctx;
}

let ctx = null;

function tone(freq, duration, options) {
    const ctx = getCtx();
    if (!ctx) return;
    const t0 = ctx.currentTime + (options?.delay || 0);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = options?.type || 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    if (options?.slideTo !== undefined) {
        osc.frequency.exponentialRampToValueAtTime(options.slideTo, t0 + duration);
    }
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.linearRampToValueAtTime(options?.volume || 0.15, t0 + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + duration + 0.02);
}

function noise(duration, options) {
    const ctx = getCtx();
    if (!ctx) return;
    const t0 = ctx.currentTime + (options?.delay || 0);
    const sampleRate = ctx.sampleRate;
    const len = Math.floor(duration * sampleRate);
    const buffer = ctx.createBuffer(1, len, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = options?.filterType || 'bandpass';
    filter.frequency.value = options?.filterFreq || 2000;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.linearRampToValueAtTime(options?.volume || 0.12, t0 + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    source.start(t0);
    source.stop(t0 + duration + 0.02);
}

export function playCardDeal() {
    noise(0.08, { filterFreq: 3000, filterType: 'bandpass', volume: 0.12 });
}

export function playChip() {
    tone(2400, 0.04, { type: 'square', volume: 0.08 });
    tone(3200, 0.04, { delay: 0.04, type: 'square', volume: 0.08 });
}

export function playButton() {
    tone(880, 0.05);
}

export function playCardFlip() {
    noise(0.05, { filterFreq: 5000, filterType: 'bandpass', volume: 0.1 });
}

export function playBet() {
    tone(2200, 0.04, { type: 'square', volume: 0.07, delay: 0 });
    tone(2600, 0.04, { type: 'square', volume: 0.07, delay: 0.05 });
    tone(3000, 0.04, { type: 'square', volume: 0.07, delay: 0.1 });
    noise(0.04, { filterFreq: 200, filterType: 'lowpass', volume: 0.05, delay: 0.15 });
}

export function playFold() {
    tone(300, 0.25, { type: 'sawtooth', volume: 0.1, slideTo: 120 });
}

export function playCheck() {
    tone(180, 0.08, { type: 'sine', volume: 0.2 });
}

export function playWin() {
    tone(523, 0.14, { type: 'triangle', volume: 0.15, delay: 0 });
    tone(659, 0.14, { type: 'triangle', volume: 0.15, delay: 0.12 });
    tone(784, 0.14, { type: 'triangle', volume: 0.15, delay: 0.24 });
    tone(1047, 0.3, { type: 'triangle', volume: 0.15, delay: 0.36 });
}

export function playLose() {
    tone(330, 0.25, { type: 'sawtooth', volume: 0.1, delay: 0 });
    tone(247, 0.25, { type: 'sawtooth', volume: 0.1, delay: 0.22 });
}

export function playPush() {
    tone(440, 0.15, { type: 'sine', volume: 0.12, delay: 0 });
    tone(440, 0.15, { type: 'sine', volume: 0.12, delay: 0.2 });
}

export function playTick() {
    tone(1800, 0.015, { type: 'square', volume: 0.06 });
}

export function playSpin() {
    noise(1.0, { filterFreq: 600, filterType: 'bandpass', volume: 0.1 });
    tone(120, 1.0, { type: 'sine', volume: 0.05, slideTo: 500 });
}

export function playBallDrop() {
    tone(1500, 0.02, { type: 'square', volume: 0.07, delay: 0 });
    tone(1600, 0.02, { type: 'square', volume: 0.07, delay: 0.055 });
    tone(1700, 0.02, { type: 'square', volume: 0.07, delay: 0.115 });
    tone(1800, 0.02, { type: 'square', volume: 0.07, delay: 0.205 });
    tone(1900, 0.02, { type: 'square', volume: 0.07, delay: 0.335 });
    tone(2000, 0.02, { type: 'square', volume: 0.07, delay: 0.535 });
}

export const EFFECTS = {
    cardDeal: playCardDeal,
    chip: playChip,
    button: playButton,
    cardFlip: playCardFlip,
    bet: playBet,
    fold: playFold,
    check: playCheck,
    win: playWin,
    lose: playLose,
    push: playPush,
    tick: playTick,
    spin: playSpin,
    ballDrop: playBallDrop,
};

export function play(name) {
    try {
        const fn = EFFECTS[name];
        if (typeof fn === 'function') {
            fn();
        }
    } catch (e) {
        // ignore
    }
}

export const SOUND_NAMES = Object.keys(EFFECTS);
