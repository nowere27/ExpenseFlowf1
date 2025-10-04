import express from 'express';
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getManagers
} from '../controllers/userController.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Admin only routes
router.get('/', authorizeRoles('admin'), getAllUsers);
router.post('/', authorizeRoles('admin'), createUser);
router.get('/managers', authorizeRoles('admin'), getManagers);
router.get('/:id', authorizeRoles('admin'), getUserById);
router.put('/:id', authorizeRoles('admin'), updateUser);
router.delete('/:id', authorizeRoles('admin'), deleteUser);

export default router;