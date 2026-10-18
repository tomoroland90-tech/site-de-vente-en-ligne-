const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, code } = req.body;
  if (!email || !code) return res.status(400).json({ error: 'Email et code requis' });

  const cleanEmail = email.toLowerCase().trim();
  const cleanCode = code.trim();

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'SUPABASE_URL ou SERVICE_KEY manquant' });
  }
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data, error } = await supabase.from('verification_codes').select('*').eq('email', cleanEmail).eq('code', cleanCode).order('created_at', { ascending: false }).limit(1).maybeSingle();

  if (error || !data) {
    return res.status(200).json({ valid: false, error: 'Code incorrect' });
  }

  if (new Date(data.expires_at) < new Date()) {
    await supabase.from('verification_codes').delete().eq('id', data.id);
    return res.status(200).json({ valid: false, error: 'Code expiré' });
  }

  // Code valide - on le supprime
  await supabase.from('verification_codes').delete().eq('id', data.id);

  return res.status(200).json({ valid: true });
};
