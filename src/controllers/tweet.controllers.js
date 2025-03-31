import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.models.js"
import {User} from "../models/user.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    const {content} = req.body;
    if(!content) {
        throw new ApiError(406, "Invalid content.");
    }
    const newTweet = await Tweet.create(
        {
            owner: req.user?._id,
            content
        }
    )
    if(!newTweet) {
        throw new ApiError(401, "Unauthorized request");
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200, newTweet, "Tweet create successfully")
    )
})

const getUserTweets = asyncHandler(async (req, res) => {
    const {userId} = req.params;
    const tweets = await Tweet.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        }
    ])
    if(tweets && tweets.length < 1) {
        throw new ApiError(404, "Doesn't find any tweet");
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200, tweets, "Tweets fetched successfully")
    )
})

const updateTweet = asyncHandler(async (req, res) => {
    const {tweetId} = req.params;
    const {content} = req.body;
    if(!content.trim()) {
        throw new ApiError(400, "Send a valid content");
    }
    const updatedTweet = await Tweet.findByIdAndUpdate(tweetId,
        {
            content
        },
        {
            new: true
        }
    )
    if(!updatedTweet) {
        throw new ApiError(400, "Send a valid tweetid")
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200, updateTweet, "Tweet update successfully")
    )
})

const deleteTweet = asyncHandler(async (req, res) => {
    const {tweetId} = req.params;
    const tweet = await Tweet.findByIdAndDelete(tweetId);
    if(!tweet) {
        throw new ApiError(400, "Send a valid tweetId for deletation");
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200, {}, "Tweet delete successfully")
    )
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}