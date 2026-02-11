# Migration 008: Backfill Transaction Network

## Problem
Existing transactions have `network = NULL`, which breaks the insights query filter.

## Solution
Run this SQL in **Supabase SQL Editor**:

**https://supabase.com/dashboard/project/unghlsaqdxmjhfpyurkl/sql/new**

```sql
-- Backfill null network values to devnet
UPDATE transactions
SET network = 'devnet'
WHERE network IS NULL;

-- Ensure network is never null going forward
ALTER TABLE transactions 
ALTER COLUMN network SET DEFAULT 'devnet';

ALTER TABLE transactions 
ALTER COLUMN network SET NOT NULL;
```

## After running migration
- Existing transactions will have network='devnet'
- Agent insights will show correct decision count
- New transactions will always have network set
