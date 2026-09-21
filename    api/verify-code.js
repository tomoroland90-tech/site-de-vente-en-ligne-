// api/verify-code.js - Vérifie le code OTP
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({error:'Method not allowed'});

  const { email, code } = req.body;
  if (!email || !code) return res.status(400).json({error:'Email et code requis', valid:false});

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
    if(!supabaseUrl || !supabaseKey) throw new Error('Config Supabase manquante');

    // Cherche le code valide non expiré
    const now = new Date().toISOString();
    const url = `${supabaseUrl}/rest/v1/verification_codes?email=eq.${encodeURIComponent(email.toLowerCase())}&code=eq.${code}&expires_at=gt.${now}&order=created_at.desc&limit=1`;
    const resp = await fetch(url, {
      headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
    });
    const data = await resp.json();
    
    if (data && data.length > 0) {
      // Supprime le code utilisé
      await fetch(`${supabaseUrl}/rest/v1/verification_codes?id=eq.${data[0].id}`, {
        method: 'DELETE',
        headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
      });
      return res.status(200).json({ success: true, valid: true });
    } else {
      return res.status(200).json({ success: true, valid: false, message: 'Code invalide ou expiré' });
    }
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message, valid:false });
  }
}
