-- UI Control Center — FINAL. Supersedes both earlier versions (neither was
-- ever applied). Apply this single file to dev via psql, verify, then apply
-- the identical file to staging. Never use `prisma migrate dev`.

CREATE TABLE IF NOT EXISTS ui_control_elements (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id       UUID NOT NULL,
  key              VARCHAR(255) NOT NULL,
  element_type     VARCHAR(30)  NOT NULL,  -- SIDEBAR_SECTION | SIDEBAR_ITEM | TAB | BUTTON | FIELD | COLUMN | SECTION | STAT_CARD
  module           VARCHAR(100) NOT NULL,
  page             VARCHAR(255),
  label            VARCHAR(255) NOT NULL,
  icon             VARCHAR(50),
  parent_key       VARCHAR(255),
  sort_order       INT NOT NULL DEFAULT 0,
  default_visible  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by       UUID,
  updated_by       UUID,
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  is_test_data     BOOLEAN NOT NULL DEFAULT FALSE,
  CONSTRAINT uq_ui_control_elements_company_key UNIQUE (company_id, key)
);

CREATE TABLE IF NOT EXISTS ui_control_overrides (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id          UUID NOT NULL,
  element_id          UUID NOT NULL REFERENCES ui_control_elements(id) ON DELETE CASCADE,
  scope_type          VARCHAR(10) NOT NULL,   -- ROLE | USER
  role_name           VARCHAR(100),           -- matches Role.name — works for system AND custom roles uniformly
  user_id             UUID,
  is_visible          BOOLEAN NOT NULL,
  sort_order_override INT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by          UUID,
  updated_by          UUID,
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  is_test_data        BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_ui_override_role
  ON ui_control_overrides (element_id, role_name)
  WHERE scope_type = 'ROLE';

CREATE UNIQUE INDEX IF NOT EXISTS uq_ui_override_user
  ON ui_control_overrides (element_id, user_id)
  WHERE scope_type = 'USER';

CREATE INDEX IF NOT EXISTS idx_ui_control_elements_company_module ON ui_control_elements(company_id, module);
CREATE INDEX IF NOT EXISTS idx_ui_control_elements_parent ON ui_control_elements(parent_key);
CREATE INDEX IF NOT EXISTS idx_ui_control_overrides_element ON ui_control_overrides(element_id);
CREATE INDEX IF NOT EXISTS idx_ui_control_overrides_user ON ui_control_overrides(user_id);
CREATE INDEX IF NOT EXISTS idx_ui_control_overrides_role ON ui_control_overrides(role_name);
