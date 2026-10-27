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

const projectPreviewDialog = document.querySelector(".project-preview-dialog");
if (projectPreviewDialog) {
  const projectPreviewTitle = projectPreviewDialog.querySelector("#preview-dialog-title");
  const projectPreviewGallery = projectPreviewDialog.querySelector(".preview-gallery");
  const projectPreviewImages = {
    argus: [{
      src: "https://github.com/user-attachments/assets/48c54e85-ed3c-42cd-80b2-23154220411c",
      alt: "Argus QR fraud screening interface from the project README",
    }],
    soochi: [
      { src: "assets/soochi-home-screen.png", alt: "Soochi fabric scrap inventory homepage" },
      { src: "assets/soochi-product-matching.jpeg", alt: "Soochi product matching view with selected scraps and suggested products" },
    ],
  };

  function openProjectPreview(projectName) {
    const images = projectPreviewImages[projectName];
    if (!images?.length) return;
    projectPreviewTitle.textContent = `${projectName === "soochi" ? "Soochi" : "Argus"} screenshots`;
    projectPreviewGallery.replaceChildren(...images.map(({ src, alt }) => {
      const image = document.createElement("img");
      image.className = "preview-gallery-image";
      image.src = src;
      image.alt = alt;
      image.loading = "lazy";
      return image;
    }));
    projectPreviewDialog.showModal();
  }

  projectPreviewDialog.querySelector(".preview-dialog-close")?.addEventListener("click", () => {
    projectPreviewDialog.close();
  });

  document.querySelectorAll(".project-card[data-project-preview]").forEach((card) => {
    card.addEventListener("click", (event) => {
      if (event.target.closest("a, .project-preview-action")) return;
      openProjectPreview(card.dataset.projectPreview);
    });
    card.querySelector(".project-preview-action")?.addEventListener("click", () => {
      openProjectPreview(card.dataset.projectPreview);
    });
  });

  projectPreviewDialog.addEventListener("click", (event) => {
    if (event.target === projectPreviewDialog) projectPreviewDialog.close();
  });
}

const spotifyEmbedUrl = getSpotifyEmbedUrl(SPOTIFY_PLAYLIST);
const discPlayer = document.querySelector(".disc-player");
const albumArt = document.querySelector(".album-art");
const musicPlayer = document.querySelector(".music-player");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let spotifyController = null;
let spotifyControllerReady = false;
let pendingDiscToggle = false;
let discSpin = null;
let discIsPlaying = false;

function currentDiscAngle() {
  if (!discPlayer) return 0;
  const transform = window.getComputedStyle(discPlayer).transform;
  if (!transform || transform === "none") return 0;
  const values = transform.slice(transform.indexOf("(") + 1, -1).split(",").map(Number);
  if (values.length < 2 || !Number.isFinite(values[0]) || !Number.isFinite(values[1])) return 0;
  return ((Math.atan2(values[1], values[0]) * 180 / Math.PI) % 360 + 360) % 360;
}

function stopDiscSpin() {
  if (!discSpin || !discPlayer) return;
  const angle = currentDiscAngle();
  discSpin.cancel();
  discSpin = null;
  discPlayer.style.transform = `rotate(${angle}deg)`;
}

function startDiscSpin() {
  if (!discPlayer || reducedMotion.matches || typeof discPlayer.animate !== "function" || discSpin) return;
  const angle = currentDiscAngle();
  discSpin = discPlayer.animate(
    [{ transform: `rotate(${angle}deg)` }, { transform: `rotate(${angle + 360}deg)` }],
    { duration: 3000, iterations: Infinity, easing: "linear" }
  );
}

function setDiscPlaying(isPlaying) {
  if (!discPlayer || !albumArt || discIsPlaying === isPlaying) return;
  discIsPlaying = isPlaying;
  albumArt.classList.toggle("is-playing", isPlaying);
  musicPlayer?.classList.toggle("is-playing", isPlaying);
  discPlayer.setAttribute("aria-pressed", String(isPlaying));
  discPlayer.setAttribute("aria-label", isPlaying ? "Pause Spotify playlist" : "Play Spotify playlist");
  if (isPlaying) startDiscSpin();
  else stopDiscSpin();
}

discPlayer?.addEventListener("click", () => {
  if (!spotifyController) return;
  if (!spotifyControllerReady) {
    pendingDiscToggle = !pendingDiscToggle;
    return;
  }
  spotifyController.togglePlay();
});
reducedMotion.addEventListener?.("change", (event) => {
  if (event.matches) stopDiscSpin();
  else if (discIsPlaying) startDiscSpin();
});

