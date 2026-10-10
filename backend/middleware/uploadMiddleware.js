
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const storage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => {
        const isImage = file.mimetype.startsWith("image/");
        const isVideo = file.mimetype.startsWith("video/");

        if (!isImage && !isVideo) {
            throw new Error("Only image and video files are allowed");
        }

        return {
            folder: "cms-media",
            resource_type: isVideo ? "video" : "image",
            allowed_formats: isImage
                ? ["jpg", "jpeg", "png", "webp", "gif"]
                : ["mp4", "webm", "mov"],
        };
    },
});

const fileFilter = (req, file, cb) => {
    const allowedImageTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
    ];

    const allowedVideoTypes = [
        "video/mp4",
        "video/webm",
        "video/quicktime",
    ];

    const isAllowed =
        allowedImageTypes.includes(file.mimetype) ||
        allowedVideoTypes.includes(file.mimetype);

    if (isAllowed) {
        return cb(null, true);
    }

    return cb(
        new Error("Unsupported file type. Upload a JPG, PNG, WebP, GIF, MP4, WebM, or MOV file."),
        false
    );
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024,
        files: 1,
    },
});

module.exports = upload;
