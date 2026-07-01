// Lógica de funcionamiento para Pizzarella5020

// Estado de la aplicación
const cart = {}; // Almacena { "cartKey": cantidad }
const activeVariants = {}; // Almacena { "productId": "size" } o { "productId": { size: "size", flavor: "flavor" } }
let selectedCurrency = "COP";
let selectedDeliveryMethod = "delivery";
const localDrinkQty = {};

// Estado del builder de medias pizzas
let halfPizzaState = {
  size: "MED",
  half1: "",
  half2: ""
};

// Adicionales seleccionados temporalmente en el modal
let tempSelectedToppings = [];
let activeToppingsPizzaId = null; // ID de pizza (o 'half-pizza') para el modal abierto

// Adicionales por pizza guardados: { "productId": ["Topping1", "Topping2"] }
const cardToppings = {};

// Inicialización de la aplicación
let loaderTimeout;

document.addEventListener("DOMContentLoaded", () => {
  // Configuración del footer (nombre dinámico del negocio)
  const footerBusinessName = document.getElementById("footer-business-name");
  if (footerBusinessName) {
    footerBusinessName.innerText = BUSINESS_SETTINGS.name;
  }
  const footerYear = document.getElementById("footer-year");
  if (footerYear) {
    footerYear.innerText = new Date().getFullYear();
  }

  // Configurar temporizador de seguridad para ocultar pantalla de carga
  const loader = document.getElementById("loader");
  if (loader) {
    loaderTimeout = setTimeout(hideLoader, 3500); // 3.5 segundos de respaldo
  }

  // Verificar horario de la tienda
  try {
    checkStoreStatus();
    setInterval(checkStoreStatus, 60000); // Check every minute
  } catch (e) {
    console.error("Error al verificar el horario de la tienda:", e);
  }

  // Renderizar catálogo
  renderPizzas();
  renderHalfPizzaBuilder();
  renderDrinks();

  // Escuchadores de eventos
  setupEventListeners();

  // Actualizar totales inicialmente
  updateTotals();

  // Inicializar animación de carga de pizza
  initPizzaLoader();
});

// Verificar si la tienda está abierta (Hora de Venezuela UTC-4)
function checkStoreStatus() {
  let vvzTime;
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Caracas",
      hour12: false,
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric"
    });
    const parts = formatter.formatToParts(new Date());
    const partValues = {};
    parts.forEach(p => partValues[p.type] = p.value);

    const year = parseInt(partValues.year, 10);
    const month = parseInt(partValues.month, 10) - 1;
    const day = parseInt(partValues.day, 10);
    const hour = parseInt(partValues.hour, 10);
    const minute = parseInt(partValues.minute, 10);
    const second = parseInt(partValues.second, 10);

    vvzTime = new Date(Date.UTC(year, month, day, hour, minute, second));
  } catch (err) {
    console.warn("Fallo al obtener zona horaria de Caracas con formatToParts, usando cálculo manual UTC-4:", err);
    // Fallback: Calcular manualmente hora de Venezuela (UTC-4)
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    vvzTime = new Date(utc + (3600000 * -4));
  }

  const day = vvzTime.getUTCDay(); // 0: Dom, 1: Lun, 2: Mar, 3: Mie, 4: Jue, 5: Vie, 6: Sab
  const hour = vvzTime.getUTCHours();
  const minute = vvzTime.getUTCMinutes();
  const currentTime = hour + (minute / 60);

  let isOpen = false;

  // Horario normal: Miércoles a Lunes (Todos menos el Martes que es 2)
  // De 5:00 PM (17) a 10:30 PM (22.5)
  if (day !== 2) {
    if (currentTime >= 17 && currentTime < 22.5) {
      isOpen = true;
    }
  }

  // Horario de pastichos: Sábado (6) y Domingo (0)
  // De 12:00 PM (12) a 3:00 PM (15)
  if (day === 0 || day === 6) {
    if (currentTime >= 12 && currentTime < 15) {
      isOpen = true;
    }
  }

  const badge = document.querySelector(".status-badge");
  if (badge) {
    if (isOpen) {
      badge.innerHTML = `<span class="pulse-dot"></span> Abierto • Pedidos por WhatsApp`;
      badge.classList.remove("closed");
    } else {
      badge.innerHTML = `<span class="pulse-dot closed"></span> Cerrado • Fuera de Horario`;
      badge.classList.add("closed");
    }
  }
}

// Función para ocultar la pantalla de carga de forma segura
function hideLoader() {
  const loader = document.getElementById("loader");
  if (loader && !loader.classList.contains("fade-out")) {
    loader.classList.add("fade-out");
    if (loaderTimeout) {
      clearTimeout(loaderTimeout);
    }
    // Asegurar que no intercepte clicks ocultándolo del todo después de la animación de CSS (0.6s)
    setTimeout(() => {
      loader.style.display = "none";
    }, 600);
  }
}

// Ocultar pantalla de carga al finalizar de cargar todos los recursos
window.addEventListener("load", () => {
  const timeElapsed = performance.now();
  const minWaitTime = 2000; // 2 segundos mínimo para evitar parpadeos
  const timeToWait = Math.max(0, minWaitTime - timeElapsed);
  setTimeout(hideLoader, timeToWait);
});

