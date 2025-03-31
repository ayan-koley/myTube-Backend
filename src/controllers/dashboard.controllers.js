import mongoose from "mongoose"
import {User} from "../models/user.models.js";
import {Video} from "../models/video.models.js"
import {Subscription} from "../models/subscription.models.js"
import {Like} from "../models/like.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    // aggrigation pipeline based on video -> calculate total views -> calculate total subscriber 
    
    // aggregation pipeline user -> video -> views -> likes -> subscriber -> subscribed -> 
    const details = await User.aggregate([
        {
            $match: {
                _id: req.user?._id
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "_id",
                foreignField: "owner",
                as: "allVideos"
            }
        },
        {
            $addFields: {
                totalVideos: {
                    $size: "$allVideos"
                }
            }
        },
        {
            $lookup: {
                from: "likes",
                "let": {"videosId": "$allVideos._id"},
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $in: ["$video", "$$videosId"]
                            }
                        }
                    }
                ],
                as: "like_details"
            }
        },
        {
            $addFields: {
                totalLikes: {
                    $size: "$like_details"
                }
            }
        },
        {
            $addFields: {
                totalViews: {
                    $sum: {
                        $map: {
                            input: "$allVideos",
                            as: "videos",
                            in: {
                                $ifNull: ["$$videos.views", 0]
                            }
                        }
                    }
                }
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscriber_details"
            }
        },
        {
            $addFields: {
                totalSubscriber: {
                    $size: "$subscriber_details"
                }
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribed_details"
            }
        },
        {
            $addFields: {
                totalSubscribedChannel: {
                    $size: "$subscribed_details"
                }
            }
        }
    ])

    if(details && details.length < 1) {
        throw new ApiError(401, "Unauthorized request.")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, details, "Successfully fetched dashboard details")
    )

})

const getChannelVideos = asyncHandler(async (req, res) => {
    const videos = await Video.find({
        owner: req.user?._id
    });
    if(videos && videos.length < 1) {
        throw new ApiError(401, "Unauthorized reques");
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200, videos, "Fetched all videos")
    )
})

export {
    getChannelStats, 
    getChannelVideos
}