if (spotifyEmbedUrl && playlistSlot) {
  const playlistId = spotifyEmbedUrl.split("/playlist/")[1].split("?")[0];
  if (playlistLink) {
    playlistLink.href = `https://open.spotify.com/playlist/${playlistId}`;
    playlistLink.hidden = false;
  }

  window.onSpotifyIframeApiReady = (IFrameAPI) => {
    IFrameAPI.createController(playlistSlot, { width: "100%", height: "152", url: SPOTIFY_PLAYLIST }, (controller) => {
      spotifyController = controller;
      controller.addListener("ready", () => {
        spotifyControllerReady = true;
        if (pendingDiscToggle) {
          pendingDiscToggle = false;
          controller.togglePlay();
        }
      });
      controller.addListener("playback_update", (event) => setDiscPlaying(!event.data.isPaused));
      controller.addListener("playback_started", () => setDiscPlaying(true));
    });
  };

  const spotifyApi = document.createElement("script");
  spotifyApi.src = "https://open.spotify.com/embed/iframe-api/v1";
  spotifyApi.async = true;
  spotifyApi.onerror = () => {
    const embed = document.createElement("iframe");
    embed.className = "spotify-embed";
    embed.src = spotifyEmbedUrl;
    embed.title = "Spotify playlist player";
    embed.loading = "lazy";
    embed.allow = "autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture";
    embed.referrerPolicy = "strict-origin-when-cross-origin";
    playlistSlot.replaceWith(embed);
    if (discPlayer) {
      discPlayer.disabled = true;
      discPlayer.setAttribute("aria-label", "Spotify controls are unavailable");
    }
  };
  document.head.append(spotifyApi);
}

const heroName = document.querySelector(".typed-name");
const heroNameText = "Hi, I’m Ann Maria";
const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
let typingTimer = 0;
let hasTypedThisSession = false;
try {
  hasTypedThisSession = sessionStorage.getItem("ann-hero-typed") === "true";
} catch {
  // The animation still works if session storage is unavailable.
}

if (heroName) {
  if (hasTypedThisSession || motionPreference.matches) {
    heroName.textContent = heroNameText;
  } else {
    try {
      sessionStorage.setItem("ann-hero-typed", "true");
    } catch {
      // Keep typing without persisting when session storage is unavailable.
    }
    let character = 0;
    const typeNextCharacter = () => {
      heroName.textContent = heroNameText.slice(0, character);
      character += 1;
      if (character <= heroNameText.length) typingTimer = window.setTimeout(typeNextCharacter, 110);
    };
    typeNextCharacter();
  }
}
motionPreference.addEventListener?.("change", (event) => {
  if (!event.matches || !heroName) return;
  window.clearTimeout(typingTimer);
  heroName.textContent = heroNameText;
});

if (!motionPreference.matches && "IntersectionObserver" in window) {
  const revealTargets = document.querySelectorAll(
    ".section:not(.hero), .profile-footer, .project-card, .experience-card, .hero-portrait, .about-note, .about-side, .stack-window, .music-player, .cat-terminal, .contact-card, .resume-note, .contribution-chart"
  );
  revealTargets.forEach((target) => target.classList.add("motion-pending"));
  document.querySelectorAll(".project-grid, .experience-grid").forEach((group) => {
    group.querySelectorAll(".project-card, .experience-card").forEach((card, index) => {
      card.style.setProperty("--reveal-delay", `${Math.min(index, 3) * 90}ms`);
    });
  });

  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.remove("motion-pending");
      entry.target.classList.add("motion-revealed");
      observer.unobserve(entry.target);
    });
  }, { rootMargin: "0px 0px -7% 0px", threshold: 0.02 });

  revealTargets.forEach((target) => revealObserver.observe(target));
  document.addEventListener("focusin", (event) => {
    const target = event.target.closest?.(".motion-pending");
    if (!target) return;
    revealObserver.unobserve(target);
    target.classList.remove("motion-pending");
    target.classList.add("motion-revealed");
  });
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
const catAscii = document.querySelector(".cat-decoration pre");
const catFrames = [
  String.raw` /\_/\\
( o.o )
 > ^ <`,
  String.raw` /\_/\\
( ^.^ )
 > ^ <`,
  String.raw` /\_/\\
( -.- )
 > ^ <`,
  String.raw` /\_/\\
( o.O )
 > ^ <`,
];
let catFrameTimeout;

