
const Category = require("../models/Category");
const Content = require("../models/Content");

// Create Category
const createCategory = async (req, res, next) => {
    try {
        const { name, description } = req.body;

        const category = await Category.create({
            name,
            description,
        });

        res.status(201).json({
            success: true,
            message: "Category created successfully",
            data: category,
        });
    } catch (error) {
        next(error);
    }
};

// Get All Categories
const getAllCategories = async (req, res, next) => {
    try {
        const categories = await Category.find().sort({ name: 1 });

        res.status(200).json({
            success: true,
            count: categories.length,
            data: categories,
        });
    } catch (error) {
        next(error);
    }
};

// Get Single Category
const getCategoryById = async (req, res, next) => {
    try {
        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found",
            });
        }

        res.status(200).json({
            success: true,
            data: category,
        });
    } catch (error) {
        next(error);
    }
};

// Update Category
const updateCategory = async (req, res, next) => {
    try {
        const { name, description } = req.body;

        const category = await Category.findByIdAndUpdate(
            req.params.id,
            { name, description },
            {
                new: true,
                runValidators: true,
            }
        );

        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Category updated successfully",
            data: category,
        });
    } catch (error) {
        next(error);
    }
};


// Delete Category
const deleteCategory = async (req, res, next) => {
    try {
        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found",
            });
        }

        // Check whether any content uses this category
        const contentUsingCategory = await Content.exists({
            category: category._id,
        });

        if (contentUsingCategory) {
            return res.status(409).json({
                success: false,
                message: "Cannot delete this category because it is being used by content.",
            });
        }

        await category.deleteOne();

        return res.status(200).json({
            success: true,
            message: "Category deleted successfully",
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createCategory,
    getAllCategories,
    getCategoryById,
    updateCategory,
    deleteCategory,
};