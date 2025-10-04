import pool from '../config/database.js';
import bcrypt from 'bcryptjs';

class User {
  // Create new user
  static async create({ email, password, firstName, lastName, role, companyId, managerId = null }) {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const query = `
      INSERT INTO users (email, password_hash, first_name, last_name, role, company_id, manager_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, email, first_name, last_name, role, company_id, manager_id, created_at
    `;
    
    const values = [email, hashedPassword, firstName, lastName, role, companyId, managerId];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Find user by email
  static async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await pool.query(query, [email]);
    return result.rows[0];
  }

  // Find user by ID
  static async findById(id) {
    const query = `
      SELECT id, email, first_name, last_name, role, company_id, manager_id, is_active, created_at
      FROM users WHERE id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // Verify password
  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // Get user with company details
  static async findByIdWithCompany(id) {
    const query = `
      SELECT u.id, u.email, u.first_name, u.last_name, u.role, u.company_id, u.manager_id,
             c.name as company_name, c.country, c.currency_code
      FROM users u
      JOIN companies c ON u.company_id = c.id
      WHERE u.id = $1 AND u.is_active = true
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
}

export default User;