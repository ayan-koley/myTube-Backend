import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.models.js";
import { Like } from "../models/like.models.js";
import { Comment } from "../models/comment.models.js";
import { Tweet } from "../models/tweet.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(400, "Send a valid video id");
  }

  const deletLike = await Like.aggregate([
    {
      $match: {
        video: new mongoose.Types.ObjectId(videoId),
        likedBy: req.user?._id
      }
    }
  ])

  console.log(deletLike);

  if (deletLike && deletLike.length < 1) {
    const like = await Like.create({
      video: new mongoose.Types.ObjectId(videoId),
      likedBy: req.user?._id,
    });
    if (!like) {
      throw new ApiError(401, "Unauthorized request");
    }
    return res
    .status(200)
    .json(new ApiResponse(200, like, "Video Like docs create successfully"));
  } else {
    await Like.findByIdAndDelete(deletLike[0]._id);
  }
  return res
    .status(200)
    .json(new ApiResponse(200, "Video Like delete successfully"));
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  //TODO: toggle like on comment
  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new ApiError(400, "Send a valid comment id");
  }
  const findLike = await Like.aggregate([
    {
      $match: {
        comment: new mongoose.Types.ObjectId(commentId),
        likedBy: req.user?._id
      }
    }
  ])
  if (findLike && findLike.length < 1) {
    const like = await Like.create({
      comment: new mongoose.Types.ObjectId(commentId),
      likedBy: req.user?._id,
    });
    if (!like) {
      throw new ApiError(401, "Unauthorized request");
    }
    return res
    .status(200)
    .json(new ApiResponse(200, like, "Comment Like docs create successfully"));
  } else {
    await Like.findByIdAndDelete(findLike[0]._id);
  }
  return res
    .status(200)
    .json(new ApiResponse(200, "Comment Like docs delete successfully"));
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  const tweet = await Tweet.findById(videoId);
  if (!tweet) {
    throw new ApiError(400, "Send a valid tweet id");
  }
  const findLike = await Like.aggregate([
    {
      $match: {
        tweet: new mongoose.Types.ObjectId(tweetId),
        likedBy: req.user?._id
      }
    }
  ])
  if (findLike && findLike.length < 1) {
    const like = await Like.create({
      tweet: new mongoose.Types.ObjectId(tweetId),
      likedBy: new mongoose.Types.ObjectId(req.user?._id),
    });
    if (!like) {
      throw new ApiError(401, "Unauthorized request");
    }
    return res
    .status(200)
    .json(new ApiResponse(200, like, "Tweet Like docs create successfully"));
  }
  return res
    .status(200)
    .json(new ApiResponse(200, "Tweet Like toggle successfully"));
});

const getLikedVideos = asyncHandler(async (req, res) => {
    const likesVideos = await Like.aggregate([
        {
            $match: {
                likedBy: req.user?._id
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "video"
            }
        },
        {
          $addFields: {
            video: {
              $first: "$video"
            }
          }
        }
    ])
    if(likesVideos && likesVideos.length < 1) {
        throw new ApiError(400, "Can't find liked video");
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200, likesVideos, "Successfully fetched liked video")
    )
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
