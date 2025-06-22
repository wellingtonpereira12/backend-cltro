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
      { 
        id: result.insertId,  
        email 
      },
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
      { 
        id: user.account_id,  // Use 'id' como chave
        email: user.email 
      },
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
  const computaVoto = async (req, res) => {
    console.log('computaVoto')
    if (!req.user || !req.user.id) {
    return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    // Get user ID from verified token
    const userId = req.user.id;
    const { btnvoto } = req.body;

    // Validate input
    if (!btnvoto || (btnvoto !== 1 && btnvoto !== 2)) {
      return res.status(400).json({ error: 'Botão de voto inválido.' });
    }


    let conn;
    try {
      conn = await db.getConnection();

      // Get current vote status (parameterized)
      const [users] = await conn.query(
        `SELECT voto_data1, voto_data2, pontos FROM login WHERE account_id = ?`,
        [userId]
      );

      if (users.length === 0) {
        return res.status(404).json({ error: 'Usuário não encontrado.' });
      }

      const user = users[0];
      const hoje = new Date().toISOString().slice(0, 10);
      const voteDate = btnvoto === 1 ? user.voto_data1 : user.voto_data2;

      // Check if already voted today
      if (voteDate && new Date(voteDate).toISOString().slice(0, 10) === hoje) {
        return res.status(400).json({ error: 'Você já votou hoje nesse site, volte amanhã!' });
      }

      // Update vote and points in single transaction
      await conn.query('START TRANSACTION');
      
      if (btnvoto === 1) {
        await conn.query(
          `UPDATE login SET voto_data1 = NOW(), pontos = pontos + 1 WHERE account_id = ?`,
          [userId]
        );
      } else {
        await conn.query(
          `UPDATE login SET voto_data2 = NOW(), pontos = pontos + 1 WHERE account_id = ?`,
          [userId]
        );
      }

      // Get updated user data
      const [updatedUsers] = await conn.query(
        `SELECT account_id AS id, userid AS name, email, pontos, voto_data1, voto_data2
        FROM login WHERE account_id = ?`,
        [userId]
      );
      
      await conn.query('COMMIT');

      const updatedUser = updatedUsers[0];
      
      // Generate new token with updated points
      const token = jwt.sign(
        { id: updatedUser.id, email: updatedUser.email },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      res.json({
        token,
        user: updatedUser
      });
    } catch (err) {
      await conn.query('ROLLBACK');
      console.error('Erro ao computar voto:', err);
      res.status(500).json({ error: 'Erro no servidor.' });
    } finally {
      if (conn) conn.release();
    }
  };


module.exports = {
  register,
  login,
  getMe,
  computaVoto
};