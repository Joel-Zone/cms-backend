
const validateContent = (req, res, next) => {
    const {
        title,
        type,
        content,
        videoUrl,
        videoSource,
    } = req.body;

    const errors = [];

    // Validate title
    if (typeof title !== "string" || title.trim() === "") {
        errors.push("Title is required");
    }

    // Validate type
    const allowedTypes = [
        "article",
        "news",
        "page",
        "announcement",
    ];

    const isUpdate = req.method === "PUT" || req.method === "PATCH";

    // Validate type
    if (!type && !isUpdate) {
        errors.push("Content type is required");
    } else if (type && !allowedTypes.includes(type)) {
        errors.push(
            "Content type must be article, news, page, or announcement"
        );
    }

    // Validate content
    if (!isUpdate) {
    if (typeof content !== "string" || content.trim() === "") {
        errors.push("Content is required");
    }
    } else if (
        content !== undefined &&
        (typeof content !== "string" || content.trim() === "")
    ) {
        errors.push("Content must be a non-empty string");
    }

    // Validate video source
    const allowedVideoSources = ["upload", "external"];

    if (
        videoSource !== undefined &&
        videoSource !== null &&
        videoSource !== "" &&
        !allowedVideoSources.includes(videoSource)
    ) {
        errors.push("Video source must be upload or external");
    }

    // Validate video URL
    if (videoUrl !== undefined && videoUrl !== null && videoUrl !== "") {
        if (typeof videoUrl !== "string") {
            errors.push("Video URL must be a string");
        } else {
            try {
                const parsedUrl = new URL(videoUrl);

                if (parsedUrl.protocol !== "https:") {
                    errors.push("Video URL must use HTTPS");
                } else if (videoSource === "external") {
                    const hostname = parsedUrl.hostname.toLowerCase();

                    const isYouTube =
                        hostname === "youtube.com" ||
                        hostname.endsWith(".youtube.com") ||
                        hostname === "youtu.be";

                    const isVimeo =
                        hostname === "vimeo.com" ||
                        hostname.endsWith(".vimeo.com");

                    if (!isYouTube && !isVimeo) {
                        errors.push(
                            "External videos must use a supported YouTube or Vimeo URL"
                        );
                    }
                }
            } catch {
                errors.push("Video URL must be a valid URL");
            }
        }
    }

    // External videos must have a URL
    if (videoSource === "external" && !videoUrl) {
        errors.push("An external video URL is required");
    }

    // If there are errors, stop the request
    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors,
        });
    }

    next();
};

module.exports = validateContent;
