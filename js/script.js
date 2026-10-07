"use strict";

(() => {
  const navigation = document.getElementById("navigation");
  const menuButton = document.getElementById("menu-button");
  const mobileMenu = window.matchMedia("(max-width: 700px)");
  const viewport = document.getElementById("portfolio-viewport");
  const track = document.getElementById("portfolio-track");
  const cards = [...track.querySelectorAll(".project-card")];
  const filters = [...document.querySelectorAll(".filter")];
  const previousButton = document.getElementById("previous-project");
  const nextButton = document.getElementById("next-project");
  const counter = document.getElementById("portfolio-counter");
  const status = document.getElementById("portfolio-status");
  const previewDialog = document.getElementById("preview-dialog");
  const previewImage = document.getElementById("preview-image");
  const servicesDialog = document.getElementById("services-dialog");
  let selectedCategory = "web";
  let currentPage = 0;
  let perView = 2;
  let visibleCards = [];
  let pointerStart = null;
  let lastSwipe = -1000;

  function setMenu(open) {
    navigation.hidden = !open;
    navigation.classList.toggle("is-open", open);
    menuButton.setAttribute("aria-expanded", String(open));
    menuButton.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
  }

  function adaptMenu() {
    setMenu(!mobileMenu.matches);
  }

  menuButton.addEventListener("click", () => setMenu(navigation.hidden));
  mobileMenu.addEventListener("change", adaptMenu);
  adaptMenu();

  document.addEventListener("click", event => {
    if (mobileMenu.matches && !navigation.contains(event.target) && !menuButton.contains(event.target)) setMenu(false);
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && mobileMenu.matches && !navigation.hidden) {
      setMenu(false);
      menuButton.focus({ preventScroll: true });
    }
  });

  function pageCount() {
    return Math.max(1, Math.ceil(visibleCards.length / perView));
  }

  function renderCarousel(animate = true) {
    const firstIndex = currentPage * perView;
    const firstCard = visibleCards[firstIndex];
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    const cardWidth = firstCard ? firstCard.getBoundingClientRect().width : 0;
    const offset = firstIndex * (cardWidth + gap);
    track.classList.toggle("no-transition", !animate);
    track.style.transform = "translate3d(" + (-offset) + "px, 0, 0)";

    cards.forEach(card => {
      const index = visibleCards.indexOf(card);
      const active = index >= firstIndex && index < firstIndex + perView;
      card.inert = !active;
      card.setAttribute("aria-hidden", String(!active));
      if (active) card.querySelector("img").loading = "eager";
    });

    const total = pageCount();
    previousButton.disabled = total < 2;
    nextButton.disabled = total < 2;
    counter.textContent = String(currentPage + 1).padStart(2, "0") + " / " + String(total).padStart(2, "0");
    const names = visibleCards.slice(firstIndex, firstIndex + perView).map(card => card.dataset.title).join(" e ");
    status.textContent = "Página " + (currentPage + 1) + " de " + total + ": " + names + ".";

    // A categoria de um único item mantém a imagem centralizada.
    track.style.justifyContent = visibleCards.length < perView ? "center" : "flex-start";
  }

  function refreshSize() {
    const firstIndex = currentPage * perView;
    const cssValue = parseInt(getComputedStyle(viewport).getPropertyValue("--cards-per-view"), 10);
    perView = Number.isFinite(cssValue) && cssValue > 0 ? cssValue : 1;
    currentPage = Math.min(Math.floor(firstIndex / perView), pageCount() - 1);
    renderCarousel(false);
  }

  function chooseCategory(category) {
    selectedCategory = category;
    visibleCards = cards.filter(card => card.dataset.categories.split(" ").includes(category));
    cards.forEach(card => { card.hidden = !visibleCards.includes(card); });
    filters.forEach(button => button.setAttribute("aria-pressed", String(button.dataset.filter === category)));
    currentPage = 0;
    refreshSize();
  }

  function movePage(direction) {
    const total = pageCount();
    if (total < 2) return;
    const focusWasOnCard = cards.some(card => card.contains(document.activeElement));
    currentPage = (currentPage + direction + total) % total;
    renderCarousel(true);
    if (focusWasOnCard) viewport.focus({ preventScroll: true });
  }

  filters.forEach(button => button.addEventListener("click", () => chooseCategory(button.dataset.filter)));
  previousButton.addEventListener("click", () => movePage(-1));
  nextButton.addEventListener("click", () => movePage(1));

  document.getElementById("carousel").addEventListener("keydown", event => {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      movePage(event.key === "ArrowRight" ? 1 : -1);
    }
    if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      currentPage = event.key === "Home" ? 0 : pageCount() - 1;
      renderCarousel(true);
      viewport.focus({ preventScroll: true });
    }
  });

  // Deslizar horizontalmente também muda o modelo no celular.
  viewport.addEventListener("pointerdown", event => {
    if (event.button !== 0 || !event.isPrimary) return;
    pointerStart = { x: event.clientX, y: event.clientY, id: event.pointerId };
  }, { passive: true });

  window.addEventListener("pointerup", event => {
    if (!pointerStart || pointerStart.id !== event.pointerId) return;
    const deltaX = event.clientX - pointerStart.x;
    const deltaY = event.clientY - pointerStart.y;
    pointerStart = null;
    if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY) * 1.3) {
      lastSwipe = performance.now();
      movePage(deltaX < 0 ? 1 : -1);
    }
  }, { passive: true });
  window.addEventListener("pointercancel", () => { pointerStart = null; }, { passive: true });

  // Navegação da primeira tela + continuação da página.
  document.querySelectorAll("[data-go]").forEach(link => {
    link.addEventListener("click", event => {
      event.preventDefault();
      const destination = link.dataset.go;
      navigation.querySelectorAll("[data-go]").forEach(item => {
        if (item.dataset.go === destination) item.setAttribute("aria-current", "location");
        else item.removeAttribute("aria-current");
      });
      if (mobileMenu.matches) setMenu(false);

      if (destination === "portfolio") {
        window.scrollTo({ top: 0, behavior: "smooth" });
        setTimeout(() => {
          viewport.focus({ preventScroll: true });
          viewport.classList.remove("is-highlighted");
          requestAnimationFrame(() => viewport.classList.add("is-highlighted"));
        }, 280);
        return;
      }

      if (destination === "contato") {
        document.getElementById("contato").scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }

      chooseCategory("web");
      window.scrollTo({ top: 0, behavior: "smooth" });
      setTimeout(() => document.getElementById("hero-title").focus({ preventScroll: true }), 250);
    });
  });
  viewport.addEventListener("animationend", () => viewport.classList.remove("is-highlighted"));

  cards.forEach(card => {
    card.querySelector("button").addEventListener("click", event => {
      if (performance.now() - lastSwipe < 350) { event.preventDefault(); return; }
      const image = card.querySelector("img");
      previewImage.src = image.getAttribute("src");
      previewImage.alt = image.alt;
      document.getElementById("preview-title").textContent = card.dataset.title;
      previewDialog.showModal();
    });
  });

  document.getElementById("services-button").addEventListener("click", () => {
    if (mobileMenu.matches) setMenu(false);
    servicesDialog.showModal();
  });

  document.querySelectorAll("dialog").forEach(dialog => {
    dialog.querySelector("[data-close-dialog]").addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", event => {
      if (event.target !== dialog) return;
      const box = dialog.getBoundingClientRect();
      if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
    });
    dialog.addEventListener("close", () => {
      if (mobileMenu.matches && navigation.contains(document.activeElement)) menuButton.focus({ preventScroll: true });
    });
  });

  const budgetForm = document.getElementById("budget-form");
  if (budgetForm) {
    budgetForm.addEventListener("submit", event => {
      event.preventDefault();
      if (!budgetForm.reportValidity()) return;

      const data = new FormData(budgetForm);
      const message = [
        "Olá, King Web! Gostaria de solicitar um orçamento.",
        "",
        "Nome: " + data.get("name"),
        "E-mail: " + data.get("email"),
        "WhatsApp: " + data.get("phone"),
        "Serviço: " + data.get("service"),
        "",
        "Sobre o projeto:",
        data.get("message")
      ].join("\n");

      // Sem inventar um número: abre o WhatsApp com a mensagem pronta.
      // Quando quiser enviar direto para o número da King Web, coloque-o em WHATSAPP_NUMBER.
      const WHATSAPP_NUMBER = "";
      const target = WHATSAPP_NUMBER
        ? "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(message)
        : "https://api.whatsapp.com/send?text=" + encodeURIComponent(message);
      window.open(target, "_blank", "noopener,noreferrer");
    });
  }

  // FAQ: mantém apenas uma pergunta aberta por vez para evitar desalinhamento visual.
  const faqCards = [...document.querySelectorAll(".faq-card")];
  faqCards.forEach(card => {
    card.addEventListener("toggle", () => {
      if (!card.open) return;
      faqCards.forEach(other => {
        if (other !== card && other.open) other.open = false;
      });
    });
  });

  chooseCategory(selectedCategory);
  new ResizeObserver(refreshSize).observe(viewport);
})();
