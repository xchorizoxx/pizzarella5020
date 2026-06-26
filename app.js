// Lógica de funcionamiento para Pizzarella5020

// Estado de la aplicación
const cart = {}; // Almacena { "productId_variant": cantidad } o { "productId_size_flavor": cantidad }
const activeVariants = {}; // Almacena { "productId": "size" } o { "productId": { size: "size", flavor: "flavor" } }
let selectedCurrency = "COP";

// Inicialización de la aplicación
document.addEventListener("DOMContentLoaded", () => {
  // Configuración del header
  document.getElementById("business-name").innerText = BUSINESS_SETTINGS.name;
  document.getElementById("footer-year").innerText = new Date().getFullYear();

  // Verificar horario de la tienda
  checkStoreStatus();

  // Renderizar catálogo
  renderPizzas();
  renderDrinks();

  // Escuchadores de eventos
  setupEventListeners();
  
  // Actualizar totales inicialmente
  updateTotals();
});

// Verificar si la tienda está abierta (Hora de Venezuela UTC-4)
function checkStoreStatus() {
  const now = new Date();
  
  // Convertir de forma confiable a la zona horaria de Caracas usando la API del navegador
  const vvzTimeString = now.toLocaleString("en-US", { timeZone: "America/Caracas" });
  const vvzTime = new Date(vvzTimeString);
  
  const day = vvzTime.getDay(); // 0: Dom, 1: Lun, 2: Mar, 3: Mie, 4: Jue, 5: Vie, 6: Sab
  const hour = vvzTime.getHours();
  const minute = vvzTime.getMinutes();
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

// Ocultar pantalla de carga al finalizar de cargar todos los recursos
window.addEventListener("load", () => {
  const loader = document.getElementById("loader");
  if (loader) {
    loader.classList.add("fade-out");
  }
});

// Formateador de moneda COP (Pesos Colombianos)
function formatCOP(value) {
  return `$${value.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

// Renderizar Pizzas (Paso 2)
function renderPizzas() {
  const container = document.getElementById("food-container");
  container.innerHTML = "";

  // Filtrar comidas (pizzas y cono pizza)
  const allComidas = PRODUCTS.filter(p => p.category === "comida");

  // Agrupar por subCategory
  const groups = {
    "Básicas": { title: "🍕 Pizzas Básicas", items: [] },
    "Especiales": { title: "✨ Pizzas Especiales", items: [] }
  };

  allComidas.forEach(p => {
    if (groups[p.subCategory]) {
      groups[p.subCategory].items.push(p);
    }
  });

  Object.keys(groups).forEach(groupKey => {
    const group = groups[groupKey];
    if (group.items.length === 0) return;

    // Renderizar encabezado de grupo (membrete)
    container.insertAdjacentHTML("beforeend", `
      <div class="subcategory-header">
        <span>${group.title}</span>
      </div>
    `);

    group.items.forEach(pizza => {
      let controlsHtml = "";
      let badgeHtml = "";

      if (pizza.isPizza) {
        // Por defecto, la variante activa inicial es PEQ
        activeVariants[pizza.id] = "PEQ";

        // Construcción del selector de tamaño (P, M, F, EF)
        let sizeButtonsHtml = "";
        pizza.variants.forEach(v => {
          const isActive = v.size === "PEQ" ? "active" : "";
          sizeButtonsHtml += `
            <button type="button" class="btn-size ${isActive}" data-id="${pizza.id}" data-size="${v.size}">
              ${v.label}
            </button>
          `;
        });

        controlsHtml = `
          <div class="size-selector">
            ${sizeButtonsHtml}
          </div>
          <div class="qty-controller">
            <button type="button" class="btn-qty btn-minus" data-id="${pizza.id}">-</button>
            <span class="qty-val" id="qty-val-${pizza.id}">0</span>
            <button type="button" class="btn-qty btn-plus" data-id="${pizza.id}">+</button>
          </div>
        `;

        // Las etiquetas de Básica o Especial ya no se mostrarán al lado del nombre
      } else {
        // Para cono pizza
        activeVariants[pizza.id] = "DEFAULT";
        controlsHtml = `
          <div></div> <!-- Espaciador -->
          <div class="qty-controller">
            <button type="button" class="btn-qty btn-minus" data-id="${pizza.id}">-</button>
            <span class="qty-val" id="qty-val-${pizza.id}">0</span>
            <button type="button" class="btn-qty btn-plus" data-id="${pizza.id}">+</button>
          </div>
        `;
      }

      const priceText = pizza.isPizza 
        ? formatCOP(pizza.variants.find(v => v.size === "PEQ").price)
        : formatCOP(pizza.price);

      const pizzaHtml = `
        <div class="product-item" id="product-${pizza.id}">
          <div class="product-top-row">
            <div class="product-img-frame">
              <img src="${pizza.logo}" alt="${pizza.name}" class="product-logo-img" id="logo-${pizza.id}">
            </div>
            <div class="product-info">
              <h3 class="product-name">${pizza.name}</h3>
              <p class="product-description">${pizza.description}</p>
              <span class="product-price-label" id="price-label-${pizza.id}">${priceText}</span>
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

// Renderizar Bebidas (Paso 3)
function renderDrinks() {
  const container = document.getElementById("drinks-container");
  container.innerHTML = "";

  const drinks = PRODUCTS.filter(p => p.category === "bebida");

  drinks.forEach(drink => {
    let controlsHtml = "";

    if (drink.isSoda) {
      // Por defecto, inicializamos la variante en BOTELLA y Coca-Cola
      activeVariants[drink.id] = { size: "BOTELLA", flavor: "Coca-Cola" };

      // Botones de tamaños de gaseosa (Botella, 1L, etc.) en forma de píldora
      let sizeButtonsHtml = "";
      drink.variants.forEach(v => {
        const isActive = v.size === "BOTELLA" ? "active" : "";
        sizeButtonsHtml += `
          <button type="button" class="btn-size ${isActive}" data-id="${drink.id}" data-size="${v.size}">
            ${v.label}
          </button>
        `;
      });

      // Botones de sabores de refrescos
      let flavorButtonsHtml = "";
      drink.flavors.forEach(f => {
        const isActive = f.name === "Coca-Cola" ? "active" : "";
        flavorButtonsHtml += `
          <button type="button" class="btn-flavor ${isActive}" data-id="${drink.id}" data-flavor="${f.name}">
            ${f.name}
          </button>
        `;
      });

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
        <div class="soda-qty-row">
          <span class="soda-control-label">Cantidad:</span>
          <div class="qty-controller">
            <button type="button" class="btn-qty btn-minus" data-id="${drink.id}">-</button>
            <span class="qty-val" id="qty-val-${drink.id}">0</span>
            <button type="button" class="btn-qty btn-plus" data-id="${drink.id}">+</button>
          </div>
        </div>
      `;
    } else {
      // Agua u otras sin variantes
      activeVariants[drink.id] = "DEFAULT";
      controlsHtml = `
        <div></div>
        <div class="qty-controller">
          <button type="button" class="btn-qty btn-minus" data-id="${drink.id}">-</button>
          <span class="qty-val" id="qty-val-${drink.id}">0</span>
          <button type="button" class="btn-qty btn-plus" data-id="${drink.id}">+</button>
        </div>
      `;
    }

    const drinkLogo = drink.isSoda ? drink.flavors[0].logo : drink.logo;
    const priceText = drink.isSoda 
      ? formatCOP(drink.variants.find(v => v.size === "BOTELLA").price)
      : formatCOP(drink.price);

    const drinkHtml = `
      <div class="product-item" id="product-${drink.id}">
        <div class="product-top-row">
          <div class="product-img-frame">
            <img src="${drinkLogo}" alt="${drink.name}" class="product-logo-img" id="logo-${drink.id}">
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
}

// Configurar escuchadores de eventos
function setupEventListeners() {
  // 1. Clic en los botones de tamaño (pizzas y refrescos)
  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("btn-size")) {
      const productId = e.target.getAttribute("data-id");
      const size = e.target.getAttribute("data-size");
      const product = PRODUCTS.find(p => p.id === productId);

      // Quitar clase activa de los otros botones de este producto y agregar al seleccionado
      const card = document.getElementById(`product-${productId}`);
      card.querySelectorAll(".btn-size").forEach(btn => {
        btn.classList.remove("active");
      });
      e.target.classList.add("active");

      let cartKey = "";
      let price = 0;

      if (product.isPizza) {
        activeVariants[productId] = size;
        cartKey = `${productId}_${size}`;
        price = product.variants.find(v => v.size === size).price;
      } else if (product.isSoda) {
        activeVariants[productId].size = size;
        const currentFlavor = activeVariants[productId].flavor;
        cartKey = `${productId}_${size}_${currentFlavor}`;
        price = product.variants.find(v => v.size === size).price;
      }

      // Actualizar precio de la tarjeta
      document.getElementById(`price-label-${productId}`).innerText = formatCOP(price);

      // Actualizar cantidad mostrada en pantalla para esta variante
      const qty = cart[cartKey] || 0;
      document.getElementById(`qty-val-${productId}`).innerText = qty;

      updateCardSelectedState(productId);
    }
  });

  // 2. Clic en los botones de sabores de refrescos
  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("btn-flavor")) {
      const productId = e.target.getAttribute("data-id");
      const flavorName = e.target.getAttribute("data-flavor");
      const product = PRODUCTS.find(p => p.id === productId);

      // Actualizar sabor activo
      activeVariants[productId].flavor = flavorName;

      // Quitar clase activa de los otros botones de sabor de este producto y agregar al seleccionado
      const card = document.getElementById(`product-${productId}`);
      card.querySelectorAll(".btn-flavor").forEach(btn => {
        btn.classList.remove("active");
      });
      e.target.classList.add("active");

      // Actualizar imagen del logo según el sabor elegido
      const flavorData = product.flavors.find(f => f.name === flavorName);
      if (flavorData) {
        document.getElementById(`logo-${productId}`).src = flavorData.logo;
      }

      // Actualizar cantidad mostrada en pantalla para este sabor y tamaño
      const currentSize = activeVariants[productId].size;
      const cartKey = `${productId}_${currentSize}_${flavorName}`;
      const qty = cart[cartKey] || 0;
      document.getElementById(`qty-val-${productId}`).innerText = qty;

      updateCardSelectedState(productId);
    }
  });

  // 3. Botones de + y - para agregar/quitar del carrito
  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("btn-plus")) {
      const productId = e.target.getAttribute("data-id");
      adjustQuantity(productId, 1);
    } else if (e.target.classList.contains("btn-minus")) {
      const productId = e.target.getAttribute("data-id");
      adjustQuantity(productId, -1);
    }
  });

  // 4. Enviar pedido
  document.getElementById("btn-submit").addEventListener("click", submitOrder);

  // 5. Ocultar errores al escribir
  document.getElementById("client-name").addEventListener("input", hideErrorMessage);
  document.getElementById("client-address").addEventListener("input", hideErrorMessage);

  // 6. Eliminar artículo desde la lista resumida (papelera)
  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("btn-delete-item") || e.target.closest(".btn-delete-item")) {
      const btn = e.target.classList.contains("btn-delete-item") ? e.target : e.target.closest(".btn-delete-item");
      const key = btn.getAttribute("data-key");

      // Eliminar del carrito
      delete cart[key];

      // Buscar el ID del producto
      const parts = key.split("_");
      const productId = parts[0];
      const product = PRODUCTS.find(p => p.id === productId);

      // Si la variante que acabamos de borrar es la que está activa actualmente en la tarjeta del producto,
      // actualizamos el contador en pantalla a 0
      let activeKey = "";
      if (product.isPizza) {
        const size = activeVariants[productId] || "PEQ";
        activeKey = `${productId}_${size}`;
      } else if (product.isSoda) {
        const size = activeVariants[productId].size;
        const flavor = activeVariants[productId].flavor;
        activeKey = `${productId}_${size}_${flavor}`;
      } else {
        activeKey = `${productId}_DEFAULT`;
      }

      if (activeKey === key) {
        document.getElementById(`qty-val-${productId}`).innerText = "0";
      }

      updateCardSelectedState(productId);
      updateTotals();
    }
  });

  // 7. Clic en los botones de método de pago
  const paymentButtons = document.querySelectorAll(".btn-payment");
  paymentButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      paymentButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      selectedCurrency = btn.getAttribute("data-currency");
    });
  });
}

