const scene = document.getElementById("scene");
const entry = document.getElementById("entry");
const profile = document.querySelector(".profile");
const audio = document.getElementById("audio");
const playToggle = document.getElementById("play-toggle");
const progress = document.getElementById("progress");
const currentTime = document.getElementById("current-time");
const duration = document.getElementById("duration");
const skipBack = document.getElementById("skip-back");
const skipForward = document.getElementById("skip-forward");
const musicPlayer = document.querySelector(".music-player");
const cdArtwork = document.querySelector(".cd-artwork");
const trackTitle = document.querySelector(".track-title");
const trackSubtitle = document.querySelector(".track-subtitle");
const soundToggle = document.getElementById("sound-toggle");
const volumeSlider = document.getElementById("volume");
const customCursor = document.getElementById("custom-cursor");
const projectsOpen = document.getElementById("projects-open");
const projectsPicker = document.getElementById("projects-picker");
const projectsClose = document.getElementById("projects-picker-close");


const bgCanvas = document.querySelector(".bg-canvas");
const bgCtx = bgCanvas.getContext("2d");
const bgBlobs = [];
const blobCount = 6;
let bgTargets = [
  [34, 38, 46],
  [30, 32, 40],
  [42, 30, 34],
  [34, 34, 34],
  [30, 30, 40],
  [40, 36, 30],
];
let bgAccum = 0;

for (let index = 0; index < blobCount; index += 1) {
  bgBlobs.push({
    u: 0.2 + Math.random() * 0.6,
    v: 0.18 + Math.random() * 0.64,
    r: 0.5 + Math.random() * 0.42,
    orbit: 0.05 + Math.random() * 0.13,
    speed: (Math.random() < 0.5 ? -1 : 1) * (0.05 + Math.random() * 0.11),
    ratio: 0.7 + Math.random() * 0.6,
    phase: Math.random() * Math.PI * 2,
    alpha: 0.5 + Math.random() * 0.34,
    color: [26, 28, 34],
  });
}

function paletteFromImage(image) {
  const grid = 44;
  const sampler = document.createElement("canvas");
  sampler.width = grid;
  sampler.height = grid;
  const samplerCtx = sampler.getContext("2d", { willReadFrequently: true });
  samplerCtx.drawImage(image, 0, 0, grid, grid);
  const data = samplerCtx.getImageData(0, 0, grid, grid).data;
  const buckets = new Map();

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const level = (Math.max(r, g, b) + Math.min(r, g, b)) / 510;
    if (level < 0.07 || level > 0.95) continue;
    const spread = Math.max(r, g, b) - Math.min(r, g, b);
    if (spread < 31 && Math.max(r, g, b) < 88) continue;

    const key = (r >> 5 << 6) | (g >> 5 << 3) | (b >> 5);
    const bucket = buckets.get(key) || { r: 0, g: 0, b: 0, w: 0 };
    bucket.r += r;
    bucket.g += g;
    bucket.b += b;
    bucket.w += 1 + spread / 38 + (1 - Math.abs(level - 0.45)) * 0.9;
    buckets.set(key, bucket);
  }

  const ranked = [...buckets.values()]
    .map(bucket => ({
      r: bucket.r / bucket.w,
      g: bucket.g / bucket.w,
      b: bucket.b / bucket.w,
      w: bucket.w,
    }))
    .sort((a, b) => b.w - a.w)
    .slice(0, 14);

  if (!ranked.length) return null;

  const picked = [ranked[0]];
  while (picked.length < 5 && picked.length < ranked.length) {
    let best = null;
    let bestScore = -1;
    for (const candidate of ranked) {
      if (picked.includes(candidate)) continue;
      let distance = Infinity;
      for (const color of picked) {
        distance = Math.min(distance,
          Math.abs(candidate.r - color.r) + Math.abs(candidate.g - color.g) + Math.abs(candidate.b - color.b));
      }
      const score = candidate.w * (0.25 + distance / 255);
      if (score > bestScore) {
        bestScore = score;
        best = candidate;
      }
    }
    if (!best) break;
    picked.push(best);
  }

  while (picked.length < blobCount) {
    const base = picked[picked.length - 1];
    picked.push({ r: base.r * 0.72, g: base.g * 0.72, b: base.b * 0.72 });
  }

  return picked.map(color => [color.r, color.g, color.b]);
}

