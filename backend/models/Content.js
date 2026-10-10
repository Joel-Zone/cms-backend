const mongoose = require("mongoose");

const contentSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },

        slug: {   //URL-friendly identifier.
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },

        type: {
            type: String,
            required: true,
            enum: ["article", "news", "page", "announcement"],
        },

        content: {
            type: String,
            required: true,
        },

        excerpt: {
            type: String,
            trim: true,
        },

        featuredImage: {
            type: String,
            default: null,
        },

        videoUrl: {
            type: String,
            default: null,
            trim: true,
        },

        videoSource: {
            type: String,
            enum: ["upload", "external"],
            default: null,
        },

        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: false,
        },

        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category",
            required: false,
        },

        status: {
            type: String,
            enum: ["draft", "published"],
            default: "draft",
        },

        views: {
            type: Number,
            default: 0,
        },

        publishedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

const Content = mongoose.model("Content", contentSchema);

module.exports = Content;