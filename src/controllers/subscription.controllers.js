import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.models.js"
import { Subscription } from "../models/subscription.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    // TODO: toggle subscription
    // if user already subscribed so delete if not so create
    const alreadySubscribed = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(channelId),
                subscriber: req.user?._id
            }
        }
    ])
    
    if(alreadySubscribed && alreadySubscribed.length > 0) {
        await Subscription.findByIdAndDelete(alreadySubscribed[0]._id)
        return res
        .status(200)
        .json(
            new ApiResponse(200, {}, "delete subscription")
        )
    }

    const isSubscribed = await Subscription.create({
        subscriber: req.user?._id,
        channel: new mongoose.Types.ObjectId(channelId)
    })
    if(!isSubscribed) {
        throw new ApiError(500, "Something gone wrong when subscribe this channel")
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200, {}, "create subscription")
    )
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    // hwo much docs create based on channel on subscription model
    const data = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $project: {
                            fullname: 1,
                            username: 1,
                            email: 1,
                            avatar: 1,
                            coverImage: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                owner: {
                    $first: "$owner"
                },
                
            }
        },
    ])
    if(!data) {
        throw new ApiError(404, "Send a valid channel id")
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200, data, "fetched subscribers")
    )

})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
    const data = await Subscription.aggregate([
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "channel",
                pipeline: [
                    {
                        $project: {
                            fullname: 1,
                            username: 1,
                            email: 1,
                            avatar: 1,
                            coverImage: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                channel: {
                    $first: "$channel"
                }
            }
        }
    ])
    if(!data) {
        throw new ApiError(404, "Send a valid subscriber id")
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200, data, "fetched subscribed channel")
    )
})

const getSubscribedStatus = asyncHandler(async(req, res) => {
    const {channelId} = req.params;
    const isSubscribed = await Subscription.exists({subscriber: req.user?._id, channel: new mongoose.Types.ObjectId(channelId)});
    return res
    .status(200)
    .json(
        new ApiResponse(200, {isSubscribed: !!isSubscribed}, "fetching subscribed details")
    ) 
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels,
    getSubscribedStatus
}