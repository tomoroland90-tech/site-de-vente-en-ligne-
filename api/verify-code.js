const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ valid: false, error: 'Method not allowed' });

  const { email, code } = req.body || {};
  if (!email || !code) {
    return res.status(400).json({ valid: false, error: 'Email et code requis' });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ valid: false, error: 'SUPABASE_URL ou SERVICE_KEY manquant dans Vercel Env' });
  }
  const supabase = createClient(supabaseUrl, supabaseKey);

  const cleanEmail = String(email).toLowerCase().trim();
  const cleanCode = String(code).trim();

  try {
    // Le code doit correspondre ET ne pas être expiré
    const { data, error } = await supabase
      .from('verification_codes')
      .select('id')
      .eq('email', cleanEmail)
      .eq('code', cleanCode)
      .gt('expires_at', new Date().toISOString())
      .limit(1)
      .maybeSingle();

    if (error) return res.status(500).json({ valid: false, error: error.message });
    if (!data) return res.status(200).json({ valid: false });

    // Code utilisé : on le supprime (usage unique)
    await supabase.from('verification_codes').delete().eq('email', cleanEmail);

    return res.status(200).json({ valid: true });
  } catch (e) {
    return res.status(500).json({ valid: false, error: e.message });
  }
};
