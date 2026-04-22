-- ============================================
-- MERCAFACIL DATABASE SCHEMA
-- ============================================

USE mercafacil_db;

-- ============================================
-- TABLA: CATEGORIES
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
    id          INT PRIMARY KEY AUTO_INCREMENT,
    name        VARCHAR(100) NOT NULL,
    icon        VARCHAR(255),
    color       VARCHAR(7)  DEFAULT '#000000',
    bg_color    VARCHAR(7)  DEFAULT '#FFFFFF',
    count       INT         DEFAULT 0,
    created_at  TIMESTAMP   DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA: STORES
-- ============================================
CREATE TABLE IF NOT EXISTS stores (
    id            INT PRIMARY KEY AUTO_INCREMENT,
    name          VARCHAR(100) NOT NULL,
    logo          VARCHAR(10),
    color         VARCHAR(7),
    bg_color      VARCHAR(7),
    address       VARCHAR(255) NOT NULL,
    city          VARCHAR(100) NOT NULL,
    phone         VARCHAR(20),
    hours         VARCHAR(50),
    rating        DECIMAL(3, 2),
    delivery_time VARCHAR(50),
    min_order     INT,
    delivery_fee  DECIMAL(8, 2),
    category      VARCHAR(50),
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA: PRODUCTS
-- ============================================
CREATE TABLE IF NOT EXISTS products (
    id          INT PRIMARY KEY AUTO_INCREMENT,
    name        VARCHAR(255) NOT NULL,
    category    VARCHAR(100) NOT NULL,
    image       LONGTEXT,
    description LONGTEXT,
    unit        VARCHAR(50),
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA: STORE_OFFERS
-- ============================================
CREATE TABLE IF NOT EXISTS store_offers (
    id             INT PRIMARY KEY AUTO_INCREMENT,
    product_id     INT         NOT NULL,
    store_id       INT         NOT NULL,
    store_name     VARCHAR(100),
    price          DECIMAL(10, 2) NOT NULL,
    original_price DECIMAL(10, 2),
    in_stock       BOOLEAN     DEFAULT TRUE,
    brand          VARCHAR(100),
    created_at     TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (store_id)   REFERENCES stores(id)   ON DELETE CASCADE,
    UNIQUE KEY unique_offer (product_id, store_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA: DELIVERY_ZONES
-- store_id es nullable: las zonas son generales de la plataforma
-- ============================================
CREATE TABLE IF NOT EXISTS delivery_zones (
    id         INT PRIMARY KEY AUTO_INCREMENT,
    store_id   INT          NULL DEFAULT NULL,
    zone       VARCHAR(100) NOT NULL,
    fee        DECIMAL(8, 2),
    min_time   VARCHAR(50),
    max_time   VARCHAR(50),
    available  BOOLEAN      DEFAULT TRUE,
    created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_products_category   ON products(category);
CREATE INDEX idx_store_offers_product ON store_offers(product_id);
CREATE INDEX idx_store_offers_store   ON store_offers(store_id);
