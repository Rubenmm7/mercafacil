SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;
USE mercafacil_db;

CREATE TABLE IF NOT EXISTS categories (
    id          BIGINT       PRIMARY KEY AUTO_INCREMENT,
    name        VARCHAR(100) NOT NULL,
    icon        VARCHAR(255),
    color       VARCHAR(7)   DEFAULT '#000000',
    bg_color    VARCHAR(7)   DEFAULT '#FFFFFF',
    count       INT          DEFAULT 0,
    created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS stores (
    id            BIGINT       PRIMARY KEY AUTO_INCREMENT,
    name          VARCHAR(100) NOT NULL,
    logo          VARCHAR(10),
    color         VARCHAR(7),
    bg_color      VARCHAR(7),
    address       VARCHAR(255) NOT NULL,
    city          VARCHAR(100) NOT NULL,
    phone         VARCHAR(20),
    hours         VARCHAR(50),
    rating        DOUBLE,
    delivery_time VARCHAR(50),
    min_order     INT,
    delivery_fee  DOUBLE,
    category      VARCHAR(50),
    created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS products (
    id          BIGINT       PRIMARY KEY AUTO_INCREMENT,
    name        VARCHAR(255) NOT NULL,
    category    VARCHAR(100) NOT NULL,
    image       LONGTEXT,
    description LONGTEXT,
    unit        VARCHAR(50),
    created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS store_offers (
    id             BIGINT       PRIMARY KEY AUTO_INCREMENT,
    product_id     BIGINT       NOT NULL,
    store_id       BIGINT       NOT NULL,
    store_name     VARCHAR(100),
    price          DOUBLE       NOT NULL,
    original_price DOUBLE,
    in_stock       BOOLEAN      DEFAULT TRUE,
    brand          VARCHAR(100),
    created_at     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (store_id)   REFERENCES stores(id)   ON DELETE CASCADE,
    UNIQUE KEY unique_offer (product_id, store_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS delivery_zones (
    id         BIGINT       PRIMARY KEY AUTO_INCREMENT,
    store_id   BIGINT       NULL DEFAULT NULL,
    zone       VARCHAR(100) NOT NULL,
    fee        DOUBLE,
    min_time   VARCHAR(50),
    max_time   VARCHAR(50),
    available  BOOLEAN      DEFAULT TRUE,
    created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_products_category    ON products(category);
CREATE INDEX idx_store_offers_product ON store_offers(product_id);
CREATE INDEX idx_store_offers_store   ON store_offers(store_id);

CREATE TABLE IF NOT EXISTS users (
    id         BIGINT       PRIMARY KEY AUTO_INCREMENT,
    nombre     VARCHAR(100) NOT NULL,
    apellidos  VARCHAR(100) NOT NULL,
    email      VARCHAR(255) NOT NULL UNIQUE,
    password   VARCHAR(255) NOT NULL,
    rol        VARCHAR(20)  NOT NULL DEFAULT 'CLIENTE',
    created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS orders (
    id            BIGINT      PRIMARY KEY AUTO_INCREMENT,
    cliente_id    BIGINT      NOT NULL,
    repartidor_id BIGINT      NULL,
    estado        VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE',
    total         DOUBLE      NOT NULL,
    created_at    TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cliente_id)    REFERENCES users(id),
    FOREIGN KEY (repartidor_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS order_items (
    id         BIGINT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    order_id   BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    store_id   BIGINT NOT NULL,
    quantity   INT    NOT NULL,
    unit_price DOUBLE NOT NULL,
    FOREIGN KEY (order_id)   REFERENCES orders(id)   ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (store_id)   REFERENCES stores(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_orders_client       ON orders(cliente_id);
CREATE INDEX idx_order_items_order   ON order_items(order_id);

CREATE TABLE IF NOT EXISTS messages (
    id           BIGINT       PRIMARY KEY AUTO_INCREMENT,
    chat_type    ENUM('CLIENTE_REPARTIDOR','VENDEDOR_REPARTIDOR','PROVEEDOR_VENDEDOR') NOT NULL,
    order_id     BIGINT       NULL,
    shop_id      BIGINT       NULL,
    remitente_id BIGINT       NOT NULL,
    mensaje      TEXT         NOT NULL,
    fecha        DATETIME     DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_msg_order  FOREIGN KEY (order_id)     REFERENCES orders(id)  ON DELETE CASCADE,
    CONSTRAINT fk_msg_shop   FOREIGN KEY (shop_id)      REFERENCES stores(id)  ON DELETE CASCADE,
    CONSTRAINT fk_msg_sender FOREIGN KEY (remitente_id) REFERENCES users(id),
    INDEX idx_msg_order_type (order_id, chat_type),
    INDEX idx_msg_shop_type  (shop_id, chat_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