// Formateador de moneda COP (Pesos Colombianos)
function formatCOP(value) {
  return `$${value.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

// Renderizar Pizzas (Paso 1)
function renderPizzas() {
  const container = document.getElementById("food-container");
  if (!container) return;
  container.innerHTML = "";

  // Filter food items (pizzas and cono pizza)
  const allComidas = PRODUCTS.filter(p => p.category === "comida");

  // Group by subCategory
  const groups = {
    "Básicas": { title: "🍕 Pizzas Básicas", items: [] },
    "Especiales": { title: "✨ Pizzas Especiales", items: [] }
  };

  allComidas.forEach(p => {
    if (p.subCategory && groups[p.subCategory]) {
      groups[p.subCategory].items.push(p);
    }
  });

  Object.keys(groups).forEach(groupKey => {
    const group = groups[groupKey];
    if (group.items.length === 0) return;

    // Render group header
    container.insertAdjacentHTML("beforeend", `
      <div class="subcategory-header">
        <span>${group.title}</span>
      </div>
    `);

    group.items.forEach(pizza => {
      let controlsHtml = "";

      if (pizza.isPizza) {
        // Set default variant if not set
        if (!activeVariants[pizza.id]) {
          activeVariants[pizza.id] = pizza.variants[0].size;
        }
        const activeSize = activeVariants[pizza.id];

        // Build size buttons
        let sizeButtonsHtml = "";
        pizza.variants.forEach(v => {
          const isActive = v.size === activeSize ? "active" : "";
          sizeButtonsHtml += `
            <button type="button" class="btn-size ${isActive}" data-id="${pizza.id}" data-size="${v.size}">
              ${v.label}
            </button>
          `;
        });

        const toppings = cardToppings[pizza.id] || [];
        const hasToppings = toppings.length > 0;
        const badgeHtml = hasToppings ? `<span class="toppings-count-badge">+${toppings.length}</span>` : "";

        controlsHtml = `
          <div class="size-selector">
            ${sizeButtonsHtml}
          </div>
          <div class="pizza-actions-stacked">
            <button type="button" class="btn-toggle-toppings" data-id="${pizza.id}">🧀 Extras${badgeHtml}</button>
            <button type="button" class="btn-add-to-cart" data-id="${pizza.id}">Agregar 😋</button>
          </div>
        `;
      } else {
        // For Cono Pizza or others without size options
        controlsHtml = `
          <div></div> <!-- Spacer -->
          <div class="pizza-actions-stacked">
            <button type="button" class="btn-add-to-cart" data-id="${pizza.id}">Agregar 😋</button>
          </div>
        `;
      }

      // Calculate total card price (base price + toppings)
      const basePrice = pizza.isPizza
        ? pizza.variants.find(v => v.size === activeVariants[pizza.id]).price
        : pizza.price;
      const toppingsPrice = getToppingsPrice(cardToppings[pizza.id] || []);
      const totalPrice = basePrice + toppingsPrice;

      const toppings = cardToppings[pizza.id] || [];
      const hasToppings = toppings.length > 0;
      const toppingsHtml = toppings.map(t => `<span class="selected-topping-tag">${TOPPING_ICONS[t] || "🔸"} ${t}</span>`).join("");

      const pizzaHtml = `
        <div class="product-item" id="product-${pizza.id}">
          <div class="product-top-row">
            <div class="product-img-frame">
              <img src="${pizza.logo}" alt="${pizza.name}" class="product-logo-img" id="logo-${pizza.id}">
            </div>
            <div class="product-info">
              <h3 class="product-name">${pizza.name}</h3>
              <p class="product-description">${pizza.description}</p>
              <span class="product-price-label" id="price-label-${pizza.id}">${formatCOP(totalPrice)}</span>
              <div class="selected-toppings-list" id="toppings-list-${pizza.id}" style="${hasToppings ? 'display: flex;' : 'display: none;'}">
                ${toppingsHtml}
              </div>
            </div>
          </div>
          <div class="product-controls">
            ${controlsHtml}
          </div>
        </div>
      `;

      container.insertAdjacentHTML("beforeend", pizzaHtml);
    });
  });
}

// Render half pizza builder (Mitad y Mitad)
function renderHalfPizzaBuilder() {
  const container = document.getElementById("half-pizza-builder");
  if (!container) return;

  const pizzas = PRODUCTS.filter(p => p.isPizza === true);

  // Size buttons (MED, FAM, EXT)
  const sizeLabels = { "MED": "M", "FAM": "F", "EXT": "EF" };
  let sizeButtonsHtml = "";
  HALF_PIZZA_SIZES.forEach(size => {
    const isActive = size === halfPizzaState.size ? "active" : "";
    sizeButtonsHtml += `
      <button type="button" class="btn-size ${isActive}" data-half-size="${size}">
        ${sizeLabels[size] || size}
      </button>
    `;
  });

  // 1. Validar que las mitades elegidas existan en el nuevo tamaño seleccionado
  if (halfPizzaState.half1) {
    const p1 = pizzas.find(p => p.id === halfPizzaState.half1);
    if (!p1 || !p1.variants.find(v => v.size === halfPizzaState.size)) halfPizzaState.half1 = "";
  }
  if (halfPizzaState.half2) {
    const p2 = pizzas.find(p => p.id === halfPizzaState.half2);
    if (!p2 || !p2.variants.find(v => v.size === halfPizzaState.size)) halfPizzaState.half2 = "";
  }

  // 2. Construir options directamente con interpolación segura
  let optionsHtml1 = `<option value="" ${!halfPizzaState.half1 ? 'selected' : ''}>-- Elige una pizza --</option>`;
  let optionsHtml2 = `<option value="" ${!halfPizzaState.half2 ? 'selected' : ''}>-- Elige una pizza --</option>`;

  pizzas.forEach(p => {
    const variant = p.variants.find(v => v.size === halfPizzaState.size);
    if (variant) {
      const text = `${p.name.replace("Pizza ", "")} — ${formatCOP(variant.price)}`;
      optionsHtml1 += `<option value="${p.id}" ${halfPizzaState.half1 === p.id ? 'selected' : ''}>${text}</option>`;
      optionsHtml2 += `<option value="${p.id}" ${halfPizzaState.half2 === p.id ? 'selected' : ''}>${text}</option>`;
    }
  });

  // Calculate current combination price (average promediado + toppings)
  let priceText = "Elige ambas mitades";
  let totalPrice = 0;
  if (halfPizzaState.half1 && halfPizzaState.half2) {
    const basePrice = calculateHalfPizzaPrice(halfPizzaState.half1, halfPizzaState.half2, halfPizzaState.size);
    const toppingsPrice = getToppingsPrice(cardToppings["half-pizza"] || []);
    totalPrice = (basePrice || 0) + toppingsPrice;
    priceText = formatCOP(totalPrice);
  }

  const toppings = cardToppings["half-pizza"] || [];
  const hasToppings = toppings.length > 0;
  const toppingsHtml = toppings.map(t => `<span class="selected-topping-tag">${TOPPING_ICONS[t] || "🔸"} ${t}</span>`).join("");
  const badgeHtml = hasToppings ? `<span class="toppings-count-badge">+${toppings.length}</span>` : "";

  // Helpful usage tip
  const builderDescription = `
    <p class="step-help-text" style="margin-top: 8px; margin-bottom: 12px;">
      💡 El precio se calcula promediando el costo de ambas mitades al millar más cercano. Agrega adicionales en "🧀 Extras" si lo deseas.
    </p>
  `;

  container.innerHTML = `
    <div class="half-pizza-builder-card">
      <div class="half-pizza-builder-header">
        <span class="half-icon">🍕</span>
        <h3>Arma tu Mitad y Mitad</h3>
      </div>
      
      ${builderDescription}

      <div class="half-pizza-size-selector">
        ${sizeButtonsHtml}
      </div>

      <div class="half-pizza-selectors">
        <div class="half-pizza-select-group">
          <label>🔴 Mitad 1</label>
          <select id="half-pizza-select-1">
            ${optionsHtml1}
          </select>
        </div>
        <div class="half-pizza-select-group">
          <label>🟡 Mitad 2</label>
          <select id="half-pizza-select-2">
            ${optionsHtml2}
          </select>
        </div>
      </div>

      <div class="half-pizza-footer" style="display: flex; flex-direction: column; gap: 12px; align-items: stretch; border-top: 1px dashed rgba(211, 47, 47, 0.2); padding-top: 14px;">
        <div class="selected-toppings-list" id="toppings-list-half-pizza" style="${hasToppings ? 'display: flex;' : 'display: none;'}">
          ${toppingsHtml}
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 0.9rem; font-weight: 700; color: var(--text-muted);">Precio de la Pizza:</span>
          <span class="half-pizza-price" id="half-pizza-price" style="font-size: 1.15rem; font-weight: 850; color: var(--primary);">${priceText}</span>
        </div>
        <div class="pizza-actions-container">
          <button type="button" class="btn-toggle-toppings" data-id="half-pizza">🧀 Extras${badgeHtml}</button>
          <button type="button" class="btn-add-to-cart" data-id="half-pizza">Agregar 😋</button>
        </div>
      </div>
    </div>
  `;
}

// Get the price of the current half pizza selection
function getHalfPizzaPrice() {
  if (!halfPizzaState.half1 || !halfPizzaState.half2) {
    return "Elige ambas mitades";
  }

  const price = calculateHalfPizzaPrice(halfPizzaState.half1, halfPizzaState.half2, halfPizzaState.size);
  if (price === null) return "N/A";
  return formatCOP(price);
}

// Calculate base half pizza price (rounded to nearest thousand)
function calculateHalfPizzaPrice(pizzaIdA, pizzaIdB, size) {
  const pizzaA = PRODUCTS.find(p => p.id === pizzaIdA);
  const pizzaB = PRODUCTS.find(p => p.id === pizzaIdB);
  if (!pizzaA || !pizzaB) return null;

  const varA = pizzaA.variants.find(v => v.size === size);
  const varB = pizzaB.variants.find(v => v.size === size);
  if (!varA || !varB) return null;

  const avg = (varA.price + varB.price) / 2;
  return Math.round(avg / 1000) * 1000;
}

// Update builder subtotal display
function updateHalfPizzaPrice() {
  const priceEl = document.getElementById("half-pizza-price");
  if (!priceEl) return;

  let priceText = "Elige ambas mitades";
  if (halfPizzaState.half1 && halfPizzaState.half2) {
    const basePrice = calculateHalfPizzaPrice(halfPizzaState.half1, halfPizzaState.half2, halfPizzaState.size);
    const toppingsPrice = getToppingsPrice(cardToppings["half-pizza"] || []);
    priceText = formatCOP((basePrice || 0) + toppingsPrice);
  }
  priceEl.innerText = priceText;

  // Add updated flash animation
  priceEl.classList.add("price-updated");
  setTimeout(() => {
    priceEl.classList.remove("price-updated");
  }, 300);
}

// Generate unique ordered cart key for half-pizzas
function getHalfPizzaCartKey(half1, half2, size) {
  const sorted = [half1, half2].sort();
  return `half_${size}_${sorted[0]}_${sorted[1]}`;
}

// Toppings layout icons
const TOPPING_ICONS = {
  "Aceitunas": "🫒",
  "Maíz": "🌽",
  "Champiñones": "🍄",
  "Anchoas": "🐟",
  "Jamón": "🥓",
  "Salami": "🍖",
  "Pepperoni": "🔴",
  "Tocineta": "🥩",
  "Pollo": "🍗"
};

// Calculate cost of an array of toppings
function getToppingsPrice(toppingsArray) {
  if (!toppingsArray || toppingsArray.length === 0) return 0;
  let total = 0;
  toppingsArray.forEach(topping => {
    if (TOPPINGS.basicos.items.includes(topping)) {
      total += TOPPINGS.basicos.price;
    } else if (TOPPINGS.especiales.items.includes(topping)) {
      total += TOPPINGS.especiales.price;
    }
  });
  return total;
}

// Parse cart key into clean structured object
function parseCartKey(key) {
  const parts = key.split("_");
  
  if (key.startsWith("half_")) {
    const size = parts[1];
    const pizzaA = parts[2];
    const pizzaB = parts[3];
    let toppings = [];
    if (key.includes("_toppings_")) {
      const toppingsIndex = parts.indexOf("toppings");
      toppings = parts.slice(toppingsIndex + 1);
    }
    return {
      type: "half",
      size,
      pizzaA,
      pizzaB,
      toppings
    };
  } else if (key.includes("_toppings_")) {
    const productId = parts[0];
    const size = parts[1];
    const toppingsIndex = parts.indexOf("toppings");
    const toppings = parts.slice(toppingsIndex + 1);
    return {
      type: "pizza",
      productId,
      size,
      toppings
    };
  } else {
    const productId = parts[0];
    const product = PRODUCTS.find(p => p.id === productId);
    if (!product) return null;
    
    if (product.isPizza) {
      const size = parts[1];
      return {
        type: "pizza",
        productId,
        size,
        toppings: []
      };
    } else if (product.isSoda) {
      const size = parts[1];
      const flavor = parts[2];
      return {
        type: "soda",
        productId,
        size,
        flavor
      };
    } else {
      return {
        type: "other",
        productId
      };
    }
  }
}

// Get unit price of parsed cart item
function getItemUnitPrice(parsed) {
  if (!parsed) return 0;
  
  if (parsed.type === "half") {
    const basePrice = calculateHalfPizzaPrice(parsed.pizzaA, parsed.pizzaB, parsed.size);
    const toppingsPrice = getToppingsPrice(parsed.toppings);
    return (basePrice || 0) + toppingsPrice;
  } else if (parsed.type === "pizza") {
    const product = PRODUCTS.find(p => p.id === parsed.productId);
    if (!product) return 0;
    const variant = product.variants.find(v => v.size === parsed.size);
    const basePrice = variant ? variant.price : 0;
    const toppingsPrice = getToppingsPrice(parsed.toppings);
    return basePrice + toppingsPrice;
  } else if (parsed.type === "soda") {
    const product = PRODUCTS.find(p => p.id === parsed.productId);
    if (!product) return 0;
    const variant = product.variants.find(v => v.size === parsed.size);
    return variant ? variant.price : 0;
  } else {
    const product = PRODUCTS.find(p => p.id === parsed.productId);
    return product ? (product.price || 0) : 0;
  }
}

// Update count badge on extras button and active toppings tags on product card
function updateToppingsFeedback(productId) {
  if (productId === "half-pizza") return;

  const toppings = cardToppings[productId] || [];
  const hasToppings = toppings.length > 0;

  // 1. Update the "🧀 Extras" button badge
  const btn = document.querySelector(`.btn-toggle-toppings[data-id="${productId}"]`);
  if (btn) {
    const existingBadge = btn.querySelector(".toppings-count-badge");
    if (existingBadge) {
      existingBadge.remove();
    }
    if (hasToppings) {
      const badge = document.createElement("span");
      badge.className = "toppings-count-badge";
      badge.innerText = `+${toppings.length}`;
      btn.appendChild(badge);
    }
  }

  // 2. Update the tags list under the price
  const listContainer = document.getElementById(`toppings-list-${productId}`);
  if (listContainer) {
    if (hasToppings) {
      const toppingsHtml = toppings.map(t => `<span class="selected-topping-tag">${TOPPING_ICONS[t] || "🔸"} ${t}</span>`).join("");
      listContainer.innerHTML = toppingsHtml;
      listContainer.style.display = "flex";
    } else {
      listContainer.innerHTML = "";
      listContainer.style.display = "none";
    }
  }
}

// Update price text on catalog item cards
function updateCardPrice(productId) {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return;

  let totalPrice = 0;
  if (product.isPizza) {
    const size = activeVariants[productId] || "PEQ";
    const variant = product.variants.find(v => v.size === size);
    const basePrice = variant ? variant.price : 0;
    const toppingsPrice = getToppingsPrice(cardToppings[productId] || []);
    totalPrice = basePrice + toppingsPrice;
  } else if (product.isSoda) {
    const size = activeVariants[productId].size;
    const variant = product.variants.find(v => v.size === size);
    totalPrice = variant ? variant.price : 0;
  } else {
    totalPrice = product.price || 0;
  }

  const label = document.getElementById(`price-label-${productId}`);
  if (label) {
    label.innerText = formatCOP(totalPrice);
  }

  // Update visual feedback for toppings (badge and list of selected toppings)
  if (product.isPizza) {
    updateToppingsFeedback(productId);
  }
}

// Add catalog selection to cart
function addProductToCart(productId) {
  if (productId === "half-pizza") {
    if (!halfPizzaState.half1 || !halfPizzaState.half2) {
      showError("⚠️ Selecciona ambas mitades antes de agregar.");
      return;
    }

    const basePrice = calculateHalfPizzaPrice(halfPizzaState.half1, halfPizzaState.half2, halfPizzaState.size);
    if (basePrice === null) {
      showError("⚠️ Una de las pizzas no está disponible en este tamaño.");
      return;
    }

    const size = halfPizzaState.size;
    const toppings = cardToppings["half-pizza"] || [];
    const toppingsPart = toppings.length > 0 ? `_toppings_${toppings.slice().sort().join("_")}` : "";
    const sortedHalves = [halfPizzaState.half1, halfPizzaState.half2].sort();
    const cartKey = `half_${size}_${sortedHalves[0]}_${sortedHalves[1]}${toppingsPart}`;

    cart[cartKey] = (cart[cartKey] || 0) + 1;

    // Animate
    const btn = document.querySelector(`.btn-add-to-cart[data-id="half-pizza"]`);
    animateFlyingPizza(btn);

    // Reset customization
    cardToppings["half-pizza"] = [];
    halfPizzaState.half1 = "";
    halfPizzaState.half2 = "";

    renderHalfPizzaBuilder();
    updateTotals();
    return;
  }

  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return;

  let cartKey = "";

  if (product.isPizza) {
    const size = activeVariants[productId] || "PEQ";
    const toppings = cardToppings[productId] || [];
    const toppingsPart = toppings.length > 0 ? `_toppings_${toppings.slice().sort().join("_")}` : "";
    cartKey = `${productId}_${size}${toppingsPart}`;

    cardToppings[productId] = [];
  } else if (product.isSoda) {
    const size = activeVariants[productId].size;
    const flavor = activeVariants[productId].flavor;
    cartKey = `${productId}_${size}_${flavor}`;
  } else {
    cartKey = `${productId}_DEFAULT`;
  }

  const qtyToAdd = localDrinkQty[productId] || 1;
  cart[cartKey] = (cart[cartKey] || 0) + qtyToAdd;
  
  if (localDrinkQty[productId]) {
    localDrinkQty[productId] = 1;
    const el = document.getElementById(`local-qty-val-${productId}`);
    if (el) el.innerText = "1";
  }

  // Animate
  const card = document.getElementById(`product-${productId}`);
  const btn = card ? card.querySelector(".btn-add-to-cart") : null;
  animateFlyingPizza(btn);

  if (product.isPizza) {
    renderPizzas();
  }
  updateTotals();
}

// Slide pizza emoji from button to summary cart
function animateFlyingPizza(sourceEl) {
  if (!sourceEl) return;

  let targetEl = document.getElementById("cart-items-list");
  // Check if target element exists and is visible, otherwise fallback to summary card
  if (!targetEl || targetEl.style.display === "none" || targetEl.offsetHeight === 0) {
    targetEl = document.querySelector(".summary-card");
  }
  if (!targetEl) return;
  
  const productItem = sourceEl.closest('.product-item');
  const imgEl = productItem ? productItem.querySelector('.product-logo-img') : null;

  const sourceRect = (imgEl || sourceEl).getBoundingClientRect();
  const targetRect = targetEl.getBoundingClientRect();

  let flyer;
  if (imgEl) {
    flyer = imgEl.cloneNode(true);
    flyer.className = "flying-pizza";
    flyer.style.width = "60px";
    flyer.style.height = "60px";
    // Ensure image retains object-fit if it had one
    flyer.style.objectFit = "contain";
  } else {
    flyer = document.createElement("div");
    flyer.className = "flying-pizza";
    flyer.innerText = "🍕";
    flyer.style.width = "60px";
    flyer.style.height = "60px";
    flyer.style.display = "flex";
    flyer.style.justifyContent = "center";
    flyer.style.alignItems = "center";
  }

  // Calculate coordinates to center the 60px flyer on the source and target elements
  const sourceX = sourceRect.left + sourceRect.width / 2 - 30;
  const sourceY = sourceRect.top + sourceRect.height / 2 - 30;
  const targetX = targetRect.left + targetRect.width / 2 - 30;
  const targetY = targetRect.top + targetRect.height / 2 - 30;

  // Set position and animation parameters as CSS custom properties
  flyer.style.left = `${sourceX}px`;
  flyer.style.top = `${sourceY}px`;
  flyer.style.setProperty('--tx', `${targetX - sourceX}px`);
  flyer.style.setProperty('--ty', `${targetY - sourceY}px`);

  document.body.appendChild(flyer);

  // Clean up element after keyframe animation finishes (animation is 2s in style.css)
  setTimeout(() => {
    if (flyer && flyer.parentNode) {
      flyer.remove();
    }
  }, 2100);
}

// Render dynamic toppings inside the modal overlay
function renderModalToppings() {
  const container = document.getElementById("modal-toppings-container");
  if (!container) return;

  let html = "";

  Object.keys(TOPPINGS).forEach(categoryKey => {
    const category = TOPPINGS[categoryKey];
    const catEmoji = categoryKey === "basicos" ? "🧀" : "⭐";

    html += `
      <div class="toppings-section">
        <div class="topping-category-label" style="font-size: 0.82rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted); margin-bottom: 10px;">
          ${catEmoji} ${category.label}
        </div>
        <div class="topping-chips-grid" style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px;">
    `;

    category.items.forEach(item => {
      const isActive = tempSelectedToppings.includes(item) ? "active" : "";
      const icon = TOPPING_ICONS[item] || "🔸";

      html += `
        <button type="button" class="topping-chip ${isActive}" data-topping-modal="${item}">
          <span class="topping-chip-icon">${icon}</span> ${item}
        </button>
      `;
    });

    html += `
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
  updateModalSubtotal();
}