function scanCover(src) {
  const image = new Image();
  image.onload = () => {
    const palette = paletteFromImage(image);
    if (palette) bgTargets = palette;
  };
  image.src = src;
}

function paintAmbient() {
  const width = bgCanvas.width;
  const height = bgCanvas.height;
  const time = performance.now() / 1000;

  bgCtx.globalCompositeOperation = "source-over";
  bgCtx.fillStyle = "#040405";
  bgCtx.fillRect(0, 0, width, height);
  bgCtx.globalCompositeOperation = "lighter";

  for (let index = 0; index < bgBlobs.length; index += 1) {
    const blob = bgBlobs[index];
    const angle = blob.phase + time * blob.speed;
    const x = (blob.u + Math.cos(angle) * blob.orbit) * width;
    const y = (blob.v + Math.sin(angle * blob.ratio + blob.phase) * blob.orbit) * height;
    const target = bgTargets[index % bgTargets.length];
    const color = blob.color;

    for (let channel = 0; channel < 3; channel += 1) {
      color[channel] += (target[channel] - color[channel]) * 0.015;
    }

    const glow = bgCtx.createRadialGradient(x, y, 0, x, y, blob.r * Math.min(width, height));
    const rgb = `${Math.round(color[0])}, ${Math.round(color[1])}, ${Math.round(color[2])}`;
    glow.addColorStop(0, `rgba(${rgb}, ${blob.alpha})`);
    glow.addColorStop(0.55, `rgba(${rgb}, ${(blob.alpha * 0.32).toFixed(3)})`);
    glow.addColorStop(1, "rgba(0, 0, 0, 0)");
    bgCtx.fillStyle = glow;
    bgCtx.fillRect(0, 0, width, height);
  }
}

function tickAmbient(dt) {
  bgAccum += dt;
  if (bgAccum < 0.04) return;
  bgAccum = 0;
  paintAmbient();
}

function resizeBg() {
  const width = 320;
  bgCanvas.width = width;
  bgCanvas.height = Math.max(120, Math.round((width * window.innerHeight) / window.innerWidth));
  paintAmbient();
}

resizeBg();
window.addEventListener("resize", resizeBg);

const snowfall = document.getElementById("snowfall");
const flakeCount = 28;

for (let index = 0; index < flakeCount; index += 1) {
  const flake = document.createElement("span");
  const size = 1.2 + Math.random() * 1.8;
  flake.className = "snowflake";
  flake.style.left = `${Math.random() * 100}%`;
  flake.style.width = `${size}px`;
  flake.style.height = `${size}px`;
  flake.style.opacity = `${0.22 + Math.random() * 0.32}`;
  flake.style.setProperty("--drift", `${-8 + Math.random() * 16}px`);
  flake.style.animationDuration = `${14 + Math.random() * 16}s`;
  flake.style.animationDelay = `-${Math.random() * 18}s`;
  snowfall.appendChild(flake);
}

const eq = document.getElementById("eq");
const barCount = 12;
const eqBars = [];
const eqLevels = new Float32Array(barCount);

for (let index = 0; index < barCount; index += 1) {
  const bar = document.createElement("span");
  eq.appendChild(bar);
  eqBars.push(bar);
}

let audioCtx = null;
let analyser = null;
let spectrum = null;

function ensureAnalyser() {
  if (audioCtx || (typeof window.AudioContext === "undefined" && typeof window.webkitAudioContext === "undefined")) return;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  audioCtx = new Ctx();
  const source = audioCtx.createMediaElementSource(audio);
  analyser = audioCtx.createAnalyser();
  analyser.fftSize = 256;
  analyser.smoothingTimeConstant = 0.55;
  source.connect(analyser);
  analyser.connect(audioCtx.destination);
  spectrum = new Uint8Array(analyser.frequencyBinCount);
}

