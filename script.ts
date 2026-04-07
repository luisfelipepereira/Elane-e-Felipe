type ParticleKind = "heart" | "spark";

interface Particle {
  x: number;
  y: number;
  size: number;
  speedY: number;
  sway: number;
  alpha: number;
  rotation: number;
  kind: ParticleKind;
}

interface TimerParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const timerRoot = document.querySelector<HTMLElement>("#cronometro");
const daysEl = document.getElementById("days");
const hoursEl = document.getElementById("hours");
const minutesEl = document.getElementById("minutes");
const secondsEl = document.getElementById("seconds");
const startDateLabel = document.getElementById("start-date-label");
const typewriterText = document.getElementById("typewriter-text");
const loadingScreen = document.getElementById("loading-screen");
const toast = document.getElementById("floating-toast");
const highlightPlay = document.getElementById("highlight-play");
const spotifyEmbed = document.getElementById("spotify-embed");
const mainTitle = document.getElementById("main-title");
const letterSection = document.getElementById("carta");
const letterTemplate = document.getElementById("letter-content-template") as HTMLTemplateElement | null;
const letterTypewriter = document.getElementById("letter-typewriter");
const loveSurpriseBtn = document.getElementById("love-surprise-btn");
const loveSurpriseBox = document.getElementById("love-surprise-box");
const loveSurpriseMessage = document.getElementById("love-surprise-message");
const surpriseHeartsLayer = document.getElementById("surprise-hearts-layer");
const polaroidGrid = document.querySelector<HTMLElement>(".polaroid-grid");
const polaroidPrevBtn = document.getElementById("polaroid-prev");
const polaroidNextBtn = document.getElementById("polaroid-next");
const polaroidPosition = document.getElementById("polaroid-position");

const relationshipStartRaw = timerRoot?.dataset.startDate ?? "2025-04-13T16:30:00";
const relationshipStartDate = new Date(relationshipStartRaw);
let toastTimeout: number | undefined;

const romanticMessages: string[] = [
  "Voce fez o meu mundo ficar mais bonito e verdadeiro.",
  "Cada segundo ao seu lado vira memoria inesquecivel.",
  "Seu carinho e o lugar mais seguro do meu coracao.",
  "Nosso amor e o meu capitulo favorito todos os dias.",
  "Com voce, o futuro parece um sonho possivel e lindo."
];

// Timer principal do relacionamento.
function isValidDate(date: Date): boolean {
  return !Number.isNaN(date.getTime());
}