// Update modal extras subtotal
function updateModalSubtotal() {
  const priceEl = document.getElementById("modal-extras-price");
  if (!priceEl) return;
  const subtotal = getToppingsPrice(tempSelectedToppings);
  priceEl.innerText = formatCOP(subtotal);
}

// Render Bebidas (Paso 2)
function renderDrinks() {
  const container = document.getElementById("drinks-container");
  if (!container) return;
  container.innerHTML = "";

  const drinks = PRODUCTS.filter(p => p.category === "bebida");

  drinks.forEach(drink => {
    let controlsHtml = "";

    if (drink.isSoda) {
      if (!activeVariants[drink.id]) {
        const defaultFlavor = (drink.flavors && drink.flavors[0]) ? drink.flavors[0].name : "Coca-Cola";
        const defaultAllowedSizes = drink.flavors[0].allowedSizes || ["1L", "2L"];
        const defaultSize = defaultAllowedSizes[0];
        activeVariants[drink.id] = { size: defaultSize, flavor: defaultFlavor };
      }
      
      const activeSize = activeVariants[drink.id].size;
      const activeFlavor = activeVariants[drink.id].flavor;

      // Size selectors
      let sizeButtonsHtml = "";
      if (drink.variants) {
        drink.variants.forEach(v => {
          const isActive = v.size === activeSize ? "active" : "";
          sizeButtonsHtml += `
            <button type="button" class="btn-size ${isActive}" data-id="${drink.id}" data-size="${v.size}" id="btn-size-${drink.id}-${v.size}">
              ${v.label}
            </button>
          `;
        });
      }

      // Flavor selectors
      let flavorButtonsHtml = "";
      if (drink.flavors) {
        drink.flavors.forEach(f => {
          const isActive = f.name === activeFlavor ? "active" : "";
          flavorButtonsHtml += `
            <button type="button" class="btn-flavor ${isActive}" data-id="${drink.id}" data-flavor="${f.name}">
              ${f.name}
            </button>
          `;
        });
      }

      controlsHtml = `
        <div class="soda-control-group">
          <span class="soda-control-label">Tamaño:</span>
          <div class="size-selector soda-sizes">
            ${sizeButtonsHtml}
          </div>
        </div>
        <div class="soda-control-group">
          <span class="soda-control-label">Sabor:</span>
          <div class="flavor-selector-container">
            ${flavorButtonsHtml}
          </div>
        </div>
        <div class="pizza-actions-stacked" style="margin-top: 10px;">
          <div class="qty-controller">
            <button type="button" class="btn-qty btn-local-minus" data-id="${drink.id}">-</button>
            <span class="qty-val" id="local-qty-val-${drink.id}">${localDrinkQty[drink.id] || 1}</span>
            <button type="button" class="btn-qty btn-local-plus" data-id="${drink.id}">+</button>
          </div>
          <button type="button" class="btn-add-to-cart" data-id="${drink.id}">Agregar 😋</button>
        </div>
      `;
    } else {
      // Water
      controlsHtml = `
        <div></div>
        <div class="pizza-actions-stacked">
          <div class="qty-controller">
            <button type="button" class="btn-qty btn-local-minus" data-id="${drink.id}">-</button>
            <span class="qty-val" id="local-qty-val-${drink.id}">${localDrinkQty[drink.id] || 1}</span>
            <button type="button" class="btn-qty btn-local-plus" data-id="${drink.id}">+</button>
          </div>
          <button type="button" class="btn-add-to-cart" data-id="${drink.id}">Agregar 😋</button>
        </div>
      `;
    }

    const currentLogo = drink.isSoda 
      ? (drink.flavors.find(f => f.name === activeVariants[drink.id].flavor)?.logo || drink.logo)
      : drink.logo;
      
    const priceText = drink.isSoda
      ? formatCOP(drink.variants.find(v => v.size === activeVariants[drink.id].size).price)
      : formatCOP(drink.price);

    const drinkHtml = `
      <div class="product-item" id="product-${drink.id}">
        <div class="product-top-row">
          <div class="product-img-frame">
            <img src="${currentLogo}" alt="${drink.name}" class="product-logo-img" id="logo-${drink.id}">
          </div>
          <div class="product-info">
            <h3 class="product-name">${drink.name}</h3>
            <p class="product-description">${drink.description}</p>
            <span class="product-price-label" id="price-label-${drink.id}">${priceText}</span>
          </div>
        </div>
        <div class="product-controls ${drink.isSoda ? 'vertical-controls' : ''}">
          ${controlsHtml}
        </div>
      </div>
    `;

    container.insertAdjacentHTML("beforeend", drinkHtml);
  });

  // Init soda sizes visibility filter
  drinks.forEach(drink => {
    if (drink.isSoda) updateSodaSizesVisibility(drink.id);
  });
}

