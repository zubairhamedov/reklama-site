const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { password, name, price, phone, imageBase64, imageExt } = req.body;

  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Нотўғри пароль!' });
  }

  const fileName = `${Date.now()}.${imageExt || 'jpg'}`;
  const imageBuffer = Buffer.from(imageBase64, 'base64');

  const { error: uploadError } = await supabase.storage
    .from('products')
    .upload(fileName, imageBuffer, { contentType: `image/${imageExt || 'jpeg'}` });

  if (uploadError) return res.status(500).json({ error: uploadError.message });

  const { data: urlData } = supabase.storage
    .from('products')
    .getPublicUrl(fileName);

  const { error: dbError } = await supabase
    .from('products')
    .insert([{ name, price, phone, image_url: urlData.publicUrl }]);

  if (dbError) return res.status(500).json({ error: dbError.message });

  res.status(200).json({ success: true });
};
