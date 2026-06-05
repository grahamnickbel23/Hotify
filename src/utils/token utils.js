import crypto from 'node:crypto';
import fs from 'node:fs';
import jwt from 'jsonwebtoken';
import cryptoRandomString from 'crypto-random-string';
import userModel from '../model/user Model.js';

export default class token {

    // access_token
    static async access_token(userModel) {

        const access_key = fs.readFileSync(process.env.ACCESS_JWT_KEY, 'utf8');
        const accessToken = jwt.sign(
            {
                userId: userModel._id,
                role: userModel.userType,
                prefarence: userModel.prefarence
            },
            access_key,
            {   algorithm: 'RS256',
                expiresIn: '1h' 
            }
        )

        return accessToken;
    }

    // refresh_token
    static async refresh_token(userId) {

        // genarate refresh token string
        const refreshTokenString = cryptoRandomString({ length: 24, type: "alphanumeric" });

        // get the keys
        const refresh_key = fs.readFileSync(process.env.REFRESH_JWT_KEY, 'utf8');

        // hashed token
        const hashedToken = crypto
            .createHash("sha256")
            .update(refreshTokenString)
            .digest("hex");

        // save hashed token to database
        await userModel.findByIdAndUpdate(
            userId,
            { refreshToken: hashedToken }
        );

        // genarate refresh token
        const refreshToken = jwt.sign(
            { token: refreshTokenString },
            refresh_key,
            {   algorithm: 'RS256',
                expiresIn: '7d'
            }
        )

        return refreshToken;
    }

    // login trust token
    static async trust_token(userModel) {

        const jwt_key = fs.readFileSync(process.env.TRUST_LOGIN_JWT_KEY, 'utf8');
        const trustLoginToken = jwt.sign(
            {
                userId: userModel._id,
                purpose: "login"
            },
            jwt_key,
            {   algorithm: 'RS256',
                expiresIn: '5m' 
            }
        )

        return trustLoginToken;
    }

    // otp access token
    static async otp_token(userModel) {

        const jwt_key = fs.readFileSync(process.env.OTP_JWT_KEY, 'utf8');
        const OTPAccessToken = jwt.sign(
            {
                userId: userModel._id,
                purpose: "otp_access"
            },
            jwt_key,
            {   algorithm: 'RS256',
                expiresIn: '30m' 
            }
        )

        return OTPAccessToken;
    }

}