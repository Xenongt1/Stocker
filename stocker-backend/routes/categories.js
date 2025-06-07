const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

/**
 * @route   GET /api/categories
 * @desc    Get all categories with stats
 * @access  Private
 */
router.get('/', auth, async (req, res) => {
    try {
        const { period } = req.query;
        const categories = await Category.getAllWithStats(period);
        res.json(categories);
    } catch (err) {
        console.error('Error fetching categories:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @route   GET /api/categories/:id
 * @desc    Get category by ID with stats
 * @access  Private
 */
router.get('/:id', auth, async (req, res) => {
    try {
        const { period } = req.query;
        const category = await Category.getSalesStats(req.params.id, period);
        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }
        res.json(category);
    } catch (err) {
        console.error('Error fetching category:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @route   POST /api/categories
 * @desc    Create a new category
 * @access  Admin
 */
router.post('/', [auth, admin], async (req, res) => {
    try {
        const { name, description } = req.body;
        
        if (!name) {
            return res.status(400).json({ error: 'Category name is required' });
        }
        
        const category = await Category.create({ name, description });
        res.status(201).json(category);
    } catch (err) {
        if (err.code === '23505') { // Unique violation
            return res.status(400).json({ error: 'Category name already exists' });
        }
        console.error('Error creating category:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @route   PUT /api/categories/:id
 * @desc    Update a category
 * @access  Admin
 */
router.put('/:id', [auth, admin], async (req, res) => {
    try {
        const { name, description } = req.body;
        
        if (!name) {
            return res.status(400).json({ error: 'Category name is required' });
        }
        
        const category = await Category.update(req.params.id, { name, description });
        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }
        res.json(category);
    } catch (err) {
        if (err.code === '23505') { // Unique violation
            return res.status(400).json({ error: 'Category name already exists' });
        }
        console.error('Error updating category:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @route   DELETE /api/categories/:id
 * @desc    Delete a category
 * @access  Admin
 */
router.delete('/:id', [auth, admin], async (req, res) => {
    try {
        const category = await Category.delete(req.params.id);
        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }
        res.json({ message: 'Category deleted successfully' });
    } catch (err) {
        console.error('Error deleting category:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router; 