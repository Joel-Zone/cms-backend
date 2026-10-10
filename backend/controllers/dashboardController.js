
const Content = require("../models/Content");
const Category = require("../models/Category");

const getDashboardStats = async (req, res, next) => {
    try {
        // Count all content documents.
        const totalContent = await Content.countDocuments();

        // Count published content.
        const publishedContent = await Content.countDocuments({
            status: "published",
        });

        // Count draft content.
        const draftContent = await Content.countDocuments({
            status: "draft",
        });

        // Count all categories.
        const totalCategories = await Category.countDocuments();

        // Calculate total views across all content.
        const viewsResult = await Content.aggregate([
            {
                $group: {
                    _id: null,
                    totalViews: { $sum: "$views" },
                },
            },
        ]);

        const totalViews = viewsResult.length > 0
            ? viewsResult[0].totalViews
            : 0;

        // Count content by type.
        const contentByType = await Content.aggregate([
            {
                $group: {
                    _id: "$type",
                    count: { $sum: 1 },
                },
            },
        ]);

        // Return counts for every supported content type.
        const contentTypes = {
            article: 0,
            news: 0,
            page: 0,
            announcement: 0,
        };

        contentByType.forEach((item) => {
            if (Object.prototype.hasOwnProperty.call(contentTypes, item._id)) {
                contentTypes[item._id] = item.count;
            }
        });

        return res.status(200).json({
            success: true,
            data: {
                totalContent,
                publishedContent,
                draftContent,
                totalCategories,
                totalViews,
                contentByType: contentTypes,
            },
        });
    } catch (error) {
        next(error);
    }
};


const getRecentContent = async (req, res, next) => {
    try {
        const recentContent = await Content.find()
            .sort({ updatedAt: -1 })
            .limit(5)
            .populate("author", "name email")
            .select("title slug type status updatedAt author");

        return res.status(200).json({
            success: true,
            count: recentContent.length,
            data: recentContent,
        });
    } catch (error) {
        next(error);
    }
};

const getSevenDayViews = async (req, res, next) => {
    try {
        const today = new Date();

        // Start at midnight today.
        const endDate = new Date(today);
        endDate.setHours(24, 0, 0, 0);

        // Start at midnight six days ago.
        const startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - 7);

        // Get published content created or published in the period.
        const viewsData = await Content.aggregate([
            {
                $match: {
                    status: "published",
                    publishedAt: {
                        $gte: startDate,
                        $lt: endDate,
                    },
                },
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$publishedAt" },
                        month: { $month: "$publishedAt" },
                        day: { $dayOfMonth: "$publishedAt" },
                    },
                    views: { $sum: "$views" },
                },
            },
        ]);

        // Build seven calendar-day entries, including zero-view days.
        const data = [];

        for (let i = 0; i < 7; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);

            const year = date.getFullYear();
            const month = date.getMonth() + 1;
            const day = date.getDate();

            const matchingDay = viewsData.find((item) =>
                item._id.year === year &&
                item._id.month === month &&
                item._id.day === day
            );

            data.push({
                date: date.toISOString().slice(0, 10),
                views: matchingDay ? matchingDay.views : 0,
            });
        }

        return res.status(200).json({
            success: true,
            data,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getDashboardStats,
    getRecentContent,
    getSevenDayViews,
};
