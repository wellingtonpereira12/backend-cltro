const db = require('../config/db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Função para registrar novo usuário
const register = async (req, res) => {
  const { name, email, password } = req.body;

  // Validações
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'A senha deve ter pelo menos 8 caracteres.' });
  }
  let conn;
  try {
    conn = await db.getConnection();  

    // Verificar se email já existe
    const [existing] = await conn.query(
      'SELECT email FROM login WHERE email = ?',
      [email]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Email já cadastrado.' });
    }

    const [existingLogin] = await conn.query(
      'SELECT userid FROM login WHERE userid = ?',
      [name]
    );

    if (existingLogin.length > 0) {
      return res.status(400).json({ error: 'Login já cadastrado.' });
    }

    // Inserir novo usuário
    const insertQuery = `
      INSERT INTO login
      (ACCOUNT_ID, userid, user_pass, sex, email, group_id, state,
       unban_time, expiration_time, logincount, lastlogin, last_ip, birthdate, character_slots, pincode,
       pincode_change, vip_time, old_group, web_auth_token, web_auth_token_enabled)
      SELECT
        COALESCE(MAX(ACCOUNT_ID), 0) + 1,
        ?, ?, 'M', ?,
        1, 0, 0, 0, 0, 0, 0, NULL,
        9, '', 0, 0, 0, NULL, 0
      FROM login
    `;

    const [result] = await conn.query(insertQuery, [
      name,
      password,
      email,
    ]);

    // Gerar token JWT
    const token = jwt.sign(
      { id: result.insertId, email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.status(201).json({
      token,
      user: {
        id: result.insertId,
        name,
        email,
        pontos: 0,
        voto_data1: null,
        voto_data2: null
      }
    });
  } catch (err) {
    console.error('Erro no registro:', err);
    res.status(500).json({ error: 'Erro no servidor.' });
  } finally {
    if (conn) conn.release();
  }
};

// Função para autenticar usuário
const login = async (req, res) => {
  const { login, password } = req.body;

  if (!login || !password) {
    return res.status(400).json({ error: 'Login e senha são obrigatórios.' });
  }

  let conn;
  try {
    conn = await db.getConnection();

    // Buscar usuário pelo email
    const [users] = await conn.query(
      `SELECT account_id, userid, user_pass, email, pontos, voto_data1, voto_data2
       FROM login WHERE userid = ? and user_pass = ?`,
      [login, password]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Credenciais inválidas..' });
    }

    const user = users[0];

    // Gerar token JWT
    const token = jwt.sign(
      { id: user.account_id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      token,
      user: {
        id: user.account_id,
        name: user.userid,
        email: user.email,
        pontos: user.pontos,
        voto_data1: user.voto_data1,
        voto_data2: user.voto_data2,
      }
    }); 
  } catch (err) {
    console.error('Erro no login:', err);
    res.status(500).json({ error: 'Erro no servidor.' });
  } finally {
    if (conn) conn.release();
  }
};

// Função para obter dados do usuário autenticado
const getMe = async (req, res) => {
  const userId = req.user.id;

  let conn;
  try {
    conn = await db.getConnection();

    const [users] = await conn.query(
      `SELECT account_id AS id, userid AS name, email, pontos, voto_data1, voto_data2
       FROM login WHERE account_id = ?`,
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    res.json(users[0]);
  } catch (err) {
    console.error('Erro ao buscar usuário:', err);
    res.status(500).json({ error: 'Erro no servidor.' });
  } finally {
    if (conn) conn.release();
  }
};

// Função para obter dados do usuário autenticado
const ComputaVoto = async (req, res) => {
  const { userId, btnvoto} = req.body;

  let conn;
  try {
    conn = await db.getConnection();

    const [users] = await conn.query(
      `SELECT voto_data1, voto_data2
       FROM login WHERE account_id = ?`,
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    // Atualiza da data da ultima atualização 
    const insertQuery = `
    
    `;

    if (btnvoto = 1) {
      if (users.voto_data1 === now()) {
        return res.status(404).json({ error: 'Você já votou hoje nesse site, volte amanha!' });
      } else {
        const [result] = await conn.query(insertQuery, [
          userId,
          voto_data1,
          voto_data2,
        ]);
      }
    } else
    if (btnvoto = 2) {
      if (users.voto_data2 === now()) {
        return res.status(404).json({ error: 'Você já votou hoje nesse site, volte amanha!' });
      } else {
        const [result] = await conn.query(insertQuery, [
          userId,
          voto_data1,
          voto_data2,
        ]);
      }
    }

    res.json(users[0]);
  } catch (err) {
    console.error('Erro ao buscar usuário:', err);
    res.status(500).json({ error: 'Erro no servidor.' });
  } finally {
    if (conn) conn.release();
  }
};

module.exports = {
  register,
  login,
  getMe,
  ComputaVoto
};