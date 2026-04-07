
-- 1. Fix profile role escalation: prevent users from changing their own role
CREATE OR REPLACE FUNCTION public.prevent_role_self_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If the role is being changed and the user is updating their own profile
  IF NEW.role IS DISTINCT FROM OLD.role AND auth.uid() = OLD.user_id THEN
    -- Only allow if the user is an admin
    IF NOT (SELECT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )) THEN
      RAISE EXCEPTION 'You cannot change your own role';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER prevent_role_self_update_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_role_self_update();

-- 2. Drop overly permissive customer policies
DROP POLICY IF EXISTS "Anyone can create customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can update their own customer record" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can select customers" ON public.customers;

-- 3. Drop overly permissive order policies
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
DROP POLICY IF EXISTS "Authenticated users can select orders" ON public.orders;

-- 4. Drop overly permissive order_items policies
DROP POLICY IF EXISTS "Anyone can create order items" ON public.order_items;
DROP POLICY IF EXISTS "Authenticated users can select order items" ON public.order_items;

-- 5. Drop overly permissive transaction policies
DROP POLICY IF EXISTS "Anyone can create transactions" ON public.transactions;
DROP POLICY IF EXISTS "Anyone can read transactions" ON public.transactions;
DROP POLICY IF EXISTS "Anyone can update transaction status" ON public.transactions;

-- 6. Restrict newsletter INSERT to authenticated users
DROP POLICY IF EXISTS "Anyone can subscribe to newsletter" ON public.newsletter_subscribers;
CREATE POLICY "Authenticated users can subscribe to newsletter"
ON public.newsletter_subscribers
FOR INSERT
TO authenticated
WITH CHECK (true);
