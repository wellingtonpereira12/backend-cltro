const db = require('../config/db');

const createAccount = async (req, res) => {
  const { userid, user_pass, sex, email } = req.body;

  if (!userid || !user_pass || !sex || !email) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
  }

  if (userid.length <= 6) {
  return res.status(400).json({ error: 'Seu login deve ter mais de 6 caracteres.' });
  }

  if (user_pass.length <= 6) {
  return res.status(400).json({ error: 'Seu senha deve ter maisde 6 caracteres.' });
  }

  if (sex !== 'M' && sex !== 'F') {
    return res.status(400).json({ error: 'Sexo inválido. Use M ou F.' });
  }

  let conn;
  try {
    conn = await db.getConnection();

    const [existing] = await conn.query(
      'SELECT userid, email FROM login WHERE userid = ? OR email = ?',
      [userid, email]
    );

    console.log(existing); // isso agora mostrará somente os dados

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Login ou email já cadastrado.' });
    }

    const insertQuery = `
      INSERT INTO login
      (ACCOUNT_ID, userid, user_pass, sex, email, group_id, state,
       unban_time, expiration_time, logincount, lastlogin, last_ip, birthdate, character_slots, pincode,
       pincode_change, vip_time, old_group, web_auth_token, web_auth_token_enabled)
      SELECT
        COALESCE(MAX(ACCOUNT_ID), 0) + 1,
        ?, ?, ?, ?,
        1, 0, 0, 0, 0, 0, 0, NULL,
        9, '', 0, 0, 0, NULL, 0
      FROM login
    `;

    await conn.query(insertQuery, [userid, user_pass, sex, email]);

    res.json({ message: 'Conta criada com sucesso!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro no servidor.' });
  } finally {
    if (conn) conn.release();
  }
};

module.exports = {
  createAccount,
};
