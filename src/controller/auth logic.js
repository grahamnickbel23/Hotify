import crypto from 'node:crypto';
import fs from 'node:fs';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import cryptoRandomString from 'crypto-random-string';
import userModel from '../model/user Model.js';
import otpVerification from '../services/otpVerify service.js';
import token from '../utils/token utils.js';

export default class auth {

    // sign up otp
    static async signup(req, res) {

        // get the data
        const data = req.body;

        // return erorr for incomplete info
        if (!data.email || !data.password) return res.status(400).json({ success: false, message: 'incomplete signup information' });

        // cheak for dublicate entry
        const doesUserExist = await userModel.findOne({ email: data.email });
        if (doesUserExist) return res.status(409).json({ success: false, message: `user already exisit` });

        // if all ok go for password hasing
        data.password = await bcrypt.hash(data.password, 10);

        // save all the info
        const newData = userModel(data);
        await newData.save();

        // return ok if all ok
        return res.status(200).json({
            success: true,
            message: `account created sucessfully`
        });
    }

    // request login 
    static async requestLogin(req, res) {

        // get the data and return error for mission info
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ suucess: false, message: `incomplete authentication issue` });

        // cheak if the user exisit
        const doesUserExist = await userModel.findOne({ email: email });
        if (!doesUserExist) return res.status(404).json({ success: false, message: `user doesn't exsist ` });

        // if all ok cheak for password
        const doesPasswordMatch = await bcrypt.compare(password, doesUserExist.password);
        if (!doesPasswordMatch) return res.status(401).json({ success: false, message: `wrong email or password` });

        // if all ok send email with otp
        await otpVerification.sendOtp(email);

        // generate login trust token
        const loginTrust = await token.trust_token(doesUserExist);

        // send access_token and refresh_token in requested fromat
        if (req.format == 'token') {
            return res.status(200).json({
                success: true,
                message: `sucessfully sent otp via email`,
                trustToken: loginTrust
            })

        } else {

            // send cookies
            res.cookie("trust_token", loginTrust, {
                httpOnly: true,
                //secure: process.env.NODE_ENV === "production",
                sameSite: "Lax",
                maxAge: 5 * 60 * 1000 // 5 min
            });

            return res.status(200).json({
                success: true,
                message: `sucessfully sent otp via email`,
            });
        }
    }

    // confirm login
    static async confirmLogin(req, res) {

        // get the otp
        const data = req.body;
        const userId = req.trustInfo.userId;
        if (!userId || !data.otp) return res.status(400).json({ suucess: false, message: `incomplete information for authentication` })

        // cheak if the user exisit
        const doesUserExist = await userModel.findById(userId);
        if (!doesUserExist) return res.status(404).json({ success: false, message: `user doesn't exsist ` });

        // verify otp
        await otpVerification.verifyOTP(doesUserExist, data);

        // generate tokens first
        const accessToken = await token.access_token(doesUserExist);
        const refreshToken = await token.refresh_token(doesUserExist._id);
        const otpAccessToken = await token.otp_token(doesUserExist);

        // send access_token and refresh_token in requested fromat
        if (req.format == 'token') {
            return res.status(200).json({
                success: true,
                message: `sucessfully sent access and refresh token`,
                accessToken: accessToken,
                refreshToken: refreshToken
            })

        } else {

            // send cookies
            res.cookie("access_token", accessToken, {
                httpOnly: true,
                //secure: process.env.NODE_ENV === "production",
                sameSite: "Lax",
                maxAge: 60 * 60 * 1000 // 1 hour
            });

            res.cookie("refresh_token", refreshToken, {
                httpOnly: true,
                //secure: process.env.NODE_ENV === "production",
                sameSite: "Lax",
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
            });

            res.cookie("otp_token", otpAccessToken, {
                httpOnly: true,
                //secure: process.env.NODE_ENV === "production",
                sameSite: "Lax",
                maxAge: 30 * 60 * 1000 // 0.5 hour
            });

            return res.status(200).json({
                success: true,
                message: `sucessfully sent tokens in cookies`,
            })
        }
    }

    // logout
    static async logout(req, res) {

        // get user id
        const userId = req.accessToken.userId;

        // remove refresh token from database
        await userModel.findByIdAndUpdate(
            userId,
            { refreshToken: null }
        );

        // clear cookies
        if (req.format != 'token') {
            res.clearCookie("access_token");
            res.clearCookie("refresh_token");
        }

        return res.status(200).json({
            success: true,
            message: "logged out successfully"
        });
    }

    // token
    static async tokenIssue(req, res) {

        // get info from refresh token
        const refreshTokenString = req.refreshToken.token;

        // hased the token
        const hashedToken = crypto
            .createHash("sha256")
            .update(refreshTokenString)
            .digest("hex");


        // search the token in the db
        const doesUserExisit = await userModel.findOne({ refreshToken: hashedToken });
        if (!doesUserExisit) return res.status(400).json({ success: false, message: `user doesn't exisit` });

        // generate tokens first
        const accessToken = await token.access_token(doesUserExisit);

        // create access token and send then
        if (req.format == 'token') {
            return res.status(200).json({
                success: true,
                message: `sucessfully sent access token`,
                accessToken: accessToken
            })
        } else {
            res.cookie("access_token", accessToken, {
                httpOnly: true,
                //secure: process.env.NODE_ENV === "production",
                sameSite: "Lax",
                maxAge: 60 * 60 * 1000 // 1 hour
            });

            return res.status(200).json({
                success: true,
                message: `sucessfully sent access token`
            })
        }
    }

    // public jwt key
    static async publicKey(req, res) {

        // get private key from env
        const privet_key = fs.readFileSync(process.env.ACCESS_JWT_KEY, 'utf8');

        // generate public key
        const publicKey = crypto
            .createPublicKey(privet_key)
            .export({
                type: "spki",
                format: "pem"
            });

        // send public key
        return res.status(200).json({
            success: true,
            message: "public key generated successfully",
            publicKey: publicKey
        });
    }


    // profile
    static async profile(req, res) {

        // get the data
        const userId = req.accessToken.userId;

        // get the user info
        const userInfo = await userModel.findById(userId).select("-password -prefarence");
        if (!userInfo) return res.status(404).json({ success: false, message: `user dones not exisit` });

        // send user info
        return res.status(200).json({
            success: true,
            message: `user profile info`,
            profile: userInfo
        })
    }

    // profile for microservices
    static async microProfile(req, res) {

        // get the data
        const userId = req.body.userId;

        // get the user info
        const userInfo = await userModel.findById(userId).select("-password -prefarence");
        if (!userInfo) return res.status(404).json({ success: false, message: `user dones not exisit` });

        // send user info
        return res.status(200).json({
            success: true,
            message: `user profile info`,
            profile: userInfo
        })
    }

    // delete
    static async delete(req, res) {

        // get the userId
        const userId = req.accessToken.userId;

        // delete the user account
        await userModel.findByIdAndDelete(userId);

        // clear cookies
        if (req.format != 'token') {
            res.clearCookie("access_token");
            res.clearCookie("refresh_token");
        }

        return res.status(200).json({
            success: true,
            message: "account deleted successfully"
        });
    }
}