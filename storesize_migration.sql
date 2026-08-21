-- StoreSize enum rename migration
-- Run this against the live Railway PostgreSQL database BEFORE deploying the
-- code change (there are no Prisma migration files in the repo, so Prisma will
-- not perform this automatically).
--
-- Mapping:
--   SMALL  -> TWO_REGISTER
--   MEDIUM -> THREE_REGISTER
--   LARGE  -> FOUR_REGISTER
--
-- ALTER TYPE ... RENAME VALUE preserves all existing rows: every column of type
-- "StoreSize" is updated in place, so no data migration of the tables is needed.

BEGIN;

ALTER TYPE "StoreSize" RENAME VALUE 'SMALL' TO 'TWO_REGISTER';
ALTER TYPE "StoreSize" RENAME VALUE 'MEDIUM' TO 'THREE_REGISTER';
ALTER TYPE "StoreSize" RENAME VALUE 'LARGE' TO 'FOUR_REGISTER';

COMMIT;
