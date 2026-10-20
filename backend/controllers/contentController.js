const prisma = require("../config/prisma");
const generateSlug = require("../utils/generateSlug");

const ALLOWED_TYPES = [
    "article",
    "news",
    "page",
    "announcement",
];

const isPrivilegedUser = (req) =>
    req.user && ["admin", "editor"].includes(req.user.role);

// Create Content
const createContent = async (req, res, next) => {
    try {
        const {
            title,
            type,
            content,
            excerpt,
            featuredImage,
            videoUrl,
            videoSource,
            category,
        } = req.body;

        if (
            typeof title !== "string" ||
            !title.trim() ||
            typeof content !== "string" ||
            !content.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Title and content are required",
            });
        }

        if (!ALLOWED_TYPES.includes(type)) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid content type. Allowed types are article, news, page, and announcement.",
            });
        }

        const data = {
            title: title.trim(),
            slug: generateSlug(title.trim()),
            type,
            content,
            authorId: req.user.id,
        };

        if (excerpt !== undefined) data.excerpt = excerpt;
        if (featuredImage !== undefined) {
            data.featuredImage = featuredImage;
        }
        if (videoUrl !== undefined) data.videoUrl = videoUrl;
        if (videoSource !== undefined) data.videoSource = videoSource;
        if (category) data.categoryId = category;

        const newContent = await prisma.content.create({ data });

        return res.status(201).json({
            success: true,
            message: "Content created successfully",
            data: newContent,
        });
    } catch (error) {
        if (error.code === "P2002") {
            return res.status(409).json({
                success: false,
                message: "Content with this slug already exists",
            });
        }
        if (error.code === "P2003") {
            return res.status(400).json({
                success: false,
                message: "The selected author or category does not exist",
            });
        }
        next(error);
    }
};

// Get All Content
const getAllContent = async (req, res, next) => {
    try {
        const { type, search } = req.query;

        const where = isPrivilegedUser(req)
            ? {}
            : { status: "published" };

        if (type) {
            if (!ALLOWED_TYPES.includes(type)) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid content type. Allowed types are article, news, page, and announcement.",
                });
            }

            where.type = type;
        }

        if (typeof search === "string" && search.trim()) {
            where.OR = [
                {
                    title: {
                        contains: search.trim(),
                        mode: "insensitive",
                    },
                },
                {
                    excerpt: {
                        contains: search.trim(),
                        mode: "insensitive",
                    },
                },
            ];
        }

        const page =
            req.query.page === undefined ? 1 : Number(req.query.page);
        const limit =
            req.query.limit === undefined ? 10 : Number(req.query.limit);

        if (
            !Number.isInteger(page) ||
            !Number.isInteger(limit) ||
            page < 1 ||
            limit < 1 ||
            limit > 100
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Page must be a positive integer, and limit must be between 1 and 100.",
            });
        }

        const skip = (page - 1) * limit;

        const [total, contents] = await Promise.all([
            prisma.content.count({ where }),
            prisma.content.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
            }),
        ]);

        const totalPages = Math.ceil(total / limit);

        return res.status(200).json({
            success: true,
            count: contents.length,
            pagination: {
                totalItems: total,
                currentPage: page,
                totalPages,
                pageSize: limit,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1,
            },
            data: contents,
        });
    } catch (error) {
        next(error);
    }
};

