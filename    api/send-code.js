// api/send-code.js - Vercel Serverless Function - Envoie code OTP via Gmail
import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({error: 'Method not allowed'});

  const { email, name } = req.body;
  if (!email) return res.status(400).json({error: 'Email manquant', success:false});

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
    if(!supabaseUrl || !supabaseKey) throw new Error('SUPABASE_URL ou SUPABASE_SERVICE_KEY manquant dans Vercel');

    // Sauvegarde dans Supabase
    const supResp = await fetch(`${supabaseUrl}/rest/v1/verification_codes`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ email: email.toLowerCase(), code: code, expires_at: expiresAt })
    });
    if(!supResp.ok){
      const txt = await supResp.text();
      console.log('Supabase insert error', txt);
      // on continue quand même pour envoyer l'email
    }

    // Envoie email via Gmail
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });

    await transporter.sendMail({
      from: `"SHOP ONLINE Cameroun" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: `Code SHOP ONLINE: ${code}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border:2px solid #16a34a;border-radius:16px;overflow:hidden">
          <div style="background:linear-gradient(135deg,#16a34a,#dc2626);padding:24px;text-align:center;color:white">
            <h1 style="margin:0;font-size:28px">🛒 SHOP ONLINE</h1>
            <p style="margin:6px 0 0 0;opacity:.9">100% GRATUIT - Cameroun</p>
          </div>
          <div style="padding:32px;text-align:center">
            <h2 style="margin:0 0 12px 0">Bonjour ${name || ''} 👋</h2>
            <p style="color:#555">Ton code de vérification à 6 chiffres :</p>
            <div style="background:#f0fdf4;border:3px dashed #16a34a;border-radius:12px;padding:20px;margin:20px 0">
              <span style="font-size:44px;font-weight:900;letter-spacing:10px;color:#16a34a">${code}</span>
            </div>
            <p style="color:#666;font-size:13px">Expire dans <b>10 minutes</b>. Ne partage ce code avec personne.</p>
            <p style="color:#888;font-size:11px;margin-top:16px">Si tu n'as pas créé de compte, ignore cet email.</p>
          </div>
          <div style="background:#f8fafc;padding:14px;text-align:center;font-size:11px;color:#999">
            SHOP ONLINE Cameroun • Douala - Yaoundé<br>Ce message est automatique, ne pas répondre
          </div>
        </div>
      `
    });

    return res.status(200).json({ success: true, message: 'Code envoyé', expiresAt });
  } catch (error) {
    console.error('send-code error', error);
    return res.status(500).json({ success:false, error: 'Erreur envoi email', details: error.message });
  }
}
