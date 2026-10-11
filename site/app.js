const content = window.BIRTHDAY_SITE;
const letters = new Map();
const opened = new Set();
let activeIndex = 0;
let confettiBurstTimer;
let ambientConfettiTimer;

const $ = (selector) => document.querySelector(selector);
const elements = {
  welcome: $("#welcome"),
  eyebrow: $("#eyebrow"),
  title: $("#welcome-title"),
  intro: $("#introduction"),
  open: $("#open-gift"),
  openLabel: $("#open-label"),
  memories: $("#memories"),
  grid: $("#memory-grid"),
  galleryTitle: $("#gallery-title"),
  galleryHint: $("#gallery-hint"),
  finalTitle: $("#final-title"),
  finalMessage: $("#final-message"),
  replay: $("#replay"),
  confetti: $("#confetti"),
  dialog: $("#letter-dialog"),
  dialogPhoto: $("#dialog-photo"),
  letterTitle: $("#letter-title"),
  letterBody: $("#letter-body"),
  count: $("#letter-count"),
  previous: $("#previous-letter"),
  next: $("#next-letter"),
  close: $("#close-letter")
};

function hydrateCopy() {
  elements.eyebrow.textContent = content.eyebrow;
  elements.title.textContent = content.title;
  elements.intro.textContent = content.introduction;
  elements.openLabel.textContent = content.openButton;
  elements.galleryTitle.textContent = content.galleryTitle;
  elements.galleryHint.textContent = content.galleryHint;
  elements.finalTitle.textContent = content.finalTitle;
  elements.finalMessage.textContent = content.finalMessage;
  elements.replay.textContent = content.replayButton;
}

function imageMarkup(images, label) {
  return images.map((src, index) => `<img src="${src}" alt="${label}${images.length > 1 ? `, photo ${index + 1} of ${images.length}` : ""}" loading="eager" decoding="async">`).join("");
}

function cakeMarkup(context) {
  return `
    <span class="wish-cake wish-cake--${context}" aria-hidden="true">
      <span class="wish-cake__glow"></span>
      <span class="wish-candles">
        <span class="wish-candle wish-candle--two">
          <span class="wish-candle__flame"></span>
          <span class="wish-candle__wick"></span>
          <span class="wish-candle__stem"></span>
          <span class="wish-candle__number">2</span>
        </span>
        <span class="wish-candle wish-candle--three">
          <span class="wish-candle__flame"></span>
          <span class="wish-candle__wick"></span>
          <span class="wish-candle__stem"></span>
          <span class="wish-candle__number">3</span>
        </span>
      </span>
      <img src="assets/pink-rosette-cake.png" alt="" draggable="false">
    </span>
  `;
}

function buildCards() {
  const cardsMarkup = content.cards.map((card, index) => `
    <article class="memory-card${card.featured ? " memory-card--featured" : ""}" data-index="${index}" style="--rotation:${card.rotation}; --delay:${index * 22}ms">
      <button class="memory-card__images${card.images.length > 1 ? " is-collage" : ""}" type="button" aria-label="Open letter: ${card.label}" data-letter-index="${index}">${imageMarkup(card.images, card.label)}${card.featured ? cakeMarkup("gallery") : ""}</button>
      <p class="memory-card__caption">${card.label}</p>
      <button class="envelope" type="button" aria-label="Open letter: ${card.label}" data-letter-index="${index}"></button>
    </article>
  `).join("");
  elements.grid.innerHTML = cardsMarkup;

  elements.grid.querySelectorAll("[data-letter-index]").forEach((button) => {
    button.addEventListener("click", () => openLetter(Number(button.dataset.letterIndex)));
  });
}

async function loadLetters() {
  await Promise.all(content.cards.map(async (card) => {
    try {
      const response = await fetch(card.letter);
      if (!response.ok) throw new Error(`Could not load ${card.letter}`);
      letters.set(card.id, (await response.text()).trim());
    } catch {
      letters.set(card.id, "This letter is waiting for its words.");
    }
  }));
}

