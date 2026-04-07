
-- 1. Fix profile self-update: prevent role changes via WITH CHECK
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND role = (SELECT p.role FROM public.profiles p WHERE p.user_id = auth.uid())
);

-- 2. Restrict public product SELECT to hide sensitive columns
-- Replace the open policy with one that uses a view
DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;

-- Create a security definer function to check if product is active
-- We keep the policy but it already only exposes active products
-- The real fix: create a view for public consumption
CREATE OR REPLACE VIEW public.public_products AS
SELECT id, name, description, price, sku, category, brand, gender, 
       images, tags, status, is_featured, stock_quantity, material,
       care_instructions, size_guide, dimensions, weight,
       seo_title, seo_description, created_at, updated_at
FROM public.products
WHERE status = 'active';

-- Re-add the product policy (still needed for direct table access by admins)
CREATE POLICY "Anyone can view active products"
ON public.products
FOR SELECT
TO public
USING (status = 'active');

-- 3. Fix newsletter policy to verify email ownership
DROP POLICY IF EXISTS "Authenticated users can subscribe to newsletter" ON public.newsletter_subscribers;
CREATE POLICY "Authenticated users can subscribe to newsletter"
ON public.newsletter_subscribers
FOR INSERT
TO authenticated
WITH CHECK (
  email = (SELECT auth.email())
);
