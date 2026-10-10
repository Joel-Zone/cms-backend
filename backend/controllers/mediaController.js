
const uploadMedia = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Please select an image or video to upload",
            });
        }

        const isVideo = req.file.mimetype.startsWith("video/");

        return res.status(201).json({
            success: true,
            message: "Media uploaded successfully",
            data: {
                url: req.file.path,
                publicId: req.file.filename,
                resourceType: isVideo ? "video" : "image",
                originalName: req.file.originalname,
                format: req.file.mimetype,
                size: req.file.size,
            },
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    uploadMedia,
};
