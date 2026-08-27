import songModel from "../../model/song Model.js";
import searchHistoryModel from "../../model/searchHistory Model.js";

export default class search {

    static async song(req, res) {

        // get the queary
        const { query } = req.params;
        console.log(`ans: ${query}`);
        if (!query) return res.status(400).json({ success: false, message: "search query missing" });

        // find the songs
        const songs = await songModel.find({

            $or: [

                {
                    title: {
                        $regex: query,
                        $options: "i"
                    }
                },

                {
                    firstSinger: {
                        $regex: query,
                        $options: "i"
                    }
                },

                {
                    secondSinger: {
                        $regex: query,
                        $options: "i"
                    }
                },

                {
                    movieName: {
                        $regex: query,
                        $options: "i"
                    }
                }

            ]

        })
            .limit(20);

        // return ok if all ok
        return res.status(200).json({
            success: true,
            message: "search completed",
            result: songs
        });
    }

    // create history
    static async history(req, res) {

        // get the info first
        const { searchItem, songId } = req.body;
        if (!searchItem || !songId) return res.status(400).json({ success: false, message: "missing information" });

        // save the result
        await searchHistoryModel.create({
            user: req.accessToken.userId,
            searchItem,
            result: songId
        });

        // return ok if all ok
        return res.status(201).json({
            success: true,
            message: "search history recorded"
        });
    }

    // read history
    static async readHistory(req, res) {

        // get the result
        const history = await searchHistoryModel.find({ user: req.accessToken.userId })
                .populate("result")
                .sort({ createdAt: -1 })
                .limit(50);

        // return ok if all ok 
        return res.status(200).json({
            success: true,
            message:"history fetched",
            info: history
        });
    }

}