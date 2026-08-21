-- Migration: add Attachment table for request file attachments (PDF/JPG/PNG, stored in DB)
BEGIN;

CREATE TABLE IF NOT EXISTS "Attachment" (
  "id"         TEXT NOT NULL,
  "requestId"  TEXT NOT NULL,
  "fileName"   TEXT NOT NULL,
  "mimeType"   TEXT NOT NULL,
  "size"       INTEGER NOT NULL,
  "data"       BYTEA NOT NULL,
  "uploadedBy" TEXT NOT NULL,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Attachment_requestId_idx" ON "Attachment"("requestId");

ALTER TABLE "Attachment"
  ADD CONSTRAINT "Attachment_requestId_fkey"
  FOREIGN KEY ("requestId") REFERENCES "Request"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Attachment"
  ADD CONSTRAINT "Attachment_uploadedBy_fkey"
  FOREIGN KEY ("uploadedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

COMMIT;
