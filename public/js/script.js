/*====================================================
        HOTEL KHANDESH DARBAR - MAIN JAVASCRIPT
        Pure Vanilla JS - Zero External Dependencies
====================================================*/

document.addEventListener("DOMContentLoaded", () => {
  initPreloader();
  initScrollProgress();
  initThemeToggle();
  initStickyHeader();
  initMobileMenu();
  initScrollReveal();
  initCounters();
  initMenuSearchAndFilter();
  initGalleryLightbox();
  init3DCoverflow();
  initManualReviewSlider();
  initSeamlessManualInfiniteScroll();
  initFaqAccordion();
  initBookingForm();
  initNewsletterForm();
  initShoppingCart();
  initBackToTop();
  initActiveNavHighlight();
});

/*====================================================
        1. PAGE PRELOADER
====================================================*/
function initPreloader() {
  const preloader = document.getElementById("preloader");
  if (preloader) {
    window.addEventListener("load", () => {
      preloader.classList.add("loaded");
    });
    // Safety fallback
    setTimeout(() => {
      preloader.classList.add("loaded");
    }, 1500);
  }
}

/*====================================================
        2. SCROLL PROGRESS BAR
====================================================*/
function initScrollProgress() {
  const progressBar = document.getElementById("scrollProgressBar");
  if (!progressBar) return;

  window.addEventListener("scroll", () => {
    const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = (winScroll / height) * 100;
    progressBar.style.width = scrolled + "%";
  });
}

/*====================================================
        3. DARK / LIGHT THEME TOGGLE
====================================================*/
function initThemeToggle() {
  const themeToggleBtn = document.getElementById("themeToggle");
  const themeIcon = document.getElementById("themeIcon");
  const htmlEl = document.documentElement;

  // Read cached preference or system default
  const savedTheme = localStorage.getItem("khandesh_theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

  if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
    htmlEl.setAttribute("data-theme", "dark");
    if (themeIcon) themeIcon.className = "fa-solid fa-sun";
  } else {
    htmlEl.setAttribute("data-theme", "light");
    if (themeIcon) themeIcon.className = "fa-solid fa-moon";
  }

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", () => {
      const currentTheme = htmlEl.getAttribute("data-theme");
      const newTheme = currentTheme === "dark" ? "light" : "dark";

      htmlEl.setAttribute("data-theme", newTheme);
      localStorage.setItem("khandesh_theme", newTheme);

      if (themeIcon) {
        themeIcon.className = newTheme === "dark" ? "fa-solid fa-sun" : "fa-solid fa-moon";
      }

      showToast(`Switched to ${newTheme.toUpperCase()} theme`, "info", 2000);
    });
  }
}

/*====================================================
        4. STICKY HEADER
====================================================*/
function initStickyHeader() {
  const header = document.getElementById("header");
  if (!header) return;

  window.addEventListener("scroll", () => {
    if (window.scrollY > 40) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }
  });
}

/*====================================================
        5. MOBILE NAVIGATION MENU
====================================================*/
function initMobileMenu() {
  const menuBtn = document.getElementById("menuBtn");
  const navLinks = document.getElementById("navLinks");

  if (menuBtn && navLinks) {
    menuBtn.addEventListener("click", () => {
      const isOpen = navLinks.classList.contains("active");
      navLinks.classList.toggle("active");
      menuBtn.classList.toggle("open");
      menuBtn.setAttribute("aria-expanded", !isOpen);
    });

    // Close menu when link is clicked
    navLinks.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", () => {
        navLinks.classList.remove("active");
        menuBtn.classList.remove("open");
        menuBtn.setAttribute("aria-expanded", "false");
      });
    });

    // Close on click outside
    document.addEventListener("click", (e) => {
      if (!navLinks.contains(e.target) && !menuBtn.contains(e.target) && navLinks.classList.contains("active")) {
        navLinks.classList.remove("active");
        menuBtn.classList.remove("open");
        menuBtn.setAttribute("aria-expanded", "false");
      }
    });
  }
}

/*====================================================
        6. SCROLL REVEAL (IntersectionObserver)
====================================================*/
function initScrollReveal() {
  const revealEls = document.querySelectorAll("[data-aos]");
  if (!revealEls.length) return;

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const delay = entry.target.dataset.aosDelay;
          if (delay) {
            entry.target.style.transitionDelay = (parseInt(delay, 10) / 1000) + "s";
          }
          entry.target.classList.add("aos-animate");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -40px 0px" });

    revealEls.forEach(el => observer.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add("aos-animate"));
  }

  // Fallback safety timeout
  setTimeout(() => {
    revealEls.forEach(el => el.classList.add("aos-animate"));
  }, 2000);
}

