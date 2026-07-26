/*====================================================
        SCROLL REVEAL (Progressive Enhancement)
====================================================*/
(function(){
  try {
    const revealEls = document.querySelectorAll("[data-aos]");
    if(!revealEls.length) return;

    if(!("IntersectionObserver" in window)){
      revealEls.forEach(el=>el.classList.add("aos-animate"));
      return;
    }

    const observer = new IntersectionObserver((entries)=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting){
          const delay = entry.target.dataset.aosDelay;
          if(delay){
            entry.target.style.transitionDelay = (parseInt(delay,10)/1000)+"s";
          }
          entry.target.classList.add("aos-animate");
          observer.unobserve(entry.target);
        }
      });
    },{
      threshold:0.1,
      rootMargin:"0px 0px -50px 0px"
    });

    revealEls.forEach(el=>observer.observe(el));
  } catch(err) {
    console.error("Scroll reveal error:", err);
    document.querySelectorAll("[data-aos]")
      .forEach(el=>el.classList.add("aos-animate"));
  }
})();

setTimeout(()=>{
  document.querySelectorAll("[data-aos]:not(.aos-animate)")
    .forEach(el=>el.classList.add("aos-animate"));
}, 2500);

/*====================================================
        MOBILE MENU
====================================================*/
const menuBtn = document.querySelector(".menu-btn");
const navLinks = document.querySelector(".nav-links");

if(menuBtn){
  menuBtn.addEventListener("click",()=>{
    navLinks.classList.toggle("active");
    menuBtn.classList.toggle("open");
  });
}

document.querySelectorAll(".nav-links a").forEach(link=>{
  link.addEventListener("click",()=>{
    navLinks.classList.remove("active");
    menuBtn.classList.remove("open");
  });
});

/*====================================================
        STICKY HEADER
====================================================*/
const header = document.querySelector("header");
window.addEventListener("scroll",()=>{
  if(window.scrollY > 50){
    header.classList.add("scrolled");
  } else {
    header.classList.remove("scrolled");
  }
});

/*====================================================
        BACK TO TOP
====================================================*/
const backTop = document.querySelector("#backToTop");
window.addEventListener("scroll",()=>{
  if(window.scrollY > 500){
    backTop.classList.add("show");
  } else {
    backTop.classList.remove("show");
  }
});

if(backTop){
  backTop.addEventListener("click",()=>{
    window.scrollTo({
      top:0,
      behavior:"smooth"
    });
  });
}

/*====================================================
        COUNTER ANIMATION
====================================================*/
const counters = document.querySelectorAll(".counter");
let started = false;

function startCounter(){
  if(started) return;
  const section = document.querySelector(".counter-section");
  if(!section) return;

  const sectionTop = section.offsetTop - window.innerHeight + 200;
  if(window.scrollY > sectionTop){
    started = true;
    counters.forEach(counter=>{
      const target = +counter.dataset.target;
      let count = 0;
      const update = () => {
        const speed = target/100;
        if(count < target){
          count += speed;
          counter.innerText = Math.ceil(count)+"+";
          setTimeout(update, 20);
        } else {
          counter.innerText = target+"+";
        }
      };
      update();
    });
  }
}
window.addEventListener("scroll", startCounter);

/*====================================================
        IMAGE HOVER EFFECT
====================================================*/
document.querySelectorAll("img").forEach(img=>{
  img.addEventListener("mouseenter",()=>{
    img.style.transition = ".5s";
  });
});

/*====================================================
        CURRENT YEAR FOOTER
====================================================*/
const year = document.querySelector(".year");
if(year){
  year.innerHTML = new Date().getFullYear();
}

/*====================================================
        ACTIVE NAV LINK ON SCROLL
====================================================*/
const sections = document.querySelectorAll("section[id]");
const navItems = document.querySelectorAll(".nav-links a");

