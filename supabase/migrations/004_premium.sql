-- ════════════════════════════════════════════════════════════════════
-- Migration 004 — Premium Tables (branches, reservations, translations)
-- Run before building Premium-tier features (Phase 4 / Phase 6).
-- ════════════════════════════════════════════════════════════════════

-- Multi-branch
CREATE TABLE branches (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id  uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name         text NOT NULL,
  address      text,
  phone        text,
  opening_hours jsonb,
  is_active    boolean DEFAULT true,
  sort_order   integer DEFAULT 0,
  created_at   timestamptz DEFAULT now()
);

-- Link items and qr_codes to a branch.
ALTER TABLE items    ADD COLUMN branch_id uuid REFERENCES branches(id) ON DELETE SET NULL;
ALTER TABLE qr_codes ADD CONSTRAINT fk_qr_branch FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL;

-- Reservations
CREATE TABLE reservations (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id  uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  branch_id    uuid REFERENCES branches(id) ON DELETE SET NULL,
  name         text NOT NULL,
  phone        text NOT NULL,
  email        text,
  party_size   integer NOT NULL CHECK (party_size > 0),
  date         date NOT NULL,
  time         time NOT NULL,
  notes        text,
  status       text DEFAULT 'pending' CHECK (status IN ('pending','confirmed','cancelled')),
  staff_notes  text,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

-- Bilingual translations
CREATE TABLE translations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  entity_type text NOT NULL CHECK (entity_type IN ('item','category','business')),
  entity_id   uuid NOT NULL,
  locale      text NOT NULL,  -- 'hi'|'mr'|'ta'|'te'|'kn'|'bn'|'gu'
  field       text NOT NULL,  -- 'name'|'description'|'tagline'
  value       text NOT NULL,
  UNIQUE(business_id, entity_type, entity_id, locale, field)
);

-- RLS
ALTER TABLE branches     ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "branches_pub_read"  ON branches FOR SELECT TO anon USING (is_active = true);
CREATE POLICY "branches_staff"     ON branches FOR ALL    TO authenticated USING (is_staff_of(business_id)) WITH CHECK (is_staff_of(business_id));

CREATE POLICY "reserv_pub_insert"  ON reservations FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "reserv_staff_all"   ON reservations FOR ALL    TO authenticated USING (is_staff_of(business_id));

CREATE POLICY "trans_pub_read"     ON translations FOR SELECT TO anon USING (true);
CREATE POLICY "trans_staff_all"    ON translations FOR ALL    TO authenticated USING (is_staff_of(business_id)) WITH CHECK (is_staff_of(business_id));
