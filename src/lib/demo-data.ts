// Local demo fixture. Used as a fallback by getMenuData() when Supabase env
// isn't configured, so the menu renders and can be styled before the live DB.
import type { Business, Category, Item } from '@/types/database'

const BIZ_ID = 'demo-0000-0000-0000-000000000000'
const c = (n: number) => `cat0000-0000-0000-0000-00000000000${n}`
const i = (n: number) => `item0000-0000-0000-0000-${String(n).padStart(12, '0')}`

export const demoBusiness: Business = {
  id: BIZ_ID,
  slug: 'demo-cafe',
  name: 'The Grand Spice',
  tagline: 'Where every bite tells a story.',
  address: '12, MG Road',
  city: 'Bengaluru',
  phone: '+91-98765-43210',
  whatsapp: '919876543210',
  email: 'owner@grandspice.in',
  logo_r2_key: null,
  cover_r2_key: null,
  tier: 'advanced',
  theme: 'bazaar',
  theme_color: '#F5A623',
  is_active: true,
  opening_hours: {
    mon: { open: '11:00', close: '23:00', closed: false },
    tue: { open: '11:00', close: '23:00', closed: false },
    wed: { open: '11:00', close: '23:00', closed: false },
    thu: { open: '11:00', close: '23:00', closed: false },
    fri: { open: '11:00', close: '23:30', closed: false },
    sat: { open: '10:00', close: '23:30', closed: false },
    sun: { open: '10:00', close: '22:00', closed: false },
  },
  social_links: {
    instagram: 'grandspice_blr',
    swiggy: null,
    zomato: null,
    google_maps: null,
  },
  seo_title: null,
  seo_description: null,
  seo_og_r2_key: null,
  firebase_measurement_id: null,
}

export const demoCategories: Category[] = [
  { id: c(1), business_id: BIZ_ID, menu_id: null, name: 'Starters', description: 'Small plates to begin your journey', icon: 'Soup', sort_order: 1, is_active: true },
  { id: c(2), business_id: BIZ_ID, menu_id: null, name: 'Mains', description: 'Hearty dishes from our tandoor & wok', icon: 'UtensilsCrossed', sort_order: 2, is_active: true },
  { id: c(3), business_id: BIZ_ID, menu_id: null, name: 'Breads & Rice', description: 'Fresh from the tandoor', icon: 'Wheat', sort_order: 3, is_active: true },
  { id: c(4), business_id: BIZ_ID, menu_id: null, name: 'Desserts', description: 'Sweet endings', icon: 'IceCream', sort_order: 4, is_active: true },
  { id: c(5), business_id: BIZ_ID, menu_id: null, name: 'Drinks', description: 'Refreshing beverages & lassis', icon: 'CupSoda', sort_order: 5, is_active: true },
]

const base = {
  business_id: BIZ_ID,
  is_jain: false,
  is_gluten_free: false,
  allergens: [] as string[],
  compare_price: null as number | null,
  custom_r2_key: null as string | null,
  custom_thumb_key: null as string | null,
  is_available: true,
  view_count: 0,
}

