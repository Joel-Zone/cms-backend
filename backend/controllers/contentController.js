const Content = require("../models/Content"); //brings our Mongoose model into the controller.
const generateSlug = require("../utils/generateSlug");

const createContent = async (req, res, next) => { //contain the JSON that the React frontend eventually sends to us.
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

        const slug = generateSlug(title);

        const newContent = await Content.create({ //creates a new document in MongoDB.
            title,
            slug,
            type,
            content,
            excerpt,
            featuredImage,
            videoUrl,
            videoSource,
            category,
            author: req.user.id,
        });

        res.status(201).json({
            success: true,
            message: "Content created successfully",
            data: newContent,
        });
    } catch (error) {
        next(error);
    }
};

//Get All Content -- GET

const getAllContent = async (req, res, next) => {
    try {
        // 1. Apply the visibility rule.
        const filter =
            req.user && ["admin", "editor"].includes(req.user.role)
                ? {}
                : { status: "published" };

        // 2. Read query parameters.
        const { type, search } = req.query;

        // 3. Validate the content type.
        if (type) {
            const allowedTypes = [
                "article",
                "news",
                "page",
                "announcement",
            ];

            if (!allowedTypes.includes(type)) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid content type. Allowed types are article, news, page, and announcement.",
                });
            }

            filter.type = type;
        }

        // 4. Apply keyword search.
        if (search && search.trim()) {
            const escapedSearch = search
                .trim()
                .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

            const searchRegex = new RegExp(escapedSearch, "i");

            filter.$or = [
                { title: searchRegex },
                { excerpt: searchRegex },
            ];
        }

        // 5. Read and validate pagination parameters.
        const page = req.query.page === undefined
            ? 1
            : Number(req.query.page);

        const limit = req.query.limit === undefined
            ? 10
            : Number(req.query.limit);

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

        // 6. Calculate how many items to skip.
        const skip = (page - 1) * limit;

        // 7. Count all documents matching the filters.
        const total = await Content.countDocuments(filter);

        // 8. Retrieve only the requested page.
        const contents = await Content.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        // 9. Return the results and pagination details.
        return res.status(200).json({
            success: true,
            count: contents.length,
            pagination: {
                totalItems: total,
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                pageSize: limit,
                hasNextPage: page < Math.ceil(total / limit),
                hasPreviousPage: page > 1,
            },
            data: contents,
        });
    } catch (error) {
        next(error);
    }
};

// Get Single Content --- GET:ID
const getContentById = async (req, res, next) => {
    try {
        const content = await Content.findById(req.params.id);

        if (!content) {
            return res.status(404).json({
                success: false,
                message: "Content not found",
            });
        }

        // Check whether the requester is an authenticated editor or admin.
        const isAuthenticated =
            req.user && ["admin", "editor"].includes(req.user.role);

        // Hide drafts from public visitors.
        if (content.status !== "published" && !isAuthenticated) {
            return res.status(404).json({
                success: false,
                message: "Content not found",
            });
        }

        // Count public views of published content only.
        if (content.status === "published" && !isAuthenticated) {
            content.views += 1;
            await content.save();
        }

        return res.status(200).json({
            success: true,
            data: content,
        });
    } catch (error) {
        next(error);
    }
};


// Update Content ---- PUT
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

        // Find the content first
        const existingContent = await Content.findById(req.params.id);

        if (!existingContent) {
            return res.status(404).json({
                success: false,
                message: "Content not found",
            });
        }

        // Only admins or the content's owner can update it
        if (
            req.user.role !== "admin" &&
            existingContent.author?.toString() !== req.user.id
        ) {
            return res.status(403).json({
                success: false,
                message: "You do not have permission to update this content",
            });
        }

        // Update only the permitted fields
        if (title !== undefined) existingContent.title = title;
        if (type !== undefined) existingContent.type = type;
        if (content !== undefined) existingContent.content = content;
        if (excerpt !== undefined) existingContent.excerpt = excerpt;
        if (featuredImage !== undefined) {
            existingContent.featuredImage = featuredImage;
        }
        if (videoUrl !== undefined) existingContent.videoUrl = videoUrl;
        if (videoSource !== undefined) {
            existingContent.videoSource = videoSource;
        }
        if (category !== undefined) existingContent.category = category;

        await existingContent.save();

        res.status(200).json({
            success: true,
            message: "Content updated successfully",
            data: existingContent,
        });
    } catch (error) {
        next(error);
    }
};

// Delete Content
const deleteContent = async (req, res, next) => {
    try {
        const deletedContent = await Content.findByIdAndDelete(req.params.id);

        if (!deletedContent) {
            return res.status(404).json({
                success: false,
                message: "Content not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Content deleted successfully",
        });
    } catch (error) {
        next(error);
    }
};

const publishContent = async (req, res, next) => {
    try {
        const { status } = req.body;

        // Accept only the two supported statuses
        if (!["draft", "published"].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Status must be either draft or published",
            });
        }

        // Find the content
        const existingContent = await Content.findById(req.params.id);

        if (!existingContent) {
            return res.status(404).json({
                success: false,
                message: "Content not found",
            });
        }

        // Editors can change the status of their own content only.
        // Admins can change the status of any content.
        if (
            req.user.role !== "admin" &&
            existingContent.author?.toString() !== req.user.id
        ) {
            return res.status(403).json({
                success: false,
                message: "You do not have permission to publish this content",
            });
        }

        // Update publication status and date
        existingContent.status = status;

        if (status === "published") {
            existingContent.publishedAt =
                existingContent.publishedAt || new Date();
        } else {
            existingContent.publishedAt = null;
        }

        await existingContent.save();

        return res.status(200).json({
            success: true,
            message:
                status === "published"
                    ? "Content published successfully"
                    : "Content moved to draft successfully",
            data: existingContent,
        });
    } catch (error) {
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