// Get Single Content
const getContentById = async (req, res, next) => {
    try {
        const content = await prisma.content.findUnique({
            where: { id: req.params.id },
        });

        if (!content) {
            return res.status(404).json({
                success: false,
                message: "Content not found",
            });
        }

        const isAuthenticated = isPrivilegedUser(req);

        if (content.status !== "published" && !isAuthenticated) {
            return res.status(404).json({
                success: false,
                message: "Content not found",
            });
        }

        let result = content;

        if (content.status === "published" && !isAuthenticated) {
            result = await prisma.content.update({
                where: { id: content.id },
                data: { views: { increment: 1 } },
            });
        }

        return res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

// Update Content
const updateContent = async (req, res, next) => {
    try {
        const {
            title,
            type,
            content,
            excerpt,
            featuredImage,
            category,
            videoUrl,
            videoSource,
        } = req.body;

        const existingContent = await prisma.content.findUnique({
            where: { id: req.params.id },
        });

        if (!existingContent) {
            return res.status(404).json({
                success: false,
                message: "Content not found",
            });
        }

        if (
            req.user.role !== "admin" &&
            existingContent.authorId !== req.user.id
        ) {
            return res.status(403).json({
                success: false,
                message: "You do not have permission to update this content",
            });
        }

        if (title !== undefined && (
            typeof title !== "string" || !title.trim()
        )) {
            return res.status(400).json({
                success: false,
                message: "Title cannot be empty",
            });
        }

        if (type !== undefined && !ALLOWED_TYPES.includes(type)) {
            return res.status(400).json({
                success: false,
                message: "Invalid content type",
            });
        }

        const data = {};

        if (title !== undefined) data.title = title.trim();
        if (type !== undefined) data.type = type;
        if (content !== undefined) data.content = content;
        if (excerpt !== undefined) data.excerpt = excerpt;
        if (featuredImage !== undefined) {
            data.featuredImage = featuredImage;
        }
        if (videoUrl !== undefined) data.videoUrl = videoUrl;
        if (videoSource !== undefined) data.videoSource = videoSource;

        if (category !== undefined) {
            data.categoryId = category || null;
        }

        const updatedContent = await prisma.content.update({
            where: { id: req.params.id },
            data,
        });

        return res.status(200).json({
            success: true,
            message: "Content updated successfully",
            data: updatedContent,
        });
    } catch (error) {
        if (error.code === "P2002") {
            return res.status(409).json({
                success: false,
                message: "Content with this slug already exists",
            });
        }
        if (error.code === "P2003") {
            return res.status(400).json({
                success: false,
                message: "The selected category does not exist",
            });
        }
        if (error.code === "P2025") {
            return res.status(404).json({
                success: false,
                message: "Content not found",
            });
        }
        next(error);
    }
};

// Delete Content
const deleteContent = async (req, res, next) => {
    try {
        const deletedContent = await prisma.content.delete({
            where: { id: req.params.id },
        });

        return res.status(200).json({
            success: true,
            message: "Content deleted successfully",
        });
    } catch (error) {
        if (error.code === "P2025") {
            return res.status(404).json({
                success: false,
                message: "Content not found",
            });
        }
        next(error);
    }
};

// Publish or Unpublish Content
const publishContent = async (req, res, next) => {
    try {
        const { status } = req.body;

        if (!["draft", "published"].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Status must be either draft or published",
            });
        }

        const existingContent = await prisma.content.findUnique({
            where: { id: req.params.id },
        });

        if (!existingContent) {
            return res.status(404).json({
                success: false,
                message: "Content not found",
            });
        }

        if (
            req.user.role !== "admin" &&
            existingContent.authorId !== req.user.id
        ) {
            return res.status(403).json({
                success: false,
                message: "You do not have permission to publish this content",
            });
        }

        const updatedContent = await prisma.content.update({
            where: { id: req.params.id },
            data: {
                status,
                publishedAt:
                    status === "published"
                        ? existingContent.publishedAt || new Date()
                        : null,
            },
        });

        return res.status(200).json({
            success: true,
            message:
                status === "published"
                    ? "Content published successfully"
                    : "Content moved to draft successfully",
            data: updatedContent,
        });
    } catch (error) {
        if (error.code === "P2025") {
            return res.status(404).json({
                success: false,
                message: "Content not found",
            });
        }
        next(error);
    }
};

module.exports = {
    createContent,
    getAllContent,
    getContentById,
    updateContent,
    deleteContent,
    publishContent,
};
