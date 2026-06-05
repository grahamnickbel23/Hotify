export const asyncHandler = (fnc, purpose) => async (req, res, next) => {

    try {

        await fnc(req, res, next);

    } catch (err) {

        return res.status(500).json({
            success: false,
            message: `error in ${purpose}`,
            error: err.message
        });
    }
};