-- Allow anyone to read active products (public storefront)
CREATE POLICY "Anyone can view active products"
ON public.products
FOR SELECT
USING (status = 'active');
