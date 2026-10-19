// Paste a Spotify playlist URL or URI here, for example:
// const SPOTIFY_PLAYLIST = "https://open.spotify.com/playlist/your_playlist_id";
const SPOTIFY_PLAYLIST = "https://open.spotify.com/playlist/3u38UwTl7lV8Qb0zxYdWML?si=e3062dc7d8aa4d87&pt=a6f7e302993d7cad22cbf94a7774b92b";

const playlistSlot = document.querySelector("#spotify-slot");
const playlistLink = document.querySelector("#spotify-link");

function getSpotifyEmbedUrl(value) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const match = trimmed.match(/(?:open\.spotify\.com\/(?:embed\/)?playlist\/|spotify:playlist:)([A-Za-z0-9]+)/);
  if (!match) return "";
  return `https://open.spotify.com/embed/playlist/${match[1]}?utm_source=generator&theme=0`;
}

const spotifyEmbedUrl = getSpotifyEmbedUrl(SPOTIFY_PLAYLIST);
if (spotifyEmbedUrl && playlistSlot) {
  const embed = document.createElement("iframe");
  embed.className = "spotify-embed";
  embed.src = spotifyEmbedUrl;
  embed.title = "Spotify playlist player";
  embed.loading = "lazy";
  embed.allow = "autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture";
  embed.referrerPolicy = "strict-origin-when-cross-origin";
  playlistSlot.replaceWith(embed);
  if (playlistLink) {
    playlistLink.href = `https://open.spotify.com/playlist/${spotifyEmbedUrl.split("/playlist/")[1].split("?")[0]}`;
    playlistLink.hidden = false;
  }
}

document.querySelectorAll(".filter-button").forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.dataset.filter;
    document.querySelectorAll(".filter-button").forEach((item) => {
      const active = item === button;
      item.classList.toggle("is-active", active);
      item.setAttribute("aria-pressed", String(active));
    });
    document.querySelectorAll(".project-card").forEach((card) => {
      card.hidden = filter !== "all" && !card.dataset.category.split(" ").includes(filter);
    });
  });
});

const catMessages = [
  "the cat approves of this tab. probably.",
  "purrmission granted. continue exploring.",
  "this bug is now a feature. the cat said so.",
  "reminder: hydrate, stretch, pet a cat.",
  "keyboard inspected. no bugs detected (by cat standards).",
  "meooww you doin?"
];
document.querySelector(".cat-button")?.addEventListener("click", () => {
  const message = document.querySelector(".cat-message");
  if (message) message.textContent = catMessages[Math.floor(Math.random() * catMessages.length)];
});

const themeButton = document.querySelector(".theme-toggle");
function updateThemeButton(isDark) {
  if (!themeButton) return;
  themeButton.textContent = isDark ? "☀ light mode" : "☾ dark mode";
  themeButton.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
  themeButton.setAttribute("aria-pressed", String(isDark));
}
updateThemeButton(document.documentElement.classList.contains("theme-dark"));
themeButton?.addEventListener("click", () => {
  const active = document.documentElement.classList.toggle("theme-dark");
  updateThemeButton(active);
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", active ? "#191624" : "#fbf8ff");
  try {
    localStorage.setItem("annmaria-theme", active ? "dark" : "light");
  } catch {
    // Keep the toggle usable if browser storage is unavailable.
  }
});

const commandDialog = document.querySelector(".command-dialog");
const commandInput = document.querySelector("#command-input");
const commandOutput = document.querySelector(".command-output");
document.querySelector(".terminal-shortcut")?.addEventListener("click", () => {
  if (typeof commandDialog?.showModal === "function") {
    commandDialog.showModal();
    commandInput?.focus();
  }
});
commandInput?.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") return;
  event.preventDefault();
  const command = commandInput.value.trim().toLowerCase();
  const output = {
    help: "Available commands: help · cat · random_fact",
    cat: "cat.exe says: your current task is to give a cat a nice life.",
    random_fact: "Ann sings and plays keyboard with Ektara, CUSAT’s girls-only band.",
  };
  if (commandOutput) commandOutput.textContent = output[command] || `command not found: ${command || "(empty)"}. try help.`;
  commandInput.value = "";
});

const dotArt = document.querySelector(".dot-art");
const dotCanvas = dotArt?.querySelector(".dot-art-canvas");
const dotContext = dotCanvas?.getContext("2d");

