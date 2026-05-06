USE mercafacil_db;

CREATE TABLE IF NOT EXISTS categories (
    id          BIGINT       PRIMARY KEY AUTO_INCREMENT,
    name        VARCHAR(100) NOT NULL,
    icon        VARCHAR(255),
    color       VARCHAR(7)   DEFAULT '#000000',
    bg_color    VARCHAR(7)   DEFAULT '#FFFFFF',
    count       INT          DEFAULT 0,
    created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

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
    vendedor_id   BIGINT       NULL,
    created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
    id          BIGINT       PRIMARY KEY AUTO_INCREMENT,
    name        VARCHAR(255) NOT NULL,
    category    VARCHAR(100) NOT NULL,
    image       LONGTEXT,
    description LONGTEXT,
    unit        VARCHAR(50),
    created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_products_category ON products(category);

CREATE TABLE IF NOT EXISTS store_offers (
    id             BIGINT       PRIMARY KEY AUTO_INCREMENT,
    product_id     BIGINT       NOT NULL,
    store_id       BIGINT       NOT NULL,
    store_name     VARCHAR(100),
    price          DOUBLE       NOT NULL,
    original_price DOUBLE,
    in_stock       BOOLEAN      DEFAULT TRUE,
    stock          INT          NOT NULL DEFAULT 0,
    brand          VARCHAR(100),
    created_at     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (store_id)   REFERENCES stores(id)   ON DELETE CASCADE,
    UNIQUE KEY unique_offer (product_id, store_id)
);

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
);

CREATE TABLE IF NOT EXISTS users (
    id         BIGINT       PRIMARY KEY AUTO_INCREMENT,
    nombre     VARCHAR(100) NOT NULL,
    apellidos  VARCHAR(100) NOT NULL,
    email      VARCHAR(255) NOT NULL UNIQUE,
    password   VARCHAR(255) NOT NULL,
    rol        VARCHAR(20)  NOT NULL DEFAULT 'CLIENTE',
    created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
    id               BIGINT       PRIMARY KEY AUTO_INCREMENT,
    cliente_id       BIGINT       NOT NULL,
    repartidor_id    BIGINT       NULL,
    estado           VARCHAR(20)  NOT NULL DEFAULT 'PENDIENTE',
    total            DOUBLE       NOT NULL,
    shipping_address VARCHAR(500) NOT NULL DEFAULT '',
    delivery_notes   VARCHAR(500) NULL,
    created_at       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cliente_id)    REFERENCES users(id),
    FOREIGN KEY (repartidor_id) REFERENCES users(id)
);

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
);

CREATE TABLE IF NOT EXISTS tracking (
    id                   BIGINT   PRIMARY KEY AUTO_INCREMENT,
    order_id             BIGINT   NOT NULL,
    latitud              DOUBLE   NOT NULL,
    longitud             DOUBLE   NOT NULL,
    ultima_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS cart_items (
    id            BIGINT       PRIMARY KEY AUTO_INCREMENT,
    user_id       BIGINT       NOT NULL,
    product_id    BIGINT       NOT NULL,
    product_name  VARCHAR(200) NOT NULL,
    product_image VARCHAR(500),
    store_id      BIGINT       NOT NULL,
    store_name    VARCHAR(200) NOT NULL,
    brand         VARCHAR(100),
    price         DOUBLE       NOT NULL,
    quantity      INT          NOT NULL,
    unit          VARCHAR(50),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_cart_item (user_id, product_id, store_id)
);

CREATE TABLE IF NOT EXISTS messages (
    id           BIGINT       PRIMARY KEY AUTO_INCREMENT,
    chat_type    ENUM('CLIENTE_REPARTIDOR','VENDEDOR_REPARTIDOR','PROVEEDOR_VENDEDOR') NOT NULL,
    order_id     BIGINT       NULL,
    shop_id      BIGINT       NULL,
    remitente_id BIGINT       NOT NULL,
    reply_to_id  BIGINT       NULL,
    mensaje      TEXT         NOT NULL,
    fecha        DATETIME     DEFAULT CURRENT_TIMESTAMP,
    is_read      BOOLEAN      NOT NULL DEFAULT FALSE,
    FOREIGN KEY (order_id)     REFERENCES orders(id)    ON DELETE CASCADE,
    FOREIGN KEY (shop_id)      REFERENCES stores(id)    ON DELETE CASCADE,
    FOREIGN KEY (remitente_id) REFERENCES users(id),
    FOREIGN KEY (reply_to_id)  REFERENCES messages(id)  ON DELETE SET NULL
);

CREATE INDEX idx_messages_is_read ON messages(is_read);
