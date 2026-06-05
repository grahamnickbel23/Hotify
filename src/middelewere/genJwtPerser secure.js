import jwt from "jsonwebtoken";
import fs from 'node:fs';

export default function genPerser(tokenName, keys, resultName) {

    return async function (req, res, next) {

        try {

            // get the token from cookies or header
            let genToken = null;
            if (req.format != 'token') { genToken = req.cookies[tokenName]} 
            else { genToken = req.headers[tokenName] }

            // get the keys
            const jwt_key = fs.readFileSync(process.env[keys], 'utf8');

            // verify jwt
            const tokenInfo = jwt.verify(genToken, jwt_key, { algorithms: ['RS256'] });

            // if all ok return info
            req[resultName] = tokenInfo;

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