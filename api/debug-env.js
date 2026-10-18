module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const env = process.env;
  const check = {
    SUPABASE_URL: !!env.SUPABASE_URL,
    SUPABASE_SERVICE_KEY: !!env.SUPABASE_SERVICE_KEY,
    SUPABASE_SERVICE_ROLE_KEY: !!env.SUPABASE_SERVICE_ROLE_KEY,
    GMAIL_USER: !!env.GMAIL_USER,
    GMAIL_APP_PASSWORD: !!env.GMAIL_APP_PASSWORD,
    NODE_ENV: env.NODE_ENV || 'unknown',
    VERCEL_ENV: env.VERCEL_ENV || 'unknown',
    // Ne jamais renvoyer les valeurs, juste si elles existent
    allKeys: Object.keys(env).filter(k => k.includes('SUPABASE') || k.includes('GMAIL')).join(', ')
  };
  return res.status(200).json(check);
};
