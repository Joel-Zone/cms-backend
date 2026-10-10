const errorMiddleware = (err, req, res, next) => {
    console.error("Error details:", err);
    console.error("Error message:", err.message);
    console.error("Error name:", err.name);

    if (err.name === "CastError") {
        return res.status(400).json({
            success: false,
            message: "Invalid content ID",
        });
    }

    if (err.code === 11000) { //11000 is the specific error code for a Duplicate Key Error. 
        return res.status(409).json({
            success: false,
            message: "Content with this title already exists",
        });
    }

    res.status(500).json({
        success: false,
        message: "Internal server error",
    });
};

module.exports = errorMiddleware;