// Adjust drink sizes availability depending on flavor restrictions
function updateSodaSizesVisibility(productId) {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product || !product.isSoda) return;

  const currentFlavor = activeVariants[productId].flavor;
  const flavorData = product.flavors.find(f => f.name === currentFlavor);
  if (!flavorData) return;

  const allowedSizes = flavorData.allowedSizes || ["1L", "2L"];

  product.variants.forEach(v => {
    const button = document.getElementById(`btn-size-${productId}-${v.size}`);
    if (button) {
      if (allowedSizes.includes(v.size)) {
        button.style.display = "inline-flex";
      } else {
        button.style.display = "none";

        // Fallback to first allowed option if selected becomes hidden
        if (activeVariants[productId].size === v.size) {
          const firstAllowed = allowedSizes[0];
          const firstButton = document.getElementById(`btn-size-${productId}-${firstAllowed}`);
          if (firstButton) {
            firstButton.click();
          }
        }
      }
    }
  });
}

// Configure application event listeners
function setupEventListeners() {
  // Single global click listener to improve performance
  document.addEventListener("click", (e) => {
    // 1. Size buttons interactions
    const btnSize = e.target.closest(".btn-size");
    if (btnSize && !btnSize.hasAttribute("data-half-size")) {
      const productId = btnSize.getAttribute("data-id");
      if (!productId) return;
      const size = btnSize.getAttribute("data-size");
      const product = PRODUCTS.find(p => p.id === productId);
      const card = document.getElementById(`product-${productId}`);
      if (card) {
        card.querySelectorAll(".btn-size").forEach(btn => btn.classList.remove("active"));
      }
      btnSize.classList.add("active");
      if (product.isPizza) {
        activeVariants[productId] = size;
      } else if (product.isSoda) {
        activeVariants[productId].size = size;
        updateSodaSizesVisibility(productId);
      }
      updateCardPrice(productId);
      return;
    }

    // 2. Soda flavor buttons interactions
    const btnFlavor = e.target.closest(".btn-flavor");
    if (btnFlavor) {
      const productId = btnFlavor.getAttribute("data-id");
      const flavorName = btnFlavor.getAttribute("data-flavor");
      const product = PRODUCTS.find(p => p.id === productId);
      activeVariants[productId].flavor = flavorName;
      const card = document.getElementById(`product-${productId}`);
      if (card) {
        card.querySelectorAll(".btn-flavor").forEach(btn => btn.classList.remove("active"));
      }
      btnFlavor.classList.add("active");
      const flavorData = product.flavors.find(f => f.name === flavorName);
      if (flavorData) {
        const logoEl = document.getElementById(`logo-${productId}`);
        if (logoEl) logoEl.src = flavorData.logo;
      }
      updateSodaSizesVisibility(productId);
      updateCardPrice(productId);
      return;
    }

    // 3. Modal toppings
    const btnToppings = e.target.closest(".btn-toggle-toppings");
    if (btnToppings) {
      const id = btnToppings.getAttribute("data-id");
      activeToppingsPizzaId = id;
      tempSelectedToppings = [...(cardToppings[id] || [])];
      renderModalToppings();
      const modal = document.getElementById("toppings-modal");
      if (modal) modal.classList.add("open");
      return;
    }

    const chip = e.target.closest(".topping-chip[data-topping-modal]");
    if (chip) {
      const toppingName = chip.getAttribute("data-topping-modal");
      const index = tempSelectedToppings.indexOf(toppingName);
      if (index === -1) {
        tempSelectedToppings.push(toppingName);
      } else {
        tempSelectedToppings.splice(index, 1);
      }
      renderModalToppings();
      return;
    }

    // 4. Agregar al carrito y Qty Local (+ / -)
    const btnLocalPlus = e.target.closest(".btn-local-plus");
    const btnLocalMinus = e.target.closest(".btn-local-minus");
    const btnAdd = e.target.closest(".btn-add-to-cart");

    if (btnLocalPlus) {
      const id = btnLocalPlus.getAttribute("data-id");
      localDrinkQty[id] = (localDrinkQty[id] || 1) + 1;
      document.getElementById(`local-qty-val-${id}`).innerText = localDrinkQty[id];
      return;
    } else if (btnLocalMinus) {
      const id = btnLocalMinus.getAttribute("data-id");
      localDrinkQty[id] = Math.max(1, (localDrinkQty[id] || 1) - 1);
      document.getElementById(`local-qty-val-${id}`).innerText = localDrinkQty[id];
      return;
    } else if (btnAdd) {
      const id = btnAdd.getAttribute("data-id");
      addProductToCart(id);
      return;
    }

    // 5. Half-pizza builder size buttons clicks
    const btnHalfSize = e.target.closest("[data-half-size]");
    if (btnHalfSize) {
      const newSize = btnHalfSize.getAttribute("data-half-size");
      halfPizzaState.size = newSize;
      renderHalfPizzaBuilder();
      return;
    }

    // 6. Incremental adjustments directly inside Resumen (mini-cart)
    const btnPlus = e.target.closest(".btn-plus-mini");
    const btnMinus = e.target.closest(".btn-minus-mini");
    const btnDelete = e.target.closest(".btn-delete-item");
    
    if (btnPlus) {
      const key = btnPlus.getAttribute("data-key");
      if (cart[key]) {
        cart[key]++;
        updateTotals();
      }
      return;
    } else if (btnMinus) {
      const key = btnMinus.getAttribute("data-key");
      if (cart[key]) {
        cart[key]--;
        if (cart[key] <= 0) {
          delete cart[key];
        }
        updateTotals();
      }
      return;
    } else if (btnDelete) {
      const key = btnDelete.getAttribute("data-key");
      delete cart[key];
      updateTotals();
      return;
    }
  });

  // Half-pizza builder dropdown options updates
  document.addEventListener("change", (e) => {
    if (e.target.id === "half-pizza-select-1") {
      halfPizzaState.half1 = e.target.value;
      updateHalfPizzaPrice();
    } else if (e.target.id === "half-pizza-select-2") {
      halfPizzaState.half2 = e.target.value;
      updateHalfPizzaPrice();
    }
  });

  // Modal Save/Close overlay listeners
  const btnConfirmModal = document.getElementById("btn-confirm-modal");
  if (btnConfirmModal) {
    btnConfirmModal.addEventListener("click", () => {
      cardToppings[activeToppingsPizzaId] = [...tempSelectedToppings];
      const modal = document.getElementById("toppings-modal");
      if (modal) modal.classList.remove("open");
      if (activeToppingsPizzaId === "half-pizza") {
        renderHalfPizzaBuilder();
      } else {
        updateCardPrice(activeToppingsPizzaId);
      }
    });
  }

  const btnCloseModal = document.getElementById("btn-close-modal");
  if (btnCloseModal) {
    btnCloseModal.addEventListener("click", () => {
      const modal = document.getElementById("toppings-modal");
      if (modal) modal.classList.remove("open");
    });
  }

  const modalOverlay = document.getElementById("toppings-modal");
  if (modalOverlay) {
    modalOverlay.addEventListener("click", (e) => {
      if (e.target === modalOverlay) {
        modalOverlay.classList.remove("open");
      }
    });
  }

  // 13. Payment method selections
  const paymentButtons = document.querySelectorAll(".btn-payment");
  paymentButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      paymentButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      selectedCurrency = btn.getAttribute("data-currency");
    });
  });

  // 14. Delivery method selections
  const deliveryButtons = document.querySelectorAll(".btn-delivery-option");
  deliveryButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      deliveryButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      selectedDeliveryMethod = btn.getAttribute("data-method");

      const addressContainer = document.getElementById("address-container");
      const zoneInfo = document.getElementById("delivery-zone-info");
      if (selectedDeliveryMethod === "delivery") {
        if (addressContainer) addressContainer.style.display = "block";
        if (zoneInfo) zoneInfo.style.display = "block";
      } else {
        if (addressContainer) addressContainer.style.display = "none";
        if (zoneInfo) zoneInfo.style.display = "none";
      }

      updateTotals();
    });
  });

  // 15. Hide error messages during input
  const clientAddressInput = document.getElementById("client-address");
  if (clientAddressInput) {
    clientAddressInput.addEventListener("input", hideErrorMessage);
  }
}



