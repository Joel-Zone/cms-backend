const prisma = require("../config/prisma");

const CONTENT_TYPES = ["article", "news", "page", "announcement"];

const getDashboardStats = async (req, res, next) => {
    try {
        const [
            totalContent,
            publishedContent,
            draftContent,
            totalCategories,
            viewsResult,
            contentByTypeResult,
        ] = await Promise.all([
            prisma.content.count(),

            prisma.content.count({
                where: { status: "published" },
            }),

            prisma.content.count({
                where: { status: "draft" },
            }),

            prisma.category.count(),

            prisma.content.aggregate({
                _sum: { views: true },
            }),

            prisma.content.groupBy({
                by: ["type"],
                _count: { _all: true },
            }),
        ]);

        const contentByType = {
            article: 0,
            news: 0,
            page: 0,
            announcement: 0,
        };

        for (const item of contentByTypeResult) {
            if (Object.prototype.hasOwnProperty.call(
                contentByType,
                item.type
            )) {
                contentByType[item.type] = item._count._all;
            }
        }

        return res.status(200).json({
            success: true,
            data: {
                totalContent,
                publishedContent,
                draftContent,
                totalCategories,
                totalViews: viewsResult._sum.views ?? 0,
                contentByType,
            },
        });
    } catch (error) {
        next(error);
    }
};

const getRecentContent = async (req, res, next) => {
    try {
        const recentContent = await prisma.content.findMany({
            orderBy: {
                updatedAt: "desc",
            },
            take: 5,
            select: {
                title: true,
                slug: true,
                type: true,
                status: true,
                updatedAt: true,
                author: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
            },
        });

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
        // Use UTC calendar days consistently for date boundaries.
        const today = new Date();
        const endDate = new Date(today);
        endDate.setUTCHours(0, 0, 0, 0);
        endDate.setUTCDate(endDate.getUTCDate() + 1);

        const startDate = new Date(endDate);
        startDate.setUTCDate(startDate.getUTCDate() - 7);

        const viewsData = await prisma.content.findMany({
            where: {
                status: "published",
                publishedAt: {
                    gte: startDate,
                    lt: endDate,
                },
            },
            select: {
                publishedAt: true,
                views: true,
            },
        });

        const viewsByDay = new Map();

        for (const item of viewsData) {
            if (!item.publishedAt) continue;

            const dateKey = item.publishedAt
                .toISOString()
                .slice(0, 10);

            viewsByDay.set(
                dateKey,
                (viewsByDay.get(dateKey) ?? 0) + item.views
            );
        }

        const data = [];

        for (let i = 0; i < 7; i++) {
            const date = new Date(startDate);
            date.setUTCDate(startDate.getUTCDate() + i);

            const dateKey = date.toISOString().slice(0, 10);

            data.push({
                date: dateKey,
                views: viewsByDay.get(dateKey) ?? 0,
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
