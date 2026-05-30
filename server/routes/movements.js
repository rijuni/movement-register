const express = require('express');
const router = express.Router();
const Movement = require('../models/Movement');
const { Op } = require('sequelize');
const { authenticate, authorizeRoles } = require('../middleware/auth');

// Create a new movement
router.post('/', async (req, res) => {
  try {
    const { id, employeeName, employeeId, outTime, informTo, visitLocation, purpose, date, employeeDepartment } = req.body;
    const movement = await Movement.create({
      id,
      employeeName,
      employeeId,
      outTime,
      informTo,
      visitLocation,
      purpose,
      date,
      employeeDepartment
    });
    res.status(201).json(movement);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating movement' });
  }
});

// Get all records (History)
router.get('/', async (req, res) => {
  try {
    const { role, username } = req.query;
    let filter = {};
    
    if (role === 'employee') {
      filter.employeeName = username;
    }

    const records = await Movement.findAll({
      where: filter,
      order: [['outTime', 'DESC']]
    });
    res.json(records);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching records' });
  }
});

// Mark return
router.put('/:id/return', authenticate, authorizeRoles('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const { returnTime } = req.body;
    
    const movement = await Movement.findByPk(id);
    if (!movement) return res.status(404).json({ message: 'Movement not found' });

    movement.returnTime = returnTime;
    await movement.save();
    
    res.json(movement);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating return time' });
  }
});

// Delete a record (Admin only)
router.delete('/:id', authenticate, authorizeRoles('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const movement = await Movement.findByPk(id);
    if (!movement) return res.status(404).json({ message: 'Movement not found' });

    await movement.destroy();
    res.json({ message: 'Record deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting record' });
  }
});

// Get TAT (Total Time Employee Outside) Statistics
router.get('/stats/tat', async (req, res) => {
  try {
    const { employeeName, startDate, endDate } = req.query;
    let filter = {};

    if (employeeName) {
      filter.employeeName = { [Op.like]: `%${employeeName}%` };
    }

    if (startDate && endDate) {
      filter.outTime = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    const movements = await Movement.findAll({
      where: filter,
      order: [['outTime', 'DESC']]
    });

    // Group by employee and calculate stats
    const employeeStats = {};

    movements.forEach(movement => {
      if (!employeeStats[movement.employeeName]) {
        employeeStats[movement.employeeName] = {
          employeeName: movement.employeeName,
          employeeId: movement.employeeId,
          totalTrips: 0,
          totalMinutes: 0,
          records: []
        };
      }

      if (movement.returnTime) {
        const duration = new Date(movement.returnTime) - new Date(movement.outTime);
        const minutes = Math.floor(duration / 60000);
        employeeStats[movement.employeeName].totalMinutes += minutes;
        employeeStats[movement.employeeName].totalTrips += 1;
        employeeStats[movement.employeeName].records.push({
          ...movement.dataValues,
          durationMinutes: minutes
        });
      }
    });

    // Format stats and calculate averages
    const stats = Object.values(employeeStats).map(emp => {
      const hours = Math.floor(emp.totalMinutes / 60);
      const minutes = emp.totalMinutes % 60;
      const avgMinutes = emp.totalTrips > 0 ? Math.floor(emp.totalMinutes / emp.totalTrips) : 0;
      const avgHours = Math.floor(avgMinutes / 60);
      const avgMins = avgMinutes % 60;

      return {
        employeeName: emp.employeeName,
        employeeId: emp.employeeId,
        totalTrips: emp.totalTrips,
        totalTime: `${hours}h ${minutes}m`,
        totalMinutes: emp.totalMinutes,
        averageTime: `${avgHours}h ${avgMins}m`,
        averageMinutes: avgMinutes,
        records: emp.records
      };
    });

    // Calculate overall stats
    const totalEmployees = stats.length;
    const totalTrips = stats.reduce((sum, emp) => sum + emp.totalTrips, 0);
    const totalMinutes = stats.reduce((sum, emp) => sum + emp.totalMinutes, 0);
    const totalHours = Math.floor(totalMinutes / 60);
    const totalMins = totalMinutes % 60;
    const avgMinutesPerEmployee = totalEmployees > 0 ? Math.floor(totalMinutes / totalEmployees) : 0;
    const avgHours = Math.floor(avgMinutesPerEmployee / 60);
    const avgMins = avgMinutesPerEmployee % 60;

    res.json({
      summary: {
        totalEmployees,
        totalTrips,
        totalTime: `${totalHours}h ${totalMins}m`,
        averageTimePerEmployee: `${avgHours}h ${avgMins}m`
      },
      data: stats.sort((a, b) => b.totalMinutes - a.totalMinutes)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching TAT statistics' });
  }
});

module.exports = router;
