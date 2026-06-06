export default class playlistApi {

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
    static async email(profileId, name) {

        // get the profile data
        const profileData = await playlistApi.profile(profileId);

        const response = await fetch(
            `${process.env.NOTIFY_URL}/email/send`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    target: profileData.profile.email,
                    subject: "New Playlist Created",
                    template: "playlistEmail",
                    data: {
                        appName: "H O T I F Y",
                        userName: profileData.profile.firstName,
                        playlistName: name
                    }
                })
            }
        );
    }
}