/*====================================================
        7. ANIMATED COUNTERS
====================================================*/
function initCounters() {
  const counters = document.querySelectorAll(".counter, [data-target]");
  if (!counters.length) return;

  let animated = false;

  function runCounters() {
    if (animated) return;
    animated = true;
    counters.forEach(counter => {
      const targetStr = counter.dataset.target || counter.innerText;
      const target = parseFloat(targetStr);
      if (isNaN(target)) return;

      let current = 0;
      const increment = target / 35;
      const isFloat = target % 1 !== 0;
      const prefix = counter.dataset.prefix || "";
      const suffix = counter.dataset.suffix || (target === 100 ? "%" : (isFloat ? "★" : "+"));

      const update = () => {
        current += increment;
        if (current < target) {
          counter.innerText = prefix + (isFloat ? current.toFixed(1) : Math.ceil(current)) + suffix;
          setTimeout(update, 30);
        } else {
          counter.innerText = prefix + (isFloat ? target.toFixed(1) : target) + suffix;
        }
      };
      update();
    });
  }

  window.addEventListener("scroll", runCounters, { passive: true });
  setTimeout(runCounters, 300);
}

/*====================================================
        8. LIVE MENU SEARCH & CATEGORY FILTER
====================================================*/
function initMenuSearchAndFilter() {
  const searchInput = document.getElementById("menuSearchInput");
  const clearBtn = document.getElementById("clearSearchBtn");
  const filterBtns = document.querySelectorAll(".menu-filter button");
  const menuCards = document.querySelectorAll(".menu-card");
  const noResultsMsg = document.getElementById("noResultsMsg");

  let activeCategory = "all";
  let searchQuery = "";

  function filterMenu() {
    let visibleCount = 0;

    menuCards.forEach(card => {
      const cardCategory = card.dataset.category || "";
      const cardName = (card.dataset.name || card.innerText).toLowerCase();

      const matchesCategory = activeCategory === "all" || cardCategory.includes(activeCategory);
      const matchesSearch = searchQuery === "" || cardName.includes(searchQuery);

      if (matchesCategory && matchesSearch) {
        card.classList.remove("hide");
        visibleCount++;
      } else {
        card.classList.add("hide");
      }
    });

    if (noResultsMsg) {
      noResultsMsg.style.display = visibleCount === 0 ? "block" : "none";
    }
  }

  // Search input handler
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      searchQuery = e.target.value.trim().toLowerCase();
      if (clearBtn) {
        clearBtn.style.display = searchQuery ? "block" : "none";
      }
      filterMenu();
    });
  }

  // Clear search button
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      if (searchInput) searchInput.value = "";
      searchQuery = "";
      clearBtn.style.display = "none";
      filterMenu();
    });
  }

  // Category filter buttons
  filterBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      filterBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      activeCategory = btn.dataset.filter || "all";
      filterMenu();
    });
  });
}

/*====================================================
        9. GALLERY LIGHTBOX MODAL
====================================================*/
function initGalleryLightbox() {
  const items = document.querySelectorAll(".gallery-item");
  const modal = document.getElementById("lightboxModal");
  const modalImg = document.getElementById("lightboxImg");
  const modalCaption = document.getElementById("lightboxCaption");
  const closeBtn = document.getElementById("lightboxClose");
  const prevBtn = document.getElementById("lightboxPrev");
  const nextBtn = document.getElementById("lightboxNext");

  if (!modal || !items.length) return;

  let currentIndex = 0;
  const imageList = Array.from(items).map(item => ({
    src: item.dataset.src || item.querySelector("img").src,
    caption: item.dataset.caption || item.querySelector("img").alt
  }));

  function openLightbox(index) {
    currentIndex = index;
    modalImg.src = imageList[currentIndex].src;
    modalCaption.innerText = imageList[currentIndex].caption;
    modal.classList.add("active");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    modal.classList.remove("active");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  function showNext() {
    currentIndex = (currentIndex + 1) % imageList.length;
    openLightbox(currentIndex);
  }

  function showPrev() {
    currentIndex = (currentIndex - 1 + imageList.length) % imageList.length;
    openLightbox(currentIndex);
  }

  items.forEach((item, index) => {
    item.addEventListener("click", () => openLightbox(index));
  });

  if (closeBtn) closeBtn.addEventListener("click", closeLightbox);
  if (nextBtn) nextBtn.addEventListener("click", showNext);
  if (prevBtn) prevBtn.addEventListener("click", showPrev);

  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeLightbox();
  });

  document.addEventListener("keydown", (e) => {
    if (!modal.classList.contains("active")) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowRight") showNext();
    if (e.key === "ArrowLeft") showPrev();
  });
}

