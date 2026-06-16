import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Check,
  Clock,
  Loader2
} from 'lucide-react';

const defaultCats = [
  { id: 'c-1', name: 'Starters', description: 'Crispy finger foods & appetizers' },
  { id: 'c-2', name: 'Soups', description: 'Freshly prepared hot soups' },
  { id: 'c-3', name: 'Veg Main Course', description: 'Gourmet vegetarian entrees' },
  { id: 'c-4', name: 'Non-Veg Main Course', description: 'Authentic chicken & mutton delicacies' },
  { id: 'c-5', name: 'Sea Food', description: 'Fresh catch seafood items' },
  { id: 'c-6', name: 'Rice', description: 'Premium long grain rice & biryanis' },
  { id: 'c-7', name: 'Breads', description: 'Freshly baked tandoori rotis & naans' },
  { id: 'c-8', name: 'Chinese', description: 'Indo-chinese delicacies' },
  { id: 'c-9', name: 'Pizza', description: 'Handmade cheese pizzas' },
  { id: 'c-10', name: 'Burgers', description: 'Juicy customized burgers' },
  { id: 'c-11', name: 'Sandwiches', description: 'Gourmet toasted sandwiches' },
  { id: 'c-12', name: 'Pasta', description: 'Fresh italian pastas' },
  { id: 'c-13', name: 'Desserts', description: 'Delicious sweet endings' },
  { id: 'c-14', name: 'Ice Cream', description: 'Creamy cold ice scoops' },
  { id: 'c-15', name: 'Beverages', description: 'Cold drinks, soda & juices' },
  { id: 'c-16', name: 'Mocktails', description: 'Refreshing mocktails' },
  { id: 'c-17', name: 'Combos', description: 'Value meal combinations' },
  { id: 'c-18', name: "Today's Special", description: 'Special recipes of the day' },
  { id: 'c-19', name: 'Chef Recommendations', description: 'Highly recommended by our chef' }
];