function tickEq() {
  if (!analyser) return;
  analyser.getByteFrequencyData(spectrum);

  const usable = Math.floor(spectrum.length * 0.82);
  for (let index = 0; index < barCount; index += 1) {
    const t0 = Math.pow(index / barCount, 1.55) * usable;
    const t1 = Math.pow((index + 1) / barCount, 1.55) * usable;
    const start = Math.floor(t0);
    const end = Math.max(start + 1, Math.floor(t1));

    let sum = 0;
    for (let bin = start; bin < end; bin += 1) sum += spectrum[bin];
    const raw = sum / (end - start) / 255;

    const lift = 1 + Math.pow(index / barCount, 2) * 1.1;
    const target = Math.min(1, Math.pow(raw, 1.42) * lift);

    const level = eqLevels[index];
    eqLevels[index] = target > level
      ? level + (target - level) * 0.38
      : level + (target - level) * 0.12;

    const scaleY = 0.12 + eqLevels[index] * 0.88;
    eqBars[index].style.transform = `scaleY(${scaleY.toFixed(3)})`;
  }
}

const cdDisc = document.querySelector(".cd-disc");
const cdWrap = document.querySelector(".cd-wrap");
const CD_FULL_SPEED = 24;
let cdAngle = 0;
let cdVelocity = 0;
let cdTarget = 0;
let lastFrame = performance.now();

function togglePlayback() {
  if (audio.paused) {
    ensureAnalyser();
    if (audioCtx && audioCtx.state === "suspended") audioCtx.resume().catch(() => { });
    audio.play().catch(() => { });
  } else {
    audio.pause();
  }
}

cdWrap.addEventListener("click", togglePlayback);
cdWrap.addEventListener("keydown", event => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    togglePlayback();
  }
});

function tickCd(now) {
  const dt = Math.min(0.05, (now - lastFrame) / 1000);
  lastFrame = now;

  const rate = cdTarget > cdVelocity ? 2.8 : 1.2;
  cdVelocity += (cdTarget - cdVelocity) * (1 - Math.exp(-dt * rate));
  if (cdTarget === 0 && cdVelocity < 0.02) cdVelocity = 0;

  if (cdVelocity > 0) {
    cdAngle = (cdAngle + cdVelocity * dt) % 360;
    cdDisc.style.transform = `rotate(${cdAngle}deg)`;
  }

  tickEq();
  tickAmbient(dt);

  requestAnimationFrame(tickCd);
}

requestAnimationFrame(tickCd);

const cursorPos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
const cursorTarget = { x: cursorPos.x, y: cursorPos.y };
const cursorEase = 0.14;
const cursorScale = { current: 1, target: 1 };
const cursorScaleEase = 0.22;

function renderCursor() {
  cursorPos.x += (cursorTarget.x - cursorPos.x) * cursorEase;
  cursorPos.y += (cursorTarget.y - cursorPos.y) * cursorEase;
  cursorScale.current += (cursorScale.target - cursorScale.current) * cursorScaleEase;
  customCursor.style.transform = `translate(${cursorPos.x}px, ${cursorPos.y}px) scale(${cursorScale.current})`;
  requestAnimationFrame(renderCursor);
}