/*====================================================
        10. FAQ ACCORDION
====================================================*/
function initFaqAccordion() {
  const faqItems = document.querySelectorAll(".faq-item");

  faqItems.forEach(item => {
    const header = item.querySelector(".faq-header");
    if (header) {
      header.addEventListener("click", () => {
        const isActive = item.classList.contains("active");

        // Close other items
        faqItems.forEach(other => {
          other.classList.remove("active");
          const otherHeader = other.querySelector(".faq-header");
          if (otherHeader) otherHeader.setAttribute("aria-expanded", "false");
        });

        if (!isActive) {
          item.classList.add("active");
          header.setAttribute("aria-expanded", "true");
        }
      });
    }
  });
}

/*====================================================
        11. RESERVATION FORM VALIDATION & SUBMIT
====================================================*/
function initBookingForm() {
  const bookingForm = document.getElementById("bookingForm");
  const dateInput = document.getElementById("bookDate");

  if (dateInput) {
    // Set minimum date to today
    const today = new Date().toISOString().split("T")[0];
    dateInput.setAttribute("min", today);
  }

  if (bookingForm) {
    bookingForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const name = document.getElementById("bookName").value.trim();
      const phone = document.getElementById("bookPhone").value.trim();
      const date = document.getElementById("bookDate").value;
      const time = document.getElementById("bookTime").value;
      const guests = document.getElementById("bookGuests").value;

      if (!name || !phone || !date || !time || !guests) {
        showToast("Please fill in all required fields.", "error");
        return;
      }

      showToast(`Thank you, ${name}! Your table reservation for ${guests} on ${date} at ${time} is confirmed.`, "success", 5000);
      bookingForm.reset();
    });
  }
}

/*====================================================
        12. NEWSLETTER FORM
====================================================*/
function initNewsletterForm() {
  const newsletterForm = document.getElementById("newsletterForm");

  if (newsletterForm) {
    newsletterForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const emailInput = document.getElementById("newsletterEmail");

      if (emailInput && emailInput.value) {
        showToast("Subscribed successfully! Watch your inbox for festival discounts.", "success");
        newsletterForm.reset();
      }
    });
  }
}

/*====================================================
        13. SHOPPING CART & KOT RECEIPT SYSTEM
====================================================*/
let cart = JSON.parse(localStorage.getItem("khandesh_cart")) || [];