const defaultItems = [
  // ================= VEG ITEMS (20 Items) =================
  { id: 'v-1', categoryId: 'c-3', name: 'Dal Tadka', description: '[Type: Veg] Traditional yellow lentils tempered with ghee, garlic, and cumin', price: 1, isVeg: true, isChefSpecial: false, isRecommended: true, status: 'Active', image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=400&h=300&q=80' },
  { id: 'v-2', categoryId: 'c-3', name: 'Dal Khichadi', description: '[Type: Veg] Comforting rice and lentil porridge tempered with spices', price: 149, isVeg: true, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=400&h=300&q=80' },
  { id: 'v-3', categoryId: 'c-3', name: 'Jeera Rice', description: '[Type: Veg] Aromatic basmati rice tempered with cumin seeds and coriander', price: 120, isVeg: true, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=400&h=300&q=80' },
  { id: 'v-4', categoryId: 'c-3', name: 'Steam Basmati Rice', description: '[Type: Veg] Premium steamed long-grain basmati rice', price: 99, isVeg: true, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=400&h=300&q=80' },
  { id: 'v-5', categoryId: 'c-3', name: 'Paneer Butter Masala', description: '[Type: Veg] Soft paneer cubes in creamy, mildly sweet tomato gravy', price: 260, isVeg: true, isChefSpecial: true, isRecommended: true, status: 'Active', image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=400&h=300&q=80' },
  { id: 'v-6', categoryId: 'c-3', name: 'Kadai Paneer', description: '[Type: Veg] Paneer cooked with bell peppers and freshly ground kadai spices', price: 250, isVeg: true, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=400&h=300&q=80' },
  { id: 'v-7', categoryId: 'c-3', name: 'Veg Thali', description: '[Type: Veg] Complete meal with dal, two veg curries, rice, chapati, and sweet', price: 199, isVeg: true, isChefSpecial: true, isRecommended: true, status: 'Active', image: 'https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?auto=format&fit=crop&w=400&h=300&q=80' },
  { id: 'v-8', categoryId: 'c-3', name: 'Paneer Tikka Masala', description: '[Type: Veg] Grilled paneer chunks in spicy spiced onion tomato gravy', price: 270, isVeg: true, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=400&h=300&q=80' },
  { id: 'v-9', categoryId: 'c-3', name: 'Mix Vegetable Curry', description: '[Type: Veg] Seasonal mixed vegetables cooked in North Indian style gravy', price: 180, isVeg: true, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?auto=format&fit=crop&w=400&h=300&q=80' },
  { id: 'v-10', categoryId: 'c-3', name: 'Chole Bhature', description: '[Type: Veg] Spicy chickpea curry served with two puffed fried breads', price: 150, isVeg: true, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1627662236973-4f8259fa2441?auto=format&fit=crop&w=400&h=300&q=80' },
  { id: 'v-11', categoryId: 'c-3', name: 'Aloo Gobi Masala', description: '[Type: Veg] Classic dry dish of potatoes and cauliflower with spices', price: 130, isVeg: true, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?auto=format&fit=crop&w=400&h=300&q=80' },
  { id: 'v-12', categoryId: 'c-3', name: 'Veg Biryani', description: '[Type: Veg] Layers of basmati rice and mixed vegetables cooked on dum', price: 210, isVeg: true, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1563379971899-660589a01cc3?auto=format&fit=crop&w=400&h=300&q=80' },
  { id: 'v-13', categoryId: 'c-3', name: 'Masala Dosa', description: '[Type: Veg] Crispy crepe filled with potato masala served with chutney and sambar', price: 99, isVeg: true, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=400&h=300&q=80' },
  { id: 'v-14', categoryId: 'c-3', name: 'Paneer Chilli', description: '[Type: Veg] Indo-Chinese style paneer tossed in soy and green chilli sauce', price: 199, isVeg: true, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=400&h=300&q=80' },
  { id: 'v-15', categoryId: 'c-3', name: 'Veg Hakka Noodles', description: '[Type: Veg] Wok-tossed noodles with colorful garden veggies and soy', price: 160, isVeg: true, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=400&h=300&q=80' },
  { id: 'v-16', categoryId: 'c-3', name: 'Gobi Manchurian', description: '[Type: Veg] Deep-fried cauliflower florets in sweet and tangy sauce', price: 150, isVeg: true, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=400&h=300&q=80' },
  { id: 'v-17', categoryId: 'c-3', name: 'Mushroom Masala', description: '[Type: Veg] Button mushrooms in spiced onion tomato masala gravy', price: 240, isVeg: true, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1517244681291-7d930cc7ab3b?auto=format&fit=crop&w=400&h=300&q=80' },
  { id: 'v-18', categoryId: 'c-3', name: 'Palak Paneer', description: '[Type: Veg] Creamy cottage cheese cubes in rich spinach sauce', price: 230, isVeg: true, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?auto=format&fit=crop&w=400&h=300&q=80' },
  { id: 'v-19', categoryId: 'c-3', name: 'Baingan Bharta', description: '[Type: Veg] Roasted and mashed eggplant cooked with peas and spices', price: 160, isVeg: true, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=400&h=300&q=80' },
  { id: 'v-20', categoryId: 'c-3', name: 'Butter Tandoori Roti', description: '[Type: Veg] Whole wheat flatbread baked in tandoor with butter', price: 25, isVeg: true, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?auto=format&fit=crop&w=400&h=300&q=80' },

  // ================= NON-VEG ITEMS (20 Items) =================
  { id: 'nv-1', categoryId: 'c-4', name: 'Chicken Thali', description: '[Type: Non-Veg] Special thali with Chicken Curry, Egg, Rice, Bhakri, and Solkadhi', price: 249, isVeg: false, isChefSpecial: true, isRecommended: true, status: 'Active', image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=400&h=300&q=80' },
  { id: 'nv-2', categoryId: 'c-4', name: 'Mutton Thali', description: '[Type: Non-Veg] Premium thali with Mutton Masala, Rassa, Rice, Bhakri, and Solkadhi', price: 329, isVeg: false, isChefSpecial: true, isRecommended: true, status: 'Active', image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=400&h=300&q=80' },
  { id: 'nv-3', categoryId: 'c-4', name: 'Chicken Handi (Half)', description: '[Type: Non-Veg] Tender chicken pieces cooked in aromatic spices (Serves 2)', price: 299, isVeg: false, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=400&h=300&q=80' },
  { id: 'nv-4', categoryId: 'c-4', name: 'Chicken Handi (Full)', description: '[Type: Non-Veg] Spicy chicken cooked in a handi with rich gravy (Serves 4)', price: 499, isVeg: false, isChefSpecial: true, isRecommended: true, status: 'Active', image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=400&h=300&q=80' },
  { id: 'nv-5', categoryId: 'c-4', name: 'Butter Chicken', description: '[Type: Non-Veg] Tandoori chicken chunks cooked in rich buttery tomato sauce', price: 349, isVeg: false, isChefSpecial: true, isRecommended: true, status: 'Active', image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=400&h=300&q=80' },
  { id: 'nv-6', categoryId: 'c-4', name: 'Chicken Tikka Masala', description: '[Type: Non-Veg] Grilled chicken tikka in spiced curry gravy', price: 320, isVeg: false, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=400&h=300&q=80' },
  { id: 'nv-7', categoryId: 'c-4', name: 'Chicken Biryani', description: '[Type: Non-Veg] Long grain basmati rice and layered spiced chicken', price: 280, isVeg: false, isChefSpecial: true, isRecommended: true, status: 'Active', image: 'https://images.unsplash.com/photo-1563379971899-660589a01cc3?auto=format&fit=crop&w=400&h=300&q=80' },
  { id: 'nv-8', categoryId: 'c-4', name: 'Mutton Biryani', description: '[Type: Non-Veg] Premium basmati rice layered with juicy mutton chunks', price: 360, isVeg: false, isChefSpecial: true, isRecommended: true, status: 'Active', image: 'https://images.unsplash.com/photo-1563379971899-660589a01cc3?auto=format&fit=crop&w=400&h=300&q=80' },
  { id: 'nv-9', categoryId: 'c-4', name: 'Mutton Rogan Josh', description: '[Type: Non-Veg] Kashmiri style mutton cooked in yogurt and saffron gravy', price: 380, isVeg: false, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=400&h=300&q=80' },
  { id: 'nv-10', categoryId: 'c-4', name: 'Chicken Korma', description: '[Type: Non-Veg] Chicken braised with yogurt, cream, and nut paste', price: 310, isVeg: false, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=400&h=300&q=80' },
  { id: 'nv-11', categoryId: 'c-4', name: 'Chicken Tandoori (Half)', description: '[Type: Non-Veg] Clay-oven roasted whole chicken in tandoori red masala', price: 240, isVeg: false, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=400&h=300&q=80' },
  { id: 'nv-12', categoryId: 'c-4', name: 'Chicken Tandoori (Full)', description: '[Type: Non-Veg] Full chicken roasted with tandoori spices and mint chutney', price: 420, isVeg: false, isChefSpecial: true, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=400&h=300&q=80' },
  { id: 'nv-13', categoryId: 'c-4', name: 'Chicken Lollipop', description: '[Type: Non-Veg] Deep-fried seasoned chicken wings served with schezwan sauce', price: 220, isVeg: false, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=400&h=300&q=80' },
  { id: 'nv-14', categoryId: 'c-4', name: 'Chicken Masala', description: '[Type: Non-Veg] Homestyle thick chicken curry with fresh ground spices', price: 280, isVeg: false, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=400&h=300&q=80' },
  { id: 'nv-15', categoryId: 'c-4', name: 'Chicken Kadai', description: '[Type: Non-Veg] Chicken cooked with bell peppers in iron wok', price: 290, isVeg: false, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=400&h=300&q=80' },
  { id: 'nv-16', categoryId: 'c-4', name: 'Egg Masala Curry', description: '[Type: Non-Veg] Hard-boiled eggs in onion-tomato based gravy', price: 160, isVeg: false, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=400&h=300&q=80' },
  { id: 'nv-17', categoryId: 'c-4', name: 'Chicken Chilli Dry', description: '[Type: Non-Veg] Crispy fried chicken bites with capsicum and dark soy', price: 240, isVeg: false, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=400&h=300&q=80' },
  { id: 'nv-18', categoryId: 'c-4', name: 'Chicken Fried Rice', description: '[Type: Non-Veg] Fluffy wok rice tossed with egg, chicken, and green onions', price: 210, isVeg: false, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=400&h=300&q=80' },
  { id: 'nv-19', categoryId: 'c-4', name: 'Chicken Shawarma Wrap', description: '[Type: Non-Veg] Shaved grilled chicken wrapped in rumali roti with garlic mayo', price: 120, isVeg: false, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=400&h=300&q=80' },
  { id: 'nv-20', categoryId: 'c-4', name: 'Chicken Seekh Kebab', description: '[Type: Non-Veg] Spiced skewered minced chicken rolls baked in tandoor', price: 260, isVeg: false, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=400&h=300&q=80' },

  // ================= SEA FOOD ITEMS (20 Items) =================
  { id: 'sf-1', categoryId: 'c-5', name: 'Fish Surmai Fry', description: '[Type: Sea Food] Tawa-fried Surmai steak coated in rava and spice blend', price: 299, isVeg: false, isChefSpecial: true, isRecommended: true, status: 'Active', image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=400&h=300&q=80' },
  { id: 'sf-2', categoryId: 'c-5', name: 'Prawns Masala', description: '[Type: Sea Food] Small prawns cooked in thick spiced coastal gravy', price: 360, isVeg: false, isChefSpecial: true, isRecommended: true, status: 'Active', image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=400&h=300&q=80' },
  { id: 'sf-3', categoryId: 'c-5', name: 'Fish Surmai Thali', description: '[Type: Sea Food] Surmai Fry, Fish Curry, Rice, Solkadhi, and Chapatis', price: 349, isVeg: false, isChefSpecial: true, isRecommended: true, status: 'Active', image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=400&h=300&q=80' },
  { id: 'sf-4', categoryId: 'c-5', name: 'Pomfret Fry', description: '[Type: Sea Food] Whole pomfret tawa fried with Konkani green masala', price: 399, isVeg: false, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=400&h=300&q=80' },
  { id: 'sf-5', categoryId: 'c-5', name: 'Prawns Koliwada', description: '[Type: Sea Food] Deep-fried crunchy prawns with local batter coating', price: 320, isVeg: false, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=400&h=300&q=80' },
  { id: 'sf-6', categoryId: 'c-5', name: 'Fish Curry Goan Style', description: '[Type: Sea Food] Coastal fish cooked in coconut-based tangy tamarind curry', price: 280, isVeg: false, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=400&h=300&q=80' },
  { id: 'sf-7', categoryId: 'c-5', name: 'Crab Masala Curry', description: '[Type: Sea Food] Whole mud crabs simmered in hot and spicy gravy', price: 450, isVeg: false, isChefSpecial: true, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=400&h=300&q=80' },
  { id: 'sf-8', categoryId: 'c-5', name: 'Butter Garlic Prawns', description: '[Type: Sea Food] Juicy prawns tossed in garlic butter with black pepper', price: 380, isVeg: false, isChefSpecial: false, isRecommended: true, status: 'Active', image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=400&h=300&q=80' },
  { id: 'sf-9', categoryId: 'c-5', name: 'Lobster Thermidor', description: '[Type: Sea Food] Gourmet lobster meat cooked in creamy wine sauce with cheese', price: 999, isVeg: false, isChefSpecial: true, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=400&h=300&q=80' },
  { id: 'sf-10', categoryId: 'c-5', name: 'Fish Tikka', description: '[Type: Sea Food] Tandoor roasted boneless fish chunks with tikka marinade', price: 320, isVeg: false, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=400&h=300&q=80' },
  { id: 'sf-11', categoryId: 'c-5', name: 'Squid Chilli Dry', description: '[Type: Sea Food] Tossed squid rings with bell peppers, green chillies, and soy', price: 260, isVeg: false, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=400&h=300&q=80' },
  { id: 'sf-12', categoryId: 'c-5', name: 'Tandoori Pomfret', description: '[Type: Sea Food] Whole pomfret marinated in tandoori spice blend and charcoal-baked', price: 420, isVeg: false, isChefSpecial: true, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=400&h=300&q=80' },
  { id: 'sf-13', categoryId: 'c-5', name: 'Prawns Dum Biryani', description: '[Type: Sea Food] Spiced prawns dum-cooked with long grain basmati rice', price: 340, isVeg: false, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1563379971899-660589a01cc3?auto=format&fit=crop&w=400&h=300&q=80' },
  { id: 'sf-14', categoryId: 'c-5', name: 'Fish Chilli Gravy', description: '[Type: Sea Food] Boneless fish chunks tossed in thick spicy soy gravy', price: 280, isVeg: false, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=400&h=300&q=80' },
  { id: 'sf-15', categoryId: 'c-5', name: 'Oysters Rockefeller', description: '[Type: Sea Food] Baked oysters topped with butter, herbs, and breadcrumbs', price: 599, isVeg: false, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=400&h=300&q=80' },
  { id: 'sf-16', categoryId: 'c-5', name: 'Seafood Hot Soup', description: '[Type: Sea Food] Hot and sour broth with mixed prawns, crab meat, and squid', price: 149, isVeg: false, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1547592165-e1d17f1a0655?auto=format&fit=crop&w=400&h=300&q=80' },
  { id: 'sf-17', categoryId: 'c-5', name: 'Bombil Rava Fry', description: '[Type: Sea Food] Crisp fried Bombay Duck coated with seasoned semolina', price: 199, isVeg: false, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=400&h=300&q=80' },
  { id: 'sf-18', categoryId: 'c-5', name: 'Seafood Fried Rice', description: '[Type: Sea Food] Long grain rice wok-tossed with fresh prawns and squid bits', price: 240, isVeg: false, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=400&h=300&q=80' },
  { id: 'sf-19', categoryId: 'c-5', name: 'Fish Fingers', description: '[Type: Sea Food] Crumbed and deep-fried fish strips served with tartar sauce', price: 220, isVeg: false, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=400&h=300&q=80' },
  { id: 'sf-20', categoryId: 'c-5', name: 'Prawns Fry Tawa', description: '[Type: Sea Food] Fresh prawns pan-fried in ginger-garlic and red chilli paste', price: 290, isVeg: false, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=400&h=300&q=80' }
];

export const PublicQRMenu: React.FC = () => {
  const { qrToken } = useParams<{ qrToken: string }>();
  const API_BASE = window.location.hostname === 'localhost'
    ? 'http://localhost:5000/api'
    : `${window.location.protocol}//${window.location.hostname}:5000/api`;
  const [menu, setMenu] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Customizer styling preset states
  const [logoUrl, setLogoUrl] = useState('https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=120&h=120&q=80');
  const [coverUrl, setCoverUrl] = useState('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&h=400&q=80');
  const [themeColor, setThemeColor] = useState('emerald'); // emerald, amber, rose, indigo, violet
  const [welcomeMsg, setWelcomeMsg] = useState('Welcome to our restaurant! Scan the QR to browse our gourmet dishes.');
  const [enableSpiceLevels, setEnableSpiceLevels] = useState(false);

  // Simulated screens state machine
  const [screen, setScreen] = useState<'menu' | 'details' | 'upsell' | 'cart' | 'summary' | 'customer_details' | 'payment' | 'status' | 'billing' | 'razorpay' | 'invoice' | 'confirmation' | 'payment_failed'>('menu');
  const [foodFilter, setFoodFilter] = useState<'All' | 'Veg' | 'Non-Veg' | 'Sea Food'>('All');

  // Cart and product details states
  const [cart, setCart] = useState<{ item: any; quantity: number; notes: string; selectedAddOns: any[]; spiceLevel?: string }[]>([]);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [detailQty, setDetailQty] = useState(1);
  const [detailNotes, setDetailNotes] = useState('');
  const [spiceLevel, setSpiceLevel] = useState<'Mild' | 'Medium' | 'Hot'>('Medium');
  const [selectedAddOns, setSelectedAddOns] = useState<any[]>([]);

  // Upsell recommendations state
  const [currentUpsellItem, setCurrentUpsellItem] = useState<any>(null);

  // Customer Details
  const [customerName, setCustomerName] = useState('Dine-in Customer');
  const [customerMobile, setCustomerMobile] = useState('0000000000');
  const [customerEmail, setCustomerEmail] = useState('dinein@customer.local');
  const [searchQuery, setSearchQuery] = useState('');

  // Payment option
  const [paymentOption, setPaymentOption] = useState<'Razorpay' | 'Counter'>('Razorpay');

  // Order transaction states
  const [orderPlaced, setOrderPlaced] = useState<any>(null);
  const [trackStatus, setTrackStatus] = useState<'Received' | 'Preparing' | 'Ready' | 'Served'>('Received');
  const [razorpayMethod, setRazorpayMethod] = useState<'UPI' | 'Card' | 'Net' | 'Wallet' | 'QR'>('QR');
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [cartNotification, setCartNotification] = useState<string | null>(null);

  const [selectedUPIApp, setSelectedUPIApp] = useState<string>('GPay');
  const [selectedBank, setSelectedBank] = useState<string>('SBI');
  const [selectedWalletOption, setSelectedWalletOption] = useState<string>('Paytm');
  const [cardNumber, setCardNumber] = useState<string>('4321 8876 5432 1098');
  const [cardExpiry, setCardExpiry] = useState<string>('12/29');
  const [cardCVV, setCardCVV] = useState<string>('123');

  // Explicit state variables for payment method state management
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('QR');
  const [selectedUPI, setSelectedUPI] = useState<string>('GPay');
  const [selectedQR, setSelectedQR] = useState<string>('QR');
  const [selectedCard, setSelectedCard] = useState<string>('4321 8876 5432 1098');
  const [selectedWallet, setSelectedWallet] = useState<string>('Paytm');

  const handleContinueRazorpaySimulated = () => {
    const activeMethod = selectedPaymentMethod || razorpayMethod;
    if (activeMethod === 'QR') {
      if (selectedQR !== 'QR') {
        alert('Please Select Some Option');
        return;
      }
      handleConfirmRazorpayPayment('QR');
      return;
    }
    if (activeMethod === 'Card') {
      if ((!cardNumber && !selectedCard) || !cardExpiry || !cardCVV) {
        alert('Please enter card details');
        return;
      }
    }
    if (activeMethod === 'UPI') {
      if (!selectedUPIApp && !selectedUPI) {
        alert('Please Select Some Option');
        return;
      }
    }
    if (activeMethod === 'Net') {
      if (!selectedBank) {
        alert('Please Select Some Option');
        return;
      }
    }
    if (activeMethod === 'Wallet') {
      if (!selectedWalletOption && !selectedWallet) {
        alert('Please Select Some Option');
        return;
      }
    }
    handleConfirmRazorpayPayment(activeMethod as any);
  };

  // Poll hook for live order KDS status updates
  useEffect(() => {
    if (!orderPlaced) return;
    const orderId = orderPlaced.id || orderPlaced.orderId;
    if (!orderId) return;

    if (orderId.toString().startsWith('ord-')) {
      const steps: ('Received' | 'Preparing' | 'Ready' | 'Served')[] = ['Received', 'Preparing', 'Ready', 'Served'];
      setTrackStatus('Received');
      let stepIndex = 0;
      const interval = setInterval(() => {
        stepIndex++;
        if (stepIndex < steps.length) {
          setTrackStatus(steps[stepIndex]);
        } else {
          clearInterval(interval);
        }
      }, 2000);
      return () => clearInterval(interval);
    }

    const checkStatus = async () => {
      try {
        const response = await fetch(`${API_BASE}/restaurant/orders/${orderId}`);
        if (response.ok) {
          const data = await response.json();
          if (data && data.status) {
            // Map backend status to our local status
            if (data.status === 'NEW' || data.status === 'ACCEPTED') setTrackStatus('Received');
            else if (data.status === 'PREPARING') setTrackStatus('Preparing');
            else if (data.status === 'READY') setTrackStatus('Ready');
            else if (data.status === 'SERVED') {
              setTrackStatus('Served');
            }
          }
        }
      } catch (err) {
        console.error('Error polling status:', err);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, [orderPlaced]);

  const fetchMenu = async () => {
    try {
      const response = await fetch(`${API_BASE}/restaurant/public/menu/${qrToken}`);
      if (!response.ok) throw new Error('Failed to load menu');
      const data = await response.json();

      const dbCats = data.categories || [];
      const mergedCats = [...dbCats];

      defaultCats.forEach(mockCat => {
        const exists = dbCats.some((c: any) => c.name.toLowerCase().trim() === mockCat.name.toLowerCase().trim());
        if (!exists) {
          mergedCats.push({ ...mockCat, menuItems: [] });
        }
      });

      mergedCats.forEach((cat: any) => {
        if (!cat.menuItems) cat.menuItems = [];
        const mockCatId = defaultCats.find(c => c.name.toLowerCase().trim() === cat.name.toLowerCase().trim())?.id;
        if (mockCatId) {
          const mockItemsForCat = defaultItems.filter(item => item.categoryId === mockCatId);
          mockItemsForCat.forEach(mockItem => {
            const itemExists = cat.menuItems.some((i: any) => i.name.toLowerCase().trim() === mockItem.name.toLowerCase().trim());
            if (!itemExists) {
              cat.menuItems.push(mockItem);
            }
          });
        }
      });

      setMenu({
        ...data,
        categories: mergedCats
      });
    } catch (err) {
      console.warn('Utilizing public menu mock fallback.');

      const fallbackCats = defaultCats.map(cat => {
        return {
          ...cat,
          menuItems: defaultItems.filter(item => item.categoryId === cat.id)
        };
      });

      setMenu({
        table: { id: 'mock-t-1', tableNumber: 'Table 5', restaurantId: 'mock-rest' },
        restaurant: { name: 'Gourmet Bistro' },
        categories: fallbackCats
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, [qrToken]);

  // Load Customizer configuration from shared localStorage or URL search params once menu is fetched
  useEffect(() => {
    const loadConfig = () => {
      const params = new URLSearchParams(window.location.search);
      const qTheme = params.get('theme');
      const qLogo = params.get('logo');
      const qCover = params.get('cover');
      const qWelcome = params.get('welcome');
      const qSpice = params.get('spice');
      const qRestId = params.get('restId');

      if (qTheme) setThemeColor(qTheme);
      if (qLogo && !qLogo.startsWith('data:')) setLogoUrl(qLogo);
      if (qCover && !qCover.startsWith('data:')) setCoverUrl(qCover);
      if (qWelcome) setWelcomeMsg(qWelcome);
      if (qSpice) setEnableSpiceLevels(qSpice === 'true');

      const restId = qRestId || menu?.restaurant?.id || menu?.table?.restaurantId;
      if (restId) {
        const savedConfig = localStorage.getItem(`restaurant_menu_config_${restId}`);
        if (savedConfig) {
          try {
            const parsed = JSON.parse(savedConfig);
            if (parsed.logoUrl) setLogoUrl(parsed.logoUrl);
            if (parsed.coverUrl) setCoverUrl(parsed.coverUrl);
            if (parsed.themeColor && !qTheme) setThemeColor(parsed.themeColor);
            if (parsed.welcomeMsg && !qWelcome) setWelcomeMsg(parsed.welcomeMsg);
            if (parsed.enableSpiceLevels !== undefined && !qSpice) setEnableSpiceLevels(parsed.enableSpiceLevels);
          } catch (e) {
            console.error(e);
          }
        }
      }
    };

    loadConfig();

    // Listen for instant postMessage updates from parent Customizer window
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'MENU_CONFIG_UPDATE') {
        const parsed = event.data.config;
        if (parsed.logoUrl) setLogoUrl(parsed.logoUrl);
        if (parsed.coverUrl) setCoverUrl(parsed.coverUrl);
        if (parsed.themeColor) setThemeColor(parsed.themeColor);
        if (parsed.welcomeMsg) setWelcomeMsg(parsed.welcomeMsg);
        if (parsed.enableSpiceLevels !== undefined) setEnableSpiceLevels(parsed.enableSpiceLevels);
      }
    };

    // Listen for storage events as fallback
    const handleStorage = (e: StorageEvent) => {
      const restId = new URLSearchParams(window.location.search).get('restId') || menu?.restaurant?.id || menu?.table?.restaurantId;
      if (restId && e.key === `restaurant_menu_config_${restId}`) {
        try {
          const parsed = JSON.parse(e.newValue || '{}');
          if (parsed.logoUrl) setLogoUrl(parsed.logoUrl);
          if (parsed.coverUrl) setCoverUrl(parsed.coverUrl);
          if (parsed.themeColor) setThemeColor(parsed.themeColor);
          if (parsed.welcomeMsg) setWelcomeMsg(parsed.welcomeMsg);
          if (parsed.enableSpiceLevels !== undefined) setEnableSpiceLevels(parsed.enableSpiceLevels);
        } catch (err) {
          console.error(err);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('storage', handleStorage);
    };
  }, [menu, window.location.search]);

  // Parser helper for food type and descriptions
  const parseFoodTypeAndDescription = (item: any) => {
    const description = item.description || '';
    let type = item.isVeg ? 'Veg' : 'Non-Veg';
    let cleanDesc = description;
    const match = description?.match(/\[Type:\s*(Veg|Non-Veg|Sea Food)\]/);
    if (match) {
      type = match[1];
      cleanDesc = description.replace(/\[Type:\s*(Veg|Non-Veg|Sea Food)\]/, '').trim();
    } else {
      const nameLower = (item.name || '').toLowerCase();
      const descLower = cleanDesc.toLowerCase();
      if (nameLower.includes('fish') || nameLower.includes('prawn') || nameLower.includes('sea') || nameLower.includes('crab') || nameLower.includes('lobster') || descLower.includes('fish') || descLower.includes('prawn') || descLower.includes('seafood')) {
        type = 'Sea Food';
      }
    }
    return { type, cleanDesc };
  };

  // Curated Image Selector Helper
  const getFoodImage = (item: any) => {
    if (item.image && !item.image.includes('unsplash.com/photo-1504674900247-0877df9cc836')) {
      return item.image;
    }
    const name = item.name?.toLowerCase() || '';
    if (name.includes('dal khichadi') || name.includes('khichadi')) return 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=400&h=300&q=80';
    if (name.includes('chole bhature') || name.includes('chole')) return 'https://images.unsplash.com/photo-1627662236973-4f8259fa2441?auto=format&fit=crop&w=400&h=300&q=80';
    if (name.includes('garlic bread')) return 'https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?auto=format&fit=crop&w=400&h=300&q=80';
    if (name.includes('pizza')) return 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=400&h=300&q=80';
    if (name.includes('burger')) return 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&h=300&q=80';
    if (name.includes('paneer')) return 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=400&h=300&q=80';
    if (name.includes('soup') || name.includes('tomato')) return 'https://images.unsplash.com/photo-1547592165-e1d17f1a0655?auto=format&fit=crop&w=400&h=300&q=80';
    if (name.includes('fish') || name.includes('prawn') || name.includes('sea') || name.includes('seafood') || name.includes('surmai') || name.includes('pomfret')) return 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=400&h=300&q=80';
    if (name.includes('biryani') || name.includes('chicken') || name.includes('mutton') || name.includes('curry') || name.includes('handi')) return 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=400&h=300&q=80';
    if (name.includes('naan') || name.includes('roti') || name.includes('bread')) return 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=400&h=300&q=80';
    if (name.includes('noodle') || name.includes('chinese') || name.includes('manchurian')) return 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=400&h=300&q=80';
    if (name.includes('sandwich')) return 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=400&h=300&q=80';
    if (name.includes('pasta')) return 'https://images.unsplash.com/photo-1563379971899-660589a01cc3?auto=format&fit=crop&w=400&h=300&q=80';
    if (name.includes('ice cream') || name.includes('scoop')) return 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=400&h=300&q=80';
    if (name.includes('dessert') || name.includes('cake') || name.includes('sweet') || name.includes('brownie')) return 'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=400&h=300&q=80';
    if (name.includes('mocktail') || name.includes('mojito') || name.includes('lagoon')) return 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=400&h=300&q=80';
    if (name.includes('coffee') || name.includes('tea') || name.includes('beverage') || name.includes('coke') || name.includes('drink')) return 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=400&h=300&q=80';
    return 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&h=300&q=80';
  };

  const getRecommendations = (itemName: string) => {
    const name = itemName.toLowerCase();
    if (name.includes('burger')) {
      return [
        { id: 'rec-1', name: 'French Fries', price: 80, description: 'Crispy golden french fries tossed in sea salt, served hot.', image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=400&h=300&q=80', isVeg: true },
        { id: 'rec-2', name: 'Cold Drink', price: 40, description: 'Chilled refreshing carbonated cola beverage can.', image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=400&h=300&q=80', isVeg: true }
      ];
    }
    if (name.includes('pizza')) {
      return [
        { id: 'rec-4', name: 'Garlic Bread', price: 110, description: 'Fresh oven-toasted bread spread with garlic butter and herbs.', image: 'https://images.unsplash.com/photo-1544982503-9f984c14501a?auto=format&fit=crop&w=400&h=300&q=80', isVeg: true },
        { id: 'rec-5', name: 'Coke Zero', price: 45, description: 'Sugar-free, zero-calorie chilled soft drink can.', image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=400&h=300&q=80', isVeg: true }
      ];
    }
    if (name.includes('fish') || name.includes('prawn') || name.includes('sea') || name.includes('surmai')) {
      return [
        { id: 'rec-10', name: 'Steam Basmati Rice', price: 99, description: 'Fluffy steamed premium long-grain aromatic basmati rice.', image: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=400&h=300&q=80', isVeg: true },
        { id: 'rec-11', name: 'Solkadhi Drink', price: 30, description: 'Traditional coastal digestive beverage made from kokum extract and coconut milk.', image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=400&h=300&q=80', isVeg: true }
      ];
    }
    if (name.includes('paneer') || name.includes('dal')) {
      return [
        { id: 'rec-12', name: 'Jeera Rice', price: 120, description: 'Fragrant long basmati rice tempered with cumin seeds and fresh coriander.', image: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=400&h=300&q=80', isVeg: true },
        { id: 'rec-13', name: 'Butter Tandoori Roti', price: 25, description: 'Whole wheat tandoor-baked flatbread glazed with butter.', image: 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=400&h=300&q=80', isVeg: true }
      ];
    }
    if (name.includes('biryani') || name.includes('chicken') || name.includes('mutton') || name.includes('handi')) {
      return [
        { id: 'rec-14', name: 'Solkadhi Drink', price: 30, description: 'Traditional cooling digestive coconut kokum beverage.', image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=400&h=300&q=80', isVeg: true },
        { id: 'rec-15', name: 'Butter Tandoori Roti', price: 25, description: 'Soft wheat flatbread glazed with butter, baked in clay tandoor.', image: 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=400&h=300&q=80', isVeg: true }
      ];
    }
    if (name.includes('coffee') || name.includes('tea')) {
      return [
        { id: 'rec-16', name: 'Sizzling Brownie', price: 150, description: 'Decadent chocolate brownie served on a sizzler plate with hot fudge.', image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=400&h=300&q=80', isVeg: true }
      ];
    }
    return [
      { id: 'rec-7', name: 'Butter Tandoori Roti', price: 25, description: 'Traditional whole wheat flatbread freshly baked with butter.', image: 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=400&h=300&q=80', isVeg: true },
      { id: 'rec-8', name: 'Sizzling Brownie', price: 150, description: 'Rich chocolate brownie with ice cream and warm chocolate syrup.', image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=400&h=300&q=80', isVeg: true }
    ];
  };

  const handleAddUpsellItem = (item: any) => {
    const mockItem = {
      id: item.id,
      name: item.name,
      price: item.price,
      description: item.description || 'Recommended pairing',
      isVeg: item.isVeg !== undefined ? item.isVeg : true,
      image: item.image
    };
    setCart(prev => {
      const idx = prev.findIndex(entry => entry.item.id === mockItem.id);
      if (idx > -1) {
        const next = [...prev];
        next[idx].quantity += 1;
        return next;
      }
      return [...prev, { item: mockItem, quantity: 1, notes: '', selectedAddOns: [] }];
    });
  };

  const getItemAddons = (item: any) => {
    if (item?.addons && item.addons.length > 0) {
      return item.addons;
    }
    // Fallback Mock Add-ons based on item type/name
    const nameLower = (item?.name || '').toLowerCase();
    if (nameLower.includes('pizza')) {
      return [
        { id: 'ao-pizza-cheese', name: 'Extra Cheese', price: 25, category: 'Cheese', maxQty: 1, isOptional: true },
        { id: 'ao-pizza-pep', name: 'Extra Pepperoni', price: 45, category: 'Toppings', maxQty: 1, isOptional: true },
        { id: 'ao-pizza-crust', name: 'Stuffed Crust', price: 60, category: 'Crust', maxQty: 1, isOptional: true }
      ];
    }
    if (nameLower.includes('burger')) {
      return [
        { id: 'ao-burger-cheese', name: 'Extra Cheese', price: 15, category: 'Cheese', maxQty: 1, isOptional: true },
        { id: 'ao-burger-patty', name: 'Extra Patty', price: 45, category: 'Patty', maxQty: 1, isOptional: true },
        { id: 'ao-burger-dip', name: 'Cheesy Dip', price: 15, category: 'Sides', maxQty: 2, isOptional: true }
      ];
    }
    if (nameLower.includes('chicken') || nameLower.includes('mutton') || nameLower.includes('non-veg') || nameLower.includes('egg') || nameLower.includes('handi')) {
      return [
        { id: 'ao-nv-egg', name: 'Boiled Egg', price: 15, category: 'Extras', maxQty: 2, isOptional: true },
        { id: 'ao-nv-gravy', name: 'Extra Gravy', price: 40, category: 'Sides', maxQty: 1, isOptional: true },
        { id: 'ao-nv-sol', name: 'Extra Solkadhi', price: 30, category: 'Drinks', maxQty: 2, isOptional: true }
      ];
    }
    if (nameLower.includes('dal') || nameLower.includes('paneer') || nameLower.includes('veg') || nameLower.includes('rice') || nameLower.includes('tadka')) {
      return [
        { id: 'ao-v-roti', name: 'Butter Roti', price: 15, category: 'Bread', maxQty: 4, isOptional: true },
        { id: 'ao-v-papad', name: 'Roasted Papad', price: 10, category: 'Sides', maxQty: 2, isOptional: true },
        { id: 'ao-v-raita', name: 'Extra Raita', price: 20, category: 'Sides', maxQty: 1, isOptional: true }
      ];
    }
    if (nameLower.includes('fish') || nameLower.includes('prawn') || nameLower.includes('sea') || nameLower.includes('crab') || nameLower.includes('lobster') || nameLower.includes('surmai')) {
      return [
        { id: 'ao-sf-sol', name: 'Extra Solkadhi', price: 30, category: 'Drinks', maxQty: 2, isOptional: true },
        { id: 'ao-sf-curry', name: 'Extra Curry Cup', price: 50, category: 'Sides', maxQty: 1, isOptional: true }
      ];
    }
    return [
      { id: 'ao-gen-extra', name: 'Extra Portion', price: 30, category: 'Extras', maxQty: 1, isOptional: true },
      { id: 'ao-gen-dip', name: 'Special Dip', price: 15, category: 'Sides', maxQty: 1, isOptional: true }
    ];
  };

  const getThemeStyles = () => {
    switch (themeColor) {
      case 'amber':
        return { bodyBg: 'bg-[#f8f5ee]', cardBg: 'bg-[#faf8f4]', border: 'border-[#dfd3bc]', accent: 'bg-[#8d7751]', accentText: 'text-[#8d7751]', text: 'text-[#2b2721]', mutedText: 'text-[#72695a]', priceText: 'text-[#8d7751]', fontClass: 'font-serif' };
      case 'rose':
        return { bodyBg: 'bg-[#fdfbfc]', cardBg: 'bg-[#fcf8f9]', border: 'border-[#eec2cb]', accent: 'bg-[#be5a6f]', accentText: 'text-[#be5a6f]', text: 'text-[#351c21]', mutedText: 'text-[#7e5860]', priceText: 'text-[#be5a6f]', fontClass: 'font-sans' };
      case 'indigo':
        return { bodyBg: 'bg-[#f0f2f8]', cardBg: 'bg-[#fcfcff]', border: 'border-[#c5cae9]', accent: 'bg-[#3f51b5]', accentText: 'text-[#3f51b5]', text: 'text-[#1e2238]', mutedText: 'text-[#5c607a]', priceText: 'text-[#3f51b5]', fontClass: 'font-sans' };
      case 'violet':
        return { bodyBg: 'bg-[#f6f0f8]', cardBg: 'bg-[#fdfaff]', border: 'border-[#e1bee7]', accent: 'bg-[#7b1fa2]', accentText: 'text-[#7b1fa2]', text: 'text-[#2e1e38]', mutedText: 'text-[#6a5b75]', priceText: 'text-[#7b1fa2]', fontClass: 'font-sans' };
      default:
        return { bodyBg: 'bg-[#f4f7f5]', cardBg: 'bg-[#ffffff]', border: 'border-[#cce5d6]', accent: 'bg-[#0f763c]', accentText: 'text-[#0f763c]', text: 'text-[#122e1f]', mutedText: 'text-[#506d5c]', priceText: 'text-[#0f763c]', fontClass: 'font-sans' };
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'Veg': return <span className="inline-flex items-center px-1.5 py-0.5 rounded border border-emerald-600 text-emerald-600 text-[8px] font-bold bg-emerald-50">🟢 Veg</span>;
      case 'Non-Veg': return <span className="inline-flex items-center px-1.5 py-0.5 rounded border border-red-600 text-red-600 text-[8px] font-bold bg-red-50">🔴 Non-Veg</span>;
      case 'Sea Food': return <span className="inline-flex items-center px-1.5 py-0.5 rounded border border-sky-600 text-sky-600 text-[8px] font-bold bg-sky-50">🍤 Sea Food</span>;
      default: return null;
    }
  };

  const style = getThemeStyles();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  const getCartTotal = () => {
    return cart.reduce((sum, entry) => {
      const basePrice = entry.item.isOnOffer && entry.item.offerPrice ? entry.item.offerPrice : entry.item.price;
      const addonsPrice = entry.selectedAddOns.reduce((s, ao) => s + ao.price, 0);
      return sum + (basePrice + addonsPrice) * entry.quantity;
    }, 0);
  };

  const handleAddToCart = () => {
    if (!selectedItem) return;
    setCart(prev => {
      const idx = prev.findIndex(entry => entry.item.id === selectedItem.id);
      if (idx > -1) {
        const next = [...prev];
        next[idx].quantity += detailQty;
        next[idx].notes = detailNotes;
        next[idx].selectedAddOns = selectedAddOns;
        next[idx].spiceLevel = spiceLevel;
        return next;
      }
      return [...prev, { item: selectedItem, quantity: detailQty, notes: detailNotes, selectedAddOns, spiceLevel }];
    });
    setCurrentUpsellItem(selectedItem);
    setScreen('upsell');
  };

  const handleRemoveFromCart = (id: string) => {
    setCart(prev => prev.filter(entry => entry.item.id !== id));
  };

  const handleConfirmRazorpayPayment = async (methodOverride?: 'UPI' | 'Card' | 'Net' | 'Wallet' | 'QR') => {
    const activeMethod = methodOverride || razorpayMethod;
    setPaymentProcessing(true);
    const subtotal = getCartTotal();
    const discount = subtotal * 0.10;
    const gst = (subtotal - discount) * 0.18;
    const grandTotal = subtotal + gst - discount;

    const itemsPayload = cart.map(entry => ({
      menuItemId: entry.item.id,
      quantity: entry.quantity,
      notes: entry.notes ? `${entry.notes}${enableSpiceLevels ? ` | Spice: ${entry.spiceLevel || 'Medium'}` : ''}${entry.selectedAddOns.length ? ` | Addons: ${entry.selectedAddOns.map(ao => ao.name).join(', ')}` : ''}` : `${enableSpiceLevels ? `Spice: ${entry.spiceLevel || 'Medium'}` : ''}${entry.selectedAddOns.length ? ` | Addons: ${entry.selectedAddOns.map(ao => ao.name).join(', ')}` : ''}`,
      unitPrice: entry.item.isOnOffer && entry.item.offerPrice ? entry.item.offerPrice : entry.item.price
    }));

    try {
      const res = await fetch(`${API_BASE}/restaurant/public/payment/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: grandTotal })
      });
      if (!res.ok) throw new Error('Order creation failed on payment endpoint');
      const orderData = await res.json();

      if (!(window as any).Razorpay) {
        throw new Error('Razorpay SDK not loaded');
      }

      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: menu?.restaurant?.name || 'Gourmet Bistro',
        description: `Table Order: ${menu?.table?.tableNumber || 'Table'}`,
        order_id: orderData.id,
        handler: async function (response: any) {
          setPaymentProcessing(true);
          const body = {
            tableId: menu?.table?.id || 'mock-t-1',
            items: itemsPayload,
            notes: `Cust: ${customerName} | Phone: ${customerMobile}${customerEmail ? ` | Email: ${customerEmail}` : ''} | Method: RAZORPAY-${activeMethod}`,
            paymentMethod: 'RAZORPAY',
            razorpayPaymentId: response.razorpay_payment_id,
            razorpayOrderId: response.razorpay_order_id,
            razorpaySignature: response.razorpay_signature
          };

          try {
            const orderRes = await fetch(`${API_BASE}/restaurant/public/order`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(body)
            });
            if (!orderRes.ok) throw new Error('Order placement failed');
            const data = await orderRes.json();
            setOrderPlaced(data);
            setScreen('confirmation');
          } catch (err) {
            const mockId = `ord-${Date.now().toString().slice(-6)}`;
            setOrderPlaced({
              id: mockId,
              orderId: mockId,
              totalAmount: grandTotal,
              paymentStatus: 'PAID'
            });
            setScreen('confirmation');
          } finally {
            setPaymentProcessing(false);
          }
        },
        prefill: {
          contact: customerMobile || undefined,
          name: customerName || undefined,
          email: customerEmail || undefined
        },
        theme: {
          color: '#059669',
        },
        modal: {
          ondismiss: function () {
            setPaymentProcessing(false);
            setScreen('payment_failed');
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (resp: any) {
        console.error('Razorpay payment failed:', resp.error);
        setScreen('payment_failed');
      });
      rzp.open();

    } catch (err) {
      console.warn('Real Razorpay initialization failed, executing simulated success flow:', err);
      // Fallback to simulated payment success
      setTimeout(async () => {
        const body = {
          tableId: menu?.table?.id || 'mock-t-1',
          items: itemsPayload,
          notes: `Cust: ${customerName} | Phone: ${customerMobile}${customerEmail ? ` | Email: ${customerEmail}` : ''} | Method: RAZORPAY-${activeMethod} (Simulated)`,
          paymentMethod: 'RAZORPAY',
          razorpayPaymentId: `pay_${Math.random().toString(36).substring(2, 11)}`,
          razorpayOrderId: `order_${Math.random().toString(36).substring(2, 11)}`
        };

        try {
          const response = await fetch(`${API_BASE}/restaurant/public/order`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
          });
          const data = await response.json();
          setOrderPlaced(data);
          setScreen('confirmation');
        } catch (e) {
          const mockId = `ord-${Date.now().toString().slice(-6)}`;
          setOrderPlaced({
            id: mockId,
            orderId: mockId,
            totalAmount: grandTotal,
            paymentStatus: 'PAID'
          });
          setScreen('confirmation');
        } finally {
          setPaymentProcessing(false);
        }
      }, 1500);
    }
  };

  const handleCheckout = async () => {
    const subtotal = getCartTotal();
    const discount = subtotal * 0.10;
    const gst = (subtotal - discount) * 0.18;
    const grandTotal = subtotal + gst - discount;

    const itemsPayload = cart.map(entry => ({
      menuItemId: entry.item.id,
      quantity: entry.quantity,
      notes: entry.notes ? `${entry.notes}${enableSpiceLevels ? ` | Spice: ${entry.spiceLevel || 'Medium'}` : ''}${entry.selectedAddOns.length ? ` | Addons: ${entry.selectedAddOns.map(ao => ao.name).join(', ')}` : ''}` : `${enableSpiceLevels ? `Spice: ${entry.spiceLevel || 'Medium'}` : ''}${entry.selectedAddOns.length ? ` | Addons: ${entry.selectedAddOns.map(ao => ao.name).join(', ')}` : ''}`,
      unitPrice: entry.item.isOnOffer && entry.item.offerPrice ? entry.item.offerPrice : entry.item.price
    }));

    if (paymentOption === 'Razorpay') {
      setScreen('razorpay');
    } else {
      const body = {
        tableId: menu?.table?.id || 'mock-t-1',
        items: itemsPayload,
        notes: `Cust: ${customerName} | Phone: ${customerMobile}${customerEmail ? ` | Email: ${customerEmail}` : ''}`,
        paymentMethod: 'COUNTER',
        razorpayPaymentId: null,
        razorpayOrderId: null
      };

      try {
        const response = await fetch(`${API_BASE}/restaurant/public/order`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        const data = await response.json();
        setOrderPlaced(data);
        setScreen('confirmation');
      } catch (err) {
        const mockId = `ord-${Date.now().toString().slice(-6)}`;
        setOrderPlaced({
          id: mockId,
          orderId: mockId,
          totalAmount: grandTotal,
          paymentStatus: 'PENDING'
        });
        setScreen('confirmation');
      }
    }
  };

  const handleResetAll = () => {
    setCart([]);
    setScreen('menu');
    setFoodFilter('All');
    setSelectedItem(null);
    setCustomerName('');
    setCustomerMobile('');
    setCustomerEmail('');
    setSearchQuery('');
    setOrderPlaced(null);
    setTrackStatus('Received');
    setRazorpayMethod('QR');
    setSelectedPaymentMethod('QR');
    setSelectedUPI('GPay');
    setSelectedQR('QR');
    setSelectedCard('4321 8876 5432 1098');
    setSelectedWallet('Paytm');
  };

  const scrollToCategory = (catId: string) => {
    const element = document.getElementById(`public-cat-${catId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const getFilteredItems = (catId: string) => {
    const category = menu?.categories?.find((c: any) => c.id === catId);
    if (!category || !category.menuItems) return [];

    return category.menuItems.filter((item: any) => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description || '').toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      if (foodFilter === 'All') return true;
      const { type } = parseFoodTypeAndDescription(item);
      return type === foodFilter;
    });
  };

  const categories = menu?.categories || [];
  const cartCount = cart.reduce((sum, entry) => sum + entry.quantity, 0);

  return (
    <div className={`h-screen overflow-hidden ${style.bodyBg} ${style.text} ${style.fontClass} flex flex-col justify-between max-w-md mx-auto shadow-2xl relative select-none bg-white`}>
      <style dangerouslySetInnerHTML={{__html: `
        .scrollbar-none::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
        }
        .scrollbar-none {
          -ms-overflow-style: none !important;
          scrollbar-width: none !important;
        }
      `}} />

      {screen === 'menu' && (
        <div className="flex-1 flex flex-col justify-between h-full max-h-full overflow-hidden relative">
          <div className="overflow-y-auto pb-28 scrollbar-none flex-1">
            {/* Cover Banner */}
            <div className="relative h-36 shrink-0 overflow-hidden">
              <img src={coverUrl} alt="Cover" className="w-full h-full object-cover brightness-[0.45]" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              <div className="absolute bottom-4 left-4 right-4 flex items-end gap-3 text-left">
                <img src={logoUrl} alt="Logo" className="w-12 h-12 rounded-full object-cover border border-white/20 bg-slate-800 shrink-0" />
                <div className="leading-tight">
                  <h4 className="font-extrabold text-sm text-white truncate w-48 leading-none mb-1">{menu?.restaurant?.name || 'Gourmet Bistro'}</h4>
                  <span className="text-[9px] text-amber-400 font-extrabold uppercase tracking-widest block leading-none">{menu?.table?.tableNumber || 'Table'} dine-in menu</span>
                </div>
              </div>
            </div>

            {/* Welcome greeting */}
            <div className="text-center px-4 py-2.5 border-b border-amber-900/10 shrink-0">
              <p className={`text-[10px] ${style.mutedText} italic font-serif leading-relaxed`}>"{welcomeMsg}"</p>
            </div>

            {/* Search Bar */}
            <div className="px-4 py-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search pizza, pasta, beverages..."
                className="w-full bg-[#070a13]/5 border border-slate-200 rounded-xl px-3 py-1.5 text-[9px] focus:outline-none"
              />
            </div>

            {/* Category tabs */}
            <div className="flex gap-1 overflow-x-auto px-4 py-2 select-none shrink-0 scrollbar-none bg-white sticky top-0 z-10 border-b border-slate-100">
              {categories.map((cat: any) => (
                <button
                  key={cat.id}
                  onClick={() => scrollToCategory(cat.id)}
                  className={`py-1 px-3 rounded-full text-[8px] font-extrabold transition-all border whitespace-nowrap ${style.mutedText} ${style.cardBg} ${style.border}`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Filter Tabs: All, Veg, Non-Veg, Sea Food */}
            <div className="flex gap-1 overflow-x-auto px-4 py-2 select-none justify-center shrink-0 scrollbar-none">
              {(['All', 'Veg', 'Non-Veg', 'Sea Food'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setFoodFilter(filter)}
                  className={`py-1 px-3 rounded-md text-[8px] font-extrabold transition-all border whitespace-nowrap ${foodFilter === filter
                    ? `${style.accent} border-transparent text-white shadow-sm`
                    : `${style.cardBg} ${style.border} ${style.mutedText}`
                    }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            {/* Catalog Items */}
            <div className="p-4 space-y-6">
              {categories.map((category: any) => {
                const items = getFilteredItems(category.id);
                if (items.length === 0) return null;
                return (
                  <div key={category.id} id={`public-cat-${category.id}`} className="space-y-3 pt-2 border-t border-slate-100/50">
                    <div className="text-left">
                      <h5 className={`text-[10px] uppercase tracking-widest font-extrabold ${style.priceText}`}>{category.name}</h5>
                      <span className="text-[8px] text-slate-400 font-medium block">{category.description}</span>
                    </div>
                    <div className="space-y-3">
                      {items.map((item: any) => {
                        const displayPrice = item.isOnOffer && item.offerPrice ? item.offerPrice : item.price;
                        const { cleanDesc } = parseFoodTypeAndDescription(item);
                        return (
                          <div
                            key={item.id}
                            onClick={() => {
                              setSelectedItem(item);
                              setDetailQty(1);
                              setDetailNotes('');
                              setSpiceLevel('Medium');
                              setSelectedAddOns([]);
                              setScreen('details');
                            }}
                            className="group cursor-pointer select-none text-left"
                          >
                            <div className="flex justify-between items-end gap-1">
                              <div className="flex items-center gap-1.5 truncate">
                                <span className="font-bold text-[10px] truncate tracking-tight">{item.name}</span>
                              </div>
                              <div className="flex-1 border-b border-dashed border-slate-200 mx-1 mb-0.5"></div>
                              <span className={`font-extrabold text-[10px] ${style.priceText} shrink-0`}>₹{displayPrice}</span>
                            </div>
                            <p className={`text-[8px] ${style.mutedText} font-medium mt-0.5 pr-4 line-clamp-1`}>{cleanDesc}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Floating Cart Button */}
          {cartCount > 0 && (
            <div className="absolute bottom-4 right-4 z-30">
              <button
                onClick={() => setScreen('cart')}
                className={`flex items-center gap-1.5 px-3 py-2.5 rounded-full shadow-2xl text-white ${style.accent} hover:scale-105 active:scale-95 transition-all`}
              >
                <div className="relative">
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><line x1="3" x2="21" y1="6" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>
                  <span className="absolute -top-2 -right-2 bg-rose-500 border border-white text-white text-[6px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center animate-bounce">
                    {cartCount}
                  </span>
                </div>
                <span className="text-[7.5px] font-black uppercase tracking-wider pr-1">₹{getCartTotal().toFixed(2)}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {screen === 'details' && selectedItem && (() => {
        const { type, cleanDesc } = parseFoodTypeAndDescription(selectedItem);
        const displayPrice = selectedItem.isOnOffer && selectedItem.offerPrice ? selectedItem.offerPrice : selectedItem.price;
        return (
          <div className="flex-1 flex flex-col justify-between p-4 bg-white text-left h-full max-h-full overflow-hidden">
            <div className="flex-1 overflow-y-auto space-y-4 pb-24 scrollbar-none">
              <button onClick={() => setScreen('menu')} className={`text-[9px] font-extrabold ${style.accentText} uppercase tracking-wider flex items-center gap-1`}>
                ← Back to Menu
              </button>

              <div className="w-full h-44 bg-slate-900 rounded-xl overflow-hidden border">
                <img src={getFoodImage(selectedItem)} alt={selectedItem.name} className="w-full h-full object-cover" />
              </div>

              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    {getTypeBadge(type)}
                    <h4 className="font-extrabold text-sm text-slate-800">{selectedItem.name}</h4>
                  </div>
                  <div className="flex items-center gap-2 mb-1.5 text-[8.5px] font-bold text-amber-500">
                    <span>★ 4.8</span>
                    <span className="text-slate-400">• 200+ Reviews</span>
                    <span className="text-slate-400">• Prep: 15 mins</span>
                  </div>
                  <p className={`text-[8.5px] ${style.mutedText}`}>{cleanDesc || 'Prepared fresh with premium handpicked ingredients.'}</p>
                </div>
                <span className={`text-sm font-black ${style.priceText} shrink-0`}>₹{displayPrice}</span>
              </div>

              {enableSpiceLevels && (
                <div className="space-y-1.5">
                  <span className="text-[8px] font-extrabold uppercase tracking-wider text-slate-400">Select Spice Level</span>
                  <div className="flex gap-2">
                    {(['Mild', 'Medium', 'Hot'] as const).map(level => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setSpiceLevel(level)}
                        className={`py-1 px-3.5 rounded-lg text-[9px] font-bold border transition-all ${spiceLevel === level
                          ? 'bg-amber-500 text-white border-transparent'
                          : 'bg-white border-slate-200 text-slate-600'
                          }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <span className="text-[8px] font-extrabold uppercase tracking-wider text-slate-400">Choose Add-ons</span>
                <div className="space-y-1.5">
                  {getItemAddons(selectedItem).map((addon: any, index: number) => {
                    const isSel = selectedAddOns.some(ao => ao.name === addon.name);
                    return (
                      <label key={addon.id || `ao-${index}`} className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-200/50 cursor-pointer select-none">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isSel}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedAddOns(prev => [...prev, addon]);
                              } else {
                                setSelectedAddOns(prev => prev.filter(ao => ao.name !== addon.name));
                              }
                            }}
                            className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                          />
                          <span className="text-[9px] font-bold text-slate-700">{addon.name}</span>
                        </div>
                        <span className="text-[9px] font-extrabold text-slate-500">+₹{addon.price}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1">
                <label className={`text-[8px] font-bold uppercase tracking-wider ${style.mutedText}`}>Special Instructions</label>
                <input
                  type="text"
                  value={detailNotes}
                  onChange={(e) => setDetailNotes(e.target.value)}
                  placeholder="E.g. No onion, less spicy, make it hot"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[9px] focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-2.5 border-t flex items-center justify-between gap-3 bg-white">
              <div className="flex items-center border border-slate-200 bg-slate-50 rounded-lg overflow-hidden shrink-0">
                <button onClick={() => setDetailQty(q => Math.max(1, q - 1))} className="px-2 py-1.5 text-xs font-bold">-</button>
                <span className="px-3 text-xs font-bold">{detailQty}</span>
                <button onClick={() => setDetailQty(q => q + 1)} className="px-2 py-1.5 text-xs font-bold">+</button>
              </div>

              <button
                onClick={handleAddToCart}
                className={`flex-grow ${style.accent} text-white font-extrabold py-2.5 px-4 rounded-lg text-[10px] uppercase tracking-wider text-center`}
              >
                Add to Cart • ₹{((displayPrice + selectedAddOns.reduce((s, a) => s + a.price, 0)) * detailQty).toFixed(2)}
              </button>
            </div>
          </div>
        );
      })()}

      {screen === 'upsell' && currentUpsellItem && (() => {
        const recs = getRecommendations(currentUpsellItem.name);
        return (
          <div className="flex-grow flex flex-col justify-between p-4 bg-white text-left h-full max-h-full overflow-hidden">
            <div className="flex-1 overflow-y-auto space-y-4 pb-24 scrollbar-none text-left">
              <h4 className="font-extrabold text-sm text-slate-800 border-b pb-2">Frequently Bought Together</h4>
              <p className="text-[10px] text-slate-400 leading-normal">Complete your gourmet dining experience with our popular matches:</p>

              <div className="space-y-4 pt-2">
                {recs.map(item => {
                  const isAdded = cart.some(entry => entry.item.name === item.name);
                  return (
                    <div key={item.id} className={`bg-slate-50 border rounded-3xl p-4 flex flex-col gap-3 shadow-sm relative overflow-hidden transition-all ${isAdded ? 'border-emerald-500 ring-2 ring-emerald-500/10 bg-emerald-50/10' : 'border-slate-200'}`}>
                      <div className="relative w-full h-36 rounded-2xl overflow-hidden border border-slate-100 bg-white shrink-0">
                        <img src={getFoodImage(item)} alt={item.name} className="w-full h-full object-cover" />
                        <div className="absolute top-2.5 left-2.5">
                          {getTypeBadge(item.isVeg ? 'Veg' : 'Non-Veg')}
                        </div>
                      </div>
                      <div className="text-left flex-1 flex flex-col justify-between">
                        <div className="space-y-1.5">
                          <span className="text-[12px] font-black text-slate-800 block leading-tight">{item.name}</span>
                          <p className="text-[9.5px] text-slate-500 leading-relaxed">{item.description}</p>
                        </div>
                        <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-100">
                          <span className="text-[12px] font-black text-emerald-600">₹{item.price}</span>
                          <button
                            onClick={() => {
                              if (isAdded) {
                                setCart(prev => prev.filter(entry => entry.item.name !== item.name));
                              } else {
                                handleAddUpsellItem(item);
                                setCartNotification(`✓ Item Added`);
                                setTimeout(() => {
                                  setCartNotification(null);
                                }, 2500);
                              }
                            }}
                            className={`py-1.5 px-4 rounded-xl text-[9.5px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 ${isAdded ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-600/15' : `${style.accent} text-white hover:opacity-90`}`}
                          >
                            {isAdded ? (
                              <>
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                                Added ✓
                              </>
                            ) : '+ Add'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="pt-3 border-t flex gap-2.5 bg-white">
              <button
                onClick={() => setScreen('menu')}
                className="flex-1 bg-white hover:bg-slate-50 border text-slate-600 font-extrabold py-2.5 rounded-xl text-[9.5px] uppercase tracking-wider text-center"
              >
                Back to Menu
              </button>
              <button
                onClick={() => setScreen('cart')}
                className={`flex-grow ${style.accent} text-white font-extrabold py-2.5 rounded-xl text-[9.5px] uppercase tracking-wider text-center`}
              >
                Checkout Cart →
              </button>
            </div>
          </div>
        );
      })()}

      {screen === 'cart' && (() => {
        const subtotal = getCartTotal();
        const discount = subtotal * 0.10;
        const gst = (subtotal - discount) * 0.18;
        const grandTotal = subtotal + gst - discount;
        return (
          <div className="flex-1 flex flex-col justify-between p-4 bg-white text-left h-full max-h-full overflow-hidden">
            <div className="flex-1 overflow-y-auto space-y-4 pb-24 scrollbar-none">
              <button onClick={() => setScreen('menu')} className={`text-[9px] font-extrabold ${style.accentText} uppercase tracking-wider flex items-center gap-1`}>
                ← Add More Items
              </button>
              <h4 className="font-extrabold text-sm text-slate-800">Your Dining Basket</h4>

              {cart.length === 0 ? (
                <p className="text-[10px] text-slate-400 py-6 text-center italic">Your cart is empty.</p>
              ) : (
                <div className="space-y-3">
                  {cart.map((entry, index) => {
                    const displayPrice = entry.item.isOnOffer && entry.item.offerPrice ? entry.item.offerPrice : entry.item.price;
                    const addonsSum = entry.selectedAddOns.reduce((s, a) => s + a.price, 0);
                    const entryTotal = (displayPrice + addonsSum) * entry.quantity;

                    return (
                      <div key={index} className="flex justify-between items-center pb-2 border-b border-dashed border-slate-200 gap-3">
                        <div className="flex items-center gap-2">
                          <img src={getFoodImage(entry.item)} alt={entry.item.name} className="w-10 h-10 object-cover rounded-lg border border-slate-100 shrink-0 bg-slate-50" />
                          <div className="text-left">
                            <h5 className="font-bold text-[10px] text-slate-800">{entry.item.name} <span className="opacity-60">x {entry.quantity}</span></h5>
                            {enableSpiceLevels && entry.spiceLevel && <span className="text-[8px] text-slate-400 font-bold block">Spice: {entry.spiceLevel}</span>}
                            {entry.selectedAddOns.length > 0 && (
                              <div className="text-[8px] text-slate-400 font-medium">
                                Add-ons: {entry.selectedAddOns.map(ao => `${ao.name} (+₹${ao.price})`).join(', ')}
                              </div>
                            )}
                            {entry.notes && <p className="text-[8px] text-amber-600 font-semibold mt-0.5">Note: "{entry.notes}"</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-[10px] text-slate-800">₹{entryTotal.toFixed(2)}</span>
                          <button onClick={() => handleRemoveFromCart(entry.item.id)} className="text-red-500 hover:text-red-700 text-[9px] font-extrabold uppercase">Remove</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="pt-2 border-t space-y-2">
              {subtotal > 0 && (
                <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200/50 mb-2 text-slate-600">
                  <div className="flex justify-between text-[9px] font-medium"><span>Items total:</span><span>₹{subtotal.toFixed(2)}</span></div>
                  <div className="flex justify-between text-[9px] font-medium text-emerald-600"><span>10% Dine-In discount:</span><span>-₹{discount.toFixed(2)}</span></div>
                  <div className="flex justify-between text-[9px] font-medium"><span>GST (18%):</span><span>₹{gst.toFixed(2)}</span></div>
                  <div className="flex justify-between text-[10px] font-black text-slate-800 border-t pt-1 mt-1"><span>Total Amount:</span><span>₹{grandTotal.toFixed(2)}</span></div>
                </div>
              )}
              <button
                onClick={() => handleConfirmRazorpayPayment()}
                disabled={cart.length === 0}
                className={`w-full ${style.accent} text-white font-extrabold py-2.5 px-3 rounded-lg text-[10px] uppercase tracking-wider text-center disabled:opacity-50`}
              >
                Proceed to Payment →
              </button>
            </div>
          </div>
        );
      })()}

      {screen === 'payment' && (() => {
        const subtotal = getCartTotal();
        const discount = subtotal * 0.10;
        const gst = (subtotal - discount) * 0.18;
        const grandTotal = subtotal + gst - discount;
        return (
          <div className="flex-1 flex flex-col justify-between p-4 bg-white text-left h-full max-h-full overflow-hidden">
            <div className="flex-1 overflow-y-auto space-y-4 pb-24 scrollbar-none">
              <button onClick={() => setScreen('cart')} className={`text-[9px] font-extrabold ${style.accentText} uppercase tracking-wider`}>
                ← Back
              </button>
              <h4 className="font-extrabold text-sm text-slate-800">Payment Method</h4>

              <div className="space-y-3 pt-2">
                <label className="flex items-center justify-between p-3.5 border rounded-xl bg-white cursor-pointer select-none">
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentOption === 'Razorpay'}
                      onChange={() => setPaymentOption('Razorpay')}
                      className="text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                    />
                    <div>
                      <span className="text-[10px] font-extrabold text-slate-800 block">Pay Online (Razorpay)</span>
                      <span className="text-[8px] text-slate-400 block">UPI, Cards, Netbanking & Wallets</span>
                    </div>
                  </div>
                </label>

                <label className="flex items-center justify-between p-3.5 border rounded-xl bg-white cursor-pointer select-none">
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentOption === 'Counter'}
                      onChange={() => setPaymentOption('Counter')}
                      className="text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                    />
                    <div>
                      <span className="text-[10px] font-extrabold text-slate-800 block">Pay At Counter</span>
                      <span className="text-[8px] text-slate-400 block">Settle bill directly at cash register</span>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            <div className="pt-2 border-t space-y-2">
              <div className="flex justify-between text-[11px] font-black text-slate-800">
                <span>Pay Total:</span>
                <span className={style.accentText}>₹{grandTotal.toFixed(2)}</span>
              </div>
              <button
                onClick={handleCheckout}
                className={`w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-2.5 px-3 rounded-lg text-[10px] uppercase tracking-wider text-center`}
              >
                {paymentOption === 'Razorpay' ? 'Proceed to Pay Online' : 'Place Order (Pay At Counter)'}
              </button>
            </div>
          </div>
        );
      })()}

      {screen === 'status' && (() => {
        const steps = ['Received', 'Preparing', 'Ready', 'Served'] as const;
        const curIdx = steps.indexOf(trackStatus);
        return (
          <div className="flex-grow flex flex-col justify-between p-4 bg-slate-950 text-slate-200 text-left h-full max-h-full overflow-hidden">
            <div className="flex-1 overflow-y-auto space-y-5 pb-24 scrollbar-none flex flex-col items-center text-center pt-6">
              <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full flex items-center justify-center shadow-lg animate-pulse mb-2">
                <Clock className="w-6 h-6 animate-spin [animation-duration:8s]" />
              </div>
              <h4 className="font-extrabold text-sm text-white">Live Kitchen Tracking</h4>
              <div className="text-[9px] bg-slate-900 border border-slate-800 rounded-xl p-3 w-full text-left space-y-1.5">
                <div className="flex justify-between text-slate-400"><span>Order ID:</span><span className="font-mono text-emerald-400 font-extrabold">{orderPlaced?.id || orderPlaced?.orderId}</span></div>
                <div className="flex justify-between text-slate-400"><span>Table Assigned:</span><span className="text-white font-extrabold">{menu?.table?.tableNumber || 'Table'}</span></div>
                <div className="flex justify-between text-slate-400"><span>Diner Name:</span><span className="text-white font-extrabold">{customerName || 'Harry'}</span></div>
                <div className="flex justify-between text-slate-400"><span>Preparation Level:</span><span className="text-white font-extrabold capitalize">{trackStatus}</span></div>
              </div>

              <div className="relative w-full pl-6 space-y-3.5 text-left pt-2">
                <div className="absolute left-[9px] top-2 bottom-2 w-0.5 bg-slate-800"></div>
                {steps.map((st, idx) => {
                  const isAct = trackStatus === st;
                  const isDone = curIdx >= idx;
                  return (
                    <div key={st} className="relative flex items-center gap-3">
                      <div className={`absolute left-[-20px] w-2.5 h-2.5 rounded-full border transition-all ${isAct ? 'bg-emerald-500 border-emerald-500 scale-110 shadow-lg shadow-emerald-500/40' : isDone ? 'bg-emerald-600 border-emerald-600' : 'bg-slate-900 border-slate-800'
                        }`} />
                      <span className={`text-[9px] font-bold ${isAct ? 'text-emerald-400' : isDone ? 'text-slate-300' : 'text-slate-600'}`}>{st === 'Received' ? 'Order Received' : st === 'Preparing' ? 'Preparing Meal' : st === 'Ready' ? 'Food Ready' : 'Served to Table'}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="pt-2 border-t border-slate-800 flex flex-col gap-2 w-full">
              <button onClick={() => setScreen('invoice')} className="w-full bg-slate-900 border border-slate-800 text-slate-300 font-extrabold py-2 rounded-lg text-[9px] uppercase tracking-wider text-center">
                View Invoice Receipt
              </button>
              <button onClick={() => setScreen('menu')} className="w-full border border-slate-800 text-slate-500 font-bold py-1 rounded-lg text-[8px] uppercase tracking-wider text-center">
                Back to Menu Catalog
              </button>
            </div>
          </div>
        );
      })()}

      {screen === 'billing' && (() => {
        const subtotal = getCartTotal();
        const discount = subtotal * 0.10;
        const gst = (subtotal - discount) * 0.18;
        const grandTotal = subtotal + gst - discount;
        return (
          <div className="flex-1 flex flex-col justify-between p-4 bg-white text-left h-full max-h-full overflow-hidden">
            <div className="flex-1 overflow-y-auto space-y-4 pb-24 scrollbar-none">
              <h4 className="font-extrabold text-sm text-center border-b pb-2 text-slate-800">Dine-in Summary Bill</h4>

              <div className="space-y-2 text-[9px] pt-1">
                {cart.map((entry, idx) => {
                  const basePrice = entry.item.isOnOffer && entry.item.offerPrice ? entry.item.offerPrice : entry.item.price;
                  const addonsSum = entry.selectedAddOns.reduce((s, a) => s + a.price, 0);
                  const entryTotal = (basePrice + addonsSum) * entry.quantity;
                  return (
                    <div key={idx} className="flex justify-between text-slate-600">
                      <span>{entry.item.name} x {entry.quantity}</span>
                      <span>₹{entryTotal.toFixed(2)}</span>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-dashed pt-2 space-y-1.5 text-[9px] text-slate-500">
                <div className="flex justify-between"><span>Subtotal:</span><span>₹{subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between text-emerald-600"><span>10% Dine-In Promo:</span><span>-₹{discount.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>GST (18%):</span><span>₹{gst.toFixed(2)}</span></div>
              </div>
            </div>

            <div className="pt-2 border-t space-y-2">
              <div className="flex justify-between text-[11px] font-black text-slate-800">
                <span>Grand Total:</span>
                <span className={style.accentText}>₹{grandTotal.toFixed(2)}</span>
              </div>
              {paymentOption === 'Razorpay' ? (
                <button
                  onClick={() => setScreen('razorpay')}
                  className={`w-full ${style.accent} text-white font-extrabold py-2.5 px-3 rounded-lg text-[10px] uppercase tracking-wider text-center`}
                >
                  Pay Online (Razorpay Checkout)
                </button>
              ) : (
                <button
                  onClick={() => setScreen('invoice')}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-white font-extrabold py-2.5 px-3 rounded-lg text-[10px] uppercase tracking-wider text-center"
                >
                  Simulate Cash Bill Settlement
                </button>
              )}
            </div>
          </div>
        );
      })()}

      {screen === 'razorpay' && (() => {
        const subtotal = getCartTotal();
        const discount = subtotal * 0.10;
        const gst = (subtotal - discount) * 0.18;
        const grandTotal = subtotal + gst - discount;
        return (
          <div className="flex-1 flex flex-col justify-between p-4 bg-[#1c2438] text-white text-left rounded-b-2xl h-full max-h-full overflow-hidden">
            <div className="flex-1 overflow-y-auto scrollbar-none space-y-4 pb-4">
              {paymentProcessing ? (
                <div className="space-y-3 py-10 text-center">
                  <Loader2 className="h-8 w-8 text-[#3399cc] animate-spin mx-auto" />
                  <h5 className="text-[10px] font-bold text-slate-300">Authorizing Payment...</h5>
                  <p className="text-[7.5px] text-slate-500">Processing secure transaction via Razorpay API</p>
                </div>
              ) : (
                <div className="w-full space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-700 pb-2 text-left justify-start">
                    <div className="w-5 h-5 bg-[#3399cc] rounded flex items-center justify-center font-black text-white text-[10px]">R</div>
                    <div>
                      <h5 className="text-[10px] font-bold leading-none">Razorpay Gateway</h5>
                      <span className="text-[7.5px] text-[#3399cc] font-extrabold uppercase">Secure Dine-In Gateway</span>
                    </div>
                  </div>

                  <div className="bg-[#141b29] p-3 rounded-xl text-left space-y-2">
                    <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block">Select Payment Mode</span>
                    <div className="grid grid-cols-2 gap-2">
                      {(['UPI', 'Card', 'Net', 'Wallet', 'QR'] as const).map(mode => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => {
                            setRazorpayMethod(mode);
                            setSelectedPaymentMethod(mode);
                            if (mode === 'QR') {
                              setSelectedQR('QR');
                            }
                          }}
                          className={`py-2 px-3 rounded-lg border text-[9px] font-extrabold uppercase text-center transition-all ${razorpayMethod === mode || selectedPaymentMethod === mode
                            ? 'bg-[#3399cc]/15 border-[#3399cc] text-white'
                            : 'border-slate-800 bg-[#1c2438]/50 text-slate-400'
                            }`}
                        >
                          {mode === 'Net' ? 'Net Banking' : mode === 'QR' ? 'UPI QR Pay' : mode}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Dynamic Sub-Payment Method Details / Input Forms */}
                  {(razorpayMethod === 'QR' || selectedPaymentMethod === 'QR') && (
                    <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-slate-700/50 mt-2">
                      <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`upi://pay?pa=gourmetbistro@paytm&pn=GourmetBistro&am=${grandTotal}`)}`} alt="UPI QR Code" className="w-28 h-28 object-contain" />
                      <span className="text-[9px] text-slate-800 font-extrabold mt-2 uppercase tracking-wide">Scan QR Code using any UPI App</span>
                    </div>
                  )}

                  {(razorpayMethod === 'UPI' || selectedPaymentMethod === 'UPI') && (
                    <div className="bg-[#141b29] p-3 rounded-xl text-left space-y-2 mt-2">
                      <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block">Select UPI App</span>
                      <div className="grid grid-cols-2 gap-2">
                        {(['GPay', 'PhonePe', 'Paytm', 'BHIM'] as const).map(app => (
                          <button
                            key={app}
                            type="button"
                            onClick={() => {
                              setSelectedUPIApp(app);
                              setSelectedUPI(app);
                            }}
                            className={`py-1.5 px-3 rounded-lg border text-[8.5px] font-bold text-center transition-all ${selectedUPIApp === app || selectedUPI === app
                              ? 'bg-[#3399cc]/15 border-[#3399cc] text-white'
                              : 'border-slate-800 bg-[#1c2438]/30 text-slate-400'
                              }`}
                          >
                            {app}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {(razorpayMethod === 'Card' || selectedPaymentMethod === 'Card') && (
                    <div className="bg-[#141b29] p-3 rounded-xl text-left space-y-2.5 mt-2">
                      <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block">Enter Card Details</span>
                      <div className="space-y-2">
                        <input
                          type="text"
                          placeholder="Card Number (e.g. 4321 8876 5432 1098)"
                          value={cardNumber}
                          onChange={(e) => {
                            setCardNumber(e.target.value);
                            setSelectedCard(e.target.value);
                          }}
                          className="w-full bg-[#1c2438] border border-slate-800 rounded-lg px-2.5 py-1.5 text-[9px] text-white focus:outline-none focus:border-[#3399cc]"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="MM/YY"
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.target.value)}
                            className="w-full bg-[#1c2438] border border-slate-800 rounded-lg px-2.5 py-1.5 text-[9px] text-white focus:outline-none focus:border-[#3399cc]"
                          />
                          <input
                            type="password"
                            placeholder="CVV"
                            value={cardCVV}
                            onChange={(e) => setCardCVV(e.target.value)}
                            className="w-full bg-[#1c2438] border border-slate-800 rounded-lg px-2.5 py-1.5 text-[9px] text-white focus:outline-none focus:border-[#3399cc]"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {(razorpayMethod === 'Net' || selectedPaymentMethod === 'Net') && (
                    <div className="bg-[#141b29] p-3 rounded-xl text-left space-y-2 mt-2">
                      <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block">Select Popular Bank</span>
                      <div className="grid grid-cols-2 gap-2">
                        {(['SBI', 'HDFC', 'ICICI', 'AXIS'] as const).map(bank => (
                          <button
                            key={bank}
                            type="button"
                            onClick={() => setSelectedBank(bank)}
                            className={`py-1.5 px-3 rounded-lg border text-[8.5px] font-bold text-center transition-all ${selectedBank === bank
                              ? 'bg-[#3399cc]/15 border-[#3399cc] text-white'
                              : 'border-slate-800 bg-[#1c2438]/30 text-slate-400'
                              }`}
                          >
                            {bank}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {(razorpayMethod === 'Wallet' || selectedPaymentMethod === 'Wallet') && (
                    <div className="bg-[#141b29] p-3 rounded-xl text-left space-y-2 mt-2">
                      <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block">Select Wallet</span>
                      <div className="grid grid-cols-2 gap-2">
                        {(['Paytm', 'PhonePe', 'AmazonPay', 'Mobikwik'] as const).map(wallet => (
                          <button
                            key={wallet}
                            type="button"
                            onClick={() => {
                              setSelectedWalletOption(wallet);
                              setSelectedWallet(wallet);
                            }}
                            className={`py-1.5 px-3 rounded-lg border text-[8.5px] font-bold text-center transition-all ${selectedWalletOption === wallet || selectedWallet === wallet
                              ? 'bg-[#3399cc]/15 border-[#3399cc] text-white'
                              : 'border-slate-800 bg-[#1c2438]/30 text-slate-400'
                              }`}
                          >
                            {wallet}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="bg-[#141b29] p-2.5 rounded-lg flex justify-between items-center text-[10px] font-bold">
                    <span className="text-slate-400">Total Amount:</span>
                    <span className="text-emerald-400">₹{grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>

            {!paymentProcessing && (
              <div className="pt-2 border-t border-slate-800 shrink-0">
                <button
                  onClick={handleContinueRazorpaySimulated}
                  className="w-full bg-[#3399cc] hover:bg-[#2e8ab8] text-white font-extrabold py-2.5 px-3 rounded-lg text-[10px] uppercase tracking-wider text-center"
                >
                  Continue
                </button>
              </div>
            )}
          </div>
        );
      })()}

      {screen === 'invoice' && (() => {
        const subtotal = getCartTotal();
        const discount = subtotal * 0.10;
        const gst = (subtotal - discount) * 0.18;
        const grandTotal = subtotal + gst - discount;
        const invoiceNum = `INV-${Date.now().toString().slice(-6)}`;
        return (
          <div className="flex-1 flex flex-col justify-between p-4 bg-[#f8fafc] text-[#1e293b] text-left h-full max-h-full overflow-hidden">
            <div className="flex-1 overflow-y-auto space-y-4 pb-24 scrollbar-none text-center">
              <button onClick={() => setScreen('status')} className="text-[9px] font-extrabold text-emerald-600 uppercase tracking-wider self-start mb-2 block">
                ← Back to Tracking
              </button>
              {/* Tick indicator */}
              <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-md mb-2">
                <Check className="w-5 h-5 font-black" />
              </div>
              <h4 className="font-extrabold text-[12px] text-slate-800">{paymentOption === 'Razorpay' ? 'Order Settled Successfully!' : 'Order Placed successfully!'}</h4>
              {paymentOption === 'Razorpay' ? (
                <span className="text-[8px] text-emerald-600 font-extrabold uppercase bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-full">Paid Invoice</span>
              ) : (
                <span className="text-[8px] text-amber-600 font-extrabold uppercase bg-amber-50 border border-amber-100 px-2.5 py-0.5 rounded-full">Payment Pending at Counter</span>
              )}

              <div className="border-t border-b border-dashed border-slate-200 py-3 mt-3 space-y-2 text-left text-[9px]">
                <div className="flex justify-between"><span className="text-slate-400">Restaurant:</span><span className="font-bold">{menu?.restaurant?.name || 'Gourmet Bistro'}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Invoice Number:</span><span className="font-mono font-bold">{invoiceNum}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Order Number:</span><span className="font-mono font-bold">{orderPlaced?.id || orderPlaced?.orderId}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Diner Name:</span><span className="font-bold">{customerName || 'Harry'}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Table:</span><span className="font-bold">{menu?.table?.tableNumber || 'Table 5'}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Payment Status:</span><span className={`font-bold uppercase ${paymentOption === 'Razorpay' ? 'text-emerald-600' : 'text-amber-500'}`}>{paymentOption === 'Razorpay' ? 'PAID' : 'PENDING'}</span></div>

                <div className="pt-2 border-t">
                  <span className="text-slate-400 font-bold uppercase tracking-wider block mb-1">Receipt Summary</span>
                  {cart.map((entry, idx) => {
                    const basePrice = entry.item.isOnOffer && entry.item.offerPrice ? entry.item.offerPrice : entry.item.price;
                    const addonsSum = entry.selectedAddOns.reduce((s, a) => s + a.price, 0);
                    const entryTotal = (basePrice + addonsSum) * entry.quantity;
                    return (
                      <div key={idx} className="flex justify-between text-[8px] text-slate-600">
                        <span>{entry.item.name} x {entry.quantity}</span>
                        <span>₹{entryTotal.toFixed(2)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="text-left text-[9px] space-y-1 pt-1 text-slate-500">
                <div className="flex justify-between"><span>Subtotal:</span><span>₹{subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Dine-in Discount (10%):</span><span>-₹{discount.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>GST (18%):</span><span>₹{gst.toFixed(2)}</span></div>
                <div className="flex justify-between font-black text-slate-800 text-[10px] pt-1 border-t border-dashed">
                  <span>Total Amount Paid:</span>
                  <span>₹{grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t space-y-2 bg-white">
              <button
                onClick={() => alert('PDF Invoice generated and downloaded successfully (Simulated)')}
                className="w-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-extrabold py-2 px-3 rounded-lg text-[9px] uppercase tracking-wider text-center flex justify-center items-center gap-1"
              >
                Download PDF Invoice
              </button>
              <button
                onClick={handleResetAll}
                className={`w-full ${style.accent} text-white font-extrabold py-2 px-3 rounded-lg text-[9px] uppercase tracking-wider text-center`}
              >
                Order Again / Close
              </button>
            </div>
          </div>
        );
      })()}

      {screen === 'confirmation' && (() => {
        return (
          <div className="flex-grow flex flex-col justify-between p-6 bg-slate-900 text-white text-center rounded-b-2xl h-full max-h-full overflow-hidden">
            <div className="flex-1 overflow-y-auto space-y-5 pb-24 scrollbar-none flex flex-col items-center justify-start pt-6">
              <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/20 animate-bounce mb-2">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>
              <h4 className="font-black text-xl text-white tracking-tight">Order Confirmed!</h4>
              <p className="text-[10.5px] text-slate-400 max-w-[280px]">
                Your food order has been successfully placed and routed directly to the kitchen display system (KDS).
              </p>

              <div className="bg-slate-800/80 border border-slate-700/50 rounded-2xl p-4 w-full text-left space-y-2.5 shadow-xl">
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Order ID:</span>
                  <span className="font-mono text-emerald-400 font-extrabold">{orderPlaced?.id || orderPlaced?.orderId || 'ORD-99281'}</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Table Number:</span>
                  <span className="text-white font-extrabold">{menu?.table?.tableNumber || 'Table 5'}</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Payment Mode:</span>
                  <span className="text-white font-extrabold uppercase">{paymentOption === 'Razorpay' ? 'Paid Online' : 'Pay At Counter'}</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 border-t border-slate-700/50 pt-2.5 mt-1">
                  <span>Est. Prep Time:</span>
                  <span className="text-amber-400 font-extrabold flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 animate-pulse" /> 15 - 20 Mins
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 space-y-2">
              <button
                onClick={() => setScreen('status')}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3 px-4 rounded-xl text-[10px] uppercase tracking-wider text-center shadow-lg shadow-emerald-600/20"
              >
                Track Live Order Status
              </button>
              <button
                onClick={() => setScreen('menu')}
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 px-4 rounded-xl text-[9px] uppercase tracking-wider text-center"
              >
                Back to Menu
              </button>
            </div>
          </div>
        );
      })()}

      {screen === 'payment_failed' && (() => {
        return (
          <div className="flex-grow flex flex-col justify-between p-6 bg-slate-900 text-white text-center rounded-b-2xl">
            <div className="flex-grow flex flex-col justify-center items-center space-y-5">
              <div className="w-16 h-16 bg-rose-500/20 border border-rose-500/40 text-rose-400 rounded-full flex items-center justify-center shadow-lg shadow-rose-500/20 animate-bounce mb-2">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h4 className="font-black text-xl text-white tracking-tight">Payment Failed</h4>
              <p className="text-[10.5px] text-slate-400 max-w-[280px]">
                Your online payment transaction was declined or cancelled. No amount has been deducted.
              </p>

              <div className="bg-slate-800/80 border border-slate-700/50 rounded-2xl p-4 w-full text-left space-y-2.5 shadow-xl">
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Status:</span>
                  <span className="text-rose-400 font-extrabold uppercase">Declined</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Payment Gateway:</span>
                  <span className="text-white font-extrabold">Razorpay Secure</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 border-t border-slate-700/50 pt-2.5 mt-1">
                  <span>Error Code:</span>
                  <span className="text-slate-300 font-mono">PAYMENT_USER_CANCELLED</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 space-y-2">
              <button
                onClick={() => handleConfirmRazorpayPayment()}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3 px-4 rounded-xl text-[10px] uppercase tracking-wider text-center shadow-lg shadow-emerald-600/20"
              >
                Retry Payment
              </button>
              <button
                onClick={() => setScreen('cart')}
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 px-4 rounded-xl text-[9px] uppercase tracking-wider text-center"
              >
                Return to Cart
              </button>
            </div>
          </div>
        );
      })()}

      {cartNotification && (
        <div className="absolute bottom-20 left-4 right-4 bg-emerald-600 text-white text-[10px] font-extrabold py-3 px-4 rounded-xl shadow-lg flex items-center justify-between animate-bounce z-50">
          <span>{cartNotification}</span>
          <button onClick={() => setCartNotification(null)} className="text-white hover:text-slate-200">✕</button>
        </div>
      )}

    </div>
  );
};

export default PublicQRMenu;
