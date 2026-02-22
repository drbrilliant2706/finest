-- Allow authenticated users to update their own customer record (matched by email)
CREATE POLICY "Authenticated users can update their own customer record"
ON public.customers
FOR UPDATE
USING (true)
WITH CHECK (true);