if (dotArt && dotCanvas && dotContext) {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const colors = ["#ad91d4", "#c89bd2", "#e3a1c1", "#d9a5c9", "#a6b6dc"];
  const mainDots = [];
  const floaters = [];
  const pointer = { x: -1000, y: -1000, active: false };
  let frame = 0;
  let width = 0;
  let height = 0;
  let pixelRatio = 1;

  function sampleText(text, font, maxWidth, step) {
    const scratch = document.createElement("canvas");
    const scratchContext = scratch.getContext("2d", { willReadFrequently: true });
    scratch.width = Math.ceil(maxWidth);
    scratch.height = Math.ceil(height);
    scratchContext.font = font;
    scratchContext.textAlign = "center";
    scratchContext.textBaseline = "middle";
    const lines = text.split("\n");
    const lineHeight = parseFloat(font.match(/([\d.]+)px/)?.[1] || "40") * 1.18;
    const blockHeight = lineHeight * lines.length;
    lines.forEach((line, index) => scratchContext.fillText(line, scratch.width / 2, (height - blockHeight) / 2 + lineHeight * (index + 0.5), maxWidth));
    const pixels = scratchContext.getImageData(0, 0, scratch.width, scratch.height).data;
    const points = [];
    for (let y = 0; y < scratch.height; y += step) {
      for (let x = 0; x < scratch.width; x += step) {
        if (pixels[(y * scratch.width + x) * 4 + 3] > 100) points.push({ x: x - scratch.width / 2, y: y - height / 2 });
      }
    }
    return points;
  }

  function buildArt() {
    width = dotArt.clientWidth;
    height = dotArt.clientHeight;
    if (!width || !height) return;
    pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    dotCanvas.width = Math.round(width * pixelRatio);
    dotCanvas.height = Math.round(height * pixelRatio);
    dotContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    mainDots.length = 0;
    floaters.length = 0;

    const mobile = width < 650;
    const fontSize = mobile ? Math.min(34, width / 11) : Math.min(126, width / 23);
    const phrase = mobile ? "KEEP DOING\nWHAT YOU LOVE" : "KEEP DOING WHAT YOU LOVE";
    const step = mobile ? 8 : 10;
    const phrasePoints = sampleText(phrase, `700 ${fontSize}px "DM Mono", monospace`, width * 0.96, step);
    phrasePoints.forEach((point) => mainDots.push({
      x: width / 2 + point.x,
      y: height / 2 + point.y + height * 0.12,
      color: colors[Math.min(colors.length - 1, Math.floor((point.x / width + 0.5) * colors.length))],
      radius: step * 0.39,
      phase: Math.random() * Math.PI * 2,
      vx: 0,
      vy: 0,
    }));

    const glyphs = ["M", "E", "O", "W", "✦", "♡", "✧", "X", "◇", "+", "☾", "☀", "★", "☽", "☼", "❖"];
    const count = Math.max(8, Math.round(width / 110));
    for (let i = 0; i < count; i++) {
      const glyphSize = Math.max(29, Math.min(56, width / 34));
      const points = sampleText(glyphs[i % glyphs.length], `700 ${glyphSize}px "DM Mono", monospace`, glyphSize * 1.2, 5);
      const glyph = {
        x: Math.random() * width,
        y: height * (0.1 + Math.random() * 0.42),
        phase: Math.random() * Math.PI * 2,
        speed: 0.35 + Math.random() * 0.5,
        angle: (Math.random() - 0.5) * 0.55,
        color: colors[i % colors.length],
        points,
        radius: Math.max(2.1, step * 0.31),
      };
      floaters.push(glyph);
    }
    draw(0);
  }

  function draw(time) {
    dotContext.clearRect(0, 0, width, height);
    const t = time * 0.001;
    const drawParticle = (x, y, radius, color) => {
      dotContext.beginPath();
      dotContext.fillStyle = color;
      dotContext.arc(x, y, radius, 0, Math.PI * 2);
      dotContext.fill();
    };

    mainDots.forEach((dot) => {
      const baseX = dot.x;
      const baseY = dot.y + (reducedMotion.matches ? 0 : Math.sin(t * 1.05 + dot.phase) * 1.6);
      if (pointer.active && !reducedMotion.matches) {
        const dx = dot.x - pointer.x;
        const dy = dot.y - pointer.y;
        const distance = Math.hypot(dx, dy);
        if (distance < 100 && distance > 0) {
          const force = (1 - distance / 100) * 14;
          dot.vx += (dx / distance) * force * 0.09;
          dot.vy += (dy / distance) * force * 0.09;
        }
      }
      dot.vx *= 0.88;
      dot.vy *= 0.88;
      drawParticle(baseX + dot.vx, baseY + dot.vy, dot.radius, dot.color);
    });

    floaters.forEach((glyph) => {
      const driftX = reducedMotion.matches ? 0 : Math.sin(t * glyph.speed + glyph.phase) * 15;
      const driftY = reducedMotion.matches ? 0 : Math.cos(t * glyph.speed * 0.8 + glyph.phase) * 13;
      const angle = reducedMotion.matches ? glyph.angle : glyph.angle + Math.sin(t * 0.55 + glyph.phase) * 0.12;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      glyph.points.forEach((point) => {
        const x0 = point.x;
        const y0 = point.y;
        let x = glyph.x + driftX + x0 * cos - y0 * sin;
        let y = glyph.y + driftY + x0 * sin + y0 * cos;
        if (pointer.active && !reducedMotion.matches) {
          const dx = x - pointer.x;
          const dy = y - pointer.y;
          const distance = Math.hypot(dx, dy);
          if (distance < 105 && distance > 0) {
            const force = (1 - distance / 105) * 23;
            x += (dx / distance) * force;
            y += (dy / distance) * force;
          }
        }
        drawParticle(x, y, glyph.radius, glyph.color);
      });
    });
  }

  function animate(time) {
    draw(time);
    if (!reducedMotion.matches) frame = requestAnimationFrame(animate);
  }

  dotArt.addEventListener("pointermove", (event) => {
    const bounds = dotArt.getBoundingClientRect();
    pointer.x = event.clientX - bounds.left;
    pointer.y = event.clientY - bounds.top;
    pointer.active = true;
  });
  dotArt.addEventListener("pointerleave", () => { pointer.active = false; });
  window.addEventListener("resize", () => {
    cancelAnimationFrame(frame);
    buildArt();
    if (!reducedMotion.matches) frame = requestAnimationFrame(animate);
  });
  reducedMotion.addEventListener?.("change", () => {
    cancelAnimationFrame(frame);
    if (!reducedMotion.matches) frame = requestAnimationFrame(animate);
    else draw(0);
  });

  const startDotArt = () => {
    buildArt();
    if (!reducedMotion.matches) frame = requestAnimationFrame(animate);
  };
  if (document.fonts?.ready) document.fonts.ready.then(startDotArt);
  else startDotArt();
}
