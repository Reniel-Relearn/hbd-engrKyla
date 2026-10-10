const content = window.BIRTHDAY_SITE;
const letters = new Map();
const opened = new Set();
let activeIndex = 0;

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

function imageMarkup(images) {
  return images.map((src, index) => `<img src="${src}" alt="${content.recipient}'s memory${images.length > 1 ? ` ${index + 1}` : ""}" loading="eager">`).join("");
}

function cakeMarkup() {
  return `
    <div class="wish-cake" aria-hidden="true">
      <span class="wish-cake__glow"></span>
      <span class="wish-cake__top-tier">
        <span class="wish-cake__top-frosting"></span>
        <span class="wish-cake__top-piping"></span>
      </span>
      <span class="wish-cake__bottom-tier">
        <span class="wish-cake__bottom-frosting"></span>
        <span class="wish-cake__bottom-piping"></span>
      </span>
      <span class="wish-cake__plate"></span>
    </div>
  `;
}

function buildCards() {
  elements.grid.innerHTML = content.cards.map((card, index) => `
    <article class="memory-card${card.featured ? " memory-card--featured" : ""}" data-index="${index}" style="--rotation:${card.rotation}; --delay:${index * 22}ms">
      <div class="memory-card__images${card.images.length > 1 ? " is-collage" : ""}">${imageMarkup(card.images)}</div>
      <p class="memory-card__caption">${card.label}</p>
      ${card.featured ? cakeMarkup() : ""}
      <button class="envelope" type="button" aria-label="Open letter: ${card.label}" data-letter-index="${index}"></button>
    </article>
  `).join("");

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
  const colors = ["#c39a4b", "#d79b9b", "#214a3c", "#fffaf2"];
  elements.confetti.innerHTML = Array.from({ length: 54 }, (_, index) => {
    const angle = (Math.PI * 2 * index) / 54 + Math.random() * .3;
    const distance = 180 + Math.random() * Math.min(innerWidth, 680);
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance + 130;
    return `<i style="--x:${x}px;--y:${y}px;--turn:${360 + Math.random() * 720}deg;--color:${colors[index % colors.length]};animation-delay:${Math.random() * .18}s"></i>`;
  }).join("");
  setTimeout(() => { elements.confetti.innerHTML = ""; }, 2300);
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
  elements.dialogPhoto.innerHTML = imageMarkup(card.images);
  elements.letterTitle.textContent = card.label;
  elements.letterBody.textContent = letters.get(card.id) || "This letter is waiting for its words.";
  elements.count.textContent = `${index + 1} of ${content.cards.length}`;
  elements.dialog.showModal();
}

function stepLetter(direction) {
  activeIndex = (activeIndex + direction + content.cards.length) % content.cards.length;
  openLetter(activeIndex);
}

function replay() {
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
