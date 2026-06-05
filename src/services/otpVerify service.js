import bcrypt from 'bcrypt';
import cryptoRandomString from "crypto-random-string";
import { redisConnect } from "../../connectRedis.js";

export default class otpVerification {

    // send otp
    static async sendOtp(email) {

        // check cooldown
        const cooldown = await redisConnect.get( `otp_cooldown:${email}` );
        if (cooldown) throw new Error( "Please wait before requesting another OTP" );

        // generate otp
        const generatedOTP = cryptoRandomString({ length: 6, type: 'numeric' });

        // hash otp
        const hashedOTP = await bcrypt.hash( generatedOTP, 10 );

        // save otp
        await redisConnect.set( `otp:${email}`, hashedOTP, { EX: 130 });

        // clear old attempt counter
        await redisConnect.del( `otp_attempts:${email}` );

        // send email
        const response = await fetch(
            `${process.env.NOTIFY_URL}/email/send`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    target: email,
                    subject: "OTP Verification for login",
                    template: "otpEmail",
                    data: {
                        otp: generatedOTP,
                        expirySeconds: 120,
                        appName: "H O T I F Y"
                    }
                })
            }
        );

        if (!response.ok) {

            await redisConnect.del( `otp:${email}` );
            throw new Error(`Failed to send OTP email: ${response.status} ${response.message}` );
        }

        // cooldown
        await redisConnect.set( `otp_cooldown:${email}`, "1", { EX: 60 });

        return true;
    }

    // verify otp
    static async verifyOTP( userInfo, data) {

        // stop brute force attack
        const attemptsKey = `otp_attempts:${userInfo.email}`;

        // check attempts
        const currentAttempts =  Number(await redisConnect.get(attemptsKey)) || 0;
        if (currentAttempts >= 5) throw new Error(  "Too many incorrect OTP attempts" );

        // get stored otp
        const storedOTP =  await redisConnect.get( `otp:${userInfo.email}` );
        if (!storedOTP) throw new Error( "OTP expired or not found" );

        // compare otp
        const doesOTPMatch = await bcrypt.compare( data.otp, storedOTP );
        if (!doesOTPMatch) {
            const attempts = await redisConnect.incr( attemptsKey );

            // keep attempts alive for otp lifetime
            if (attempts === 1) await redisConnect.expire( attemptsKey, 130 );

            throw new Error(`Wrong OTP. ${ 5 - attempts} attempts remaining` );
        }

        // success
        await redisConnect.del( `otp:${userInfo.email}` );
        await redisConnect.del( attemptsKey );

        // send email of login
        data.appName = "H O T I F Y";
        data.userName = userInfo.firstName;

        await fetch(
            `${process.env.NOTIFY_URL}/email/send`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    target: userInfo.email,
                    subject: "Hotify Login Notification",
                    template: "loginEmail",
                    data: data
                })
            }
        )

        return true;
    }
}