function makeConfetti() {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const colors = ["#f06f9c", "#f5a6bf", "#d86489", "#f8d3df", "#fff8ef", "#d5aa5f"];
  const shapes = ["ribbon", "ribbon", "petal", "dot"];
  const pieceCount = reducedMotion ? 18 : Math.min(86, Math.max(58, Math.round(innerWidth / 15)));

  window.clearTimeout(confettiBurstTimer);
  elements.confetti.querySelector(".confetti__burst")?.remove();

  const burst = document.createElement("div");
  burst.className = "confetti__burst";
  burst.innerHTML = Array.from({ length: pieceCount }, (_, index) => {
    const stream = index % 7 === 0 ? "left" : index % 7 === 1 ? "right" : "center";
    const fromSide = stream !== "center";
    const direction = stream === "left" ? 1 : stream === "right" ? -1 : Math.random() < .5 ? -1 : 1;
    const startX = stream === "left" ? 7 + Math.random() * 7 : stream === "right" ? 86 + Math.random() * 7 : 46 + Math.random() * 8;
    const startY = fromSide ? 47 + Math.random() * 22 : 51 + Math.random() * 8;
    const horizontalReach = fromSide ? innerWidth * (.2 + Math.random() * .24) : innerWidth * (.08 + Math.random() * .36);
    const x = direction * horizontalReach;
    const lift = reducedMotion ? 35 + Math.random() * 55 : 120 + Math.random() * Math.min(260, innerHeight * .32);
    const fall = reducedMotion ? 90 + Math.random() * 90 : 220 + Math.random() * Math.min(360, innerHeight * .42);
    const drift = direction * (12 + Math.random() * 48);
    const size = fromSide ? 6 + Math.random() * 7 : 7 + Math.random() * 9;
    const duration = reducedMotion ? .75 + Math.random() * .2 : 1.85 + Math.random() * .65;
    const delay = reducedMotion ? Math.random() * .08 : Math.random() * .24;
    const turn = direction * (420 + Math.random() * 760);
    const shape = shapes[(index + Math.floor(Math.random() * shapes.length)) % shapes.length];

    return `<i class="confetti__piece confetti__piece--${shape}" style="--start-x:${startX}vw;--start-y:${startY}vh;--x:${x}px;--lift:${lift}px;--fall:${fall}px;--drift:${drift}px;--turn-mid:${turn * .55}deg;--turn:${turn}deg;--size:${size}px;--duration:${duration}s;--delay:${delay}s;--color:${colors[index % colors.length]}"></i>`;
  }).join("");
  elements.confetti.append(burst);

  confettiBurstTimer = window.setTimeout(() => burst.remove(), reducedMotion ? 1200 : 3100);
}

function startAmbientConfetti() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const colors = ["#f06f9c", "#f5a6bf", "#d86489", "#f8d3df", "#fff8ef", "#d5aa5f"];
  const shapes = ["ribbon", "petal", "dot"];
  const pieceCount = Math.min(30, Math.max(18, Math.round(innerWidth / 55)));
  const ambient = document.createElement("div");
  ambient.className = "confetti__ambient";
  ambient.innerHTML = Array.from({ length: pieceCount }, (_, index) => {
    const entry = index % 6 === 0 ? "left" : index % 6 === 1 ? "right" : "top";
    const startX = entry === "left" ? -2 + Math.random() * 8 : entry === "right" ? 94 + Math.random() * 8 : 3 + Math.random() * 94;
    const startY = entry === "top" ? -18 - Math.random() * 35 : 2 + Math.random() * 38;
    const direction = entry === "left" ? 1 : entry === "right" ? -1 : Math.random() < .5 ? -1 : 1;
    const drift = direction * (24 + Math.random() * 78);
    const duration = 10.5 + Math.random() * 7;
    const delay = -(Math.random() * duration);
    const turn = direction * (260 + Math.random() * 520);
    const size = 5 + Math.random() * 7;
    const sway = direction * (8 + Math.random() * 22);
    const shape = shapes[index % shapes.length];

    return `<i class="confetti__ambient-piece confetti__ambient-piece--${shape}" style="--ambient-x:${startX}vw;--ambient-y:${startY}vh;--ambient-drift:${drift}px;--ambient-sway:${sway}px;--ambient-turn-mid:${turn / 2}deg;--ambient-turn:${turn}deg;--ambient-size:${size}px;--ambient-duration:${duration}s;--ambient-delay:${delay}s;--ambient-color:${colors[index % colors.length]}"></i>`;
  }).join("");

  elements.confetti.querySelector(".confetti__ambient")?.remove();
  elements.confetti.append(ambient);
}