// Modificar cantidad de la variante activa de un producto
function adjustQuantity(productId, change) {
  const product = PRODUCTS.find(p => p.id === productId);
  let cartKey = "";

  if (product.isPizza) {
    const size = activeVariants[productId] || "PEQ";
    cartKey = `${productId}_${size}`;
  } else if (product.isSoda) {
    const size = activeVariants[productId].size;
    const flavor = activeVariants[productId].flavor;
    cartKey = `${productId}_${size}_${flavor}`;
  } else {
    cartKey = `${productId}_DEFAULT`;
  }
  
  const currentQty = cart[cartKey] || 0;
  const newQty = currentQty + change;

  if (newQty <= 0) {
    delete cart[cartKey];
    document.getElementById(`qty-val-${productId}`).innerText = "0";
  } else {
    cart[cartKey] = newQty;
    document.getElementById(`qty-val-${productId}`).innerText = newQty;
  }

  updateCardSelectedState(productId);
  updateTotals();
}

// Actualizar si una tarjeta de producto se muestra seleccionada en el UI
function updateCardSelectedState(productId) {
  const card = document.getElementById(`product-${productId}`);
  
  // Sumamos la cantidad de todas las variantes de este producto
  let totalQty = 0;
  Object.keys(cart).forEach(key => {
    if (key.startsWith(`${productId}_`)) {
      totalQty += cart[key];
    }
  });

  if (totalQty > 0) {
    card.classList.add("selected");
  } else {
    card.classList.remove("selected");
  }
}

