// Base de datos de productos y configuraciones para Pizzarella5020

const BUSINESS_SETTINGS = {
  name: "Pizzarella5020",
  phone: "584126514537", // <-- Número real del delivery configurado
  currency: "COP",
  deliveryFee: 4000,
  deliveryLabel: "Zona Central"
};

// Precios globales de cajas de pizza según su tamaño
const BOX_PRICES = {
  "PEQ": 2000,
  "MED": 3000,
  "FAM": 3000,
  "EXT": 3000
};

// Tamaños que permiten combinación de media pizza (mitad y mitad)
const HALF_PIZZA_SIZES = ["MED", "FAM", "EXT"];

// Adicionales / Toppings extra
const TOPPINGS = {
  basicos: {
    price: 5000,
    label: "Básicos ($5,000 c/u)",
    items: ["Aceitunas", "Maíz", "Champiñones", "Anchoas", "Jamón"]
  },
  especiales: {
    price: 7000,
    label: "Especiales ($7,000 c/u)",
    items: ["Salami", "Pepperoni", "Tocineta", "Pollo"]
  }
};

// Sabores de refrescos disponibles con tamaños permitidos
const SODA_FLAVORS = [
  { name: "Coca-Cola", logo: "logos/soda_3.png", allowedSizes: ["1L", "2L"] },
  { name: "Colita", logo: "logos/soda_11.png", allowedSizes: ["1L", "2L"] },
  { name: "Manzana", logo: "logos/soda_7.png", allowedSizes: ["1L", "2L"] },
  { name: "Piña", logo: "logos/soda_12.png", allowedSizes: ["1L", "2L"] },
  { name: "Uva", logo: "logos/soda_1.png", allowedSizes: ["1L", "2L"] }
];