function stopConfetti() {
  window.clearTimeout(confettiBurstTimer);
  window.clearTimeout(ambientConfettiTimer);
  elements.confetti.replaceChildren();
}

function animateCards() {
  const giftCenter = { x: innerWidth / 2, y: innerHeight * .56 };
  elements.grid.querySelectorAll(".memory-card").forEach((card, index) => {
    const box = card.getBoundingClientRect();
    card.style.setProperty("--from-x", `${giftCenter.x - (box.left + box.width / 2)}px`);
    card.style.setProperty("--from-y", `${giftCenter.y - (box.top + box.height / 2)}px`);
    card.style.setProperty("--spin", `${index % 2 ? 35 : -35}deg`);
    card.classList.add("is-bursting");
  });
}

function revealGift() {
  if (elements.open.classList.contains("is-open")) return;
  elements.open.classList.add("is-open");
  makeConfetti();
  ambientConfettiTimer = window.setTimeout(startAmbientConfetti, 2500);
  setTimeout(() => elements.welcome.classList.add("is-opening"), 520);
  setTimeout(() => {
    elements.welcome.hidden = true;
    elements.memories.hidden = false;
    window.scrollTo(0, 0);
    requestAnimationFrame(() => requestAnimationFrame(animateCards));
  }, 1050);
}

function openLetter(index) {
  activeIndex = index;
  const card = content.cards[index];
  opened.add(card.id);
  elements.grid.querySelector(`[data-index="${index}"]`)?.classList.add("is-opened");
  elements.dialogPhoto.className = `letter-dialog__photo${card.images.length > 1 ? " is-collage" : ""}`;
  elements.dialogPhoto.innerHTML = `${imageMarkup(card.images, card.label)}${card.featured ? cakeMarkup("dialog") : ""}`;
  elements.letterTitle.textContent = card.label;
  elements.letterBody.textContent = letters.get(card.id) || "This letter is waiting for its words.";
  elements.count.textContent = `${index + 1} of ${content.cards.length}`;
  if (!elements.dialog.open) elements.dialog.showModal();
}

function stepLetter(direction) {
  activeIndex = (activeIndex + direction + content.cards.length) % content.cards.length;
  openLetter(activeIndex);
}

function replay() {
  stopConfetti();
  elements.grid.querySelectorAll(".memory-card").forEach((card) => card.classList.remove("is-bursting"));
  elements.memories.hidden = true;
  elements.welcome.hidden = false;
  elements.welcome.classList.remove("is-opening");
  elements.open.classList.remove("is-open");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

hydrateCopy();
buildCards();
loadLetters();
elements.open.addEventListener("click", revealGift);
elements.replay.addEventListener("click", replay);
elements.close.addEventListener("click", () => elements.dialog.close());
elements.previous.addEventListener("click", () => stepLetter(-1));
elements.next.addEventListener("click", () => stepLetter(1));
elements.dialog.addEventListener("click", (event) => {
  if (event.target === elements.dialog || event.target.classList.contains("letter-dialog__backdrop")) elements.dialog.close();
});
