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

export const EFFECTS = {
    cardDeal: playCardDeal,
    chip: playChip,
    button: playButton
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
