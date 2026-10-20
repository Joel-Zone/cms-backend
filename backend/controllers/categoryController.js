const prisma = require("../config/prisma");

// Create Category
const createCategory = async (req, res, next) => {
    try {
        const { name, description } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({
                success: false,
                message: "Category name is required",
            });
        }

        const category = await prisma.category.create({
            data: {
                name: name.trim(),
                description: description ?? "",
            },
        });

        return res.status(201).json({
            success: true,
            message: "Category created successfully",
            data: category,
        });
    } catch (error) {
        if (error.code === "P2002") {
            return res.status(409).json({
                success: false,
                message: "A category with this name already exists",
            });
        }

        next(error);
    }
};

// Get All Categories
const getAllCategories = async (req, res, next) => {
    try {
        const categories = await prisma.category.findMany({
            orderBy: {
                name: "asc",
            },
        });

        return res.status(200).json({
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
        const category = await prisma.category.findUnique({
            where: {
                id: req.params.id,
            },
        });

        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found",
            });
        }

        return res.status(200).json({
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
        const data = {};

        if (name !== undefined) {
            if (!name.trim()) {
                return res.status(400).json({
                    success: false,
                    message: "Category name cannot be empty",
                });
            }

            data.name = name.trim();
        }

        if (description !== undefined) {
            data.description = description;
        }

        const category = await prisma.category.update({
            where: {
                id: req.params.id,
            },
            data,
        });

        return res.status(200).json({
            success: true,
            message: "Category updated successfully",
            data: category,
        });
    } catch (error) {
        if (error.code === "P2025") {
            return res.status(404).json({
                success: false,
                message: "Category not found",
            });
        }

        if (error.code === "P2002") {
            return res.status(409).json({
                success: false,
                message: "A category with this name already exists",
            });
        }

        next(error);
    }
};

// Delete Category
const deleteCategory = async (req, res, next) => {
    try {
        const category = await prisma.category.findUnique({
            where: {
                id: req.params.id,
            },
        });

        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found",
            });
        }

        // Prevent deletion if content uses this category
        const contentUsingCategory = await prisma.content.count({
            where: {
                categoryId: category.id,
            },
        });

        if (contentUsingCategory > 0) {
            return res.status(409).json({
                success: false,
                message:
                    "Cannot delete this category because it is being used by content.",
            });
        }

        await prisma.category.delete({
            where: {
                id: category.id,
            },
        });

        return res.status(200).json({
            success: true,
            message: "Category deleted successfully",
        });
    } catch (error) {
        if (error.code === "P2025") {
            return res.status(404).json({
                success: false,
                message: "Category not found",
            });
        }

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
