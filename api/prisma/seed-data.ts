/* Datos del catálogo copiados de la demo estática (js/catalog.js y js/producto.js)
   + algoritmo determinista de reseñas (allReviewsFor). */

export const U = (id: string) =>
  `https://images.unsplash.com/${id}?q=80&w=800&auto=format&fit=crop`;

export interface CatalogProduct {
  id: number;
  name: string;
  cat: string;
  price: number;
  old: number;
  rating: number;
  reviews: number;
  badge: 'flash' | 'new' | 'top' | null;
  icon: string;
  g: string[];
  img: string;
  prime: boolean;
  stock: number;
  deal: boolean;
}

export const PRODUCTS: CatalogProduct[] = [
  {
    id: 1,
    name: 'Auriculares Nova X',
    cat: 'Tech',
    price: 89.99,
    old: 149.99,
    rating: 4.8,
    reviews: 2341,
    badge: 'flash',
    icon: 'headphones',
    g: ['#FF6A00', '#FF3D1F'],
    img: U('photo-1505740420928-5e560c06d30e'),
    prime: true,
    stock: 78,
    deal: true,
  },
  {
    id: 2,
    name: 'Smartwatch Fit Pro',
    cat: 'Tech',
    price: 99.0,
    old: 159.0,
    rating: 4.7,
    reviews: 1876,
    badge: 'flash',
    icon: 'smartwatch',
    g: ['#7C3AED', '#4F46E5'],
    img: U('photo-1546868871-7041f2a55e12'),
    prime: true,
    stock: 64,
    deal: true,
  },
  {
    id: 3,
    name: 'Altavoz Pulse Boom',
    cat: 'Tech',
    price: 65.99,
    old: 99.99,
    rating: 4.6,
    reviews: 982,
    badge: null,
    icon: 'speaker',
    g: ['#0EA5E9', '#2563EB'],
    img: U('photo-1608043152269-423dbba4e7e1'),
    prime: true,
    stock: 82,
    deal: true,
  },
  {
    id: 4,
    name: 'Zapatillas Velocity Runner',
    cat: 'Moda',
    price: 74.5,
    old: 110.0,
    rating: 4.9,
    reviews: 3120,
    badge: 'top',
    icon: 'shoe',
    g: ['#F43F5E', '#FB7185'],
    img: U('photo-1542291026-7eec264c27ff'),
    prime: true,
    stock: 55,
    deal: false,
  },
  {
    id: 5,
    name: 'Chaqueta North Wind',
    cat: 'Moda',
    price: 129.0,
    old: 180.0,
    rating: 4.7,
    reviews: 640,
    badge: null,
    icon: 'jacket',
    g: ['#334155', '#0F172A'],
    img: U('photo-1551028719-00167b16eac5'),
    prime: false,
    stock: 40,
    deal: true,
  },
  {
    id: 6,
    name: 'Mochila Urban Flex',
    cat: 'Moda',
    price: 54.0,
    old: 79.0,
    rating: 4.5,
    reviews: 1518,
    badge: null,
    icon: 'backpack',
    g: ['#F59E0B', '#F97316'],
    img: U('photo-1553062407-98eeb64c6a62'),
    prime: true,
    stock: 71,
    deal: false,
  },
  {
    id: 7,
    name: 'Gafas de Sol Riviera',
    cat: 'Accesorios',
    price: 39.0,
    old: 65.0,
    rating: 4.4,
    reviews: 733,
    badge: 'flash',
    icon: 'glasses',
    g: ['#10B981', '#0D9488'],
    img: U('photo-1572635196237-14b3f281503f'),
    prime: true,
    stock: 88,
    deal: true,
  },
  {
    id: 8,
    name: 'Reloj Minimal Steel',
    cat: 'Accesorios',
    price: 119.0,
    old: 169.0,
    rating: 4.8,
    reviews: 1204,
    badge: null,
    icon: 'watch',
    g: ['#64748B', '#334155'],
    img: U('photo-1524805444758-089113d48a6d'),
    prime: false,
    stock: 33,
    deal: false,
  },
  {
    id: 9,
    name: 'Lámpara Luna Desk',
    cat: 'Hogar',
    price: 45.0,
    old: 69.0,
    rating: 4.6,
    reviews: 421,
    badge: 'new',
    icon: 'lamp',
    g: ['#8B5CF6', '#D946EF'],
    img: U('photo-1507473885765-e6ed057f782c'),
    prime: true,
    stock: 60,
    deal: true,
  },
  {
    id: 10,
    name: 'Set Cerámica Atelier ×4',
    cat: 'Hogar',
    price: 29.9,
    old: 49.9,
    rating: 4.7,
    reviews: 356,
    badge: null,
    icon: 'mug',
    g: ['#EC4899', '#F43F5E'],
    img: U('photo-1514228742587-6b1558fcca3d'),
    prime: false,
    stock: 47,
    deal: false,
  },
  {
    id: 11,
    name: 'Kit Skincare Glow',
    cat: 'Belleza',
    price: 49.0,
    old: 85.0,
    rating: 4.8,
    reviews: 2093,
    badge: 'flash',
    icon: 'drop',
    g: ['#F472B6', '#FB7185'],
    img: U('photo-1556228720-195a672e8a03'),
    prime: true,
    stock: 91,
    deal: true,
  },
  {
    id: 12,
    name: 'Perfume Nocturne 50 ml',
    cat: 'Belleza',
    price: 79.0,
    old: 120.0,
    rating: 4.9,
    reviews: 1687,
    badge: 'top',
    icon: 'perfume',
    g: ['#A855F7', '#7C3AED'],
    img: U('photo-1541643600914-78b084683601'),
    prime: true,
    stock: 52,
    deal: true,
  },
];

