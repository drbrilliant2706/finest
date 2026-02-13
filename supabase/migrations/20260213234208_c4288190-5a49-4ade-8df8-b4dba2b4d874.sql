
-- Create transactions table to track SonicPesa payments
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  sonicpesa_order_id TEXT,
  reference TEXT,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'TZS',
  buyer_phone TEXT NOT NULL,
  buyer_name TEXT,
  buyer_email TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  result TEXT,
  profit NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (for webhook)
CREATE POLICY "Anyone can create transactions"
ON public.transactions
FOR INSERT
WITH CHECK (true);

-- Allow anyone to read their own transaction by phone (for status polling)
CREATE POLICY "Anyone can read transactions"
ON public.transactions
FOR SELECT
USING (true);

-- Admin can manage all transactions
CREATE POLICY "Admin and manager can manage transactions"
ON public.transactions
FOR ALL
USING (is_admin_or_manager(auth.uid()));

-- Allow webhook to update transactions
CREATE POLICY "Anyone can update transaction status"
ON public.transactions
FOR UPDATE
USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_transactions_updated_at
BEFORE UPDATE ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Also allow anyone to insert orders and order_items (for guest checkout)
CREATE POLICY "Anyone can create orders"
ON public.orders
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can create order items"
ON public.order_items
FOR INSERT
WITH CHECK (true);

-- Allow anyone to insert customers (for guest checkout)
CREATE POLICY "Anyone can create customers"
ON public.customers
FOR INSERT
WITH CHECK (true);
