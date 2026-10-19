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
];
document.querySelector(".cat-button")?.addEventListener("click", () => {
  const message = document.querySelector(".cat-message");
  if (message) message.textContent = catMessages[Math.floor(Math.random() * catMessages.length)];
});

const themeButton = document.querySelector(".theme-toggle");
themeButton?.addEventListener("click", () => {
  const active = document.documentElement.classList.toggle("theme-alt");
  themeButton.setAttribute("aria-pressed", String(active));
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