export const CATEGORIES = [
  {
    name: 'Tech',
    label: 'Tecnología',
    icon: 'chip',
    g: ['#2563EB', '#0EA5E9'],
  },
  { name: 'Moda', label: 'Moda', icon: 'jacket', g: ['#F43F5E', '#FB923C'] },
  { name: 'Hogar', label: 'Hogar', icon: 'lamp', g: ['#8B5CF6', '#D946EF'] },
  {
    name: 'Belleza',
    label: 'Belleza',
    icon: 'drop',
    g: ['#EC4899', '#F472B6'],
  },
  {
    name: 'Accesorios',
    label: 'Accesorios',
    icon: 'watch',
    g: ['#0F766E', '#10B981'],
  },
];

export const DESCRIPTIONS: Record<number, string> = {
  1: 'Los auriculares Nova X de Nova Audio combinan cancelación de ruido híbrida, drivers de 40 mm y una autonomía de hasta 24 horas. Su diadema plegable y las almohadillas viscoelásticas los hacen perfectos para desplazamientos, oficina o viajes largos.',
  2: 'El Smartwatch Fit Pro de FitTech monitoriza ritmo cardíaco, sueño y más de 100 modos deportivos con GPS integrado. Pantalla AMOLED de 1,4", resistencia al agua 5 ATM y una batería que darga una semana completa.',
  3: 'El altavoz Pulse Boom llena cualquier estancia con 30 W de potencia y graves profundos gracias a su radiador pasivo. Resistente al agua IPX7, es el compañero ideal para casa, terraza o escapadas.',
  4: 'Las Velocity Runner de Velocity están diseñadas para corredores que buscan ligereza y retorno de energía. Su media suela de espuma EVA y la malla técnica transpirable te acompañan del primer al último kilómetro.',
  5: 'La chaqueta North Wind protege del viento y la lluvia ligera con su membrana impermeable y tejido reciclado. Cortavientos versátil con capucha ajustable y bolsillos interiores, pensada para el día a día urbano.',
  6: 'La mochila Urban Flex de 22 L está fabricada en nylon balístico 900D con cremalleras YKK: resistente al agua, al roce y a la vida en movimiento. Compartimento acolchado para portátil de hasta 15,6".',
  7: 'Las gafas Riviera de Riviera Eyewear combinan acetato italiano y cristales polarizados con protección UV400. Un diseño atemporal de inspiración retro que protege con estilo durante todo el año.',
  8: 'El Minimal Steel de Minimal Steel Co. es un reloj de caja de 40 mm en acero inoxidable 316L con cristal de zafiro. Movimiento japonés, resistencia 5 ATM y una estética minimalista que combina con todo.',
  9: 'La lámpara Luna Desk de Luna Living crea una luz cálida y regulable con su brazo articulado de 360°. Su difusor antideslumbrante cuida la vista durante largas jornadas de lectura o trabajo.',
  10: 'El set Atelier de Atelier Cerámica incluye cuatro piezas de gres esmaltado hechas a mano: dos tazas de 350 ml y dos platos de postre. Cada pieza es única, con pequeñas variaciones que celebran lo artesanal.',
  11: 'El Kit Skincare Glow de Glow Lab reúne limpiador, sérum y crema hidratante con un 92% de ingredientes de origen natural. Una rutina completa de tres pasos para una piel luminosa en dos semanas.',
  12: 'Nocturne es una eau de parfum con un 18% de concentración: notas de bergamota y cardamomo se abren hacia un corazón de jazmín y un fondo amaderado de sándalo y vainilla. Intensidad que dura más de 8 horas.',
};

