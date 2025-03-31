import mongoose, { isValidObjectId } from "mongoose"
import {Comment} from "../models/comment.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query
    const comment = await Comment.aggregate([
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup: {
                from:"users",
                localField:"owner",
                foreignField: "_id",
                as: "owner_details",
                pipeline: [
                    {
                        $project: {
                            _id: 1,
                            fullname: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                "owner_details": {
                    $first: "$owner_details"
                }
            }
        },
        {
            $facet: {
                data: [
                    {
                        $skip: (page - 1) * limit
                    },
                    {
                         $limit: limit
                    }
                ]
            }
        },
        
    ])
    if(comment && comment.length < 1) {
        throw new ApiError(404, "Doesn't find comment")
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200, comment, "Comment fetched successfully")
    )

})

const addComment = asyncHandler(async (req, res) => {
    const {videoId} = req.params;
    const {content} = req.body;
    if(!content || content.trim() === "") {
        throw new ApiError(406, "Content is missing")
    }
    const newComment = await Comment.create({
        content,
        video: new mongoose.Types.ObjectId(videoId),
        owner: req.user?._id
    })
    if(!newComment) {
        throw new ApiError(401, "unauthorized request")
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200, newComment, "Comment add successfully")
    )
})

const updateComment = asyncHandler(async (req, res) => {
    const {commentId} = req.params;
    const {content} = req.body;
    if(!content || content.trim() == "") {
        throw new ApiError(406, "Content is missing")
    }
    if(isValidObjectId(commentId)) {
        throw new ApiError(404, "Invalid commentId.")
    }
    const updatedComment = await Comment.findByIdAndUpdate(commentId,
        {
            content
        },
        {
            new: true
        }
    )
    if(!updatedComment) {
        throw new ApiError(401, "Unauthorized request.")
    }
    return res
    .status(200)
    .json(new ApiResponse(200, updatedComment, "Comment add successfully"))
})

const deleteComment = asyncHandler(async (req, res) => {
    const {commentId} = req.params;
    const deletedComment = await Comment.findByIdAndDelete(commentId);
    if(deletedComment && deletedComment.length < 1) {
        throw new ApiError(404, "Send a valid comment id")
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200, deletedComment, "Comment delte successfully" )
    )
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }