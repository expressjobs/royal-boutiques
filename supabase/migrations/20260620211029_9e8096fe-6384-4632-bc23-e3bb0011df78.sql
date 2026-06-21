-- Anyone (anon + authenticated) can read product images via signed URLs
CREATE POLICY "product_images_public_read"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'product-images');

-- Only admins can upload
CREATE POLICY "product_images_admin_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));

-- Only admins can update metadata
CREATE POLICY "product_images_admin_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));

-- Only admins can delete
CREATE POLICY "product_images_admin_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));