export const SPECS: Record<number, Record<string, string>> = {
  1: {
    Marca: 'Nova Audio',
    Material: 'ABS mate · almohadillas viscoelásticas',
    Dimensiones: '18 × 16 × 8 cm',
    Peso: '248 g',
    Color: 'Negro grafito',
    Conectividad: 'Bluetooth 5.3 · Jack 3,5 mm',
    Garantía: '2 años',
    'Referencia AAO': 'AAO-HPX-001',
  },
  2: {
    Marca: 'FitTech',
    Material: 'Aluminio · correa de fluoroelastómero',
    Dimensiones: '4,6 × 3,8 × 1,1 cm (caja)',
    Peso: '52 g',
    Color: 'Negro / plata',
    Pantalla: 'AMOLED 1,4" táctil',
    Garantía: '2 años',
    'Referencia AAO': 'AAO-SMW-002',
  },
  3: {
    Marca: 'Pulse Sound',
    Material: 'Tela técnica · carcasa rígida',
    Dimensiones: '18 × 7 × 7 cm',
    Peso: '620 g',
    Color: 'Azul océano',
    Conectividad: 'Bluetooth 5.3 · AUX',
    Garantía: '2 años',
    'Referencia AAO': 'AAO-SP3-003',
  },
  4: {
    Marca: 'Velocity',
    Material: 'Malla técnica · suela de goma EVA',
    Dimensiones: '30 × 18 × 12 cm (caja)',
    Peso: '640 g (par)',
    Color: 'Rojo coral',
    Tallas: 'EU 36–46',
    Garantía: '2 años (legal)',
    'Referencia AAO': 'AAO-ZPV-004',
  },
  5: {
    Marca: 'North Wind',
    Material: 'Poliéster reciclado · membrana impermeable',
    Dimensiones: '70 cm de largo (talla M)',
    Peso: '780 g (talla M)',
    Color: 'Verde bosque',
    Tallas: 'S – XXL',
    Garantía: '2 años (legal)',
    'Referencia AAO': 'AAO-CHN-005',
  },
  6: {
    Marca: 'Urban Flex',
    Material: 'Nylon balístico 900D · cremalleras YKK',
    Dimensiones: '45 × 30 × 15 cm (22 L)',
    Peso: '890 g',
    Color: 'Arena',
    Compartimentos: 'Portátil 15,6" + 5 bolsillos',
    Garantía: '2 años',
    'Referencia AAO': 'AAO-MBU-006',
  },
  7: {
    Marca: 'Riviera Eyewear',
    Material: 'Acetato italiano · cristal polarizado',
    Dimensiones: '14,5 × 5 × 14 cm',
    Peso: '28 g',
    Color: 'Carey dorado',
    Protección: 'UV400 · categoría 3',
    Garantía: '2 años',
    'Referencia AAO': 'AAO-GFR-007',
  },
  8: {
    Marca: 'Minimal Steel Co.',
    Material: 'Acero inoxidable 316L · cristal de zafiro',
    Dimensiones: 'Caja de 40 mm · correa 20 mm',
    Peso: '120 g',
    Color: 'Plateado',
    Resistencia: '5 ATM (50 m)',
    Garantía: '2 años',
    'Referencia AAO': 'AAO-RWM-008',
  },
  9: {
    Marca: 'Luna Living',
    Material: 'Metal lacado · difusor de policarbonato',
    Dimensiones: '28 × 18 × 38 cm',
    Peso: '1,4 kg',
    Color: 'Blanco luna',
    Bombilla: 'LED 9 W incluida (E27)',
    Garantía: '2 años',
    'Referencia AAO': 'AAO-LPL-009',
  },
  10: {
    Marca: 'Atelier Cerámica',
    Material: 'Gres esmaltado artesanal',
    Dimensiones: 'Taza: 8 × 9 cm (350 ml)',
    Peso: '1,2 kg (set completo)',
    Color: 'Blanco roto',
    Cuidados: 'Apto lavavajillas y microondas',
    Garantía: '2 años',
    'Referencia AAO': 'AAO-CMA-010',
  },
  11: {
    Marca: 'Glow Lab',
    Material: 'Fórmula vegana · 92% origen natural',
    Dimensiones: '3 × 50 ml',
    Peso: '420 g',
    Color: '—',
    Apto_para: 'Todo tipo de pieles · testado dermatológicamente',
    Garantía: '2 años',
    'Referencia AAO': 'AAO-SKG-011',
  },
  12: {
    Marca: 'Nocturne Parfums',
    Material: 'Eau de parfum · 18% concentración',
    Dimensiones: '5 × 5 × 11 cm (50 ml)',
    Peso: '320 g',
    Color: 'Ámbar oscuro',
    Familia_olfativa: 'Amaderada aromática',
    Garantía: '2 años',
    'Referencia AAO': 'AAO-PFN-012',
  },
};