const PRODUCTS = [
  // --- PIZZAS BÁSICAS ---
  {
    id: "napolitana",
    name: "Pizza Napolitana",
    category: "comida",
    subCategory: "Básicas",
    description: "Salsa de la casa, mozzarella.",
    logo: "logos/pizza_1.png",
    isPizza: true,
    variants: [
      { size: "PEQ", label: "P", name: "PEQ (24CM)", price: 13000 },
      { size: "MED", label: "M", name: "MED (30CM)", price: 17000 },
      { size: "FAM", label: "F", name: "FAM (40CM)", price: 28000 },
      { size: "EXT", label: "EF", name: "EXT FAM", price: 34000 }
    ]
  },
  {
    id: "basica",
    name: "Pizza Básica",
    category: "comida",
    subCategory: "Básicas",
    description: "Salsa de la casa, mozzarella, + ingrediente a elección.",
    logo: "logos/pizza_2.png",
    isPizza: true,
    variants: [
      { size: "PEQ", label: "P", name: "PEQ (24CM)", price: 17000 },
      { size: "MED", label: "M", name: "MED (30CM)", price: 22000 },
      { size: "FAM", label: "F", name: "FAM (40CM)", price: 38000 },
      { size: "EXT", label: "EF", name: "EXT FAM", price: 44000 }
    ]
  },
  {
    id: "suprema",
    name: "Pizza Suprema",
    category: "comida",
    subCategory: "Básicas",
    description: "Salsa de la casa, mozzarella, salchicha, cebolla caramelizada.",
    logo: "logos/pizza_6.png",
    isPizza: true,
    variants: [
      { size: "PEQ", label: "P", name: "PEQ (24CM)", price: 19000 },
      { size: "MED", label: "M", name: "MED (30CM)", price: 24000 },
      { size: "FAM", label: "F", name: "FAM (40CM)", price: 37000 },
      { size: "EXT", label: "EF", name: "EXT FAM", price: 43000 }
    ]
  },
  {
    id: "hawaiana",
    name: "Pizza Hawaiana",
    category: "comida",
    subCategory: "Básicas",
    description: "Salsa de la casa, mozzarella, tocineta, piña (bocadillo opcional).",
    logo: "logos/pizza_7.png",
    isPizza: true,
    variants: [
      { size: "PEQ", label: "P", name: "PEQ (24CM)", price: 19000 },
      { size: "MED", label: "M", name: "MED (30CM)", price: 24000 },
      { size: "FAM", label: "F", name: "FAM (40CM)", price: 42000 },
      { size: "EXT", label: "EF", name: "EXT FAM", price: 48000 }
    ]
  },
  {
    id: "toscana",
    name: "Pizza Toscana",
    category: "comida",
    subCategory: "Básicas",
    description: "Salsa de la casa, mozzarella, pepperoni, cebolla.",
    logo: "logos/pizza_3.png",
    isPizza: true,
    variants: [
      { size: "PEQ", label: "P", name: "PEQ (24CM)", price: 20000 },
      { size: "MED", label: "M", name: "MED (30CM)", price: 25000 },
      { size: "FAM", label: "F", name: "FAM (40CM)", price: 38000 },
      { size: "EXT", label: "EF", name: "EXT FAM", price: 44000 }
    ]
  },

  // --- PIZZAS ESPECIALES ---
  {
    id: "granjera",
    name: "Pizza Granjera",
    category: "comida",
    subCategory: "Especiales",
    description: "Salsa de la casa, mozzarella, jamón, pollo, maíz.",
    logo: "logos/pizza_5.png",
    isPizza: true,
    variants: [
      { size: "PEQ", label: "P", name: "PEQ (24CM)", price: 22000 },
      { size: "MED", label: "M", name: "MED (30CM)", price: 27000 },
      { size: "FAM", label: "F", name: "FAM (40CM)", price: 45000 },
      { size: "EXT", label: "EF", name: "EXT FAM", price: 51000 }
    ]
  },
  {
    id: "siciliana",
    name: "Pizza Siciliana",
    category: "comida",
    subCategory: "Especiales",
    description: "Salsa de la casa, mozzarella, jamón, tocineta, salami.",
    logo: "logos/pizza_4.png",
    isPizza: true,
    variants: [
      { size: "PEQ", label: "P", name: "PEQ (24CM)", price: 24000 },
      { size: "MED", label: "M", name: "MED (30CM)", price: 32000 },
      { size: "FAM", label: "F", name: "FAM (40CM)", price: 55000 },
      { size: "EXT", label: "EF", name: "EXT FAM", price: 61000 }
    ]
  },
  {
    id: "vegetariana",
    name: "Pizza Vegetariana",
    category: "comida",
    subCategory: "Especiales",
    description: "Salsa de la casa, mozzarella, maíz, cebolla, pimentón, champiñones, aceitunas.",
    logo: "logos/pizza_8.png",
    isPizza: true,
    variants: [
      { size: "PEQ", label: "P", name: "PEQ (24CM)", price: 20000 },
      { size: "MED", label: "M", name: "MED (30CM)", price: 25000 },
      { size: "FAM", label: "F", name: "FAM (40CM)", price: 40000 },
      { size: "EXT", label: "EF", name: "EXT FAM", price: 46000 }
    ]
  },
  {
    id: "diavola",
    name: "Pizza Diavola",
    category: "comida",
    subCategory: "Especiales",
    description: "Salsa de la casa, mozzarella, pepperoni, aceitunas, champiñones, pimentón.",
    logo: "logos/pizza_9.png",
    isPizza: true,
    variants: [
      { size: "PEQ", label: "P", name: "PEQ (24CM)", price: 24000 },
      { size: "MED", label: "M", name: "MED (30CM)", price: 32000 },
      { size: "FAM", label: "F", name: "FAM (40CM)", price: 55000 },
      { size: "EXT", label: "EF", name: "EXT FAM", price: 61000 }
    ]
  },
  {
    id: "puglia",
    name: "Pizza Puglia",
    category: "comida",
    subCategory: "Especiales",
    description: "Salsa de la casa, mozzarella, anchoas, pepperoni, aceitunas.",
    logo: "logos/pizza_3.png",
    isPizza: true,
    variants: [
      { size: "PEQ", label: "P", name: "PEQ (24CM)", price: 20000 },
      { size: "MED", label: "M", name: "MED (30CM)", price: 28000 },
      { size: "FAM", label: "F", name: "FAM (40CM)", price: 45000 },
      { size: "EXT", label: "EF", name: "EXT FAM", price: 51000 }
    ]
  },
  {
    id: "pizzarella",
    name: "Pizza Pizzarella",
    category: "comida",
    subCategory: "Especiales",
    description: "Salsa de la casa, mozzarella, + 5 ingredientes a tu elección.",
    logo: "logos/pizza_2.png",
    isPizza: true,
    variants: [
      { size: "PEQ", label: "P", name: "PEQ (24CM)", price: 28000 },
      { size: "MED", label: "M", name: "MED (30CM)", price: 38000 },
      { size: "FAM", label: "F", name: "FAM (40CM)", price: 60000 },
      { size: "EXT", label: "EF", name: "EXT FAM", price: 66000 }
    ]
  },
  
  // --- CONO PIZZA ---
  {
    id: "conopizza",
    name: "Cono Pizza",
    category: "comida",
    subCategory: "Especiales",
    description: "Salsa de la casa, mozzarella, pollo, tocineta, pimentón. (Solo Fines de Semana)",
    logo: "logos/pizza_1.png",
    price: 6000,
    isPizza: false
  },

  // --- BEBIDAS ---
  {
    id: "agua",
    name: "Agua",
    category: "bebida",
    description: "Agua mineral purificada.",
    logo: "logos/soda_9.png",
    price: 2000,
    isSoda: false
  },
  {
    id: "refresco",
    name: "Refresco Gaseosa",
    category: "bebida",
    description: "Elige el tamaño de tu gaseosa y tu sabor preferido.",
    logo: "logos/soda_3.png", // Coca-Cola por defecto
    isSoda: true,
    flavors: SODA_FLAVORS,
    variants: [
      { size: "1L", label: "1L", name: "Gaseosa 1 Litro", price: 5000 },
      { size: "2L", label: "2L", name: "Gaseosa 2 Litros", price: 8000 }
    ]
  }
];