window.addEventListener("scroll",()=>{
  let current = "";
  sections.forEach(section=>{
    // Skip hidden sections (their offsetTop is 0 but they are not the home/hero section)
    if (section.getAttribute("id") !== "home" && section.offsetTop === 0) return;
    
    const sectionTop = section.offsetTop - 150;
    if(window.scrollY >= sectionTop){
      current = section.getAttribute("id");
    }
  });

  navItems.forEach(link=>{
    link.classList.remove("active");
    if(link.getAttribute("href") === "#"+current){
      link.classList.add("active");
    }
  });
});


/*====================================================
        SHOPPING CART & KOT ORDER SYSTEM
====================================================*/
let cart = JSON.parse(localStorage.getItem("khandesh_cart")) || [];

// Cart DOM Elements
const cartToggle = document.getElementById("cartToggle");
const closeCart = document.getElementById("closeCart");
const cartDrawer = document.getElementById("cartDrawer");
const cartOverlay = document.getElementById("cartOverlay");
const cartBadgeCount = document.getElementById("cartBadgeCount");
const cartItemsList = document.getElementById("cartItemsList");
const cartTotalPrice = document.getElementById("cartTotalPrice");
const orderTypeSelect = document.getElementById("orderType");
const tableNoGroup = document.getElementById("tableNoGroup");
const tableNoSelect = document.getElementById("tableNo");
const cartCheckoutForm = document.getElementById("cartCheckoutForm");

// Drawer open/close
if (cartToggle) {
  cartToggle.addEventListener("click", () => {
    cartDrawer.classList.add("open");
    cartOverlay.classList.add("show");
  });
}

const hideCart = () => {
  cartDrawer.classList.remove("open");
  cartOverlay.classList.remove("show");
};

if (closeCart) closeCart.addEventListener("click", hideCart);
if (cartOverlay) cartOverlay.addEventListener("click", hideCart);

// Show/Hide table selection based on dine-in/takeaway
if (orderTypeSelect) {
  orderTypeSelect.addEventListener("change", () => {
    if (orderTypeSelect.value === "dine-in") {
      tableNoGroup.style.display = "block";
      tableNoSelect.required = true;
    } else {
      tableNoGroup.style.display = "none";
      tableNoSelect.required = false;
      tableNoSelect.value = "";
    }
  });
}

// Update Cart Badge and Display
function updateCartUI() {
  localStorage.setItem("khandesh_cart", JSON.stringify(cart));
  
  // Update badge count
  const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);
  if (cartBadgeCount) {
    cartBadgeCount.innerText = totalQty;
  }

  // Populate Drawer List
  if (!cartItemsList) return;

  if (cart.length === 0) {
    cartItemsList.innerHTML = `
      <div class="cart-empty-msg">
        <i class="fa-solid fa-shopping-cart" style="font-size: 3rem; color: #ddd; margin-bottom: 15px; display: block;"></i>
        <p>Your cart is empty.</p>
      </div>
    `;
    if (cartTotalPrice) cartTotalPrice.innerText = "₹0";
    return;
  }

  let listHtml = "";
  let subtotal = 0;

  cart.forEach((item, index) => {
    subtotal += item.price * item.quantity;
    listHtml += `
      <div class="cart-item">
        <img src="${item.image}" alt="${item.name}">
        <div class="cart-item-details">
          <h4>${item.name}</h4>
          <span class="cart-item-price">₹${item.price}</span>
          <div class="cart-item-qty">
            <button class="qty-btn" onclick="adjustQty(${index}, -1)">-</button>
            <span class="qty-val">${item.quantity}</span>
            <button class="qty-btn" onclick="adjustQty(${index}, 1)">+</button>
          </div>
        </div>
        <button class="remove-item-btn" onclick="removeFromCart(${index})">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </div>
    `;
  });

  cartItemsList.innerHTML = listHtml;
  if (cartTotalPrice) cartTotalPrice.innerText = `₹${subtotal}`;
}