const FEATURES: Record<string, string[]> = {
  Tech: [
    'Batería de larga duración: hasta 24 h de uso continuo',
    'Conexión estable Bluetooth 5.3 con emparejamiento instantáneo',
    'Diseño compacto y ligero, fácil de llevar a todas partes',
    'Compatible con iOS, Android, Windows y macOS',
    'Carga rápida: 15 minutos equivalen a 3 h de uso',
    'Materiales premium con acabado mate resistente a huellas',
  ],
  Moda: [
    'Tejido transpirable de alta resistencia',
    'Corte moderno unisex, tallas de la S a la XXL',
    'Costuras reforzadas para el uso diario',
    'Fácil cuidado: apto para lavadora',
    'Colores que no destiñen tras múltiples lavados',
    'Diseño ligero pensado para moverte con libertad',
  ],
  Hogar: [
    'Materiales naturales y acabado artesanal',
    'Base estable antideslizante',
    'Fácil limpieza con un paño húmedo',
    'Diseño atemporal que combina con cualquier estancia',
    'Fabricado con procesos sostenibles',
    'Resistente al calor y a la humedad',
  ],
  Belleza: [
    'Fórmula dermatológicamente testada',
    'Ingredientes de origen natural al 92%',
    'Apto para pieles sensibles',
    'Sin parabenos ni siliconas',
    'Envase 100% reciclable',
    'Resultados visibles desde la primera semana',
  ],
  Accesorios: [
    'Acero inoxidable y materiales hipoalergénicos',
    'Acabado pulido resistente a arañazos',
    'Diseño minimalista atemporal',
    'Ajuste cómodo para uso prolongado',
    'Incluye estuche de protección',
    'Resistente al agua y al sudor',
  ],
};

export function featuresFor(prod: { id: number; cat: string }): string[] {
  const pool = FEATURES[prod.cat];
  const r = rng(prod.id * 31 + 7);
  const idx = new Set<number>();
  while (idx.size < 4) idx.add(Math.floor(r() * pool.length));
  return [...idx].map((i) => pool[i]);
}

/* ── Reseñas deterministas (mismo algoritmo que js/catalog.js) ── */

export const REVIEW_NAMES = [
  'María G.',
  'Piero L.',
  'Sofía R.',
  'Luca M.',
  'Ana B.',
  'Marco T.',
  'Elena V.',
  'Diego F.',
  'Chiara P.',
  'Hugo S.',
  'Valentina N.',
  'Andrés C.',
];
export const REVIEW_TITLES = [
  'Excelente compra',
  'Superó mis expectativas',
  'Muy buena calidad',
  'Justo lo que buscaba',
  'Relación calidad-precio increíble',
  'Llegó rapidísimo',
  'Muy recomendable',
  'Bastante bien',
  'Repitiré seguro',
  'Muy contento',
];
export const REVIEW_TEXTS = [
  'Lo pedí con la oferta del día y llegó en menos de 48h. La calidad es tal como se describe en la página. Muy contento con la compra.',
  'Dudaba por el precio, pero la calidad me ha sorprendido. Se nota que es un producto bien hecho. Lo recomiendo sin dudar.',
  'Cumple perfectamente lo que promete. El embalaje venía impecable y el envío fue rapidísimo. Volveré a comprar en All At Once.',
  'Lo llevo usando un par de semanas y funciona de maravilla. Eso sí, el color es ligeramente más oscuro que en las fotos.',
  'Compra excelente. El servicio de atención al cliente me resolvió una duda en minutos. El producto, de diez.',
  'Muy buena relación calidad-precio. No es perfecto, pero por lo que cuesta está genial. Llegó un día antes de lo previsto.',
  'Es el segundo que compro y la calidad se mantiene. Envío rápido y bien protegido. Muy recomendable.',
  'Producto sólido y con buen acabado. El envío exprés funciona de verdad: lo pedí por la mañana y al día siguiente estaba en casa.',
  'Está bien, aunque esperaba algo más grande. Revisad las medidas antes de comprar. Por lo demás, sin quejas.',
  'Increíble por este precio. Se nota que All At Once selecciona bien sus productos. Cinco estrellas merecidas.',
];

