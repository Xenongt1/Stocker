const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');

class User {
  static async create(userData) {
    const { username, email, password, role = 'user', firstName, lastName } = userData;

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const query = `
      INSERT INTO users (username, email, password, role, first_name, last_name)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const result = await db.query(query, [
      username,
      email,
      hashedPassword,
      role,
      firstName,
      lastName
    ]);

    const newUser = await db.query(
      'SELECT id, username, email, role, first_name, last_name, created_at FROM users WHERE id = ?',
      [result.insertId]
    );

    return newUser.rows[0];
  }

  static async findByUsername(username) {
    const query = 'SELECT * FROM users WHERE username = ?';
    const result = await db.query(query, [username]);
    return result.rows[0];
  }

  static async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = ?';
    const result = await db.query(query, [email]);
    return result.rows[0];
  }

  static async findById(id) {
    const query = 'SELECT * FROM users WHERE id = ?';
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  static async validatePassword(user, password) {
    return bcrypt.compare(password, user.password);
  }

  static generateAuthToken(user) {
    return jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role
      },
      jwtConfig.secret,
      jwtConfig.options
    );
  }

  static async updateLastLogin(userId) {
    const query = `
      UPDATE users 
      SET last_login = CURRENT_TIMESTAMP 
      WHERE id = ?
    `;
    await db.query(query, [userId]);
    const updatedUser = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
    return updatedUser.rows[0];
  }

  static async list() {
    const query = 'SELECT id, username, role, created_at FROM users ORDER BY created_at DESC';
    const { rows } = await db.query(query);
    return rows;
  }

  static async update(id, { username, password, role }) {
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (username) {
      updates.push(`username = ?`);
      values.push(username);
    }

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updates.push(`password = ?`);
      values.push(hashedPassword);
    }

    if (role) {
      updates.push(`role = ?`);
      values.push(role);
    }

    if (updates.length === 0) return null;

    values.push(id);
    const query = `
      UPDATE users 
      SET ${updates.join(', ')}
      WHERE id = ?
    `;

    await db.query(query, values);
    const updatedUser = await db.query('SELECT id, username, role, created_at FROM users WHERE id = ?', [id]);
    return updatedUser.rows[0];
  }

  static async delete(id) {
    const query = 'DELETE FROM users WHERE id = ?';
    await db.query(query, [id]);
    return { id };
  }
}

module.exports = User; 