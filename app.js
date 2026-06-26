// Lógica de funcionamiento para Pizzarella5020

// Estado de la aplicación
const cart = {}; // Almacena { "productId_variant": cantidad } o { "productId_size_flavor": cantidad }
const activeVariants = {}; // Almacena { "productId": "size" } o { "productId": { size: "size", flavor: "flavor" } }
let selectedCurrency = "COP";
let selectedDeliveryMethod = "delivery";

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
    if (p.subCategory && groups[p.subCategory]) {
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
        // Por defecto, la variante activa inicial es la primera disponible
        const defaultSize = pizza.variants[0].size;
        activeVariants[pizza.id] = defaultSize;

        // Construcción del selector de tamaño (P, M, F, EF)
        let sizeButtonsHtml = "";
        pizza.variants.forEach(v => {
          const isActive = v.size === defaultSize ? "active" : "";
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
        ? formatCOP(pizza.variants[0].price)
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
      // Por defecto, inicializamos la variante con la primera talla y sabor disponible
      const defaultSize = (drink.variants && drink.variants[0]) ? drink.variants[0].size : "BOTELLA";
      const defaultFlavor = (drink.flavors && drink.flavors[0]) ? drink.flavors[0].name : "Coca-Cola";
      activeVariants[drink.id] = { size: defaultSize, flavor: defaultFlavor };

      // Botones de tamaños de gaseosa (Botella, 1L, etc.) en forma de píldora
      let sizeButtonsHtml = "";
      if (drink.variants) {
        drink.variants.forEach(v => {
          const isActive = v.size === defaultSize ? "active" : "";
          sizeButtonsHtml += `
            <button type="button" class="btn-size ${isActive}" data-id="${drink.id}" data-size="${v.size}" id="btn-size-${drink.id}-${v.size}">
              ${v.label}
            </button>
          `;
        });
      }

      // Botones de sabores de refrescos
      let flavorButtonsHtml = "";
      if (drink.flavors) {
        drink.flavors.forEach(f => {
          const isActive = f.name === defaultFlavor ? "active" : "";
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
      ? formatCOP(drink.variants[0].price)
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

  // Actualizar visibilidad de tamaños según el sabor inicial de cada soda
  drinks.forEach(drink => {
    if (drink.isSoda) updateSodaSizesVisibility(drink.id);
  });
}

// Actualizar la visibilidad de los tamaños de gaseosa según el sabor elegido
function updateSodaSizesVisibility(productId) {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product || !product.isSoda) return;

  const currentFlavor = activeVariants[productId].flavor;
  const allowedFlavorsFor2_5L = ["Coca-Cola", "Pepsi", "Manzana"];

  const button2_5L = document.getElementById(`btn-size-${productId}-2.5L`);
  if (button2_5L) {
    if (allowedFlavorsFor2_5L.includes(currentFlavor)) {
      button2_5L.style.display = "inline-flex";
    } else {
      button2_5L.style.display = "none";
      // Si la opción seleccionada actualmente era 2.5L, la cambiamos a 2L
      if (activeVariants[productId].size === "2.5L") {
        const button2L = document.getElementById(`btn-size-${productId}-2L`);
        if (button2L) {
          button2L.click();
        }
      }
    }
  }
}

// Configurar escuchadores de eventos
function setupEventListeners() {
  // 1. Clic en los botones de tamaño (pizzas y refrescos)
  document.addEventListener("click", (e) => {
    const btnSize = e.target.closest(".btn-size");
    if (btnSize) {
      const productId = btnSize.getAttribute("data-id");
      const size = btnSize.getAttribute("data-size");
      const product = PRODUCTS.find(p => p.id === productId);

      // Quitar clase activa de los otros botones de este producto y agregar al seleccionado
      const card = document.getElementById(`product-${productId}`);
      card.querySelectorAll(".btn-size").forEach(btn => {
        btn.classList.remove("active");
      });
      btnSize.classList.add("active");

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
    const btnFlavor = e.target.closest(".btn-flavor");
    if (btnFlavor) {
      const productId = btnFlavor.getAttribute("data-id");
      const flavorName = btnFlavor.getAttribute("data-flavor");
      const product = PRODUCTS.find(p => p.id === productId);

      // Actualizar sabor activo
      activeVariants[productId].flavor = flavorName;

      // Quitar clase activa de los otros botones de sabor de este producto y agregar al seleccionado
      const card = document.getElementById(`product-${productId}`);
      card.querySelectorAll(".btn-flavor").forEach(btn => {
        btn.classList.remove("active");
      });
      btnFlavor.classList.add("active");

      // Actualizar imagen del logo según el sabor elegido
      const flavorData = product.flavors.find(f => f.name === flavorName);
      if (flavorData) {
        document.getElementById(`logo-${productId}`).src = flavorData.logo;
      }

      // Actualizar visibilidad de tamaños de refresco según el sabor elegido
      updateSodaSizesVisibility(productId);

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
    const btnPlus = e.target.closest(".btn-plus");
    const btnMinus = e.target.closest(".btn-minus");
    if (btnPlus) {
      const productId = btnPlus.getAttribute("data-id");
      adjustQuantity(productId, 1);
    } else if (btnMinus) {
      const productId = btnMinus.getAttribute("data-id");
      adjustQuantity(productId, -1);
    }
  });

  // 4. Enviar pedido
  document.getElementById("btn-submit").addEventListener("click", submitOrder);

  // 5. Ocultar errores al escribir
  const clientAddressInput = document.getElementById("client-address");
  if (clientAddressInput) {
    clientAddressInput.addEventListener("input", hideErrorMessage);
  }

  // 6. Eliminar artículo desde la lista resumida (papelera)
  document.addEventListener("click", (e) => {
    const btnDelete = e.target.closest(".btn-delete-item");
    if (btnDelete) {
      const key = btnDelete.getAttribute("data-key");

      // Eliminar del carrito
      delete cart[key];

      // Buscar el ID del producto
      const parts = key.split("_");
      const productId = parts[0];
      const product = PRODUCTS.find(p => p.id === productId);

      // Si la variante que acabamos de borrar es la que está activa actualmente en la tarjeta del producto,
      // actualizamos el contador en pantalla a 0
      if (product) {
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

  // 8. Clic en los botones de método de entrega (Delivery / Pickup)
  const deliveryButtons = document.querySelectorAll(".btn-delivery-option");
  deliveryButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      deliveryButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      selectedDeliveryMethod = btn.getAttribute("data-method");

      const addressContainer = document.getElementById("address-container");
      if (selectedDeliveryMethod === "delivery") {
        addressContainer.style.display = "block";
      } else {
        addressContainer.style.display = "none";
      }

      updateTotals();
    });
  });
}

// Modificar cantidad de la variante activa de un producto
function adjustQuantity(productId, change) {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return;
  let cartKey = "";

  if (product.isPizza) {
    const size = activeVariants[productId] || "PEQ";
    cartKey = `${productId}_${size}`;
  } else if (product.isSoda) {
    const variantObj = activeVariants[productId] || {};
    const size = variantObj.size || "BOTELLA";
    const flavor = variantObj.flavor || "Coca-Cola";
    cartKey = `${productId}_${size}_${flavor}`;
  } else {
    cartKey = `${productId}_DEFAULT`;
  }

  const currentQty = cart[cartKey] || 0;
  const newQty = currentQty + change;

  if (newQty <= 0) {
    delete cart[cartKey];
    const qtyElement = document.getElementById(`qty-val-${productId}`);
    if (qtyElement) qtyElement.innerText = "0";
  } else {
    cart[cartKey] = newQty;
    const qtyElement = document.getElementById(`qty-val-${productId}`);
    if (qtyElement) qtyElement.innerText = newQty;
  }

  updateCardSelectedState(productId);
  updateTotals();
}

// Actualizar si una tarjeta de producto se muestra seleccionada en el UI
function updateCardSelectedState(productId) {
  const card = document.getElementById(`product-${productId}`);
  if (!card) return;

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
          if (product.variants) {
            const sizeVariant = product.variants.find(v => v.size === size);
            if (sizeVariant) {
              subtotal += (sizeVariant.price || 0) * qty;
              const boxPrice = BOX_PRICES[size] || 0;
              boxTotal += boxPrice * qty; // Cajas de pizza según tamaño
            }
          }
        } else if (product.isSoda) {
          const size = parts[1];
          if (product.variants) {
            const sizeVariant = product.variants.find(v => v.size === size);
            if (sizeVariant) {
              subtotal += (sizeVariant.price || 0) * qty;
            }
          }
        } else {
          // Agua o Cono Pizza
          subtotal += (product.price || 0) * qty;
        }
      }
    }
  });

  // Costo del delivery
  const deliveryCost = (hasItems && selectedDeliveryMethod === "delivery") ? BUSINESS_SETTINGS.deliveryFee : 0;
  const total = subtotal + boxTotal + deliveryCost;

  // Actualizar UI
  document.getElementById("summary-subtotal").innerText = formatCOP(subtotal);
  document.getElementById("summary-boxes").innerText = formatCOP(boxTotal);
  const deliveryLabel = document.getElementById("summary-delivery-label");
  const deliveryVal = document.getElementById("summary-delivery");
  if (selectedDeliveryMethod === "pickup") {
    if (deliveryLabel) deliveryLabel.innerText = "Entrega: Retiro en tienda";
    if (deliveryVal) deliveryVal.innerText = formatCOP(0);
  } else {
    if (deliveryLabel) deliveryLabel.innerText = "Entrega: Delivery";
    if (deliveryVal) deliveryVal.innerText = formatCOP(deliveryCost);
  }
  document.getElementById("summary-total").innerText = formatCOP(total);
  // Renderizar la lista resumida del carrito
  renderMiniCart();
}

// Validar y enviar pedido a WhatsApp
function submitOrder() {
  const addressInput = document.getElementById("client-address");
  const notesInput = document.getElementById("order-notes");

  const clientAddress = addressInput ? addressInput.value.trim() : "";
  const orderNotes = notesInput ? notesInput.value.trim() : "";

  // 1. Validar que haya productos
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

  // 2. Validar dirección/indicaciones (solo si es Delivery)
  if (selectedDeliveryMethod === "delivery" && !clientAddress) {
    showError("⚠️ Por favor, escribe las indicaciones o dirección para la entrega.");
    if (addressInput) {
      addressInput.focus();
      addressInput.scrollIntoView({ behavior: "smooth", block: "center" });
    }
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
        if (product.variants) {
          const sizeVariant = product.variants.find(v => v.size === size);
          if (sizeVariant) {
            const itemTotal = (sizeVariant.price || 0) * qty;
            subtotal += itemTotal;
            const boxPrice = BOX_PRICES[size] || 0;
            boxTotal += boxPrice * qty;

            itemsText += `• ${qty} Pizza ${product.name.replace("Pizza ", "")} (${size}) - _${formatCOP(itemTotal)}_\n`;
          }
        }
      } else if (product.isSoda) {
        const size = parts[1];
        const flavor = parts[2];
        if (product.variants) {
          const sizeVariant = product.variants.find(v => v.size === size);
          if (sizeVariant) {
            const itemTotal = (sizeVariant.price || 0) * qty;
            subtotal += itemTotal;
            itemsText += `• ${qty} Refresco ${size} (${flavor}) - _${formatCOP(itemTotal)}_\n`;
          }
        }
      } else {
        const itemTotal = (product.price || 0) * qty;
        subtotal += itemTotal;
        itemsText += `• ${qty} ${product.name} - _${formatCOP(itemTotal)}_\n`;
      }
    }
  });

  const deliveryCost = selectedDeliveryMethod === "delivery" ? BUSINESS_SETTINGS.deliveryFee : 0;
  const grandTotal = subtotal + boxTotal + deliveryCost;

  // Armado del mensaje de WhatsApp
  let msg = `📱 *NUEVO PEDIDO*\n`;
  msg += `-----------------------------------------\n\n`;
  if (selectedDeliveryMethod === "delivery") {
    msg += `📍 *Método de Entrega:* Delivery 🛵\n`;
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
    msg += `*Entrega: Delivery:* ${formatCOP(deliveryCost)}\n`;
  } else {
    msg += `*Entrega: Retiro en tienda:* ${formatCOP(0)}\n`;
  }
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

  // Usar window.location.href para evitar bloqueadores de popups
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
        if (product.variants) {
          const sizeVariant = product.variants.find(v => v.size === size);
          if (sizeVariant) {
            desc = `${qty}x Pizza ${product.name.replace("Pizza ", "")} (${sizeVariant.size})`;
            price = (sizeVariant.price || 0) * qty;
          }
        }
      } else if (product.isSoda) {
        const size = parts[1];
        const flavor = parts[2];
        if (product.variants) {
          const sizeVariant = product.variants.find(v => v.size === size);
          if (sizeVariant) {
            desc = `${qty}x Refresco ${size} [${flavor}]`;
            price = (sizeVariant.price || 0) * qty;
          }
        }
      } else {
        desc = `${qty}x ${product.name}`;
        price = (product.price || 0) * qty;
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