window.adjustQty = function(index, amount) {
  cart[index].quantity += amount;
  if (cart[index].quantity <= 0) {
    cart.splice(index, 1);
  }
  updateCartUI();
};

window.removeFromCart = function(index) {
  cart.splice(index, 1);
  updateCartUI();
};

function showToast(message) {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    container.style.position = "fixed";
    container.style.bottom = "240px"; // Placed clearly above the floating buttons
    container.style.right = "25px";
    container.style.zIndex = "2000";
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.gap = "10px";
    container.style.width = "min(90%, 320px)";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.style.background = "linear-gradient(135deg, #160d08, #2a1a11)";
  toast.style.color = "white";
  toast.style.padding = "12px 20px";
  toast.style.borderRadius = "12px";
  toast.style.boxShadow = "0 8px 30px rgba(0,0,0,0.25)";
  toast.style.borderLeft = "4px solid #d4af37";
  toast.style.display = "flex";
  toast.style.alignItems = "center";
  toast.style.gap = "10px";
  toast.style.fontSize = "0.85rem";
  toast.style.fontWeight = "500";
  toast.style.opacity = "0";
  toast.style.transform = "translateX(50px)";
  toast.style.transition = "all 0.3s cubic-bezier(0.68, -0.55, 0.27, 1.55)";

  toast.innerHTML = `
    <i class="fa-solid fa-circle-check" style="color: #25D366; font-size: 1.1rem;"></i>
    <span style="flex: 1;">${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "1";
    toast.style.transform = "translateX(0)";
  }, 10);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(50px)";
    setTimeout(() => {
      if (container.contains(toast)) {
        container.removeChild(toast);
      }
    }, 300);
  }, 2500);
}

window.addToCart = function(name, price, image) {
  const existing = cart.find(item => item.name === name);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ name, price: Number(price), image, quantity: 1 });
  }
  updateCartUI();
  
  // Visual feedback: Show a Toast Notification
  showToast(`Added: ${name} (₹${price})`);
  
  // Highlight cart button
  if (cartToggle) {
    cartToggle.style.transform = "scale(1.2)";
    setTimeout(() => {
      cartToggle.style.transform = "none";
    }, 200);
  }
};

/*====================================================
        DYNAMIC MENU LOADER & RENDERER
====================================================*/
const menuGrid = document.getElementById("menuGrid");
const menuLoading = document.getElementById("menuLoading");

async function loadMenu() {
  try {
    const res = await fetch("/api/menu");
    if (!res.ok) throw new Error("Could not load menu");
    const menuItems = await res.json();
    
    if (menuLoading) menuLoading.style.display = "none";
    if (menuGrid) {
      menuGrid.style.display = "grid";
      
      if (!menuItems.length) {
        menuGrid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--text);">No menu items found. Please run seed script first.</p>`;
        return;
      }

      let gridHtml = "";
      menuItems.forEach((item, index) => {
        const badgeHtml = item.badge ? `<span class="badge ${item.badge === 'Chef Choice' ? 'new' : ''}">${item.badge}</span>` : "";
        const tagHtml = item.tag ? `<span>🔥 ${item.tag}</span>` : `<span>⭐ ${item.rating || '4.7'}</span>`;
        
        gridHtml += `
          <article class="menu-card" data-category="${item.category}">
            <div class="menu-image">
              <img src="${item.image}" alt="${item.name}">
              ${badgeHtml}
            </div>
            <div class="menu-content">
              <div class="title-row">
                <h3>${item.name}</h3>
                <span class="price">₹${item.price}</span>
              </div>
              <p>${item.description}</p>
              <div class="food-info">
                <span>🟢 ${item.veg ? 'Pure Veg' : 'Non Veg'}</span>
                ${tagHtml}
              </div>
              <button class="primary-btn" onclick="addToCart('${item.name.replace(/'/g, "\\'")}', ${item.price}, '${item.image}')">Add to Cart</button>
            </div>
          </article>
        `;
      });

      menuGrid.innerHTML = gridHtml;
      
      // Initialize filtering on the new cards
      initializeMenuFilters();

      // GSAP Entrance Animations for compact cards (instant staggered fade-in)
      if (window.gsap) {
        gsap.from(".menu-card", {
          opacity: 0,
          y: 20,
          scale: 0.98,
          duration: 0.4,
          stagger: 0.03,
          ease: "power1.out"
        });
      }

      // Refresh ScrollTrigger to calculate correct offsets for lower sections (About, Reservation, etc.)
      if (window.ScrollTrigger) {
        ScrollTrigger.refresh();
      }
    }
  } catch (err) {
    console.error("Error loading dynamic menu:", err);
    if (menuLoading) {
      menuLoading.innerHTML = `<p style="color: red;">Failed to load live menu. Refresh or try again.</p>`;
    }
  }
}

