# StoreSize Enum Rename — Codebase Audit

Mapping: `SMALL → TWO_REGISTER`, `MEDIUM → THREE_REGISTER`, `LARGE → FOUR_REGISTER`

> ⚠️ `MEDIUM` is ALSO a value of the unrelated **`Priority`** enum. Those occurrences must **NOT** be changed. They are listed separately below under "DO NOT CHANGE".

---

## 1. Prisma schema — enum definition & defaults

| File | Line | Current | Change to |
|------|------|---------|-----------|
| prisma/schema.prisma | 37 | `SMALL` (in `enum StoreSize`) | `TWO_REGISTER` |
| prisma/schema.prisma | 38 | `MEDIUM` (in `enum StoreSize`) | `THREE_REGISTER` |
| prisma/schema.prisma | 39 | `LARGE` (in `enum StoreSize`) | `FOUR_REGISTER` |
| prisma/schema.vercel.prisma | 37 | `SMALL` (in `enum StoreSize`) | `TWO_REGISTER` |
| prisma/schema.vercel.prisma | 38 | `MEDIUM` (in `enum StoreSize`) | `THREE_REGISTER` |
| prisma/schema.vercel.prisma | 39 | `LARGE` (in `enum StoreSize`) | `FOUR_REGISTER` |

Model field *type references* (`size StoreSize`, `storeSize StoreSize` at schema.prisma / schema.vercel.prisma lines 105, 137, 163) do **not** need edits — the type name is unchanged, only its member values.

No Prisma migration files exist (`prisma/migrations/` is absent). The DB enum will need an `ALTER TYPE ... RENAME VALUE` migration handled separately.

---

## 2. Seed data — `scripts/seed.ts`

### Store `size` (StoreSize) — lines 92–106
| Line | Current | Change to |
|------|---------|-----------|
| 92  | `size: 'LARGE'`  | `'FOUR_REGISTER'` |
| 93  | `size: 'MEDIUM'` | `'THREE_REGISTER'` |
| 94  | `size: 'LARGE'`  | `'FOUR_REGISTER'` |
| 95  | `size: 'MEDIUM'` | `'THREE_REGISTER'` |
| 96  | `size: 'SMALL'`  | `'TWO_REGISTER'` |
| 97  | `size: 'MEDIUM'` | `'THREE_REGISTER'` |
| 98  | `size: 'SMALL'`  | `'TWO_REGISTER'` |
| 99  | `size: 'SMALL'`  | `'TWO_REGISTER'` |
| 100 | `size: 'LARGE'`  | `'FOUR_REGISTER'` |
| 101 | `size: 'MEDIUM'` | `'THREE_REGISTER'` |
| 102 | `size: 'SMALL'`  | `'TWO_REGISTER'` |
| 103 | `size: 'LARGE'`  | `'FOUR_REGISTER'` |
| 104 | `size: 'MEDIUM'` | `'THREE_REGISTER'` |
| 105 | `size: 'SMALL'`  | `'TWO_REGISTER'` |
| 106 | `size: 'MEDIUM'` | `'THREE_REGISTER'` |

### Bundle `storeSize` (StoreSize) — lines 190–242
| Line | Current | Change to |
|------|---------|-----------|
| 190 | `where: { storeSize: 'SMALL' }`   | `'TWO_REGISTER'` |
| 192 | `storeSize: 'SMALL'`              | `'TWO_REGISTER'` |
| 214 | `where: { storeSize: 'MEDIUM' }`  | `'THREE_REGISTER'` |
| 216 | `storeSize: 'MEDIUM'`             | `'THREE_REGISTER'` |
| 240 | `where: { storeSize: 'LARGE' }`   | `'FOUR_REGISTER'` |
| 242 | `storeSize: 'LARGE'`             | `'FOUR_REGISTER'` |

### Request `storeSize` (StoreSize)
| Line | Current | Change to |
|------|---------|-----------|
| 277 | `storeSize: 'LARGE' as StoreSize`  | `'FOUR_REGISTER'` |
| 289 | `storeSize: 'MEDIUM' as StoreSize` | `'THREE_REGISTER'` |
| 334 | `storeSize: 'SMALL' as StoreSize`  | `'TWO_REGISTER'` |

### Display text (KnowledgeArticle content) — optional, cosmetic
| Line | Note |
|------|------|
| 390 | HTML content string uses human labels "Small Store / Medium Store / Large Store" describing register counts. Not an enum value — update wording only if the team wants the copy to match the new naming. |

---

## 3. Frontend components (`app/`)

### Store size color maps (object keys are enum values)
| File | Line | Current | Change to |
|------|------|---------|-----------|
| app/(authenticated)/stores/_components/stores-client.tsx | 19 | `{ SMALL: '#F59E0B', MEDIUM: '#0067B9', LARGE: '#00B2A9' }` | keys → `{ TWO_REGISTER: ..., THREE_REGISTER: ..., FOUR_REGISTER: ... }` |
| app/(authenticated)/admin/bundles/_components/bundles-client.tsx | 18 | `{ SMALL: '#F59E0B', MEDIUM: '#0067B9', LARGE: '#00B2A9' }` | keys → `TWO_REGISTER / THREE_REGISTER / FOUR_REGISTER` |