export const demoItems: Item[] = [
  // ── Starters ──────────────────────────────────────────────────────────
  {
    ...base, id: i(1), category_id: c(1), sort_order: 1,
    name: 'Paneer Tikka', dietary: 'veg', badge: 'bestseller', is_featured: true,
    price: 320, compare_price: 380,
    description: 'Char-grilled cottage cheese marinated in hung curd & spices, served with mint chutney.',
    image_mode: 'stock', stock_image_key: 'stock/indian/paneer-tikka.webp',
  },
  {
    ...base, id: i(2), category_id: c(1), sort_order: 2,
    name: 'Samosa (2 pcs)', dietary: 'veg', badge: null, is_featured: false,
    price: 80,
    description: 'Crisp pastry shells filled with spiced potato & peas. Served with tamarind chutney.',
    image_mode: 'stock', stock_image_key: 'stock/indian/samosa.webp',
  },
  {
    ...base, id: i(3), category_id: c(1), sort_order: 3,
    name: 'Chilli Paneer', dietary: 'veg', badge: 'spicy', is_featured: false,
    price: 290,
    description: 'Indo-Chinese tossed in a sweet, sour & fiery sauce with bell peppers.',
    image_mode: 'stock', stock_image_key: 'stock/chinese/chilli-paneer.webp',
  },
  {
    ...base, id: i(4), category_id: c(1), sort_order: 4,
    name: 'Chicken Seekh Kebab', dietary: 'non-veg', badge: 'chef_special', is_featured: true,
    price: 380,
    description: 'Minced chicken with herbs & aromatics, grilled on skewers in the tandoor.',
    image_mode: 'none', stock_image_key: null,
  },
  {
    ...base, id: i(5), category_id: c(1), sort_order: 5,
    name: 'Crispy Corn Chaat', dietary: 'veg', badge: 'new', is_featured: false,
    price: 190,
    description: 'Flash-fried sweet corn tossed with spices, onion, and tangy masala.',
    image_mode: 'none', stock_image_key: null,
  },
  {
    ...base, id: i(6), category_id: c(1), sort_order: 6,
    name: 'Veg Spring Rolls', dietary: 'vegan', badge: null, is_featured: false,
    price: 160,
    description: 'Crispy golden rolls stuffed with spiced vegetables, served with sweet chilli sauce.',
    image_mode: 'none', stock_image_key: null,
  },
  {
    ...base, id: i(7), category_id: c(1), sort_order: 7,
    name: 'Egg Bhurji Pav', dietary: 'egg', badge: null, is_featured: false,
    price: 140, is_available: false,
    description: 'Street-style scrambled eggs with onion, tomato & chilli. Served with buttered pav.',
    image_mode: 'none', stock_image_key: null,
  },

  // ── Mains ─────────────────────────────────────────────────────────────
  {
    ...base, id: i(8), category_id: c(2), sort_order: 1,
    name: 'Chicken Biryani', dietary: 'non-veg', badge: 'bestseller', is_featured: true,
    price: 380, compare_price: 440,
    description: 'Dum-cooked basmati rice with tender chicken, whole spices & caramelised onions. Served with raita.',
    image_mode: 'stock', stock_image_key: 'stock/indian/biryani.webp',
  },
  {
    ...base, id: i(9), category_id: c(2), sort_order: 2,
    name: 'Dal Makhani', dietary: 'veg', badge: 'chef_special', is_featured: false,
    price: 250,
    description: 'Slow-cooked black lentils simmered overnight with butter & cream. The restaurant\'s signature.',
    image_mode: 'stock', stock_image_key: 'stock/indian/dal-makhani.webp',
  },
  {
    ...base, id: i(10), category_id: c(2), sort_order: 3,
    name: 'Butter Chicken', dietary: 'non-veg', badge: null, is_featured: false,
    price: 390,
    description: 'Charred chicken in a velvety tomato-cream sauce. Mild, aromatic & buttery.',
    image_mode: 'stock', stock_image_key: 'stock/indian/butter-chicken.webp',
  },
  {
    ...base, id: i(11), category_id: c(2), sort_order: 4,
    name: 'Palak Paneer', dietary: 'veg', badge: null, is_featured: false,
    price: 280,
    description: 'Fresh cottage cheese in a vibrant spinach gravy with a hint of cream.',
    image_mode: 'none', stock_image_key: null,
  },
  {
    ...base, id: i(12), category_id: c(2), sort_order: 5,
    name: 'Veg Hakka Noodles', dietary: 'vegan', badge: null, is_featured: false,
    price: 220,
    description: 'Wok-tossed noodles with crunchy vegetables in a light soy glaze.',
    image_mode: 'stock', stock_image_key: 'stock/chinese/hakka-noodles.webp',
  },
  {
    ...base, id: i(13), category_id: c(2), sort_order: 6,
    name: 'Mutton Rogan Josh', dietary: 'non-veg', badge: 'chef_special', is_featured: true,
    price: 480,
    description: 'Slow-braised Kashmiri lamb in aromatic spices. Rich, bold & deeply satisfying.',
    image_mode: 'none', stock_image_key: null,
  },
  {
    ...base, id: i(14), category_id: c(2), sort_order: 7,
    name: 'Chole Bhature', dietary: 'veg', badge: null, is_featured: false,
    price: 180, is_available: false,
    description: 'Spiced chickpea curry served with fluffy deep-fried bhature.',
    image_mode: 'none', stock_image_key: null,
  },
  {
    ...base, id: i(15), category_id: c(2), sort_order: 8,
    name: 'Vegan Tofu Curry', dietary: 'vegan', badge: 'new', is_featured: false,
    price: 310,
    description: 'Silken tofu in a coconut-tomato gravy with fresh curry leaves. 100% plant-based.',
    image_mode: 'none', stock_image_key: null,
    is_gluten_free: true,
  },
  {
    ...base, id: i(16), category_id: c(2), sort_order: 9,
    name: 'Egg Curry', dietary: 'egg', badge: null, is_featured: false,
    price: 210,
    description: 'Boiled eggs in a spiced onion-tomato masala. Homestyle and comforting.',
    image_mode: 'none', stock_image_key: null,
  },

  // ── Breads & Rice ─────────────────────────────────────────────────────
  {
    ...base, id: i(17), category_id: c(3), sort_order: 1,
    name: 'Butter Naan', dietary: 'veg', badge: null, is_featured: false,
    price: 60,
    description: 'Soft leavened bread slathered in butter, baked fresh in the tandoor.',
    image_mode: 'none', stock_image_key: null,
  },
  {
    ...base, id: i(18), category_id: c(3), sort_order: 2,
    name: 'Garlic Naan', dietary: 'veg', badge: 'bestseller', is_featured: false,
    price: 80,
    description: 'Tandoor-baked naan finished with roasted garlic butter and fresh coriander.',
    image_mode: 'none', stock_image_key: null,
  },
  {
    ...base, id: i(19), category_id: c(3), sort_order: 3,
    name: 'Laccha Paratha', dietary: 'veg', badge: null, is_featured: false,
    price: 70,
    description: 'Layered whole-wheat bread with a flaky, crispy texture.',
    image_mode: 'none', stock_image_key: null,
  },
  {
    ...base, id: i(20), category_id: c(3), sort_order: 4,
    name: 'Jeera Rice', dietary: 'vegan', badge: null, is_featured: false,
    price: 120,
    description: 'Basmati rice tempered with cumin seeds and green cardamom.',
    image_mode: 'none', stock_image_key: null,
    is_gluten_free: true,
  },
  {
    ...base, id: i(21), category_id: c(3), sort_order: 5,
    name: 'Cheese Stuffed Kulcha', dietary: 'veg', badge: 'new', is_featured: false,
    price: 130,
    description: 'Soft bread stuffed with melted cheese and mild spices, cooked in the tandoor.',
    image_mode: 'none', stock_image_key: null,
  },

  // ── Desserts ──────────────────────────────────────────────────────────
  {
    ...base, id: i(22), category_id: c(4), sort_order: 1,
    name: 'Gulab Jamun', dietary: 'veg', badge: 'bestseller', is_featured: false,
    price: 90, compare_price: 110,
    description: 'Soft milk-solid dumplings soaked in rose-scented sugar syrup. Served warm.',
    image_mode: 'none', stock_image_key: null,
  },
  {
    ...base, id: i(23), category_id: c(4), sort_order: 2,
    name: 'Kulfi Falooda', dietary: 'veg', badge: null, is_featured: true,
    price: 160,
    description: 'Traditional dense ice cream with vermicelli, rose syrup & basil seeds.',
    image_mode: 'none', stock_image_key: null,
  },
  {
    ...base, id: i(24), category_id: c(4), sort_order: 3,
    name: 'Chocolate Brownie', dietary: 'egg', badge: null, is_featured: false,
    price: 180,
    description: 'Warm fudgy brownie with a scoop of vanilla ice cream and chocolate sauce.',
    image_mode: 'none', stock_image_key: null,
  },
  {
    ...base, id: i(25), category_id: c(4), sort_order: 4,
    name: 'Vegan Mango Sorbet', dietary: 'vegan', badge: 'new', is_featured: false,
    price: 140,
    description: 'Pure Alphonso mango sorbet with a touch of chilli salt. Dairy-free.',
    image_mode: 'none', stock_image_key: null,
    is_gluten_free: true,
  },
  {
    ...base, id: i(26), category_id: c(4), sort_order: 5,
    name: 'Rasmalai', dietary: 'veg', badge: null, is_featured: false,
    price: 130, is_available: false,
    description: 'Soft cottage cheese patties soaked in saffron-flavoured thickened milk.',
    image_mode: 'none', stock_image_key: null,
  },

  // ── Drinks ────────────────────────────────────────────────────────────
  {
    ...base, id: i(27), category_id: c(5), sort_order: 1,
    name: 'Masala Chai', dietary: 'veg', badge: null, is_featured: false,
    price: 50,
    description: 'Cutting chai with ginger, cardamom & our secret masala blend.',
    image_mode: 'stock', stock_image_key: 'stock/drinks/chai.webp',
  },
  {
    ...base, id: i(28), category_id: c(5), sort_order: 2,
    name: 'Mango Lassi', dietary: 'veg', badge: 'bestseller', is_featured: true,
    price: 120,
    description: 'Thick blended yogurt with Alphonso mango pulp. Chilled & refreshing.',
    image_mode: 'none', stock_image_key: null,
  },
  {
    ...base, id: i(29), category_id: c(5), sort_order: 3,
    name: 'Cold Coffee', dietary: 'veg', badge: null, is_featured: false,
    price: 150,
    description: 'Blended iced coffee with cream and a chocolate drizzle.',
    image_mode: 'stock', stock_image_key: 'stock/drinks/cold-coffee.webp',
  },
  {
    ...base, id: i(30), category_id: c(5), sort_order: 4,
    name: 'Virgin Mojito', dietary: 'vegan', badge: null, is_featured: false,
    price: 130,
    description: 'Muddled mint, lime juice, soda water & a hint of sugar. Alcohol-free.',
    image_mode: 'none', stock_image_key: null,
    is_gluten_free: true,
  },
  {
    ...base, id: i(31), category_id: c(5), sort_order: 5,
    name: 'Rose Sharbat', dietary: 'vegan', badge: null, is_featured: false,
    price: 90,
    description: 'Chilled rose-flavoured drink with basil seeds. Old Delhi Irani-cafe classic.',
    image_mode: 'none', stock_image_key: null,
    is_gluten_free: true,
  },
  {
    ...base, id: i(32), category_id: c(5), sort_order: 6,
    name: 'Fresh Lime Soda', dietary: 'vegan', badge: null, is_featured: false,
    price: 70,
    description: 'Freshly squeezed lime with soda — sweet, salted, or mixed.',
    image_mode: 'none', stock_image_key: null,
    is_gluten_free: true,
  },
]
