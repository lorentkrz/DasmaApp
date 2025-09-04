-- Create vendor_payments table for tracking multiple payments to vendors
CREATE TABLE IF NOT EXISTS vendor_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  wedding_id UUID NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method VARCHAR(50) DEFAULT 'cash',
  description TEXT,
  receipt_number VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_vendor_payments_vendor_id ON vendor_payments(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_payments_wedding_id ON vendor_payments(wedding_id);
CREATE INDEX IF NOT EXISTS idx_vendor_payments_payment_date ON vendor_payments(payment_date);

-- Enable RLS
ALTER TABLE vendor_payments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their wedding vendor payments" ON vendor_payments
  FOR SELECT USING (
    wedding_id IN (
      SELECT w.id FROM weddings w 
      WHERE w.owner_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM wedding_collaborators wc 
        WHERE wc.wedding_id = w.id AND wc.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert vendor payments for their weddings" ON vendor_payments
  FOR INSERT WITH CHECK (
    wedding_id IN (
      SELECT w.id FROM weddings w 
      WHERE w.owner_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM wedding_collaborators wc 
        WHERE wc.wedding_id = w.id AND wc.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update their wedding vendor payments" ON vendor_payments
  FOR UPDATE USING (
    wedding_id IN (
      SELECT w.id FROM weddings w 
      WHERE w.owner_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM wedding_collaborators wc 
        WHERE wc.wedding_id = w.id AND wc.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete their wedding vendor payments" ON vendor_payments
  FOR DELETE USING (
    wedding_id IN (
      SELECT w.id FROM weddings w 
      WHERE w.owner_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM wedding_collaborators wc 
        WHERE wc.wedding_id = w.id AND wc.user_id = auth.uid()
      )
    )
  );

-- Create function to update vendor payment status based on payments
CREATE OR REPLACE FUNCTION update_vendor_payment_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the vendor's payment status based on total payments
  UPDATE vendors 
  SET 
    deposit_paid = CASE 
      WHEN (
        SELECT COALESCE(SUM(amount), 0) 
        FROM vendor_payments 
        WHERE vendor_id = COALESCE(NEW.vendor_id, OLD.vendor_id)
      ) >= contract_amount THEN true
      WHEN (
        SELECT COALESCE(SUM(amount), 0) 
        FROM vendor_payments 
        WHERE vendor_id = COALESCE(NEW.vendor_id, OLD.vendor_id)
      ) > 0 THEN true
      ELSE false
    END,
    deposit_amount = (
      SELECT COALESCE(SUM(amount), 0) 
      FROM vendor_payments 
      WHERE vendor_id = COALESCE(NEW.vendor_id, OLD.vendor_id)
    ),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.vendor_id, OLD.vendor_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update vendor payment status
CREATE TRIGGER update_vendor_payment_status_on_insert
  AFTER INSERT ON vendor_payments
  FOR EACH ROW EXECUTE FUNCTION update_vendor_payment_status();

CREATE TRIGGER update_vendor_payment_status_on_update
  AFTER UPDATE ON vendor_payments
  FOR EACH ROW EXECUTE FUNCTION update_vendor_payment_status();

CREATE TRIGGER update_vendor_payment_status_on_delete
  AFTER DELETE ON vendor_payments
  FOR EACH ROW EXECUTE FUNCTION update_vendor_payment_status();