let errorTimeout;
function showError(msg) {
  const errorMessage = document.getElementById("error-message");
  errorMessage.innerText = msg;
  errorMessage.style.display = "block";
  clearTimeout(errorTimeout);
  errorTimeout = setTimeout(() => {
    errorMessage.style.display = "none";
  }, 4000);
}

function hideErrorMessage() {
  document.getElementById("error-message").style.display = "none";
}

// Calcular totales de productos, cajas y delivery
function updateTotals() {
  let subtotal = 0;
  let boxTotal = 0;
  let hasItems = false;

  Object.keys(cart).forEach(key => {
    const parts = key.split("_");
    const productId = parts[0];
    const qty = cart[key];

    if (qty > 0) {
      hasItems = true;
      const product = PRODUCTS.find(p => p.id === productId);

      if (product) {
        if (product.isPizza) {
          const size = parts[1];
          const sizeVariant = product.variants.find(v => v.size === size);
          if (sizeVariant) {
            subtotal += sizeVariant.price * qty;
            boxTotal += sizeVariant.boxPrice * qty; // Cajas de pizza según tamaño
          }
        } else if (product.isSoda) {
          const size = parts[1];
          const sizeVariant = product.variants.find(v => v.size === size);
          if (sizeVariant) {
            subtotal += sizeVariant.price * qty;
          }
        } else {
          // Agua o Cono Pizza
          subtotal += product.price * qty;
        }
      }
    }
  });

  // Costo del delivery
  const deliveryCost = hasItems ? BUSINESS_SETTINGS.deliveryFee : 0;
  const total = subtotal + boxTotal + deliveryCost;

  // Actualizar UI
  document.getElementById("summary-subtotal").innerText = formatCOP(subtotal);
  document.getElementById("summary-boxes").innerText = formatCOP(boxTotal);
  document.getElementById("summary-delivery").innerText = formatCOP(deliveryCost);
  document.getElementById("summary-total").innerText = formatCOP(total);

  // Renderizar la lista resumida del carrito
  renderMiniCart();
}