function formatDatePtBR(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function pad(value: number, digits = 2): string {
  return String(value).padStart(digits, "0");
}

function escapeHtml(rawValue: string): string {
  return rawValue
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function splitDuration(totalMs: number): TimerParts {
  const totalSeconds = Math.floor(totalMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { days, hours, minutes, seconds };
}

function renderTimer(parts: TimerParts): void {
  if (!daysEl || !hoursEl || !minutesEl || !secondsEl) {
    return;
  }

  daysEl.textContent = pad(parts.days, 3);
  hoursEl.textContent = pad(parts.hours, 2);
  minutesEl.textContent = pad(parts.minutes, 2);
  secondsEl.textContent = pad(parts.seconds, 2);
}

function renderInvalidTimer(): void {
  if (!daysEl || !hoursEl || !minutesEl || !secondsEl) {
    return;
  }

  daysEl.textContent = "---";
  hoursEl.textContent = "--";
  minutesEl.textContent = "--";
  secondsEl.textContent = "--";
}

function updateRelationshipTimer(): void {
  if (!isValidDate(relationshipStartDate)) {
    if (startDateLabel) {
      startDateLabel.textContent = "Data invalida no atributo data-start-date.";
    }
    renderInvalidTimer();
    return;
  }

  const now = new Date();
  const diff = now.getTime() - relationshipStartDate.getTime();
  const safeDiff = Math.max(0, diff);
  const timerParts = splitDuration(safeDiff);

  renderTimer(timerParts);
}

function initStartDateLabel(): void {
  if (!startDateLabel) {
    return;
  }

  if (!isValidDate(relationshipStartDate)) {
    startDateLabel.textContent = "Data invalida no atributo data-start-date.";
    return;
  }

  startDateLabel.textContent = `Desde ${formatDatePtBR(relationshipStartDate)}`;
}

// Efeito de digitacao com alternancia automatica de frases.
function initTypewriter(): void {
  if (!typewriterText) {
    return;
  }

  let messageIndex = 0;
  let charIndex = 0;
  let deleting = false;

  const typeLoop = (): void => {
    const currentMessage = romanticMessages[messageIndex] ?? "";

    if (!deleting) {
      charIndex = Math.min(charIndex + 1, currentMessage.length);
    } else {
      charIndex = Math.max(charIndex - 1, 0);
    }

    typewriterText.textContent = currentMessage.slice(0, charIndex);

    let delay = deleting ? 40 : 70;

    if (!deleting && charIndex === currentMessage.length) {
      deleting = true;
      delay = 1600;
    } else if (deleting && charIndex === 0) {
      deleting = false;
      messageIndex = (messageIndex + 1) % romanticMessages.length;
      delay = 300;
    }

    window.setTimeout(typeLoop, delay);
  };

  typeLoop();
}

// Carta romantica com animacao de digitacao progressiva.
function initRomanticLetterTypewriter(): void {
  if (!letterSection || !letterTypewriter) {
    return;
  }

  // Garante que a secao da carta apareca mesmo se o observer de reveal nao disparar.
  letterSection.classList.add("is-visible");

  const letterRawText = letterTemplate?.textContent?.replace(/\r/g, "").trim() ?? "";

  if (!letterRawText) {
    return;
  }

  const formatLetter = (content: string): string => {
    const safe = escapeHtml(content).replace(/\n/g, "<br>");
    return safe.replace(/te amo/gi, '<span class="pulse-word">$&</span>');
  };

  let started = false;
  let charIndex = 0;
  let fallbackTimeout: number | undefined;

  const typeNext = (): void => {
    charIndex += 1;
    letterTypewriter.textContent = letterRawText.slice(0, charIndex);

    if (charIndex >= letterRawText.length) {
      letterTypewriter.classList.remove("is-typing");
      letterTypewriter.innerHTML = formatLetter(letterRawText);
      return;
    }

    const currentChar = letterRawText.charAt(charIndex);
    let delay = 22 + Math.floor(Math.random() * 18);

    if (currentChar === "." || currentChar === ",") {
      delay += 68;
    } else if (currentChar === "\n") {
      delay += 95;
    }

    window.setTimeout(typeNext, delay);
  };

  const startTyping = (): void => {
    if (started) {
      return;
    }

    started = true;
    if (fallbackTimeout) {
      window.clearTimeout(fallbackTimeout);
    }
    letterTypewriter.classList.add("is-typing");
    typeNext();
  };

  // Fallback para navegadores/cenarios em que o observer nao aciona.
  fallbackTimeout = window.setTimeout(startTyping, 1300);

  if (!("IntersectionObserver" in window)) {
    startTyping();
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        startTyping();
        observer.disconnect();
      });
    },
    { threshold: 0.2 }
  );

  observer.observe(letterSection);
}

// Surpresa da carta: revela mensagem e sobe coracoes animados.
function initLetterSurprise(): void {
  if (!loveSurpriseBtn || !loveSurpriseBox || !loveSurpriseMessage || !surpriseHeartsLayer) {
    return;
  }

  const surpriseMessages: string[] = [
    "Surpresa: o meu futuro favorito e viver cada fase ao seu lado.",
    "Promessa: eu vou te escolher e te cuidar todos os dias."
  ];

  let clickIndex = 0;

  const spawnSurpriseHearts = (count: number): void => {
    for (let i = 0; i < count; i += 1) {
      const heart = document.createElement("span");
      heart.className = "surprise-heart";
      heart.textContent = i % 2 === 0 ? String.fromCharCode(10084) : String.fromCharCode(10085);
      heart.style.left = `${random(10, 90)}%`;
      heart.style.fontSize = `${random(0.95, 1.58)}rem`;
      heart.style.setProperty("--drift", `${random(-48, 48).toFixed(2)}px`);
      heart.style.setProperty("--rise", `${random(130, 230).toFixed(2)}px`);
      heart.style.animationDuration = `${random(1.35, 2.35).toFixed(2)}s`;
      surpriseHeartsLayer.appendChild(heart);
      heart.addEventListener("animationend", () => heart.remove(), { once: true });
    }
  };

  loveSurpriseBtn.addEventListener("click", () => {
    clickIndex += 1;
    loveSurpriseMessage.textContent = surpriseMessages[(clickIndex - 1) % surpriseMessages.length];

    if (loveSurpriseBox.hasAttribute("hidden")) {
      loveSurpriseBox.removeAttribute("hidden");
      requestAnimationFrame(() => {
        loveSurpriseBox.classList.add("visible");
      });
    } else {
      loveSurpriseBox.classList.add("flash");
      window.setTimeout(() => {
        loveSurpriseBox.classList.remove("flash");
      }, 380);
    }

    spawnSurpriseHearts(18);
    showToast("Uma surpresa romantica apareceu.");
  });
}

// Animacao de entrada para elementos conforme o scroll.
function initRevealOnScroll(): void {
  const revealElements = Array.from(document.querySelectorAll<HTMLElement>(".reveal"));

  if (revealElements.length === 0) {
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.18, rootMargin: "0px 0px -40px" }
  );

  revealElements.forEach((element) => observer.observe(element));
}

