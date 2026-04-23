-- ============================================
-- MERCAFACIL — DATOS INICIALES (Jaén)
-- ============================================

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;
USE mercafacil_db;

-- ============================================
-- CATEGORIES
-- ============================================
INSERT INTO categories (id, name, icon, color, bg_color, count) VALUES
(1, 'Aceite y Conservas', '🫒', '#92400e', '#fef3c7', 245),
(2, 'Frutas y Verduras',  '🍊', '#15803d', '#f0fdf4', 312),
(3, 'Carnicería',         '🥩', '#b91c1c', '#fef2f2', 189),
(4, 'Lácteos',            '🥛', '#2563eb', '#eff6ff', 156),
(5, 'Panadería',          '🍞', '#d97706', '#fffbeb',  98),
(6, 'Charcutería',        '🥓', '#be185d', '#fdf2f8', 134);

-- ============================================
-- STORES (supermercados de Jaén)
-- ============================================
INSERT INTO stores (id, name, logo, color, bg_color, address, city, phone, hours, rating, delivery_time, min_order, delivery_fee, category) VALUES
(1, 'Mercadona', 'M', '#00863e', '#f0fdf4', 'Av. de Madrid, 85',             'Jaén, 23009', '953 25 18 60', 'L-D: 09:00–21:30', 4.50, '1-3h', 50, 7.21, 'Supermercado'),
(2, 'Alcampo',   'A', '#e2001a', '#fff5f5', 'Jaén Plaza, Av. del Ejército s/n','Jaén, 23008', '953 08 55 00', 'L-D: 09:00–22:00', 4.20, '2-4h', 30, 4.90, 'Hipermercado'),
(3, 'Lidl',      'L', '#0050aa', '#eff6ff', 'C/ Pedro Sánchez Nuño, 19',     'Jaén, 23007', '800 200 660',  'L-D: 09:00–21:00', 4.30, '2-4h', 20, 3.99, 'Supermercado'),
(4, 'Carrefour', 'C', '#1945a2', '#eff6ff', 'C/ Arquitecto Berges, 12',      'Jaén, 23004', '953 27 80 00', 'L-D: 09:00–21:00', 4.00, '2-5h', 30, 5.90, 'Supermercado'),
(5, 'DIA',       'D', '#e62d31', '#fff5f5', 'C/ Roldán y Marín, 5',          'Jaén, 23001', '953 23 10 40', 'L-S: 09:00–21:00', 3.80, '3-5h', 25, 3.99, 'Supermercado');

-- ============================================
-- PRODUCTS
-- ============================================
INSERT INTO products (id, name, category, image, description, unit) VALUES
(1, 'Aceite de Oliva Virgen Extra Picual 1L', 'Aceite y Conservas',
   'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&q=80',
   'AOVE de primera calidad, producido en Jaén', '1L'),

(2, 'Tomates Pera de Temporada (1kg)', 'Frutas y Verduras',
   'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=400&q=80',
   'Tomates frescos de producción local', '1kg'),

(3, 'Pan de Pueblo Artesano (600g)', 'Panadería',
   'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&q=80',
   'Pan artesano de masa madre, horneado diariamente', '600g'),

(4, 'Leche Entera Brick 1L', 'Lácteos',
   'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&q=80',
   'Leche entera de vaca UHT', '1L'),

(5, 'Aceitunas Manzanilla en Lata (500g)', 'Aceite y Conservas',
   'https://images.unsplash.com/photo-1598965675045-45c5e72c7d05?w=400&q=80',
   'Aceitunas verdes sin hueso en salmuera', '500g'),

(6, 'Chorizo Extra Ibérico (250g)', 'Charcutería',
   'https://images.unsplash.com/photo-1612204103590-b67f06e43f4b?w=400&q=80',
   'Chorizo de cerdo ibérico curado al pimentón', '250g'),

(7, 'Naranjas de Temporada (malla 2kg)', 'Frutas y Verduras',
   'https://images.unsplash.com/photo-1547514701-42782101795e?w=400&q=80',
   'Naranjas de zumo frescas y dulces', '2kg'),

(8, 'Jamón Serrano Reserva Loncheado (100g)', 'Charcutería',
   'https://images.unsplash.com/photo-1536304993881-ff86e0c9b22d?w=400&q=80',
   'Jamón serrano de bodega, curación 12 meses', '100g');

-- ============================================
-- STORE OFFERS
-- ============================================

