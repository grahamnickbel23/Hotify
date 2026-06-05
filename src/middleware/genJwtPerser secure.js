import jwt from "jsonwebtoken";

export default function genPerser(tokenName, resultName) {

    return async function (req, res, next) {

        try {

            // get the token either from cookies or headers
            let token = null;
            if (req.format != 'token') { token = req.cookies[tokenName]} 
            else { token = req.headers[tokenName] }

            // decode the token
            const decoded = jwt.verify(token, global.PUBLIC_KEY, { algorithms: ["RS256"] });

            // send the info for use
            req[resultName] = decoded;

            next();

        } catch (err) {

            return res.status(500).json({
                success: false,
                message: `error in web jwt perser`,
                error: err.message
            });

        }
    }
}