### New-store form — `app/(authenticated)/catalog/new-store/_components/new-store-form.tsx`
| Line | Current | Change to |
|------|---------|-----------|
| 53  | `size: 'MEDIUM' as string` (default) | `'THREE_REGISTER'` |
| 160 | `size: 'MEDIUM'` (reset default) | `'THREE_REGISTER'` |
| 281 | `<option value="SMALL">Small (Under 3,000 sq ft)</option>` | value → `TWO_REGISTER` |
| 282 | `<option value="MEDIUM">Medium (3,000-6,000 sq ft)</option>` | value → `THREE_REGISTER` |
| 283 | `<option value="LARGE">Large (Over 6,000 sq ft)</option>` | value → `FOUR_REGISTER` |
| 517 | `<option value="SMALL">Small</option>` | value → `TWO_REGISTER` |
| 518 | `<option value="MEDIUM">Medium</option>` | value → `THREE_REGISTER` |
| 519 | `<option value="LARGE">Large</option>` | value → `FOUR_REGISTER` |

(Line 190 `priority: 'MEDIUM'` in this file is Priority — see DO NOT CHANGE.)

### Admin stores — `app/(authenticated)/admin/stores/_components/admin-stores-client.tsx`
| Line | Current | Change to |
|------|---------|-----------|
| 11 | `size: 'MEDIUM'` (form default) | `'THREE_REGISTER'` |
| 16 | `size: 'MEDIUM'` (openCreate default) | `'THREE_REGISTER'` |
| 17 | `size: s?.size ?? 'MEDIUM'` (openEdit fallback) | `?? 'THREE_REGISTER'` |
| 82 | `<option value="SMALL">Small</option><option value="MEDIUM">Medium</option><option value="LARGE">Large</option>` | values → `TWO_REGISTER / THREE_REGISTER / FOUR_REGISTER` |

### Display-only text (optional, cosmetic)
| File | Line | Note |
|------|------|------|
| app/(authenticated)/admin/_components/admin-client.tsx | 8 | Description string "...for Small, Medium, and Large stores" — cosmetic copy only. |
| app/(authenticated)/requests/[id]/_components/request-detail-client.tsx | 158, 175 | Renders `{request?.storeSize}` / `{request?.store?.size}` raw — no code change needed; UI will show new values automatically. |

---

## 4. API routes — no hardcoded enum values
- `app/api/bundles/route.ts` (lines 13–16): reads `storeSize` from query string and passes through — no literal enum values. No change needed (works with new values automatically).
- `app/api/stores/route.ts`, `app/api/requests/route.ts`: pass `size`/`storeSize` through from the request body — no hardcoded StoreSize literals.

---

## DO NOT CHANGE — `Priority` enum `MEDIUM` (unrelated)
These are the `Priority` enum, NOT StoreSize:
- prisma/schema.prisma:50 — `MEDIUM` in `enum Priority`
- prisma/schema.prisma:166 — `@default(MEDIUM)` on `priority`
- prisma/schema.vercel.prisma:50, 166 — same as above
- scripts/seed.ts:292, 303, 337 — `priority: 'MEDIUM' as Priority`
- app/(authenticated)/catalog/new-store/_components/new-store-form.tsx:190 — `priority: 'MEDIUM'`
- app/(authenticated)/catalog/support/_components/support-form.tsx:13, 90 — Priority `MEDIUM`
- app/(authenticated)/catalog/replacement/_components/replacement-form.tsx:27, 142 — Priority `MEDIUM`
- app/api/requests/route.ts:101 — `requestData?.priority ?? 'MEDIUM'`

---

## Summary of files requiring changes (StoreSize only)
1. `prisma/schema.prisma` — enum values (3)
2. `prisma/schema.vercel.prisma` — enum values (3)
3. `scripts/seed.ts` — store sizes, bundle storeSize, request storeSize (24 literals)
4. `app/(authenticated)/stores/_components/stores-client.tsx` — sizeColors keys
5. `app/(authenticated)/admin/bundles/_components/bundles-client.tsx` — sizeColors keys
6. `app/(authenticated)/catalog/new-store/_components/new-store-form.tsx` — defaults + option values
7. `app/(authenticated)/admin/stores/_components/admin-stores-client.tsx` — defaults + option values

Cosmetic/optional copy: `scripts/seed.ts:390`, `app/(authenticated)/admin/_components/admin-client.tsx:8`.

Also required outside the repo: a PostgreSQL enum migration (`ALTER TYPE "StoreSize" RENAME VALUE ...`) since no Prisma migration files exist.
