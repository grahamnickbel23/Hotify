export default async function adminAuth(req, res, next) {
    try {
         
        // cheak for root admin and pass it
        const rootAdmin = req.headers.admin;
        if (rootAdmin === process.env.ROOT_ADMIN) return next();

        // get the admin email
        const admin = req.accessToken.role;

        if (admin === 'admin') {
            return next();
        } else {
            return res.status(400).json({ success: false, message: "path requre admin access" });
        }
    } catch (err) {

        return res.status(500).json({
            success: false,
            message: `error in admin cheaking`,
            error: err.message
        });

    }
}