// Menu category buttons filtering
function initializeMenuFilters() {
  const filterBtns = document.querySelectorAll(".menu-filter button");
  
  filterBtns.forEach(btn => {
    // Clone and replace button to clear any old events
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);

    newBtn.addEventListener("click", () => {
      // Set active button
      document.querySelectorAll(".menu-filter button").forEach(b => b.classList.remove("active"));
      newBtn.classList.add("active");

      const filter = newBtn.dataset.filter;
      const cards = document.querySelectorAll(".menu-card");
      
      cards.forEach(card => {
        if (filter === "all" || card.dataset.category === filter) {
          card.classList.remove("hide");
        } else {
          card.classList.add("hide");
        }
      });
    });
  });
}

// Initial loads
document.addEventListener("DOMContentLoaded", () => {
  loadMenu();
  updateCartUI();
  loadReviews();

  // Initialize GSAP Animations for static sections
  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);

    // Hero section animations
    gsap.from(".hero-content h1", { opacity: 0, x: -60, duration: 0.8, ease: "power2.out" });
    gsap.from(".hero-content p", { opacity: 0, x: -40, duration: 0.8, delay: 0.2, ease: "power2.out" });
    gsap.from(".hero-buttons", { opacity: 0, y: 30, duration: 0.6, delay: 0.4, ease: "power2.out" });
    gsap.from(".hero-image img", { opacity: 0, scale: 0.95, duration: 1, delay: 0.2, ease: "power3.out" });

    // About section fade-in
    gsap.from(".about-content", {
      scrollTrigger: {
        trigger: ".about",
        start: "top 75%",
      },
      opacity: 0,
      y: 40,
      duration: 0.8,
      ease: "power2.out"
    });

    // Special Thali banner slide-in
    gsap.from(".special-content", {
      scrollTrigger: {
        trigger: ".today-special",
        start: "top 75%",
      },
      opacity: 0,
      x: 60,
      duration: 1,
      ease: "power2.out"
    });

    // Reservation section fade-in
    gsap.from(".reservation-content", {
      scrollTrigger: {
        trigger: ".reservation",
        start: "top 75%",
      },
      opacity: 0,
      x: -50,
      duration: 0.8,
      ease: "power2.out"
    });

    gsap.from(".booking-form", {
      scrollTrigger: {
        trigger: ".reservation",
        start: "top 75%",
      },
      opacity: 0,
      x: 50,
      duration: 0.8,
      ease: "power2.out"
    });
  }
});

