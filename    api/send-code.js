
// api/send-code.js - A mettre dans ton projet Vercel dans un dossier /api
import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  // CORS pour ton site
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({error: 'Method not allowed'});

  const { email, name } = req.body;
  
  if (!email) return res.status(400).json({error: 'Email manquant'});

  // Génère un code unique pour cet utilisateur
  const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6 chiffres unique
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // expire dans 10 min

  try {
    // 1. Sauvegarde le code dans Supabase (pour vérifier après)
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
    
    await fetch(`${supabaseUrl}/rest/v1/verification_codes`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        email: email.toLowerCase(),
        code: code,
        expires_at: expiresAt,
        created_at: new Date().toISOString()
      })
    });

    // 2. Envoie l'email via Gmail gratuit
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER, // ton_email@gmail.com
        pass: process.env.GMAIL_APP_PASSWORD // ton mot de passe app 16 lettres
      }
    });

    await transporter.sendMail({
      from: `"SHOP ONLINE Cameroun" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: `Votre code de vérification SHOP ONLINE : ${code}`,
      html: `
        <div style="font-family:Arial; max-width:600px; margin:0 auto; border:2px solid #16a34a; border-radius:15px; overflow:hidden;">
          <div style="background:linear-gradient(135deg,#16a34a,#dc2626); padding:20px; text-align:center; color:white;">
            <h1 style="margin:0;">🛒 SHOP ONLINE</h1>
            <p style="margin:5px 0 0 0;">100% GRATUIT - Cameroun</p>
          </div>
          <div style="padding:30px; text-align:center;">
            <h2>Bonjour ${name || ''} !</h2>
            <p>Votre code de vérification est :</p>
            <div style="background:#f0fdf4; border:2px dashed #16a34a; border-radius:10px; padding:20px; margin:20px 0;">
              <span style="font-size:42px; font-weight:bold; letter-spacing:8px; color:#16a34a;">${code}</span>
            </div>
            <p style="color:#666;">Ce code est unique et expire dans <b>10 minutes</b>.</p>
            <p style="color:#666; font-size:12px;">Si vous n'avez pas créé de compte, ignorez cet email.</p>
          </div>
          <div style="background:#f8fafc; padding:15px; text-align:center; font-size:12px; color:#888;">
            SHOP ONLINE Cameroun - Tous droits réservés
          </div>
        </div>
      `
    });

    return res.status(200).json({ success: true, message: 'Code envoyé', expiresAt });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erreur envoi email', details: error.message });
  }
}
