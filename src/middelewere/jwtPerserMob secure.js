import jwt from "jsonwebtoken";
import fs from 'node:fs';

export default async function authMobile(req, res, next) {

    try {

        // Get authorization header return error if not
        const accessHeader = req.headers.access_token;
        const refreshHeader = req.headers.refresh_token;

        // get the keys
        const access_key = fs.readFileSync(process.env.ACCESS_JWT_KEY, 'utf8');
        const refresh_key = fs.readFileSync(process.env.REFRESH_JWT_KEY, 'utf8');

        // return error if no berrer token is found
        if (req.exsemtion != true) {
            if (!accessHeader) return res.status(401).json({ success: false, message: "Authorization header missing" });
        } else {
            if (!refreshHeader) return res.status(401).json({ success: false, message: "refresh header missing" });
        }

        // Verify JWT
        let accessDecoded = null;
        let refreshDecoded = null;

        if (req.exsemtion != true) {
            accessDecoded = jwt.verify(
                accessHeader,
                access_key,
                {algorithms: ['RS256']}
            )
        } else {
            refreshDecoded = jwt.verify(
                refreshHeader,
                refresh_key,
                {algorithms: ['RS256']}
            )
        };

        // Attach decoded user info
        req.format = 'token';
        if (req.exsemtion != true) { req.accessToken = accessDecoded };
        req.refreshToken = refreshDecoded;

        next();

    } catch (err) {

        return res.status(500).json({
            success: false,
            message: `error in mobile jwt perser`,
            error: err.message
        });

    }

}