CREATE POLICY "Allow anon to update profiles" ON profiles FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
