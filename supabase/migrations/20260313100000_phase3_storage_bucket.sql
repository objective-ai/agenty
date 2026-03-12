-- Mission banner image storage bucket (public read)
INSERT INTO storage.buckets (id, name, public)
VALUES ('mission-banners', 'mission-banners', true)
ON CONFLICT (id) DO NOTHING;

-- Anyone can read mission banners (public bucket)
CREATE POLICY "Public read mission banners"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'mission-banners');

-- Authenticated users (service role) can upload banners
CREATE POLICY "Auth insert mission banners"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'mission-banners');
