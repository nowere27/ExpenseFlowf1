import User from '../models/User.js';
import Company from '../models/Company.js';
import { generateToken } from '../utils/jwt.js';
import pool from '../config/database.js';

export const signup = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { email, password, firstName, lastName, companyName, country, currencyCode } = req.body;

    // Validation
    if (!email || !password || !firstName || !lastName || !companyName || !country || !currencyCode) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if user exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Start transaction
    await client.query('BEGIN');

    // Create company
    const company = await Company.create({
      name: companyName,
      country,
      currencyCode
    });

    // Create admin user
    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      role: 'admin',
      companyId: company.id
    });

    // Create default expense categories
    await Company.createDefaultCategories(company.id);

    await client.query('COMMIT');

    // Generate JWT token
    const token = generateToken(user.id, user.role);

    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        company: {
          id: company.id,
          name: company.name,
          country: company.country,
          currencyCode: company.currency_code
        }
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error during signup' });
  } finally {
    client.release();
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await User.verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if user is active
    if (!user.is_active) {
      return res.status(403).json({ message: 'Account is deactivated' });
    }

    // Get user with company details
    const userWithCompany = await User.findByIdWithCompany(user.id);

    // Generate JWT token
    const token = generateToken(user.id, user.role);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: userWithCompany.id,
        email: userWithCompany.email,
        firstName: userWithCompany.first_name,
        lastName: userWithCompany.last_name,
        role: userWithCompany.role,
        managerId: userWithCompany.manager_id,
        company: {
          id: userWithCompany.company_id,
          name: userWithCompany.company_name,
          country: userWithCompany.country,
          currencyCode: userWithCompany.currency_code
        }
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

export const getProfile = async (req, res) => {
  try {
    // User is already attached by auth middleware
    res.json({
      user: {
        id: req.user.id,
        email: req.user.email,
        firstName: req.user.first_name,
        lastName: req.user.last_name,
        role: req.user.role,
        managerId: req.user.manager_id,
        company: {
          id: req.user.company_id,
          name: req.user.company_name,
          country: req.user.country,
          currencyCode: req.user.currency_code
        }
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
