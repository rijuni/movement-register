const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/db');
const Admin = require('../models/Admin');
const { authenticate, authorizeRoles } = require('../middleware/auth');

// Login Route
router.post('/login', async (req, res) => {
  const { mode, identifier, password } = req.body;

  try {
    if (mode === 'admin') {
      if (!identifier || !password) {
        return res.status(400).json({ success: false, message: 'Employee ID and password are required' });
      }

      // Find admin by empId (case-insensitive search)
      const admin = await Admin.findOne({
        where: sequelize.where(
          sequelize.fn('lower', sequelize.col('empId')),
          identifier.toLowerCase().trim()
        )
      });

      if (!admin) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      // Check password
      const isPasswordValid = bcrypt.compareSync(password, admin.password);
      if (!isPasswordValid) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      // Generate JWT Token
      const token = jwt.sign(
        { 
          id: admin.id, 
          username: `${admin.firstName} ${admin.lastName}`, 
          empId: admin.empId, 
          role: admin.role,
          location: admin.location || 'IT DATA CENTER'
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      return res.json({ 
        success: true, 
        token, 
        user: { 
          username: `${admin.firstName} ${admin.lastName}`, 
          empId: admin.empId,
          role: admin.role,
          location: admin.location || 'IT DATA CENTER'
        } 
      });
    } else {
      // Public Access - No ID check required
      const token = jwt.sign(
        { username: 'Public User', role: 'public' },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
      return res.json({ success: true, token, user: { username: 'Public User', role: 'public' } });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Reset Password Route (Accessible pre-login or post-login)
router.post('/reset-password', async (req, res) => {
  const { empId, password, confirmPassword } = req.body;

  try {
    if (!empId || !password || !confirmPassword) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
    }

    // Find admin (case-insensitive)
    const admin = await Admin.findOne({
      where: sequelize.where(
        sequelize.fn('lower', sequelize.col('empId')),
        empId.toLowerCase().trim()
      )
    });

    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin account with this Employee ID not found' });
    }

    // Update password
    const hashedPassword = bcrypt.hashSync(password, 10);
    admin.password = hashedPassword;
    await admin.save();

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Admin Management Routes (Only Super Admin can access)

// Get all admins (Super Admin only)
router.get('/admins', authenticate, authorizeRoles('SUPER_ADMIN'), async (req, res) => {
  try {
    const admins = await Admin.findAll({
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']]
    });
    res.json({ success: true, admins });
  } catch (error) {
    console.error('Get admins error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Create normal admin (Super Admin only)
router.post('/create-admin', authenticate, authorizeRoles('SUPER_ADMIN'), async (req, res) => {
  const { firstName, lastName, empId, password, confirmPassword } = req.body;

  try {
    if (!firstName || !lastName || !empId || !password || !confirmPassword) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
    }

    // Check if empId already exists (case-insensitive check)
    const existingAdmin = await Admin.findOne({
      where: sequelize.where(
        sequelize.fn('lower', sequelize.col('empId')),
        empId.toLowerCase().trim()
      )
    });

    if (existingAdmin) {
      return res.status(409).json({ success: false, message: 'Employee ID is already registered as an admin' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const newAdmin = await Admin.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      empId: empId.trim(),
      password: hashedPassword,
      role: 'ADMIN' // Always normal admin when created through this route
    });

    // Don't return password
    const adminResponse = newAdmin.toJSON();
    delete adminResponse.password;

    res.status(201).json({ success: true, admin: adminResponse, message: 'Admin account created successfully' });
  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update normal admin (Super Admin only)
router.put('/admins/:id', authenticate, authorizeRoles('SUPER_ADMIN'), async (req, res) => {
  const { firstName, lastName, empId } = req.body;
  const { id } = req.params;

  try {
    if (!firstName || !lastName || !empId) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const admin = await Admin.findByPk(id);
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin account not found' });
    }

    // Check unique empId (excluding current admin)
    const existingAdmin = await Admin.findOne({
      where: sequelize.where(
        sequelize.fn('lower', sequelize.col('empId')),
        empId.toLowerCase().trim()
      )
    });

    if (existingAdmin && existingAdmin.id !== parseInt(id)) {
      return res.status(409).json({ success: false, message: 'Employee ID is already registered' });
    }

    admin.firstName = firstName.trim();
    admin.lastName = lastName.trim();
    admin.empId = empId.trim();
    await admin.save();

    const adminResponse = admin.toJSON();
    delete adminResponse.password;

    res.json({ success: true, admin: adminResponse, message: 'Admin account updated successfully' });
  } catch (error) {
    console.error('Update admin error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete normal admin (Super Admin only)
router.delete('/admins/:id', authenticate, authorizeRoles('SUPER_ADMIN'), async (req, res) => {
  const { id } = req.params;

  try {
    const admin = await Admin.findByPk(id);
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin account not found' });
    }

    // Prevent Super Admin from deleting themselves
    if (admin.empId.toLowerCase() === req.user.empId.toLowerCase()) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own account' });
    }

    await admin.destroy();
    res.json({ success: true, message: 'Admin account deleted successfully' });
  } catch (error) {
    console.error('Delete admin error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
