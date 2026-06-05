import jwt from "jsonwebtoken";
import fs from 'node:fs';

export default async function authWeb(req, res, next) {

    try {

        // cheak for root admin and pass it
        const admin = req.headers.admin;
        if (admin === process.env.ROOT_ADMIN) return next();

        // get the token from cookies
        const accessToken = req.cookies.access_token;
        const refreshToken = req.cookies.refresh_token;

        // get the keys
        const access_key = fs.readFileSync(process.env.ACCESS_JWT_KEY, 'utf8');
        const refresh_key = fs.readFileSync(process.env.REFRESH_JWT_KEY, 'utf8');

        // return error if no token found
        if (req.exsemtion != true) {
            if (!accessToken) return res.status(401).json({ success: false, message: "requred token missing" });
        } else {
            if (!refreshToken) return res.status(401).json({ success: false, message: "refresh token missing" });
        }

        // Verify JWT
        let accessDecoded = null;
        let refreshDecoded = null;

        if (req.exsemtion != true) {
            accessDecoded = jwt.verify(
                accessToken,
                access_key,
                {algorithms: ['RS256']}
            )
        } else {
            refreshDecoded = jwt.verify(
                refreshToken,
                refresh_key,
                {algorithms: ['RS256']}
            )
        };

        // Attach user data to request
        if (req.exsemtion != true) { req.accessToken = accessDecoded };
        req.refreshToken = refreshDecoded

        next();

    } catch (err) {

        return res.status(500).json({
            success: false,
            message: `error in web jwt perser`,
            error: err.message
        });

    }
}