// Validar y enviar pedido a WhatsApp
function submitOrder() {
  const nameInput = document.getElementById("client-name");
  const addressInput = document.getElementById("client-address");
  const notesInput = document.getElementById("order-notes");
  const errorMessage = document.getElementById("error-message");

  const clientName = nameInput.value.trim();
  const clientAddress = addressInput.value.trim();
  const orderNotes = notesInput ? notesInput.value.trim() : "";

  // 1. Validar nombre
  if (!clientName) {
    showError("⚠️ Por favor, introduce tu nombre para continuar.");
    nameInput.focus();
    nameInput.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }

  // 2. Validar que haya productos
  const cartSize = Object.keys(cart).length;
  if (cartSize === 0) {
    showError("⚠️ El carrito está vacío. Por favor agrega al menos una pizza o bebida.");
    return;
  }

  // 3. Validar dirección/indicaciones
  if (!clientAddress) {
    showError("⚠️ Por favor, escribe las indicaciones o dirección para la entrega.");
    addressInput.focus();
    addressInput.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }

  hideErrorMessage();

  // 4. Formatear mensaje
  let subtotal = 0;
  let boxTotal = 0;
  let itemsText = "";

  Object.keys(cart).forEach(key => {
    const parts = key.split("_");
    const productId = parts[0];
    const qty = cart[key];

    const product = PRODUCTS.find(p => p.id === productId);

    if (product && qty > 0) {
      if (product.isPizza) {
        const size = parts[1];
        const sizeVariant = product.variants.find(v => v.size === size);
        if (sizeVariant) {
          const itemTotal = sizeVariant.price * qty;
          subtotal += itemTotal;
          boxTotal += sizeVariant.boxPrice * qty;

          itemsText += `• ${qty} Pizza ${product.name.replace("Pizza ", "")} (${size}) - _${formatCOP(itemTotal)}_\n`;
        }
      } else if (product.isSoda) {
        const size = parts[1];
        const flavor = parts[2];
        const sizeVariant = product.variants.find(v => v.size === size);
        if (sizeVariant) {
          const itemTotal = sizeVariant.price * qty;
          subtotal += itemTotal;
          itemsText += `• ${qty} Refresco ${size} (${flavor}) - _${formatCOP(itemTotal)}_\n`;
        }
      } else {
        const itemTotal = product.price * qty;
        subtotal += itemTotal;
        itemsText += `• ${qty} ${product.name} - _${formatCOP(itemTotal)}_\n`;
      }
    }
  });

  const deliveryCost = BUSINESS_SETTINGS.deliveryFee;
  const grandTotal = subtotal + boxTotal + deliveryCost;

  // Armado del mensaje de WhatsApp
  let msg = `📱 *NUEVO PEDIDO - ${BUSINESS_SETTINGS.name}*\n`;
  msg += `-----------------------------------------\n\n`;
  msg += `👤 *Cliente:* ${clientName}\n`;
  msg += `📍 *Dirección / Indicaciones:* ${clientAddress}\n`;
  if (orderNotes) {
    msg += `📝 *Instrucciones Especiales:* ${orderNotes}\n`;
  }
  msg += `\n`;
  msg += `🛒 *Detalle del Pedido:*\n`;
  msg += itemsText + `\n`;
  
  if (boxTotal > 0) {
    msg += `📦 *Cajas de Pizza:* ${formatCOP(boxTotal)}\n`;
  }
  msg += `🛵 *Envío en Moto:* ${formatCOP(deliveryCost)}\n`;
  msg += `💵 *Total a Pagar:* ${formatCOP(grandTotal)}\n\n`;

  // Información del método de pago
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

  // Enlace y redirección
  const encodedText = encodeURIComponent(msg);
  const whatsappUrl = `https://wa.me/${BUSINESS_SETTINGS.phone}?text=${encodedText}`;

  window.location.href = whatsappUrl;
}