-- Producto 1: Aceite de Oliva Virgen Extra
INSERT INTO store_offers (product_id, store_id, store_name, price, original_price, in_stock, brand) VALUES
(1, 1, 'Mercadona', 4.95, NULL,  TRUE,  'Hacendado'),
(1, 2, 'Alcampo',   4.49, NULL,  TRUE,  'Auchan'),
(1, 3, 'Lidl',      4.29, NULL,  TRUE,  'Vitaland'),
(1, 4, 'Carrefour', 4.79, NULL,  TRUE,  'Carrefour'),
(1, 5, 'DIA',       4.19, NULL,  TRUE,  'DIA');

-- Producto 2: Tomates Pera
INSERT INTO store_offers (product_id, store_id, store_name, price, original_price, in_stock, brand) VALUES
(2, 1, 'Mercadona', 1.89, NULL,  TRUE,  'Granja Propia'),
(2, 3, 'Lidl',      1.59, NULL,  TRUE,  'Lidl Fresh'),
(2, 2, 'Alcampo',   1.79, NULL,  TRUE,  'Bio Village'),
(2, 5, 'DIA',       1.69, NULL,  FALSE, 'DIA Fresh');

-- Producto 3: Pan de Pueblo
INSERT INTO store_offers (product_id, store_id, store_name, price, original_price, in_stock, brand) VALUES
(3, 1, 'Mercadona', 1.35, NULL, TRUE, 'Hacendado'),
(3, 2, 'Alcampo',   1.25, NULL, TRUE, 'Auchan'),
(3, 4, 'Carrefour', 1.29, NULL, TRUE, 'Carrefour');

-- Producto 4: Leche Entera
INSERT INTO store_offers (product_id, store_id, store_name, price, original_price, in_stock, brand) VALUES
(4, 1, 'Mercadona', 0.89, NULL, TRUE, 'Hacendado'),
(4, 3, 'Lidl',      0.79, NULL, TRUE, 'Milbona'),
(4, 4, 'Carrefour', 0.85, NULL, TRUE, 'Carrefour'),
(4, 5, 'DIA',       0.75, NULL, TRUE, 'DIA');

-- Producto 5: Aceitunas Manzanilla
INSERT INTO store_offers (product_id, store_id, store_name, price, original_price, in_stock, brand) VALUES
(5, 1, 'Mercadona', 2.35, NULL, TRUE, 'Hacendado'),
(5, 2, 'Alcampo',   2.15, NULL, TRUE, 'Jolca'),
(5, 5, 'DIA',       1.99, NULL, TRUE, 'DIA');

-- Producto 6: Chorizo Extra Ibérico
INSERT INTO store_offers (product_id, store_id, store_name, price, original_price, in_stock, brand) VALUES
(6, 1, 'Mercadona', 3.49, NULL, TRUE,  'Hacendado'),
(6, 4, 'Carrefour', 3.29, NULL, TRUE,  'El Pozo'),
(6, 5, 'DIA',       3.19, NULL, FALSE, 'DIA');

-- Producto 7: Naranjas
INSERT INTO store_offers (product_id, store_id, store_name, price, original_price, in_stock, brand) VALUES
(7, 1, 'Mercadona', 2.49, NULL, TRUE, 'Granja Propia'),
(7, 3, 'Lidl',      1.99, NULL, TRUE, 'Lidl Fresh'),
(7, 2, 'Alcampo',   2.29, NULL, TRUE, 'Bio Village');

-- Producto 8: Jamón Serrano
INSERT INTO store_offers (product_id, store_id, store_name, price, original_price, in_stock, brand) VALUES
(8, 1, 'Mercadona', 2.89, NULL, TRUE, 'Hacendado'),
(8, 2, 'Alcampo',   2.65, NULL, TRUE, 'Campofrío'),
(8, 4, 'Carrefour', 2.79, NULL, TRUE, 'El Pozo');

-- ============================================
-- DELIVERY ZONES (zonas de Jaén, sin tienda asociada)
-- ============================================
INSERT INTO delivery_zones (store_id, zone, fee, min_time, max_time, available) VALUES
(NULL, 'Jaén Centro (23001–23003)',  2.99, '1h', '3h', TRUE),
(NULL, 'Jaén Norte (23004–23006)',   2.99, '1h', '4h', TRUE),
(NULL, 'Jaén Sur (23007–23009)',     3.99, '2h', '4h', TRUE),
(NULL, 'Martos y alrededores',       4.99, '3h', '6h', FALSE),
(NULL, 'Linares y Bailén',           4.99, '3h', '6h', FALSE);
