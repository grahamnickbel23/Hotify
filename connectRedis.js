import { createClient } from "redis";

export const redisConnect = createClient({
    url: process.env.REDIS_URL
})

export async function connectRedis() {
    try{

        await redisConnect.connect();
        console.log(`Redis local DB connected !!`);

    }catch(err){

        console.log(`Redis connection error: ${err}`);
    }
};