/*====================================================
        CHECKOUT & KOT RECEIPT SUBMISSION
====================================================*/
if (cartCheckoutForm) {
  cartCheckoutForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (cart.length === 0) {
      alert("Your cart is empty! Add some delicious dishes first.");
      return;
    }

    const name = document.getElementById("custName").value.trim();
    const phone = document.getElementById("custPhone").value.trim();
    const type = document.getElementById("orderType").value;
    const tableNo = document.getElementById("tableNo").value;
    const notes = document.getElementById("orderNotes").value.trim();

    if (type === "dine-in" && !tableNo) {
      alert("Please select a table number for Dine-In.");
      return;
    }

    const orderData = {
      name,
      phone,
      type,
      tableNo,
      items: cart,
      notes
    };

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to submit order");
      }

      const result = await res.json();
      const order = result.order;

      // Hide Cart Drawer
      hideCart();

      // Show Receipt / KOT Ticket popup
      showKotReceipt(order);

      // Clear local cart
      cart = [];
      updateCartUI();
      cartCheckoutForm.reset();
    } catch (err) {
      console.error(err);
      alert(err.message || "Something went wrong. Please check your backend.");
    }
  });
}

function showKotReceipt(order) {
  document.getElementById("recKOT").innerText = order.kotNo;
  
  // Format Date
  const dateObj = new Date(order.createdAt);
  const formattedDate = dateObj.toLocaleDateString() + " " + dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  document.getElementById("recDate").innerText = formattedDate;

  document.getElementById("recType").innerText = order.type === "dine-in" ? "DINE-IN" : "TAKEAWAY (PARCEL)";
  
  const tableContainer = document.getElementById("recTableContainer");
  if (order.type === "dine-in") {
    tableContainer.style.display = "block";
    document.getElementById("recTable").innerText = order.tableNo;
  } else {
    tableContainer.style.display = "none";
  }

  document.getElementById("recCustName").innerText = order.name;
  document.getElementById("recCustPhone").innerText = order.phone;

  // Render items table
  const itemsBody = document.getElementById("recItemsBody");
  let itemsHtml = "";
  order.items.forEach(item => {
    itemsHtml += `
      <tr style="border-bottom: 1px dotted #ccc;">
        <td style="padding: 6px 0; text-align: left;">${item.name}</td>
        <td style="padding: 6px 0; text-align: right;">x${item.quantity}</td>
        <td style="padding: 6px 0; text-align: right;">₹${item.price * item.quantity}</td>
      </tr>
    `;
  });
  itemsBody.innerHTML = itemsHtml;
  document.getElementById("recTotal").innerText = `₹${order.totalAmount}`;

  // Instructions
  const instContainer = document.getElementById("recInstructionsContainer");
  if (order.notes) {
    instContainer.style.display = "block";
    document.getElementById("recInstructions").innerText = order.notes;
  } else {
    instContainer.style.display = "none";
  }

  // Display Modal
  const modal = document.getElementById("kotReceiptModal");
  if (modal) {
    modal.style.display = "flex";
  }
}

/*====================================================
        TABLE BOOKING FORM SUBMISSION
====================================================*/
const bookingFormSubmit = document.getElementById("tableBookingForm");
if (bookingFormSubmit) {
  bookingFormSubmit.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(bookingFormSubmit);
    const bookingData = {
      name: formData.get("name"),
      phone: formData.get("phone"),
      email: formData.get("email"),
      date: formData.get("date"),
      time: formData.get("time"),
      guests: formData.get("guests"),
      notes: formData.get("notes")
    };

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookingData)
      });

      if (!res.ok) {
        throw new Error("Failed to place booking");
      }

      alert("Thank you! Your table booking request has been successfully sent to Hotel Khandesh Darbar.");
      bookingFormSubmit.reset();
    } catch (err) {
      console.error(err);
      alert("Error submitting table reservation. Please call directly.");
    }
  });
}

/*====================================================
        NEWSLETTER FORM SUBMISSION
====================================================*/
const newsletterFormSubmit = document.getElementById("newsletterSubscriptionForm");
if (newsletterFormSubmit) {
  newsletterFormSubmit.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = newsletterFormSubmit.querySelector('input[type="email"]').value;

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to subscribe");
      }

      alert("Thanks for subscribing! Watch your email for our latest Khandeshi offers.");
      newsletterFormSubmit.reset();
    } catch (err) {
      alert(err.message || "Error subscribing to newsletter.");
    }
  });
}

