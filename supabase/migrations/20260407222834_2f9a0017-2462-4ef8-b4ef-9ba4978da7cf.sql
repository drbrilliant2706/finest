
CREATE POLICY "Authenticated users can select customers"
ON public.customers
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can select orders"
ON public.orders
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can select order items"
ON public.order_items
FOR SELECT
TO authenticated
USING (true);