// Distribui as polaroids com rotacao aleatoria e entrada escalonada.
function initPolaroidLayout(): void {
  const polaroids = Array.from(document.querySelectorAll<HTMLElement>(".polaroid"));

  polaroids.forEach((polaroid, index) => {
    const rotation = (Math.random() * 10 - 5).toFixed(2);
    polaroid.style.setProperty("--rotation", `${rotation}deg`);

    window.setTimeout(() => {
      polaroid.classList.add("in");
    }, 230 + index * 120);
  });
}

// Em telas pequenas, mostra uma polaroid por vez para reduzir o tamanho da pagina.
function initMobilePolaroidSlider(): void {
  const polaroids = Array.from(document.querySelectorAll<HTMLElement>(".polaroid"));

  if (!polaroidGrid || !polaroidPrevBtn || !polaroidNextBtn || !polaroidPosition || polaroids.length === 0) {
    return;
  }

  const mobileMedia = window.matchMedia("(max-width: 700px)");
  let currentIndex = 0;

  const renderMobileState = (): void => {
    if (!mobileMedia.matches) {
      polaroidGrid.classList.remove("mobile-carousel");
      polaroids.forEach((polaroid) => polaroid.classList.remove("active-mobile"));
      polaroidPosition.textContent = "";
      return;
    }

    polaroidGrid.classList.add("mobile-carousel");

    if (currentIndex > polaroids.length - 1) {
      currentIndex = 0;
    }

    polaroids.forEach((polaroid, index) => {
      polaroid.classList.toggle("active-mobile", index === currentIndex);
    });

    polaroidPosition.textContent = `${currentIndex + 1} / ${polaroids.length}`;
  };

  const move = (step: number): void => {
    if (!mobileMedia.matches) {
      return;
    }

    currentIndex = (currentIndex + step + polaroids.length) % polaroids.length;
    renderMobileState();
  };

  polaroidPrevBtn.addEventListener("click", () => move(-1));
  polaroidNextBtn.addEventListener("click", () => move(1));

  if (typeof mobileMedia.addEventListener === "function") {
    mobileMedia.addEventListener("change", renderMobileState);
  } else {
    mobileMedia.addListener(renderMobileState);
  }

  renderMobileState();
}

// Ripple effect para botoes de destaque.
function attachRipple(button: HTMLElement): void {
  button.addEventListener("click", (event: MouseEvent) => {
    const rect = button.getBoundingClientRect();
    const ripple = document.createElement("span");
    const size = Math.max(rect.width, rect.height);

    ripple.className = "ripple";
    ripple.style.width = `${size}px`;
    ripple.style.height = `${size}px`;
    ripple.style.left = `${event.clientX - rect.left - size / 2}px`;
    ripple.style.top = `${event.clientY - rect.top - size / 2}px`;

    button.appendChild(ripple);

    ripple.addEventListener("animationend", () => ripple.remove(), { once: true });
  });
}

function initRippleButtons(): void {
  const buttons = Array.from(document.querySelectorAll<HTMLElement>(".ripple-btn"));
  buttons.forEach((button) => attachRipple(button));
}

function showToast(message: string): void {
  if (!toast) {
    return;
  }

  toast.textContent = message;
  toast.classList.add("show");

  if (toastTimeout) {
    window.clearTimeout(toastTimeout);
  }

  toastTimeout = window.setTimeout(() => {
    toast.classList.remove("show");
  }, 2100);
}

function initSpotifyHighlight(): void {
  if (!highlightPlay || !spotifyEmbed) {
    return;
  }

  highlightPlay.addEventListener("click", () => {
    spotifyEmbed.classList.add("pulse");
    spotifyEmbed.scrollIntoView({ behavior: "smooth", block: "center" });
    showToast("Agora aperte play no player.");

    window.setTimeout(() => {
      spotifyEmbed.classList.remove("pulse");
    }, 1600);
  });
}

// Parallax leve para reforcar profundidade visual.
function initParallax(): void {
  const parallaxItems = Array.from(document.querySelectorAll<HTMLElement>("[data-parallax]"));

  if (parallaxItems.length === 0) {
    return;
  }

  const update = (): void => {
    const scrollTop = window.scrollY;

    parallaxItems.forEach((item) => {
      const speed = Number.parseFloat(item.dataset.parallax ?? "0.1");
      const offset = Math.min(140, Math.max(-90, scrollTop * speed));
      item.style.setProperty("--parallax-offset", `${offset}px`);
    });
  };

  update();
  window.addEventListener("scroll", update, { passive: true });
}

