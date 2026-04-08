DROP POLICY IF EXISTS "Allow all access to requisitions" ON public.requisitions;

CREATE POLICY "Public can view requisitions"
ON public.requisitions
FOR SELECT
TO public
USING (true);

CREATE POLICY "Anonymous can create requisitions"
ON public.requisitions
FOR INSERT
TO anon
WITH CHECK (auth.role() = 'anon');

CREATE POLICY "Authenticated can create requisitions"
ON public.requisitions
FOR INSERT
TO authenticated
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Anonymous can update requisitions"
ON public.requisitions
FOR UPDATE
TO anon
USING (auth.role() = 'anon')
WITH CHECK (auth.role() = 'anon');

CREATE POLICY "Authenticated can update requisitions"
ON public.requisitions
FOR UPDATE
TO authenticated
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Anonymous can delete requisitions"
ON public.requisitions
FOR DELETE
TO anon
USING (auth.role() = 'anon');

CREATE POLICY "Authenticated can delete requisitions"
ON public.requisitions
FOR DELETE
TO authenticated
USING (auth.role() = 'authenticated');