// Display error toasts
let errorTimeout;
function showError(msg) {
  const errorMessage = document.getElementById("error-message");
  if (!errorMessage) return;
  errorMessage.innerText = msg;
  errorMessage.style.display = "block";
  clearTimeout(errorTimeout);
  errorTimeout = setTimeout(() => {
    errorMessage.style.display = "none";
  }, 4000);
}

function hideErrorMessage() {
  const errorMessage = document.getElementById("error-message");
  if (errorMessage) errorMessage.style.display = "none";
}

// Recompute cart subtotal, boxes, delivery, and totals
function updateTotals() {
  let subtotal = 0;
  let boxTotal = 0;
  let hasItems = false;

  Object.keys(cart).forEach(key => {
    const qty = cart[key];
    if (qty <= 0) return;

    hasItems = true;
    const parsed = parseCartKey(key);
    if (!parsed) return;

    const unitPrice = getItemUnitPrice(parsed);
    subtotal += unitPrice * qty;

    // Apply pizza boxes price separately by size
    if (parsed.type === "pizza" || parsed.type === "half") {
      const boxPrice = BOX_PRICES[parsed.size] || 0;
      boxTotal += boxPrice * qty;
    }
  });

  const deliveryCost = (hasItems && selectedDeliveryMethod === "delivery") ? BUSINESS_SETTINGS.deliveryFee : 0;
  const total = subtotal + boxTotal + deliveryCost;

  // Update DOM totals
  document.getElementById("summary-subtotal").innerText = formatCOP(subtotal);
  document.getElementById("summary-boxes").innerText = formatCOP(boxTotal);
  
  const deliveryLabel = document.getElementById("summary-delivery-label");
  const deliveryVal = document.getElementById("summary-delivery");
  if (selectedDeliveryMethod === "pickup") {
    if (deliveryLabel) deliveryLabel.innerText = "Entrega: Retiro en tienda";
    if (deliveryVal) deliveryVal.innerText = formatCOP(0);
  } else {
    if (deliveryLabel) deliveryLabel.innerText = `Entrega: Delivery (${BUSINESS_SETTINGS.deliveryLabel})`;
    if (deliveryVal) deliveryVal.innerText = formatCOP(deliveryCost);
  }
  
  document.getElementById("summary-total").innerText = formatCOP(total);
  
  // Highlight selections in catalog cards
  PRODUCTS.forEach(p => {
    // Removed updateCardSelectedState
  });

  // Render resumen list
  renderMiniCart();
}

