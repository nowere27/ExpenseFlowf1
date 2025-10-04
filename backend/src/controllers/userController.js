import User from '../models/User.js';
import pool from '../config/database.js';

// Get all users in the company
export const getAllUsers = async (req, res) => {
  try {
    const companyId = req.user.company_id;
    
    const query = `
      SELECT u.id, u.email, u.first_name, u.last_name, u.role, u.manager_id, 
             u.is_active, u.created_at,
             m.first_name as manager_first_name, m.last_name as manager_last_name
      FROM users u
      LEFT JOIN users m ON u.manager_id = m.id
      WHERE u.company_id = $1
      ORDER BY u.created_at DESC
    `;
    
    const result = await pool.query(query, [companyId]);
    
    res.json({ users: result.rows });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get single user by ID
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user.company_id;
    
    const query = `
      SELECT u.id, u.email, u.first_name, u.last_name, u.role, u.manager_id, 
             u.is_active, u.created_at,
             m.first_name as manager_first_name, m.last_name as manager_last_name
      FROM users u
      LEFT JOIN users m ON u.manager_id = m.id
      WHERE u.id = $1 AND u.company_id = $2
    `;
    
    const result = await pool.query(query, [id, companyId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create new employee/manager
export const createUser = async (req, res) => {
  try {
    const { email, password, firstName, lastName, role, managerId } = req.body;
    const companyId = req.user.company_id;

    // Validation
    if (!email || !password || !firstName || !lastName || !role) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (!['employee', 'manager'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Must be employee or manager' });
    }

    // Check if email already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    // If manager is assigned, verify they exist and belong to same company
    if (managerId) {
      const manager = await User.findById(managerId);
      if (!manager || manager.company_id !== companyId) {
        return res.status(400).json({ message: 'Invalid manager' });
      }
    }

    // Create user
    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      role,
      companyId,
      managerId: managerId || null
    });

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        managerId: user.manager_id
      }
    });

  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update user
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, role, managerId, isActive } = req.body;
    const companyId = req.user.company_id;

    // Check if user exists and belongs to company
    const existingUser = await User.findById(id);
    if (!existingUser || existingUser.company_id !== companyId) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent admin from changing their own role
    if (id == req.user.id && role && role !== 'admin') {
      return res.status(403).json({ message: 'Cannot change your own admin role' });
    }

    // Validate role if provided
    if (role && !['admin', 'employee', 'manager'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    // If manager is assigned, verify they exist
    if (managerId) {
      const manager = await User.findById(managerId);
      if (!manager || manager.company_id !== companyId) {
        return res.status(400).json({ message: 'Invalid manager' });
      }
      // Prevent circular manager assignment
      if (managerId == id) {
        return res.status(400).json({ message: 'User cannot be their own manager' });
      }
    }

    const query = `
      UPDATE users 
      SET first_name = COALESCE($1, first_name),
          last_name = COALESCE($2, last_name),
          role = COALESCE($3, role),
          manager_id = $4,
          is_active = COALESCE($5, is_active),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $6 AND company_id = $7
      RETURNING id, email, first_name, last_name, role, manager_id, is_active
    `;

    const values = [
      firstName,
      lastName,
      role,
      managerId === undefined ? existingUser.manager_id : managerId,
      isActive,
      id,
      companyId
    ];

    const result = await pool.query(query, values);

    res.json({
      message: 'User updated successfully',
      user: result.rows[0]
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete user (soft delete - set is_active to false)
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user.company_id;

    // Check if user exists
    const existingUser = await User.findById(id);
    if (!existingUser || existingUser.company_id !== companyId) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent admin from deleting themselves
    if (id == req.user.id) {
      return res.status(403).json({ message: 'Cannot delete your own account' });
    }

    // Soft delete
    const query = `
      UPDATE users 
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND company_id = $2
    `;

    await pool.query(query, [id, companyId]);

    res.json({ message: 'User deactivated successfully' });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all managers (for dropdown)
export const getManagers = async (req, res) => {
  try {
    const companyId = req.user.company_id;
    
    const query = `
      SELECT id, first_name, last_name, email
      FROM users
      WHERE company_id = $1 AND (role = 'manager' OR role = 'admin') AND is_active = true
      ORDER BY first_name, last_name
    `;
    
    const result = await pool.query(query, [companyId]);
    
    res.json({ managers: result.rows });
  } catch (error) {
    console.error('Get managers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};