export function rng(seed: number): () => number {
  let a = (seed * 2654435761) >>> 0;
  return () => (a = (a * 1664525 + 1013904223) >>> 0) / 4294967296;
}

export interface GeneratedReview {
  name: string;
  rating: number;
  title: string;
  text: string;
  date: string;
  verified: boolean;
}

export function allReviewsFor(prod: {
  id: number;
  rating: number;
}): GeneratedReview[] {
  const r = rng(prod.id * 97 + 13);
  const n = 5 + Math.floor(r() * 3);
  const reviews: GeneratedReview[] = [];
  const usedT = new Set<number>(),
    usedX = new Set<number>();
  for (let i = 0; i < n; i++) {
    const roll = r();
    const rating = roll < prod.rating - 3.35 ? 5 : roll < 0.87 ? 4 : 3;
    let ti = Math.floor(r() * REVIEW_TITLES.length);
    let xi = Math.floor(r() * REVIEW_TEXTS.length);
    while (usedT.has(ti)) ti = (ti + 1) % REVIEW_TITLES.length;
    while (usedX.has(xi)) xi = (xi + 1) % REVIEW_TEXTS.length;
    usedT.add(ti);
    usedX.add(xi);
    reviews.push({
      name: REVIEW_NAMES[Math.floor(r() * REVIEW_NAMES.length)],
      rating,
      title: REVIEW_TITLES[ti],
      text: REVIEW_TEXTS[xi],
      date: `hace ${1 + Math.floor(r() * 89)} días`,
      verified: r() < 0.85,
    });
  }
  return reviews;
}

/* ── Ajustes / cupones / métodos por defecto ── */

export const DEFAULT_SETTINGS = {
  tienda: 'All At Once',
  iva: 21,
  moneda: 'EUR',
  envioGratis: 75,
  envioCoste: 4.99,
};

export const BASE_COUPONS = [
  { code: 'AAO10', tipo: 'pct', valor: 10, descripcion: '-10% en tu pedido' },
  { code: 'FLASH20', tipo: 'pct', valor: 20, descripcion: '-20% venta flash' },
];

export const DEFAULT_SHIPPING = [
  {
    id: 'estandar',
    nombre: 'Estándar',
    desc: '3–5 días laborables',
    precio: DEFAULT_SETTINGS.envioCoste,
    gratisDesde: DEFAULT_SETTINGS.envioGratis,
    extra: 0,
    dias: 4,
    activo: true,
  },
  {
    id: 'express',
    nombre: 'Exprés 24/48 h',
    desc: 'Con seguimiento en tiempo real',
    precio: 9.99,
    gratisDesde: null,
    extra: 0,
    dias: 1,
    activo: true,
  },
  {
    id: 'reembolso',
    nombre: 'Contra reembolso',
    desc: 'Pagas al recibir en casa',
    precio: DEFAULT_SETTINGS.envioCoste,
    gratisDesde: DEFAULT_SETTINGS.envioGratis,
    extra: 3.5,
    dias: 4,
    activo: true,
  },
];

export const DEFAULT_PAYMENTS = [
  {
    id: 'tarjeta',
    nombre: 'Tarjeta',
    desc: 'Visa, Mastercard, Amex · cifrado seguro',
    activo: true,
  },
  {
    id: 'paypal',
    nombre: 'PayPal',
    desc: 'Serás redirigido para completar el pago',
    activo: true,
  },
  {
    id: 'reembolso',
    nombre: 'Contra reembolso',
    desc: 'Suplemento de gestión',
    activo: true,
  },
];

export const slugify = (name: string): string =>
  name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
