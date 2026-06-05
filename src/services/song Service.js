import { exec } from "child_process";
import genious from 'genius-lyrics';
import lyricsModel from "../model/lyrics Model.js";

export default class songApi {

    // audio processing via ffmpeg
    static async processAudio(inputPath, manifestPath) {

        // ffmpeg comand
        const command = `
                ffmpeg -y \
                -i "${inputPath}" \
                -map 0:a -map 0:a -map 0:a \
                -c:a libopus \
                -b:a:0 128k \
                -b:a:1 64k \
                -b:a:2 32k \
                -f dash \
                -seg_duration 5 \
                -use_template 1 \
                -use_timeline 1 \
                -adaptation_sets "id=0,streams=a" \
                "${manifestPath}"
            `;

            // clling comand via promise
        return new Promise((resolve, reject) => {

            exec(command, (error, stdout, stderr) => {

                if (error) {
                    console.error(stderr);
                    return reject(error);
                }

                resolve({ stdout, stderr });

            });

        });
    }

    // function to fetch lyrics
    static async lyricsUpload(name, songId) {

        // get the song data from genious
        const client = new genious.Client(process.env.CLIENT_ACCESS_TOKEN);
        const search = await client.songs.search(name);

        // throw error if song not found
        if (!search.length) throw new Error("Song not found on Genius");

        // get the lyrics and save into mongo db
        const lyrics = await search[0].lyrics();
        await lyricsModel.create({ songId, lyrics });
    }

    // call profile api
    static async profile(userId) {
        const info = await fetch(
            `${process.env.AUTH_URL}/auth/micro/profile`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    userId: userId
                })
            }
        );

        return await info.json();
    }

    // call email api
    static async emailUpload(profileId, data) {

        // get the profile data
        const profileData = await songApi.profile(profileId);

        const response = await fetch(
            `${process.env.NOTIFY_URL}/email/send`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    target: profileData.profile.email,
                    subject: "New Track Uploaded!!!",
                    template: "newSongEmail",
                    data: {
                        appName: "H O T I F Y",
                        userName: profileData.profile.firstName,
                        trackName: data.title,
                        artistName: data.firstSinger,
                        tracklanguage: data.language
                    }
                })
            }
        );
    }
}