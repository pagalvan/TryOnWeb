-- Create a storage bucket for snapshots
insert into storage.buckets (id, name, public)
values ('tryon-snapshots', 'tryon-snapshots', true);

-- Policy to allow public/anon users to upload snapshots (since the try-on page might be public)
create policy "Public users can upload snapshots"
on storage.objects for insert
to public
with check ( bucket_id = 'tryon-snapshots' );

-- Policy to allow public access to view snapshots (needed for Gemini to access the URL if we pass a URL, 
-- but we might pass base64. However, storing it is good for history).
create policy "Public Access"
on storage.objects for select
to public
using ( bucket_id = 'tryon-snapshots' );