if (window.matchMedia("(pointer: fine)").matches) {
  window.addEventListener("pointermove", event => {
    cursorTarget.x = event.clientX;
    cursorTarget.y = event.clientY;
    customCursor.classList.add("is-visible");
  });
  window.addEventListener("pointerdown", () => {
    cursorScale.target = 0.82;
  });
  window.addEventListener("pointerup", () => {
    cursorScale.target = 1;
  });
  window.addEventListener("pointercancel", () => {
    cursorScale.target = 1;
  });
  document.addEventListener("mouseleave", () => {
    customCursor.classList.remove("is-visible");
    cursorScale.target = 1;
  });
  document.documentElement.addEventListener("mouseenter", () => customCursor.classList.add("is-visible"));
  renderCursor();
} else {
  document.documentElement.style.setProperty("cursor", "auto");
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return "--:--";
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainder}`;
}

function syncProgress() {
  const ratio = audio.duration ? audio.currentTime / audio.duration : 0;
  progress.value = Math.round(ratio * 1000);
  progress.style.setProperty("--played", `${ratio * 100}%`);
  currentTime.textContent = formatTime(audio.currentTime);
  duration.textContent = Number.isFinite(audio.duration)
    ? `-${formatTime(Math.max(0, audio.duration - audio.currentTime))}`
    : "--:--";
}

const playlist = [
  { title: "fell in luv", artist: "playboi carti ft. bryson tiller", src: "music/fell-in-luv.mp3", cover: "music/fell-in-luv-cover.jpg" },
  { title: "yessirskiii", artist: "lil uzi vert & 21 savage", src: "music/yessirskiii.mp3", cover: "music/yessirskiii-cover.jpg" },
  { title: "marble floors", artist: "summrs", src: "music/marble-floors.mp3", cover: "music/marble-floors-cover.jpg" },
  { title: "twig", artist: "yen", src: "music/twig.mp3", cover: "music/twig-cover.png" },
  { title: "feel my wrath", artist: "yen", src: "music/feel-my-wrath.mp3", cover: "music/feel-my-wrath-cover.png" },
  { title: "bastard", artist: "yen", src: "music/bastard.mp3", cover: "music/bastard-cover.png" },
  { title: "i keep calling ...", artist: "wifiskeleton, jaydes", src: "music/i-keep-calling.mp3", cover: "music/i-keep-calling-cover.png" },
  { title: "i'm a piece of shit", artist: "yen", src: "music/im-a-piece-of-shit.mp3", cover: "music/im-a-piece-of-shit-cover.png" },
];

scanCover(playlist[0].cover);

let trackIndex = 0;
let isSwitching = false;
const switchMs = 240;

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function updateTrackLabels() {
  const track = playlist[trackIndex];
  musicPlayer.setAttribute("aria-label", `Music player for ${track.title}`);
  playToggle.setAttribute("aria-label", audio.paused ? `Play ${track.title}` : `Pause ${track.title}`);
}

function applyTrack(index) {
  trackIndex = (index + playlist.length) % playlist.length;
  const track = playlist[trackIndex];
  audio.src = track.src;
  cdArtwork.src = track.cover;
  scanCover(track.cover);
  trackTitle.textContent = track.title;
  trackSubtitle.textContent = track.artist;
  progress.value = 0;
  progress.style.setProperty("--played", "0%");
  currentTime.textContent = "0:00";
  duration.textContent = "--:--";
  audio.load();
  updateTrackLabels();
}

async function loadTrack(index, autoplay = false) {
  const nextIndex = (index + playlist.length) % playlist.length;
  if (isSwitching || nextIndex === trackIndex) return;

  isSwitching = true;
  const wasPlaying = autoplay || !audio.paused;
  musicPlayer.classList.add("is-switching");
  scene.classList.add("is-switching");

  await wait(switchMs / 2);
  if (wasPlaying) audio.pause();
  applyTrack(nextIndex);
  await wait(switchMs / 2);
  musicPlayer.classList.remove("is-switching");
  scene.classList.remove("is-switching");

  if (wasPlaying) audio.play().catch(() => { });
  isSwitching = false;
}

function changeTrack(delta) {
  loadTrack(trackIndex + delta, !audio.paused);
}

function enterProfile() {
  scene.classList.add("entered");
  entry.setAttribute("aria-hidden", "true");
  entry.tabIndex = -1;
  ensureAnalyser();
  audio.play().catch(() => { });
}

entry.addEventListener("click", enterProfile);

function openProjectsPicker() {
  projectsPicker.hidden = false;
  requestAnimationFrame(() => {
    requestAnimationFrame(() => projectsPicker.classList.add("is-open"));
  });
  projectsClose.focus();
}

function closeProjectsPicker() {
  projectsPicker.classList.remove("is-open");
  const finish = () => {
    if (!projectsPicker.classList.contains("is-open")) projectsPicker.hidden = true;
  };
  projectsPicker.addEventListener("transitionend", finish, { once: true });
  setTimeout(finish, 320);
  projectsOpen.focus();
}

projectsOpen.addEventListener("click", openProjectsPicker);
projectsClose.addEventListener("click", closeProjectsPicker);
projectsPicker.addEventListener("click", event => {
  if (event.target === projectsPicker) closeProjectsPicker();
});
projectsPicker.querySelectorAll(".project-link").forEach(link => {
  link.addEventListener("click", () => closeProjectsPicker());
});
window.addEventListener("keydown", event => {
  if (event.key === "Escape" && projectsPicker.classList.contains("is-open")) {
    event.preventDefault();
    closeProjectsPicker();
  }
});
window.addEventListener("keydown", event => {
  if (!scene.classList.contains("entered") && (event.key === "Enter" || event.key === " ")) {
    event.preventDefault();
    enterProfile();
  }
});

scene.addEventListener("pointermove", event => {
  document.documentElement.style.setProperty("--pointer-x", `${event.clientX}px`);
  document.documentElement.style.setProperty("--pointer-y", `${event.clientY}px`);
});

profile.addEventListener("pointermove", event => {
  const bounds = profile.getBoundingClientRect();
  const x = (event.clientX - bounds.left) / bounds.width;
  const y = (event.clientY - bounds.top) / bounds.height;
  profile.style.setProperty("--tilt-x", `${(0.5 - y) * 5}deg`);
  profile.style.setProperty("--tilt-y", `${(x - 0.5) * 7}deg`);
  profile.style.setProperty("--move-x", `${(x - 0.5) * 10}px`);
  profile.style.setProperty("--move-y", `${(y - 0.5) * 8}px`);
  profile.style.setProperty("--shine-x", `${x * 100}%`);
  profile.style.setProperty("--shine-y", `${y * 100}%`);
});

profile.addEventListener("pointerleave", () => {
  profile.style.setProperty("--tilt-x", "0deg");
  profile.style.setProperty("--tilt-y", "0deg");
  profile.style.setProperty("--move-x", "0px");
  profile.style.setProperty("--move-y", "0px");
  profile.style.setProperty("--shine-x", "50%");
  profile.style.setProperty("--shine-y", "35%");
});

playToggle.addEventListener("click", () => {
  if (audio.paused) {
    audio.play().catch(() => { });
  } else {
    audio.pause();
  }
});

skipBack.addEventListener("click", () => changeTrack(-1));

skipForward.addEventListener("click", () => changeTrack(1));

soundToggle.addEventListener("click", () => {
  audio.muted = !audio.muted;
  soundToggle.classList.toggle("is-muted", audio.muted);
  soundToggle.setAttribute("aria-label", audio.muted ? "Unmute audio" : "Mute audio");
});

volumeSlider.addEventListener("input", () => {
  const level = Number(volumeSlider.value) / 100;
  audio.volume = level;
  volumeSlider.style.setProperty("--filled", `${volumeSlider.value}%`);
  if (audio.muted && level > 0) {
    audio.muted = false;
    soundToggle.classList.remove("is-muted");
    soundToggle.setAttribute("aria-label", "Mute audio");
  }
});

volumeSlider.style.setProperty("--filled", `${volumeSlider.value}%`);
audio.volume = Number(volumeSlider.value) / 100;

progress.addEventListener("input", () => {
  if (!audio.duration) return;
  audio.currentTime = (Number(progress.value) / 1000) * audio.duration;
  syncProgress();
});

audio.addEventListener("loadedmetadata", () => {
  syncProgress();
});

audio.addEventListener("timeupdate", syncProgress);
audio.addEventListener("ended", () => loadTrack(trackIndex + 1, true));
audio.addEventListener("play", () => {
  playToggle.classList.add("is-playing");
  scene.classList.add("playing");
  cdTarget = CD_FULL_SPEED;
  updateTrackLabels();
});
audio.addEventListener("pause", () => {
  playToggle.classList.remove("is-playing");
  scene.classList.remove("playing");
  cdTarget = 0;
  updateTrackLabels();
});

  