function random(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function initParticleSystem(): void {
  const canvas = document.getElementById("particles-canvas") as HTMLCanvasElement | null;
  const ctx = canvas?.getContext("2d") ?? null;

  if (!canvas || !ctx) {
    return;
  }

  const particles: Particle[] = [];
  const maxParticles = 80;

  const createParticle = (forcedHeart = false): Particle => {
    const kind: ParticleKind = forcedHeart ? "heart" : Math.random() > 0.55 ? "heart" : "spark";
    return {
      x: random(0, canvas.width),
      y: random(0, canvas.height),
      size: random(4, 13),
      speedY: random(0.18, 0.7),
      sway: random(0.004, 0.03),
      alpha: random(0.2, 0.85),
      rotation: random(0, Math.PI * 2),
      kind
    };
  };

  const resetParticle = (particle: Particle): void => {
    particle.x = random(0, canvas.width);
    particle.y = canvas.height + random(5, 120);
    particle.size = random(4, 13);
    particle.speedY = random(0.18, 0.7);
    particle.sway = random(0.004, 0.03);
    particle.alpha = random(0.15, 0.8);
    particle.rotation = random(0, Math.PI * 2);
    particle.kind = Math.random() > 0.55 ? "heart" : "spark";
  };

  const resizeCanvas = (): void => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };

  const drawHeart = (particle: Particle): void => {
    const x = particle.x;
    const y = particle.y;
    const size = particle.size;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(particle.rotation);
    ctx.scale(size / 12, size / 12);
    ctx.beginPath();
    ctx.moveTo(0, -2);
    ctx.bezierCurveTo(5, -8, 12, -2, 0, 10);
    ctx.bezierCurveTo(-12, -2, -5, -8, 0, -2);
    ctx.closePath();
    ctx.fillStyle = `rgba(255, ${Math.floor(random(70, 140))}, ${Math.floor(random(120, 170))}, ${particle.alpha})`;
    ctx.shadowColor = "rgba(255, 95, 154, 0.35)";
    ctx.shadowBlur = 12;
    ctx.fill();
    ctx.restore();
  };

  const drawSpark = (particle: Particle): void => {
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size * 0.24, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 220, 235, ${particle.alpha})`;
    ctx.shadowColor = "rgba(255, 162, 199, 0.4)";
    ctx.shadowBlur = 10;
    ctx.fill();
  };

  const burstHearts = (count: number): void => {
    for (let i = 0; i < count; i += 1) {
      particles.push({
        x: random(canvas.width * 0.3, canvas.width * 0.7),
        y: random(canvas.height * 0.2, canvas.height * 0.5),
        size: random(7, 15),
        speedY: random(0.6, 1.4),
        sway: random(0.01, 0.04),
        alpha: random(0.5, 0.9),
        rotation: random(0, Math.PI * 2),
        kind: "heart"
      });
    }
  };

  let easterClicks = 0;
  let resetClickTimeout: number | undefined;

  if (mainTitle) {
    mainTitle.addEventListener("click", () => {
      easterClicks += 1;

      if (resetClickTimeout) {
        window.clearTimeout(resetClickTimeout);
      }

      resetClickTimeout = window.setTimeout(() => {
        easterClicks = 0;
      }, 1500);

      if (easterClicks >= 5) {
        burstHearts(24);
        showToast("Easter egg: chuva romantica ativada.");
        easterClicks = 0;
      }
    });
  }

  const animate = (): void => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const time = Date.now() * 0.001;

    particles.forEach((particle) => {
      particle.y -= particle.speedY;
      particle.x += Math.sin(time + particle.rotation) * particle.sway * 45;
      particle.alpha -= 0.0017;

      if (particle.kind === "heart") {
        drawHeart(particle);
      } else {
        drawSpark(particle);
      }

      if (particle.y < -24 || particle.alpha <= 0) {
        resetParticle(particle);
      }
    });

    requestAnimationFrame(animate);
  };

  resizeCanvas();
  window.addEventListener("resize", resizeCanvas, { passive: true });

  for (let i = 0; i < maxParticles; i += 1) {
    particles.push(createParticle());
  }

  animate();
}

function hideLoadingScreen(): void {
  if (!loadingScreen) {
    return;
  }

  window.setTimeout(() => {
    loadingScreen.classList.add("hidden");
  }, 950);
}

function init(): void {
  initStartDateLabel();
  updateRelationshipTimer();
  window.setInterval(updateRelationshipTimer, 1000);
  initTypewriter();
  initRomanticLetterTypewriter();
  initRevealOnScroll();
  initPolaroidLayout();
  initMobilePolaroidSlider();
  initRippleButtons();
  initLetterSurprise();
  initSpotifyHighlight();
  initParallax();
  initParticleSystem();
}

window.addEventListener("load", () => {
  init();
  hideLoadingScreen();
});
