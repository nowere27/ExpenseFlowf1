import pool from '../config/database.js';

class Company {
  // Create new company
  static async create({ name, country, currencyCode }) {
    const query = `
      INSERT INTO companies (name, country, currency_code)
      VALUES ($1, $2, $3)
      RETURNING id, name, country, currency_code, created_at
    `;
    
    const values = [name, country, currencyCode];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Find company by ID
  static async findById(id) {
    const query = 'SELECT * FROM companies WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // Create default expense categories for a company
  static async createDefaultCategories(companyId) {
    const categories = [
      { name: 'Travel', description: 'Business travel expenses' },
      { name: 'Meals', description: 'Client meetings and meals' },
      { name: 'Office Supplies', description: 'Office equipment and supplies' },
      { name: 'Technology', description: 'Software and hardware' },
      { name: 'Training', description: 'Professional development' }
    ];

    const query = `
      INSERT INTO expense_categories (company_id, name, description)
      VALUES ($1, $2, $3)
    `;

    for (const category of categories) {
      await pool.query(query, [companyId, category.name, category.description]);
    }
  }
}

export default Company;