document.querySelector(".cat-button")?.addEventListener("click", () => {
  const message = document.querySelector(".cat-message");
  if (message) message.textContent = catMessages[Math.floor(Math.random() * catMessages.length)];
  if (!catAscii) return;

  window.clearTimeout(catFrameTimeout);
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    catAscii.textContent = catFrames[0];
    return;
  }

  let frameIndex = 1;
  const showNextFrame = () => {
    if (frameIndex >= catFrames.length) {
      catAscii.textContent = catFrames[0];
      return;
    }
    catAscii.textContent = catFrames[frameIndex++];
    catFrameTimeout = window.setTimeout(showNextFrame, 150);
  };
  showNextFrame();
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
  const randomFacts = [
    "I'm allergic to a lot of things, including dust and cats at times :(",
    "I play the keyboard and a bit of guitar in my free time; I tried to learn the violin but it didn't work out.",
    "My favourite colour is purple (obv)",
    "I love to read, especially fiction and fantasy stuff.",
    "My comfort tv show is Derry Girls.",
    "Je peux parler un peu français. Ich habe auch ein bisschen Deutsch gelernt.",
    "I love playing cozy games like Stardew Valley and the Sims 4.",
    "My fav desserts are ones which are hot and cold at the same time, like fried ice cream and lava cake."
  ]
  const commands = {
    help: "Commands: help · about · obsessions · projects · music · community · github · contact · cat · random_fact",
    about: "Hey, i'm Ann Maria, nice to meet ya!",
    obsessions: "Current obsessions: Sade, Human made designs and Spicy food.",
    projects: "Currently working on: My portfolio(yes this one). See #projects for past projects and more details.",
    music: "Singer and keyboardist with Ektara, I also sing and play the keyboard for a bunch of choirs at church. See #music.",
    community: "TinkerHub WIT Lead · SAIT Design Team · AWS CUSAT SBG Technical Lead · Ektara keyboardist.",
    github: "Checkout github.com/annmariatech and follow if you like what you see.",
    contact: "Say hello at hey.annmaria@gmail.com or use the contact section.",
    cat: "cat.exe says: your current task is to give a cat a nice life.",
    random_fact: randomFacts[Math.floor(Math.random() * randomFacts.length)],
    fact: randomFacts[Math.floor(Math.random() * randomFacts.length)]
  };
  if (commandOutput) commandOutput.textContent = commands[command] || `command not found: ${command || "(empty)"}. type help.`;
  commandInput.value = "";
});

const dotArt = document.querySelector(".dot-art");
const dotCanvas = dotArt?.querySelector(".dot-art-canvas");
const dotContext = dotCanvas?.getContext("2d");

if (dotArt && dotCanvas && dotContext) {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let colors = [];
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
    colors = ["--footer-dot-one", "--footer-dot-two", "--footer-dot-three", "--footer-dot-four", "--footer-dot-five"]
      .map((name) => getComputedStyle(dotArt).getPropertyValue(name).trim());
    mainDots.length = 0;
    floaters.length = 0;

    const mobile = width < 650;
    const fontSize = mobile ? Math.min(34, width / 10) : Math.min(108, width / 18);
    const phrase = mobile ? "KEEP DOING\nWHAT YOU LOVE" : "KEEP DOING WHAT YOU LOVE";
    const step = mobile ? 5 : 6;
    const phrasePoints = sampleText(phrase, `700 ${fontSize}px "DM Mono", monospace`, width * 0.94, step);
    phrasePoints.forEach((point) => mainDots.push({
      x: width / 2 + point.x,
      y: height / 2 + point.y + height * 0.12,
      color: colors[Math.min(colors.length - 1, Math.floor((point.x / width + 0.5) * colors.length))],
      radius: step * 0.56,
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
      if (pointer.active && !reducedMotion.matches) {
        const dx = dot.x - pointer.x;
        const dy = dot.y - pointer.y;
        const distance = Math.hypot(dx, dy);
        if (distance < 90 && distance > 0) {
          const force = (1 - distance / 90) * 12;
          dot.vx += (dx / distance) * force * 0.09;
          dot.vy += (dy / distance) * force * 0.09;
        }
      }
      dot.vx *= 0.88;
      dot.vy *= 0.88;
      const offset = Math.hypot(dot.vx, dot.vy);
      const maxOffset = dot.radius * 0.85;
      if (offset > maxOffset) {
        dot.vx *= maxOffset / offset;
        dot.vy *= maxOffset / offset;
      }
      drawParticle(dot.x + dot.vx, dot.y + dot.vy, dot.radius, dot.color);
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

  const themeObserver = new MutationObserver(() => buildArt());
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

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
