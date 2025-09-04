-- Add total budget field to weddings table
ALTER TABLE weddings 
ADD COLUMN IF NOT EXISTS total_budget DECIMAL(10,2) DEFAULT 0 CHECK (total_budget >= 0);

-- Add comment for clarity
COMMENT ON COLUMN weddings.total_budget IS 'Total planned budget for the entire wedding';
