-- PostgreSQL initial schema. Monetary amounts are integer toman; timestamps are UTC.
BEGIN;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE users (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 phone varchar(11) NOT NULL UNIQUE CHECK (phone ~ '^09[0-9]{9}$'),
 full_name varchar(160),
 role text NOT NULL DEFAULT 'customer' CHECK (role IN ('customer','admin')),
 status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','disabled')),
 phone_verified_at timestamptz,
 created_by uuid REFERENCES users(id) ON DELETE SET NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE otp_codes (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 phone varchar(11) NOT NULL CHECK (phone ~ '^09[0-9]{9}$'),
 code_hash text NOT NULL,
 expires_at timestamptz NOT NULL,
 attempts smallint NOT NULL DEFAULT 0 CHECK (attempts BETWEEN 0 AND 10),
 consumed_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX otp_codes_phone_created_idx ON otp_codes(phone, created_at DESC);
CREATE TABLE sessions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 token_hash text NOT NULL UNIQUE,
 expires_at timestamptz NOT NULL,
 revoked_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX sessions_user_idx ON sessions(user_id, expires_at) WHERE revoked_at IS NULL;
CREATE TABLE addresses (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
 recipient_name varchar(160) NOT NULL,
 recipient_phone varchar(11) NOT NULL CHECK (recipient_phone ~ '^09[0-9]{9}$'),
 province varchar(100) NOT NULL, city varchar(100) NOT NULL,
 address_line text NOT NULL, plaque varchar(30), unit varchar(30), postal_code varchar(10),
 is_default boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX addresses_user_idx ON addresses(user_id);

CREATE TABLE brands (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name varchar(160) NOT NULL UNIQUE,
 slug varchar(180) NOT NULL UNIQUE, active boolean NOT NULL DEFAULT true
);
CREATE TABLE categories (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 parent_id uuid REFERENCES categories(id) ON DELETE RESTRICT,
 name varchar(160) NOT NULL, slug varchar(180) NOT NULL UNIQUE,
 description text, image_url text,
 status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
 seo_title varchar(180), seo_description varchar(320),
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE products (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 category_id uuid REFERENCES categories(id) ON DELETE RESTRICT,
 brand_id uuid REFERENCES brands(id) ON DELETE RESTRICT,
 name varchar(240) NOT NULL, slug varchar(260) NOT NULL UNIQUE, sku varchar(100) UNIQUE,
 short_description varchar(500), description text,
 price_toman bigint NOT NULL CHECK (price_toman >= 0),
 compare_at_price_toman bigint CHECK (compare_at_price_toman IS NULL OR compare_at_price_toman >= price_toman),
 status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
 specs jsonb NOT NULL DEFAULT '{}'::jsonb, search_text text NOT NULL DEFAULT '',
 stock_on_hand integer NOT NULL DEFAULT 0 CHECK (stock_on_hand >= 0),
 stock_reserved integer NOT NULL DEFAULT 0 CHECK (stock_reserved >= 0 AND stock_reserved <= stock_on_hand),
 low_stock_threshold integer NOT NULL DEFAULT 3 CHECK (low_stock_threshold >= 0),
 deleted_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX products_category_idx ON products(category_id) WHERE deleted_at IS NULL;
CREATE INDEX products_search_idx ON products USING gin(search_text gin_trgm_ops) WHERE status='published' AND deleted_at IS NULL;
CREATE TABLE product_images (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 product_id uuid NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
 url text NOT NULL, alt_text varchar(240) NOT NULL DEFAULT '', sort_order integer NOT NULL DEFAULT 0
);

CREATE TABLE carts (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid UNIQUE REFERENCES users(id) ON DELETE CASCADE,
 guest_token_hash text UNIQUE, created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK ((user_id IS NOT NULL) <> (guest_token_hash IS NOT NULL))
);
CREATE TABLE cart_items (
 cart_id uuid NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
 product_id uuid NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
 quantity integer NOT NULL CHECK (quantity BETWEEN 1 AND 99),
 updated_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(cart_id, product_id)
);

CREATE TABLE orders (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), order_number varchar(32) NOT NULL UNIQUE,
 user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
 channel text NOT NULL DEFAULT 'web' CHECK (channel IN ('web','phone','in_store')),
 status text NOT NULL DEFAULT 'pending_payment' CHECK (status IN ('pending_payment','confirmed','processing','shipped','delivered','cancelled')),
 payment_state text NOT NULL DEFAULT 'unpaid' CHECK (payment_state IN ('unpaid','pending','paid','failed','refunded')),
 payment_method text NOT NULL CHECK (payment_method IN ('online','cod')),
 subtotal_toman bigint NOT NULL CHECK (subtotal_toman >= 0),
 discount_toman bigint NOT NULL DEFAULT 0 CHECK (discount_toman >= 0),
 shipping_toman bigint NOT NULL DEFAULT 0 CHECK (shipping_toman >= 0),
 total_toman bigint NOT NULL CHECK (total_toman = subtotal_toman - discount_toman + shipping_toman),
 shipping_address_snapshot jsonb NOT NULL, idempotency_key varchar(128) NOT NULL UNIQUE,
 created_by uuid REFERENCES users(id) ON DELETE SET NULL,
 reservation_expires_at timestamptz, cancelled_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK (discount_toman <= subtotal_toman)
);
CREATE INDEX orders_user_created_idx ON orders(user_id, created_at DESC);
CREATE INDEX orders_status_created_idx ON orders(status, created_at DESC);
CREATE TABLE order_items (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 order_id uuid NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
 product_id uuid NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
 product_name_snapshot varchar(240) NOT NULL, sku_snapshot varchar(100),
 unit_price_toman bigint NOT NULL CHECK (unit_price_toman >= 0),
 quantity integer NOT NULL CHECK (quantity BETWEEN 1 AND 99),
 line_total_toman bigint NOT NULL CHECK (line_total_toman = unit_price_toman * quantity)
);
CREATE TABLE order_status_history (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 order_id uuid NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
 from_status text, to_status text NOT NULL, note text,
 actor_id uuid REFERENCES users(id) ON DELETE SET NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE payments (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 order_id uuid NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
 provider text NOT NULL CHECK (provider IN ('zarinpal','mock')),
 authority varchar(160) UNIQUE, provider_ref varchar(160),
 amount_toman bigint NOT NULL CHECK (amount_toman >= 0),
 state text NOT NULL DEFAULT 'pending' CHECK (state IN ('unpaid','pending','paid','failed','refunded')),
 verified_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE inventory_movements (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 product_id uuid NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
 delta_on_hand integer NOT NULL, delta_reserved integer NOT NULL DEFAULT 0,
 on_hand_after integer NOT NULL CHECK (on_hand_after >= 0),
 reserved_after integer NOT NULL CHECK (reserved_after >= 0 AND reserved_after <= on_hand_after),
 movement_type text NOT NULL CHECK (movement_type IN ('purchase','sale','reserve','release','adjust','in_store_sale','return')),
 reason text NOT NULL, order_id uuid REFERENCES orders(id) ON DELETE RESTRICT,
 actor_id uuid REFERENCES users(id) ON DELETE SET NULL, idempotency_key varchar(160) UNIQUE,
 created_at timestamptz NOT NULL DEFAULT now(), CHECK (delta_on_hand <> 0 OR delta_reserved <> 0)
);
CREATE INDEX inventory_product_created_idx ON inventory_movements(product_id, created_at DESC);
CREATE TABLE articles (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), author_id uuid REFERENCES users(id) ON DELETE SET NULL,
 title varchar(240) NOT NULL, slug varchar(260) NOT NULL UNIQUE, excerpt varchar(500),
 content jsonb NOT NULL DEFAULT '{}'::jsonb,
 status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
 featured_image_url text, featured_image_alt varchar(240), seo_title varchar(180), seo_description varchar(320),
 published_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK (status <> 'published' OR published_at IS NOT NULL)
);
CREATE TABLE audit_logs (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), actor_id uuid REFERENCES users(id) ON DELETE SET NULL,
 action varchar(120) NOT NULL, entity_type varchar(100) NOT NULL, entity_id uuid,
 request_id varchar(100), details jsonb NOT NULL DEFAULT '{}'::jsonb, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_logs_created_idx ON audit_logs(created_at DESC);
CREATE TABLE rate_limits (
 key_hash varchar(128) PRIMARY KEY, window_started_at timestamptz NOT NULL,
 request_count integer NOT NULL CHECK (request_count >= 0), blocked_until timestamptz
);
CREATE TABLE store_settings (
 key varchar(120) PRIMARY KEY, value jsonb NOT NULL,
 updated_by uuid REFERENCES users(id) ON DELETE SET NULL, updated_at timestamptz NOT NULL DEFAULT now()
);
COMMIT;