// Validate, structure, and submit order message to WhatsApp API
function submitOrder() {
  const addressInput = document.getElementById("client-address");
  const notesInput = document.getElementById("order-notes");

  const clientAddress = addressInput ? addressInput.value.trim() : "";
  const orderNotes = notesInput ? notesInput.value.trim() : "";

  // Validate cart is not empty
  let totalItems = 0;
  Object.keys(cart).forEach(key => {
    if (cart[key] > 0) {
      totalItems += cart[key];
    }
  });
  if (totalItems === 0) {
    showError("⚠️ El carrito está vacío. Por favor agrega al menos una pizza o bebida.");
    return;
  }

  // Validate client address for Delivery method
  if (selectedDeliveryMethod === "delivery" && !clientAddress) {
    showError("⚠️ Por favor, escribe las indicaciones o dirección para la entrega.");
    if (addressInput) {
      addressInput.focus();
      addressInput.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    return;
  }

  hideErrorMessage();

  let subtotal = 0;
  let boxTotal = 0;
  let itemsText = "";

  Object.keys(cart).forEach(key => {
    const qty = cart[key];
    if (qty <= 0) return;

    const parsed = parseCartKey(key);
    if (!parsed) return;

    const unitPrice = getItemUnitPrice(parsed);
    const rowPrice = unitPrice * qty;
    subtotal += rowPrice;

    if (parsed.type === "half") {
      const pA = PRODUCTS.find(p => p.id === parsed.pizzaA);
      const pB = PRODUCTS.find(p => p.id === parsed.pizzaB);
      const nameA = pA ? pA.name.replace("Pizza ", "") : parsed.pizzaA;
      const nameB = pB ? pB.name.replace("Pizza ", "") : parsed.pizzaB;
      
      const boxPrice = BOX_PRICES[parsed.size] || 0;
      boxTotal += boxPrice * qty;

      itemsText += `• ${qty}x Media Pizza (${parsed.size}): mitad ${nameA} + mitad ${nameB}`;
      if (parsed.toppings && parsed.toppings.length > 0) {
        itemsText += `\n   Extras: ${parsed.toppings.join(", ")}`;
      }
      itemsText += ` - _${formatCOP(rowPrice)}_\n`;
    } else if (parsed.type === "pizza") {
      const p = PRODUCTS.find(p => p.id === parsed.productId);
      const name = p ? p.name.replace("Pizza ", "") : parsed.productId;
      
      const boxPrice = BOX_PRICES[parsed.size] || 0;
      boxTotal += boxPrice * qty;

      itemsText += `• ${qty}x Pizza ${name} (${parsed.size})`;
      if (parsed.toppings && parsed.toppings.length > 0) {
        itemsText += `\n   Extras: ${parsed.toppings.join(", ")}`;
      }
      itemsText += ` - _${formatCOP(rowPrice)}_\n`;
    } else if (parsed.type === "soda") {
      itemsText += `• ${qty}x Refresco ${parsed.flavor} (${parsed.size}) - _${formatCOP(rowPrice)}_\n`;
    } else {
      const p = PRODUCTS.find(p => p.id === parsed.productId);
      const name = p ? p.name : parsed.productId;
      itemsText += `• ${qty}x ${name} - _${formatCOP(rowPrice)}_\n`;
    }
  });

  const deliveryCost = selectedDeliveryMethod === "delivery" ? BUSINESS_SETTINGS.deliveryFee : 0;
  const grandTotal = subtotal + boxTotal + deliveryCost;

  // Build WhatsApp text body
  let msg = `📱 *NUEVO PEDIDO*\n`;
  msg += `-----------------------------------------\n\n`;
  if (selectedDeliveryMethod === "delivery") {
    msg += `📍 *Método de Entrega:* Delivery 🛵 (${BUSINESS_SETTINGS.deliveryLabel})\n`;
    msg += `🏠 *Dirección:* ${clientAddress}\n`;
  } else {
    msg += `📍 *Método de Entrega:* Retiro en Tienda (Pickup) 🛍️\n`;
  }
  if (orderNotes) {
    msg += `📝 *Instrucciones Especiales:* ${orderNotes}\n`;
  }
  msg += `\n`;
  msg += `🛒 *Detalle del Pedido:*\n`;
  msg += itemsText + `\n`;

  if (boxTotal > 0) {
    msg += `📦 *Cajas de Pizza:* ${formatCOP(boxTotal)}\n`;
  }
  if (selectedDeliveryMethod === "delivery") {
    msg += `*Entrega: Delivery (${BUSINESS_SETTINGS.deliveryLabel}):* ${formatCOP(deliveryCost)}\n`;
  } else {
    msg += `*Entrega: Retiro en tienda:* ${formatCOP(0)}\n`;
  }
  msg += `💵 *Total a Pagar:* ${formatCOP(grandTotal)}\n\n`;

  // Payment information
  if (selectedCurrency === "COP") {
    msg += `💵 *Método de Pago:* Pesos COP\n`;
  } else if (selectedCurrency === "USD") {
    msg += `💵 *Método de Pago:* Dólares USD - (Consulta tasa del día)\n`;
  } else if (selectedCurrency === "BS") {
    msg += `💵 *Método de Pago:* Bolívares (Bs) - (Consulta tasa del día)\n\n`;
    msg += `⚠️ *Nota:* Por favor, envíanos el capture de la transferencia o pago móvil para proceder con tu orden. ¡Muchas gracias!\n`;
  }

  msg += `\n📸 *Instagram:* @pizzarella5020\n`;
  msg += `-----------------------------------------\n`;
  msg += `📍 *Nota:* Recuerda enviarnos tu ubicación al WhatsApp.\n`;

  // Redirect to WhatsApp API endpoint
  const encodedText = encodeURIComponent(msg);
  const whatsappUrl = `https://wa.me/${BUSINESS_SETTINGS.phone}?text=${encodedText}`;

  window.location.href = whatsappUrl;
}

// Render dynamic Resumen mini-cart list
function renderMiniCart() {
  const container = document.getElementById("cart-items-list");
  if (!container) return;

  let html = "";
  let hasItems = false;

  Object.keys(cart).forEach(key => {
    const qty = cart[key];
    if (qty <= 0) return;

    hasItems = true;
    const parsed = parseCartKey(key);
    if (!parsed) return;

    let title = "";
    let extrasText = "";

    if (parsed.type === "half") {
      const pA = PRODUCTS.find(p => p.id === parsed.pizzaA);
      const pB = PRODUCTS.find(p => p.id === parsed.pizzaB);
      const nameA = pA ? pA.name.replace("Pizza ", "") : parsed.pizzaA;
      const nameB = pB ? pB.name.replace("Pizza ", "") : parsed.pizzaB;
      title = `Mitad ${nameA} / Mitad ${nameB} (${parsed.size})`;
      if (parsed.toppings && parsed.toppings.length > 0) {
        extrasText = `<div class="cart-item-extras" style="font-size: 0.72rem; color: var(--text-muted); margin-top: 2px; font-weight: 500;">Extras: ${parsed.toppings.join(", ")}</div>`;
      }
    } else if (parsed.type === "pizza") {
      const p = PRODUCTS.find(p => p.id === parsed.productId);
      const name = p ? p.name.replace("Pizza ", "") : parsed.productId;
      title = `Pizza ${name} (${parsed.size})`;
      if (parsed.toppings && parsed.toppings.length > 0) {
        extrasText = `<div class="cart-item-extras" style="font-size: 0.72rem; color: var(--text-muted); margin-top: 2px; font-weight: 500;">Extras: ${parsed.toppings.join(", ")}</div>`;
      }
    } else if (parsed.type === "soda") {
      title = `Refresco ${parsed.flavor} (${parsed.size})`;
    } else {
      const p = PRODUCTS.find(p => p.id === parsed.productId);
      title = p ? p.name : parsed.productId;
    }

    const unitPrice = getItemUnitPrice(parsed);
    const rowPrice = unitPrice * qty;

    html += `
      <div class="cart-item-row" data-key="${key}">
        <div class="cart-item-info" style="display: flex; flex-direction: column; align-items: flex-start;">
          <span class="cart-item-desc">${title}</span>
          ${extrasText}
        </div>
        <div class="cart-item-right">
          <span class="cart-item-price">${formatCOP(rowPrice)}</span>
          <div class="qty-controller mini-qty" style="display: flex; align-items: center; background-color: #e2e8f0; border-radius: 50px; padding: 2px; gap: 2px;">
            <button type="button" class="btn-qty btn-minus-mini" data-key="${key}">-</button>
            <span class="qty-val" style="font-size: 0.85rem; font-weight: 800; min-width: 20px; text-align: center;">${qty}</span>
            <button type="button" class="btn-qty btn-plus-mini" data-key="${key}">+</button>
          </div>
          <button type="button" class="btn-delete-item" data-key="${key}" title="Eliminar del pedido">🗑️</button>
        </div>
      </div>
    `;
  });

  if (hasItems) {
    container.innerHTML = html;
    container.style.display = "flex";
  } else {
    container.innerHTML = "";
    container.style.display = "none";
  }
}

// Inicializar la animación de carga premium de la pizza (con GSAP)
function initPizzaLoader() {
  if (typeof gsap === "undefined") {
    console.error("GSAP no está cargado");
    return;
  }

  gsap.config({ trialWarn: false });

  const select = s => document.querySelector(s);
  const toArray = s => gsap.utils.toArray(s);
  const pizzaSpinDuration = 4;
  const pizzaBase = select('#pizzaBase');
  if (!pizzaBase) return;
  const allIngredients = toArray('.ingredient');
  const allMushrooms = toArray('.mushroom');
  const allSalami = toArray('.salami');
  const allOlive = toArray('.olive');
  const allPeppers = toArray('.pepper');

  gsap.set('svg', {
    visibility: 'visible'
  });

  const pizzaProp = gsap.getProperty('#pizzaBase');

  function addToPizza(el) {
    const pizzaRot = pizzaProp('rotation');
    gsap.set(el, {
      rotation: 360 - pizzaRot,
      svgOrigin: '400 300'
    });
    pizzaBase.appendChild(el);
  }

  function reset() {
    allIngredients.forEach((c) => {
      const ingredientGroup = select('#ingredientGroup');
      if (ingredientGroup) {
        ingredientGroup.appendChild(c);
      }
      gsap.set(c, {
        rotation: 0,
        y: 0
      });
    });
    gsap.set('#egg .eggBits', {
      scale: 0,
      svgOrigin: '400 300'
    });
    gsap.set('#eggShine', {
      opacity: 0
    });
  }

  const tl = gsap.timeline({ repeat: -1, onRepeat: reset });

  tl.to('#pizzaBase', {
    duration: pizzaSpinDuration,
    rotation: -360,
    repeat: 2,
    svgOrigin: '400 300',
    ease: 'none'
  })
    .to('#egg', {
      duration: pizzaSpinDuration,
      rotation: -360,
      repeat: 2,
      ease: 'none'
    }, 0)
    .to(allMushrooms, {
      duration: 1.2,
      opacity: 1,
      y: '+=158',
      stagger: {
        each: pizzaSpinDuration / allMushrooms.length,
        onComplete: function () {
          addToPizza(this.targets()[0]);
        }
      },
      ease: 'power3.in'
    }, 0.47)
    .to(allPeppers, {
      opacity: 1,
      y: '+=200',
      stagger: {
        each: pizzaSpinDuration / allPeppers.length,
        onComplete: function () {
          addToPizza(this.targets()[0]);
        }
      },
      ease: 'power1.in'
    }, 1)
    .to(allSalami, {
      opacity: 1,
      y: '+=152',
      stagger: {
        each: pizzaSpinDuration / allSalami.length,
        onComplete: function () {
          addToPizza(this.targets()[0]);
        }
      },
      ease: 'power3.in'
    }, 1.5)
    .to(allOlive, {
      opacity: 1,
      y: '+=180',
      stagger: {
        each: pizzaSpinDuration / allOlive.length,
        onComplete: function () {
          addToPizza(this.targets()[0]);
        }
      },
      ease: 'power3.in'
    }, 0.78)
    .to('#egg .eggBits', {
      duration: 1,
      scale: 1,
      stagger: {
        amount: 0.2
      },
      ease: 'elastic(0.6, 0.5)'
    }, '-=4')
    .to('#eggShine', {
      opacity: 0.6,
    }, '-=3.65')
    .to('.ingredient, #egg, #eggShine', {
      opacity: 0
    }, '-=0.5');

  gsap.globalTimeline.timeScale(1.25);
  reset();
  tl.progress(0.1); // Adelantar la línea de tiempo al 10% al iniciar para evitar retrasos
}
