
const BOOKING_URL = "https://www.booking.com/hotel/ke/upslope-bnb.html";

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- Mobile navigation ---------- */
(function initNav() {
  const toggle = document.getElementById("navToggle");
  const nav = document.getElementById("siteNav");
  const toggleIconUse = document.getElementById("navToggleIcon");
  if (!toggle || !nav) return;

  function setOpen(open) {
    nav.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    if (toggleIconUse) toggleIconUse.setAttribute("href", open ? "#icon-close" : "#icon-menu");
    document.body.style.overflow = open ? "hidden" : "";
  }

  toggle.addEventListener("click", () => setOpen(!nav.classList.contains("open")));

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setOpen(false));
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && nav.classList.contains("open")) setOpen(false);
  });
})();

/* ---------- Header scroll state + active section highlighting ---------- */
(function initHeaderAndActiveLinks() {
  const header = document.getElementById("siteHeader");
  const navLinks = Array.from(document.querySelectorAll(".site-nav a[href^='#']"));
  const sections = navLinks
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

  function onScroll() {
    if (header) header.classList.toggle("scrolled", window.scrollY > 40);
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  if ("IntersectionObserver" in window && sections.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const id = "#" + entry.target.id;
          const link = navLinks.find((l) => l.getAttribute("href") === id);
          if (!link) return;
          if (entry.isIntersecting) {
            navLinks.forEach((l) => l.classList.remove("active"));
            link.classList.add("active");
          }
        });
      },
      { rootMargin: "-45% 0px -45% 0px" }
    );
    sections.forEach((section) => observer.observe(section));
  }
})();

/* ---------- Hero parallax (answers scrolling, skipped for reduced motion) ---------- */
(function initHeroParallax() {
  if (prefersReducedMotion) return;
  const hero = document.querySelector(".hero");
  const back = document.querySelector(".hill-back");
  const mid = document.querySelector(".hill-mid");
  const front = document.querySelector(".hill-front-group");
  if (!hero || !back || !mid || !front) return;

  function onScroll() {
    const y = window.scrollY;
    if (y > hero.offsetHeight) return;
    back.style.transform = `translateY(${y * 0.12}px)`;
    mid.style.transform = `translateY(${y * 0.22}px)`;
    front.style.transform = `translateY(${y * 0.32}px)`;
  }
  window.addEventListener("scroll", onScroll, { passive: true });
})();

/* ---------- Booking date tool(s) ---------- */
(function initBookingTools() {
  const forms = document.querySelectorAll("[data-booking-tool]");
  const todayStr = new Date().toISOString().split("T")[0];

  forms.forEach((form) => {
    const checkin = form.querySelector("input[name='checkin']");
    const checkout = form.querySelector("input[name='checkout']");
    const guests = form.querySelector("select[name='guests']");
    if (!checkin || !checkout) return;

    checkin.min = todayStr;
    checkout.min = todayStr;

    checkin.addEventListener("change", () => {
      const next = new Date(checkin.value);
      next.setDate(next.getDate() + 1);
      const nextStr = next.toISOString().split("T")[0];
      checkout.min = nextStr;
      if (!checkout.value || checkout.value <= checkin.value) {
        checkout.value = nextStr;
      }
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const params = new URLSearchParams();
      if (checkin.value) params.set("checkin", checkin.value);
      if (checkout.value) params.set("checkout", checkout.value);
      params.set("group_adults", guests ? guests.value : "2");
      params.set("no_rooms", "1");
      window.open(`${BOOKING_URL}?${params.toString()}`, "_blank", "noopener");
    });
  });
})();

/* ---------- Gallery: real-photo fallback + lightbox ---------- */
(function initGallery() {
  const items = Array.from(document.querySelectorAll(".gallery-item"));
  if (!items.length) return;

  // If a real photo hasn't been added yet at the path in `src`,
  // fall back to the styled gradient tile instead of a broken image icon.
  items.forEach((item) => {
    const img = item.querySelector("img");
    if (!img) return;
    img.addEventListener("error", () => item.classList.add("img-fallback"), { once: true });
  });

  const lightbox = document.getElementById("lightbox");
  const frame = document.getElementById("lightboxFrame");
  const captionEl = document.getElementById("lightboxCaption");
  const closeBtn = document.getElementById("lightboxClose");
  const prevBtn = document.getElementById("lightboxPrev");
  const nextBtn = document.getElementById("lightboxNext");
  if (!lightbox || !frame) return;

  let currentIndex = 0;

  function render() {
    const item = items[currentIndex];
    const img = item.querySelector("img");
    const caption = item.querySelector(".gallery-caption");
    const captionText = caption ? caption.textContent : "";
    frame.innerHTML = "";
    if (img && !item.classList.contains("img-fallback")) {
      const big = document.createElement("img");
      big.src = img.src;
      big.alt = img.alt;
      frame.appendChild(big);
    }
    captionEl.textContent = captionText;
  }

  function open(index) {
    currentIndex = index;
    render();
    lightbox.hidden = false;
    document.body.style.overflow = "hidden";
    closeBtn.focus();
  }

  function close() {
    lightbox.hidden = true;
    document.body.style.overflow = "";
  }

  function step(delta) {
    currentIndex = (currentIndex + delta + items.length) % items.length;
    render();
  }

  items.forEach((item, index) => {
    item.addEventListener("click", () => open(index));
  });

  closeBtn.addEventListener("click", close);
  prevBtn.addEventListener("click", () => step(-1));
  nextBtn.addEventListener("click", () => step(1));
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) close();
  });
  document.addEventListener("keydown", (e) => {
    if (lightbox.hidden) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowLeft") step(-1);
    if (e.key === "ArrowRight") step(1);
  });
})();

/* ---------- Contact form (static site: opens the visitor's email client) ---------- */
(function initContactForm() {
  const form = document.getElementById("contactForm");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const to = form.dataset.to || "hello@upslopebnb.example";
    const name = form.querySelector("#name").value.trim();
    const email = form.querySelector("#email").value.trim();
    const message = form.querySelector("#message").value.trim();

    const subject = encodeURIComponent(`Message from ${name}`);
    const body = encodeURIComponent(`${message}\n\n— ${name} (${email})`);
    window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
  });
})();

/* ---------- Back to top ---------- */
(function initBackToTop() {
  const btn = document.getElementById("backToTop");
  if (!btn) return;

  window.addEventListener(
    "scroll",
    () => {
      btn.hidden = window.scrollY < 700;
    },
    { passive: true }
  );

  btn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
  });
})();

/* ---------- Footer year ---------- */
(function initYear() {
  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());
})();