const nodemailer = require('nodemailer');
const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, name } = req.body;
  if (!email) return res.status(400).json({ error: 'Email requis' });

  const cleanEmail = email.toLowerCase().trim();
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'SUPABASE_URL ou SERVICE_KEY manquant dans Vercel Env' });
  }
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Supprime anciens codes
  await supabase.from('verification_codes').delete().eq('email', cleanEmail);

  // Insère nouveau code
  const { error: insertError } = await supabase.from('verification_codes').insert([{ email: cleanEmail, code: code, expires_at: expiresAt }]);
  if (insertError) return res.status(500).json({ error: 'Supabase insert error', details: insertError.message });

  // Envoie email via Gmail
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;
  if (!gmailUser || !gmailPass) {
    return res.status(500).json({ error: 'GMAIL_USER ou GMAIL_APP_PASSWORD manquant dans Vercel' });
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: gmailUser, pass: gmailPass }
  });

  const mailOptions = {
    from: `"SHOP ONLINE Cameroun" <${gmailUser}>`,
    to: cleanEmail,
    subject: `Ton code SHOP ONLINE : ${code}`,
    html: `
      <div style="font-family: Arial; max-width: 500px; margin: auto; border: 2px solid #16a34a; border-radius: 12px; padding: 20px;">
        <h2 style="color: #16a34a; text-align: center;">🔐 Vérification SHOP ONLINE</h2>
        <p>Salut ${name || ''} !</p>
        <p>Ton code unique à 6 chiffres est :</p>
        <div style="background: #f0fdf4; border: 2px dashed #16a34a; border-radius: 10px; padding: 15px; text-align: center; font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #16a34a;">${code}</div>
        <p style="font-size: 12px; color: #666; text-align: center; margin-top: 15px;">Expire dans 10 minutes. Ne partage ce code avec personne.<br>Si tu n'as pas demandé ce code, ignore cet email.</p>
        <p style="font-size: 11px; text-align: center; color: #999;">SHOP ONLINE - 100% Gratuit - Cameroun 🇨🇲</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return res.status(200).json({ success: true, message: 'Code envoyé' });
  } catch (mailErr) {
    console.error('Mail error', mailErr);
    return res.status(500).json({ error: 'Erreur envoi email', details: mailErr.message });
  }
};
