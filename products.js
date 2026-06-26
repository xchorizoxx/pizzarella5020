// Base de datos de productos y configuraciones para Pizzarella5020

const BUSINESS_SETTINGS = {
  name: "Pizzarella5020",
  phone: "584126514537", // <-- Número real del delivery configurado
  currency: "COP",
  deliveryFee: 4000
};

// Sabores de refrescos disponibles ordenados alfabéticamente
const SODA_FLAVORS = [
  { name: "Coca-Cola", logo: "logos/soda_3.png" },
  { name: "Colita", logo: "logos/soda_11.png" },
  { name: "Manzana", logo: "logos/soda_7.png" },
  { name: "Pepsi", logo: "logos/soda_5.png" },
  { name: "Piña", logo: "logos/soda_12.png" },
  { name: "Uva", logo: "logos/soda_1.png" }
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
      { size: "PEQ", label: "P", name: "PEQ (24CM)", price: 13000, boxPrice: 1500 },
      { size: "MED", label: "M", name: "MED (30CM)", price: 17000, boxPrice: 1800 },
      { size: "FAM", label: "F", name: "FAM (40CM)", price: 28000, boxPrice: 2500 },
      { size: "EXT", label: "EF", name: "EXT FAM", price: 34000, boxPrice: 2500 }
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
      { size: "PEQ", label: "P", name: "PEQ (24CM)", price: 17000, boxPrice: 1500 },
      { size: "MED", label: "M", name: "MED (30CM)", price: 22000, boxPrice: 1800 },
      { size: "FAM", label: "F", name: "FAM (40CM)", price: 38000, boxPrice: 2500 },
      { size: "EXT", label: "EF", name: "EXT FAM", price: 44000, boxPrice: 2500 }
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
      { size: "PEQ", label: "P", name: "PEQ (24CM)", price: 19000, boxPrice: 1500 },
      { size: "MED", label: "M", name: "MED (30CM)", price: 24000, boxPrice: 1800 },
      { size: "FAM", label: "F", name: "FAM (40CM)", price: 37000, boxPrice: 2500 },
      { size: "EXT", label: "EF", name: "EXT FAM", price: 43000, boxPrice: 2500 }
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
      { size: "PEQ", label: "P", name: "PEQ (24CM)", price: 19000, boxPrice: 1500 },
      { size: "MED", label: "M", name: "MED (30CM)", price: 24000, boxPrice: 1800 },
      { size: "FAM", label: "F", name: "FAM (40CM)", price: 42000, boxPrice: 2500 },
      { size: "EXT", label: "EF", name: "EXT FAM", price: 48000, boxPrice: 2500 }
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
      { size: "PEQ", label: "P", name: "PEQ (24CM)", price: 20000, boxPrice: 1500 },
      { size: "MED", label: "M", name: "MED (30CM)", price: 25000, boxPrice: 1800 },
      { size: "FAM", label: "F", name: "FAM (40CM)", price: 38000, boxPrice: 2500 },
      { size: "EXT", label: "EF", name: "EXT FAM", price: 44000, boxPrice: 2500 }
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
      { size: "PEQ", label: "P", name: "PEQ (24CM)", price: 22000, boxPrice: 1500 },
      { size: "MED", label: "M", name: "MED (30CM)", price: 27000, boxPrice: 1800 },
      { size: "FAM", label: "F", name: "FAM (40CM)", price: 45000, boxPrice: 2500 },
      { size: "EXT", label: "EF", name: "EXT FAM", price: 51000, boxPrice: 2500 }
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
      { size: "PEQ", label: "P", name: "PEQ (24CM)", price: 24000, boxPrice: 1500 },
      { size: "MED", label: "M", name: "MED (30CM)", price: 32000, boxPrice: 1800 },
      { size: "FAM", label: "F", name: "FAM (40CM)", price: 55000, boxPrice: 2500 },
      { size: "EXT", label: "EF", name: "EXT FAM", price: 61000, boxPrice: 2500 }
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
      { size: "PEQ", label: "P", name: "PEQ (24CM)", price: 20000, boxPrice: 1500 },
      { size: "MED", label: "M", name: "MED (30CM)", price: 25000, boxPrice: 1800 },
      { size: "FAM", label: "F", name: "FAM (40CM)", price: 40000, boxPrice: 2500 },
      { size: "EXT", label: "EF", name: "EXT FAM", price: 46000, boxPrice: 2500 }
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
      { size: "PEQ", label: "P", name: "PEQ (24CM)", price: 24000, boxPrice: 1500 },
      { size: "MED", label: "M", name: "MED (30CM)", price: 32000, boxPrice: 1800 },
      { size: "FAM", label: "F", name: "FAM (40CM)", price: 55000, boxPrice: 2500 },
      { size: "EXT", label: "EF", name: "EXT FAM", price: 61000, boxPrice: 2500 }
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
      { size: "PEQ", label: "P", name: "PEQ (24CM)", price: 20000, boxPrice: 1500 },
      { size: "MED", label: "M", name: "MED (30CM)", price: 28000, boxPrice: 1800 },
      { size: "FAM", label: "F", name: "FAM (40CM)", price: 45000, boxPrice: 2500 },
      { size: "EXT", label: "EF", name: "EXT FAM", price: 51000, boxPrice: 2500 }
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
      { size: "PEQ", label: "P", name: "PEQ (24CM)", price: 28000, boxPrice: 1500 },
      { size: "MED", label: "M", name: "MED (30CM)", price: 38000, boxPrice: 1800 },
      { size: "FAM", label: "F", name: "FAM (40CM)", price: 60000, boxPrice: 2500 },
      { size: "EXT", label: "EF", name: "EXT FAM", price: 66000, boxPrice: 2500 }
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
      { size: "BOTELLA", label: "Botella", name: "Botella Personal", price: 3000 },
      { size: "1L", label: "1L", name: "Gaseosa 1 Litro", price: 5000 },
      { size: "1.5L", label: "1.5L", name: "Gaseosa 1.5 Litros", price: 7000 },
      { size: "2L", label: "2L", name: "Gaseosa 2 Litros", price: 8000 },
      { size: "2.5L", label: "2.5L", name: "Gaseosa 2.5 Litros", price: 8000 }
    ]
  }
];
