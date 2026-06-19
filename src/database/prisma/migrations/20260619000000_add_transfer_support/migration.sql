-- Make category_id nullable so transfer transactions can omit it
ALTER TABLE transactions ALTER COLUMN category_id DROP NOT NULL;

-- Add transfer_group_id to link paired transfer transactions
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS transfer_group_id UUID;

CREATE INDEX IF NOT EXISTS transactions_transfer_group_id_idx ON transactions(transfer_group_id);