/*====================================================
        MONTHLY MESS FORM SUBMISSION
====================================================*/
const messSubscriptionForm = document.getElementById("messSubscriptionForm");
if (messSubscriptionForm) {
  messSubscriptionForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(messSubscriptionForm);
    const messData = {
      name: formData.get("name"),
      phone: formData.get("phone"),
      plan: formData.get("plan"),
      timing: formData.get("timing"),
      startDate: formData.get("startDate"),
      notes: formData.get("notes")
    };

    try {
      const res = await fetch("/api/mess-subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(messData)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to submit subscription");
      }

      showToast("Subscription Request Sent! Manager will contact you.");
      messSubscriptionForm.reset();
    } catch (err) {
      console.error(err);
      alert(err.message || "Error submitting mess subscription. Please call directly.");
    }
  });
}

/*====================================================
        DYNAMIC REVIEWS LOADER
====================================================*/
async function loadReviews() {
  const reviewGrid = document.querySelector(".review-grid");
  if (!reviewGrid) return;

  try {
    const res = await fetch("/api/reviews");
    if (!res.ok) throw new Error("Could not load reviews");
    const reviews = await res.json();
    
    // Filter approved reviews only
    const approvedReviews = reviews.filter(r => r.approved);
    
    if (approvedReviews.length > 0) {
      let reviewsHtml = "";
      approvedReviews.forEach(r => {
        const stars = "★".repeat(r.rating) + "☆".repeat(5 - r.rating);
        const avatarInitial = r.name.charAt(0).toUpperCase();
        reviewsHtml += `
          <div class="review-card">
            <div class="review-top">
              <div class="avatar">${avatarInitial}</div>
              <div>
                <h4>${r.name}</h4>
                <span>${r.role || 'Google Review'}</span>
              </div>
            </div>
            <div class="stars">${stars}</div>
            <p>${r.text}</p>
          </div>
        `;
      });
      reviewGrid.innerHTML = reviewsHtml;
    }
  } catch (err) {
    console.error("Error rendering reviews:", err);
  }
}

/*====================================================
        MONTHLY MESS OVERLAY MODAL TOGGLER
====================================================*/
const messModal = document.getElementById("messModal");
const closeMessModalBtn = document.getElementById("closeMessModal");
const messPlanNavLinks = document.querySelectorAll('a[href="#mess"]');

if (messModal) {
  messPlanNavLinks.forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      
      // Close mobile menu if open
      const mobileNav = document.getElementById("mobileNav");
      const menuBtn = document.querySelector(".menu-btn");
      if (mobileNav && mobileNav.classList.contains("open")) {
        mobileNav.classList.remove("open");
        if (menuBtn) menuBtn.classList.remove("open");
      }
      
      // Display the overlay container
      messModal.style.display = "flex";
      
      // Trigger GSAP zoom/fade animations
      if (window.gsap) {
        gsap.fromTo(messModal, 
          { opacity: 0 }, 
          { opacity: 1, duration: 0.3 }
        );
        gsap.fromTo(messModal.querySelector("div"), 
          { scale: 0.9, y: 30 }, 
          { scale: 1, y: 0, duration: 0.4, ease: "back.out(1.1)" }
        );
      }
    });
  });

  const closeMess = () => {
    if (window.gsap) {
      gsap.to(messModal.querySelector("div"), {
        scale: 0.9,
        y: 25,
        duration: 0.25,
        ease: "power2.in",
        onComplete: () => {
          gsap.to(messModal, {
            opacity: 0,
            duration: 0.15,
            onComplete: () => {
              messModal.style.display = "none";
            }
          });
        }
      });
    } else {
      messModal.style.display = "none";
    }
  };

  if (closeMessModalBtn) {
    closeMessModalBtn.addEventListener("click", closeMess);
  }

  // Close modal when clicking outside contents
  messModal.addEventListener("click", (e) => {
    if (e.target === messModal) {
      closeMess();
    }
  });
}