function initShoppingCart() {
  const cartToggle = document.getElementById("cartToggle");
  const cartDrawer = document.getElementById("cartDrawer");
  const cartOverlay = document.getElementById("cartOverlay");
  const closeCart = document.getElementById("closeCart");
  const addToCartBtns = document.querySelectorAll(".add-to-cart-btn");
  const orderTypeSelect = document.getElementById("orderType");
  const tableNoGroup = document.getElementById("tableNoGroup");
  const checkoutForm = document.getElementById("cartCheckoutForm");
  const kotModal = document.getElementById("kotReceiptModal");
  const closeKotBtn = document.getElementById("closeKotBtn");

  updateCartUI();

  // Open & Close Cart
  function openCart() {
    if (cartDrawer && cartOverlay) {
      cartDrawer.classList.add("active");
      cartOverlay.classList.add("active");
    }
  }

  function closeCartDrawer() {
    if (cartDrawer && cartOverlay) {
      cartDrawer.classList.remove("active");
      cartOverlay.classList.remove("active");
    }
  }

  if (cartToggle) cartToggle.addEventListener("click", openCart);
  if (closeCart) closeCart.addEventListener("click", closeCartDrawer);
  if (cartOverlay) cartOverlay.addEventListener("click", closeCartDrawer);

  // Add to cart buttons
  addToCartBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      const name = btn.dataset.name;
      const price = parseFloat(btn.dataset.price);

      const existingItem = cart.find(item => item.id === id);
      if (existingItem) {
        existingItem.qty += 1;
      } else {
        cart.push({ id, name, price, qty: 1 });
      }

      saveCart();
      updateCartUI();
      showToast(`Added "${name}" to cart!`, "success", 2000);
    });
  });

  // Toggle Table number field based on Order Type
  if (orderTypeSelect && tableNoGroup) {
    orderTypeSelect.addEventListener("change", () => {
      if (orderTypeSelect.value === "takeaway") {
        tableNoGroup.style.display = "none";
      } else {
        tableNoGroup.style.display = "block";
      }
    });
  }

  // Handle Checkout & KOT Generation
  if (checkoutForm) {
    checkoutForm.addEventListener("submit", (e) => {
      e.preventDefault();

      if (cart.length === 0) {
        showToast("Your cart is empty. Add items before placing an order.", "error");
        return;
      }

      const orderType = document.getElementById("orderType").value;
      const tableNo = document.getElementById("tableNo").value;
      const custName = document.getElementById("custName").value.trim();
      const custPhone = document.getElementById("custPhone").value.trim();
      const orderNotes = document.getElementById("orderNotes").value.trim();

      if (orderType === "dine-in" && !tableNo) {
        showToast("Please select your Table Number for Dine-In.", "error");
        return;
      }

      // Generate Receipt Data
      const kotNumber = "KOT-" + Math.floor(1000 + Math.random() * 9000);
      const now = new Date();
      const dateStr = now.toLocaleDateString() + " " + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      document.getElementById("recKOT").innerText = kotNumber;
      document.getElementById("recDate").innerText = dateStr;
      document.getElementById("recType").innerText = orderType === "dine-in" ? "Dine-In" : "Takeaway";
      document.getElementById("recTableContainer").style.display = orderType === "dine-in" ? "block" : "none";
      document.getElementById("recTable").innerText = tableNo || "N/A";
      document.getElementById("recCustName").innerText = custName;
      document.getElementById("recCustPhone").innerText = custPhone;

      // Populate Items Table
      const recBody = document.getElementById("recItemsBody");
      let totalAmount = 0;
      recBody.innerHTML = "";

      cart.forEach(item => {
        const itemTotal = item.price * item.qty;
        totalAmount += itemTotal;
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td style="padding: 4px 0;">${item.name}</td>
          <td style="text-align: center; padding: 4px 0;">x${item.qty}</td>
          <td style="text-align: right; padding: 4px 0;">₹${itemTotal}</td>
        `;
        recBody.appendChild(tr);
      });

      document.getElementById("recTotal").innerText = `₹${totalAmount}`;
      const instContainer = document.getElementById("recInstructionsContainer");
      if (orderNotes) {
        instContainer.style.display = "block";
        document.getElementById("recInstructions").innerText = orderNotes;
      } else {
        instContainer.style.display = "none";
      }

      // Close cart drawer & show KOT modal
      closeCartDrawer();
      if (kotModal) {
        kotModal.classList.add("active");
        kotModal.setAttribute("aria-hidden", "false");
      }

      // Reset Cart
      cart = [];
      saveCart();
      updateCartUI();
      checkoutForm.reset();
      showToast("Order placed successfully! KOT generated.", "success");
    });
  }

  if (closeKotBtn && kotModal) {
    closeKotBtn.addEventListener("click", () => {
      kotModal.classList.remove("active");
      kotModal.setAttribute("aria-hidden", "true");
    });
  }
}

function saveCart() {
  localStorage.setItem("khandesh_cart", JSON.stringify(cart));
}

function updateCartUI() {
  const badgeCount = document.getElementById("cartBadgeCount");
  const cartList = document.getElementById("cartItemsList");
  const totalPriceEl = document.getElementById("cartTotalPrice");

  const totalCount = cart.reduce((sum, item) => sum + item.qty, 0);
  const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  if (badgeCount) badgeCount.innerText = totalCount;
  if (totalPriceEl) totalPriceEl.innerText = `₹${totalPrice}`;

  if (!cartList) return;

  if (cart.length === 0) {
    cartList.innerHTML = `
      <div style="text-align: center; padding: 40px 10px; color: var(--text-muted);">
        <i class="fa-solid fa-shopping-cart" style="font-size: 3rem; margin-bottom: 12px; display: block; color: var(--border-color);"></i>
        <p>Your cart is empty.</p>
      </div>
    `;
    return;
  }

  cartList.innerHTML = "";
  cart.forEach((item, index) => {
    const row = document.createElement("div");
    row.className = "cart-item-row";
    row.innerHTML = `
      <div class="cart-item-info">
        <h4>${item.name}</h4>
        <p>₹${item.price} x ${item.qty} = ₹${item.price * item.qty}</p>
      </div>
      <div class="cart-item-qty">
        <button class="qty-btn" onclick="updateQty(${index}, -1)">-</button>
        <span>${item.qty}</span>
        <button class="qty-btn" onclick="updateQty(${index}, 1)">+</button>
      </div>
    `;
    cartList.appendChild(row);
  });
}

// Global scope for onclick handlers
window.updateQty = function(index, delta) {
  if (cart[index]) {
    cart[index].qty += delta;
    if (cart[index].qty <= 0) {
      cart.splice(index, 1);
    }
    saveCart();
    updateCartUI();
  }
};

/*====================================================
        14. BACK TO TOP BUTTON
====================================================*/
function initBackToTop() {
  const backTop = document.getElementById("backToTop");
  if (!backTop) return;

  window.addEventListener("scroll", () => {
    if (window.scrollY > 400) {
      backTop.classList.add("show");
    } else {
      backTop.classList.remove("show");
    }
  });

  backTop.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

/*====================================================
        15. ACTIVE NAV LINK ON SCROLL
====================================================*/
function initActiveNavHighlight() {
  const sections = document.querySelectorAll("section[id]");
  const navItems = document.querySelectorAll(".nav-links a");

  window.addEventListener("scroll", () => {
    let current = "";
    sections.forEach(section => {
      const sectionTop = section.offsetTop - 140;
      if (window.scrollY >= sectionTop) {
        current = section.getAttribute("id");
      }
    });

    navItems.forEach(link => {
      link.classList.remove("active");
      if (link.getAttribute("href") === "#" + current) {
        link.classList.add("active");
      }
    });
  });
}

/*====================================================
        16. UNIVERSAL TOAST NOTIFICATION UTILITY
====================================================*/
function showToast(message, type = "success", duration = 3500) {
  const toastContainer = document.getElementById("toastContainer");
  if (!toastContainer) return;

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;

  const iconClass = type === "success" ? "fa-circle-check" : type === "error" ? "fa-circle-exclamation" : "fa-circle-info";
  toast.innerHTML = `
    <i class="fa-solid ${iconClass}"></i>
    <span>${message}</span>
  `;

  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = "slideOutRight 0.35s ease forwards";
    setTimeout(() => {
      toast.remove();
    }, 350);
  }, duration);
}

/*====================================================
        17. 3D PERSPECTIVE COVERFLOW CAROUSEL LOGIC
====================================================*/
function init3DCoverflow() {
  const wrapper = document.querySelector(".coverflow-wrapper");
  const containers = document.querySelectorAll(".coverflow-card-container");
  const prevBtn = document.getElementById("coverflowPrev");
  const nextBtn = document.getElementById("coverflowNext");

  if (!containers.length) return;

  let activeIndex = 0;
  const total = containers.length;

  function updateCoverflow() {
    containers.forEach((container, i) => {
      let diff = i - activeIndex;
      if (diff > total / 2) diff -= total;
      if (diff < -total / 2) diff += total;

      const offset = -diff / 2.2;
      const direction = Math.sign(-diff);
      const absOffset = Math.abs(diff) / 2.2;
      const isActive = i === activeIndex;

      container.style.setProperty("--active", isActive ? 1 : 0);
      container.style.setProperty("--offset", offset);
      container.style.setProperty("--direction", direction);
      container.style.setProperty("--abs-offset", absOffset);
      container.style.setProperty("--pointer-events", isActive ? "auto" : "none");

      if (Math.abs(diff) > 2) {
        container.style.opacity = "0";
        container.style.visibility = "hidden";
        container.style.pointerEvents = "none";
      } else {
        container.style.opacity = "1";
        container.style.visibility = "visible";
      }
    });

    if (prevBtn) prevBtn.style.visibility = "visible";
    if (nextBtn) nextBtn.style.visibility = "visible";
  }

  if (prevBtn) {
    prevBtn.addEventListener("click", (e) => {
      e.preventDefault();
      activeIndex = (activeIndex - 1 + total) % total;
      updateCoverflow();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", (e) => {
      e.preventDefault();
      activeIndex = (activeIndex + 1) % total;
      updateCoverflow();
    });
  }

  containers.forEach((container, i) => {
    container.addEventListener("click", () => {
      if (i === activeIndex) {
        const src = container.dataset.src;
        const caption = container.dataset.caption;
        if (typeof openImageModal === "function" && src) {
          openImageModal(src, caption);
        }
      } else {
        activeIndex = i;
        updateCoverflow();
      }
    });
  });

  // Touch Swipe Support
  let touchStartX = 0;
  if (wrapper) {
    wrapper.addEventListener("touchstart", (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    wrapper.addEventListener("touchend", (e) => {
      const touchEndX = e.changedTouches[0].screenX;
      if (touchStartX - touchEndX > 35) {
        activeIndex = (activeIndex + 1) % total;
        updateCoverflow();
      } else if (touchEndX - touchStartX > 35) {
        activeIndex = (activeIndex - 1 + total) % total;
        updateCoverflow();
      }
    }, { passive: true });
  }

  updateCoverflow();
}

/*====================================================
        18. SEAMLESS MANUAL INFINITE SCROLL (CLONE-BASED)
        Allows 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 1 -> 2 -> 3...
        100% Manual Swipe - ZERO Auto-play
====================================================*/
function initSeamlessManualInfiniteScroll() {
  const scrollContainers = document.querySelectorAll(".review-grid, .why-grid, .facilities-grid, .category-grid");

  scrollContainers.forEach(container => {
    if (!container || container.dataset.infiniteInitialized) return;
    container.dataset.infiniteInitialized = "true";

    const originalItems = Array.from(container.children);
    if (originalItems.length < 2) return;

    // Clone items to form an infinite sequence (1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 1 -> 2 -> 3...)
    originalItems.forEach(item => {
      const clone = item.cloneNode(true);
      clone.setAttribute("aria-hidden", "true");
      container.appendChild(clone);
    });

    let singleSetWidth = 0;

    const calculateWidth = () => {
      let width = 0;
      originalItems.forEach(item => {
        const style = window.getComputedStyle(item);
        const margin = (parseFloat(style.marginLeft) || 0) + (parseFloat(style.marginRight) || 0);
        width += item.offsetWidth + margin;
      });
      const containerStyle = window.getComputedStyle(container);
      const gap = parseFloat(containerStyle.gap) || 0;
      singleSetWidth = width + (originalItems.length * gap);
    };

    calculateWidth();
    window.addEventListener("resize", calculateWidth, { passive: true });

    let isAdjusting = false;

    container.addEventListener("scroll", () => {
      if (isAdjusting || singleSetWidth <= 0) return;

      // Seamless infinite loop when manually scrolling right
      if (container.scrollLeft >= singleSetWidth) {
        isAdjusting = true;
        container.scrollLeft -= singleSetWidth;
        isAdjusting = false;
      } 
      // Seamless infinite loop when manually scrolling left
      else if (container.scrollLeft <= 0) {
        isAdjusting = true;
        container.scrollLeft += singleSetWidth;
        isAdjusting = false;
      }
    }, { passive: true });
  });
}

/*====================================================
        19. INDEX-BASED MANUAL REVIEW SLIDER (NO AUTO SCROLL)
====================================================*/
function initManualReviewSlider() {
  const track = document.getElementById("reviewGridTrack");
  const slides = document.querySelectorAll(".review-card-slide");
  const prevBtn = document.getElementById("reviewPrev");
  const nextBtn = document.getElementById("reviewNext");
  const wrapper = document.querySelector(".review-carousel-wrapper");

  if (!track || !slides.length) return;

  let activeIndex = 0;
  const total = slides.length;

  function updateReviewSlider() {
    track.style.transform = `translateX(-${activeIndex * 100}%)`;
  }

  if (prevBtn) {
    prevBtn.addEventListener("click", (e) => {
      e.preventDefault();
      activeIndex = (activeIndex - 1 + total) % total;
      updateReviewSlider();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", (e) => {
      e.preventDefault();
      activeIndex = (activeIndex + 1) % total;
      updateReviewSlider();
    });
  }

  // Touch Swipe Support
  let touchStartX = 0;
  if (wrapper) {
    wrapper.addEventListener("touchstart", (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    wrapper.addEventListener("touchend", (e) => {
      const touchEndX = e.changedTouches[0].screenX;
      if (touchStartX - touchEndX > 35) {
        activeIndex = (activeIndex + 1) % total;
        updateReviewSlider();
      } else if (touchEndX - touchStartX > 35) {
        activeIndex = (activeIndex - 1 + total) % total;
        updateReviewSlider();
      }
    }, { passive: true });
  }

  updateReviewSlider();
}