// Renderizar la lista simplificada del carrito en el resumen (Paso 5) con la papelera
function renderMiniCart() {
  const container = document.getElementById("cart-items-list");
  if (!container) return;

  let html = "";
  let hasItems = false;

  Object.keys(cart).forEach(key => {
    const qty = cart[key];
    if (qty <= 0) return;

    hasItems = true;
    const parts = key.split("_");
    const productId = parts[0];
    const product = PRODUCTS.find(p => p.id === productId);

    if (product) {
      let desc = "";
      let price = 0;

      if (product.isPizza) {
        const size = parts[1];
        const sizeVariant = product.variants.find(v => v.size === size);
        if (sizeVariant) {
          desc = `${qty}x Pizza ${product.name.replace("Pizza ", "")} (${sizeVariant.size})`;
          price = sizeVariant.price * qty;
        }
      } else if (product.isSoda) {
        const size = parts[1];
        const flavor = parts[2];
        const sizeVariant = product.variants.find(v => v.size === size);
        if (sizeVariant) {
          desc = `${qty}x Refresco ${size} [${flavor}]`;
          price = sizeVariant.price * qty;
        }
      } else {
        desc = `${qty}x ${product.name}`;
        price = product.price * qty;
      }

      html += `
        <div class="cart-item-row">
          <span class="cart-item-desc">${desc}</span>
          <div class="cart-item-right">
            <span class="cart-item-price">${formatCOP(price)}</span>
            <button type="button" class="btn-delete-item" data-key="${key}" title="Eliminar del pedido">🗑️</button>
          </div>
        </div>
      `;
    }
  });

  if (hasItems) {
    container.innerHTML = html;
    container.style.display = "flex";
  } else {
    container.innerHTML = "";
    container.style.display = "none";
  }
}
