const natural = (field) => `(length(${field}) BETWEEN 1 AND 128 AND ${field} NOT GLOB '*[^0-9]*' AND (${field} = '0' OR substr(${field}, 1, 1) BETWEEN '1' AND '9'))`;
const positive = (field) => `(${natural(field)} AND ${field} <> '0')`;
const atMost = (left, right) => `(length(${left}) < length(${right}) OR (length(${left}) = length(${right}) AND ${left} <= ${right}))`;
const definitions = [];
function define(type, name, body) {
  definitions.push({ type, name, sql: `CREATE ${type.toUpperCase()} ${name} ${body}` });
}

define('table', 'budgets', `(
  issuer_id TEXT NOT NULL,
  unit_id TEXT NOT NULL,
  total TEXT NOT NULL CHECK ${natural('total')},
  reserved TEXT NOT NULL DEFAULT '0' CHECK ${natural('reserved')},
  spent TEXT NOT NULL DEFAULT '0' CHECK ${natural('spent')},
  PRIMARY KEY (issuer_id, unit_id),
  CHECK ${atMost('reserved', 'total')},
  CHECK ${atMost('spent', 'total')}
) STRICT`);

define('table', 'rewards', `(
  id TEXT PRIMARY KEY NOT NULL,
  issuer_id TEXT NOT NULL,
  subject_id TEXT NOT NULL,
  source_result_id TEXT NOT NULL,
  evidence_ref TEXT NOT NULL,
  quantity TEXT NOT NULL CHECK ${positive('quantity')},
  unit_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'posted', 'revoked')),
  version INTEGER NOT NULL CHECK (version BETWEEN 1 AND 3),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (issuer_id, source_result_id),
  CHECK ((status = 'pending' AND version = 1) OR (status = 'approved' AND version = 2) OR
         (status = 'posted' AND version = 3) OR (status = 'revoked' AND version IN (2, 3)))
) STRICT`);

define('table', 'ledger', `(
  reward_id TEXT NOT NULL REFERENCES rewards(id),
  direction TEXT NOT NULL CHECK (direction IN ('debit', 'credit')),
  issuer_id TEXT NOT NULL,
  subject_id TEXT NOT NULL,
  unit_id TEXT NOT NULL,
  account TEXT NOT NULL CHECK (account IN ('issuer_budget', 'subject')),
  quantity TEXT NOT NULL CHECK ${positive('quantity')},
  created_at TEXT NOT NULL,
  PRIMARY KEY (reward_id, direction),
  CHECK ((direction = 'debit' AND account = 'issuer_budget') OR (direction = 'credit' AND account = 'subject'))
) STRICT`);

define('table', 'events', `(
  command_id TEXT PRIMARY KEY NOT NULL,
  reward_id TEXT NOT NULL REFERENCES rewards(id),
  issuer_id TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('submit', 'approve', 'post', 'revoke')),
  version INTEGER NOT NULL CHECK (version BETWEEN 1 AND 3),
  previous_status TEXT CHECK (previous_status IN ('pending', 'approved')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'posted', 'revoked')),
  recorded_at TEXT NOT NULL,
  UNIQUE (reward_id, version)
) STRICT`);

define('table', 'command_receipts', `(
  issuer_id TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  command_id TEXT NOT NULL UNIQUE REFERENCES events(command_id),
  reward_id TEXT NOT NULL REFERENCES rewards(id),
  fingerprint TEXT NOT NULL CHECK (length(fingerprint) BETWEEN 1 AND 4096),
  receipt_json TEXT NOT NULL CHECK (json_valid(receipt_json)),
  PRIMARY KEY (issuer_id, idempotency_key)
) STRICT`);

for (const table of ['ledger', 'events', 'command_receipts']) {
  for (const operation of ['UPDATE', 'DELETE']) {
    define('trigger', `${table}_no_${operation.toLowerCase()}`, `BEFORE ${operation} ON ${table}
      BEGIN SELECT RAISE(ABORT, '${table} is append-only'); END`);
  }
}
define('trigger', 'rewards_no_delete', `BEFORE DELETE ON rewards
  BEGIN SELECT RAISE(ABORT, 'rewards cannot be deleted'); END`);
define('trigger', 'rewards_immutable_fields', `BEFORE UPDATE ON rewards
  WHEN NEW.id <> OLD.id OR NEW.issuer_id <> OLD.issuer_id OR NEW.subject_id <> OLD.subject_id OR
       NEW.source_result_id <> OLD.source_result_id OR NEW.evidence_ref <> OLD.evidence_ref OR
       NEW.quantity <> OLD.quantity OR NEW.unit_id <> OLD.unit_id OR NEW.created_at <> OLD.created_at
  BEGIN SELECT RAISE(ABORT, 'reward fields are immutable'); END`);
define('trigger', 'rewards_valid_transition', `BEFORE UPDATE ON rewards
  WHEN NEW.version <> OLD.version + 1 OR NOT (
    (OLD.status = 'pending' AND NEW.status IN ('approved', 'revoked')) OR
    (OLD.status = 'approved' AND NEW.status IN ('posted', 'revoked')))
  BEGIN SELECT RAISE(ABORT, 'invalid reward transition'); END`);
define('trigger', 'posted_requires_pair', `BEFORE UPDATE ON rewards
  WHEN NEW.status = 'posted' AND (SELECT count(*) FROM ledger WHERE reward_id = NEW.id) <> 2
  BEGIN SELECT RAISE(ABORT, 'posted reward requires balanced pair'); END`);
define('trigger', 'ledger_matches_reward', `BEFORE INSERT ON ledger
  WHEN NOT EXISTS (SELECT 1 FROM rewards WHERE id = NEW.reward_id AND status = 'approved'
    AND issuer_id = NEW.issuer_id AND subject_id = NEW.subject_id AND unit_id = NEW.unit_id AND quantity = NEW.quantity)
  BEGIN SELECT RAISE(ABORT, 'ledger must match approved reward'); END`);
define('trigger', 'event_matches_reward', `BEFORE INSERT ON events
  WHEN NOT EXISTS (SELECT 1 FROM rewards WHERE id = NEW.reward_id AND issuer_id = NEW.issuer_id
    AND version = NEW.version AND status = NEW.status)
  BEGIN SELECT RAISE(ABORT, 'event must match reward'); END`);
define('trigger', 'budgets_fixed_total', `BEFORE UPDATE ON budgets
  WHEN NEW.issuer_id <> OLD.issuer_id OR NEW.unit_id <> OLD.unit_id OR NEW.total <> OLD.total
  BEGIN SELECT RAISE(ABORT, 'reference budgets cannot be funded or reassigned'); END`);
define('trigger', 'budgets_no_delete', `BEFORE DELETE ON budgets
  BEGIN SELECT RAISE(ABORT, 'budgets cannot be deleted'); END`);

export const SCHEMA = Object.freeze(definitions.map(Object.freeze));
export const SCHEMA_VERSION = 1;
export const APPLICATION_ID = 0x45444649;
