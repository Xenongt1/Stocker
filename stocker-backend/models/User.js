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
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, username, email, role, first_name, last_name, created_at
    `;
    
    const result = await db.query(query, [
      username,
      email,
      hashedPassword,
      role,
      firstName,
      lastName
    ]);
    
    return result.rows[0];
  }

  static async findByUsername(username) {
    const query = 'SELECT * FROM users WHERE username = $1';
    const result = await db.query(query, [username]);
    return result.rows[0];
  }

  static async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await db.query(query, [email]);
    return result.rows[0];
  }

  static async findById(id) {
    const query = 'SELECT * FROM users WHERE id = $1';
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
      WHERE id = $1 
      RETURNING *
    `;
    const result = await db.query(query, [userId]);
    return result.rows[0];
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
      updates.push(`username = $${paramCount}`);
      values.push(username);
      paramCount++;
    }

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updates.push(`password = $${paramCount}`);
      values.push(hashedPassword);
      paramCount++;
    }

    if (role) {
      updates.push(`role = $${paramCount}`);
      values.push(role);
      paramCount++;
    }

    if (updates.length === 0) return null;

    values.push(id);
    const query = `
      UPDATE users 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, username, role, created_at
    `;

    const { rows } = await db.query(query, values);
    return rows[0];
  }

  static async delete(id) {
    const query = 'DELETE FROM users WHERE id = $1 RETURNING id';
    const { rows } = await db.query(query, [id]);
    return rows[0];
  }
}

module.exports = User; 