import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.models.js";
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  deleteImageOnCloudinary,
  deleteVideoOnCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 12,
    query,
    sortBy = "views",
    sortType = 1,
    userId,
  } = req.query;
  //: get all videos based on query, sort, pagination
  // validation on query
  if (!query.trim()) {
    throw new ApiError(400, "Send a valid query ");
  }
  const videos = await Video.aggregate([
    {
      $match: {
        $or: [
          { title: { $regex: query, $options: "i" } },
          { description: { $regex: query, $options: "i" } },
        ],
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              fullname: 1,
              avatar: 1,
              username: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        owner: {
          $first: "$owner",
        },
      },
    },
    {
      $sort: {
        [sortBy]: Number(sortType),
      },
    },
    {
      $facet: {
        data: [
          {
            $skip: (page - 1) * limit,
          },
          {
            $limit: limit,
          },
        ],
      },
    },
  ]);
  // due pagination
  if (!videos) {
    throw new ApiError(400, "Video is not founded");
  }
  // 1. based on query search videos using aggregation pipeline
  // 2. sortBy views and date
  // 3. sortType -> ASC or DESC order
  return res
    .status(200)
    .json(new ApiResponse(200, videos[0].data, "Videos fetched successfully"));
  // userId - ?
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  //  get video, upload to cloudinary, create video

  // validation on title and description
  if (!title.trim()) {
    throw new ApiError(400, "Send a valid title");
  }
  if (!description.trim()) {
    throw new ApiError(400, "Send a valid Description");
  }
  // videoFile thumbnail
  const videoFileLocalPath = req.files?.videoFile?.[0].path;

  const thumbnailLocalPath = req.files?.thumbnail?.[0].path;

  if (!videoFileLocalPath) {
    throw new ApiError(400, "VideoFile is required");
  }
  if (!thumbnailLocalPath) {
    throw new ApiError(400, "Thumbnail is required");
  }

  const videoFile = await uploadOnCloudinary(videoFileLocalPath);
  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

  if (!(videoFile && thumbnail)) {
    throw new ApiError(500, "Internal server error on upload files");
  }

  const video = await Video.create({
    videoFile: {
      url: videoFile.url,
      public_id: videoFile.public_id,
    },
    thumbnail: {
      url: thumbnail.url,
      public_id: thumbnail.public_id,
    },
    owner: req.user?._id,
    title,
    description,
    duration: videoFile.duration,
  });
  if (!video) {
    throw new ApiError(500, "Faild to create new video");
  }
  // validation on videoFile and thumbnail
  // upload on cloudinary
  // get data from cloudinary and extract paths and duration
  // create a new object and store data on dbs
  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video create successfully "));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  // get video by id
  const video = await Video.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              fullname: 1,
              avatar: 1,
              username: 1,
              coverImage: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        owner: {
          $first: "$owner",
        },
      },
    },
    // find all subscriber and all likes on this video
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "video",
        as: "likes",
      },
    },
    {
      $addFields: {
        likes: {
          $size: "$likes",
        },
      },
    },
  ]);

  if (video && video.length < 1) {
    throw new ApiError(400, "Send a valid videoId");
  }
  return res.status(200).json(new ApiResponse(200, video, "vidoe fetched successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  const { title, description } = req.body;
  if (title == undefined || title.trim() == "") {
    throw new ApiError(400, "Send valid title");
  }
  if (description == undefined || description.trim() == "") {
    throw new ApiError(400, "Send valid descriptions");
  }

  const updatedVideo = await Video.findByIdAndUpdate(
    videoId,
    {
      title,
      description,
    },
    {
      new: true,
    }
  );

  if (!updatedVideo) {
    throw new ApiError(400, "Send a valid videoId");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, updatedVideo, "Video update successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const deletedVideo = await Video.findByIdAndDelete(videoId);
  if (!deletedVideo) {
    throw new ApiError(400, "Send a valid videoId to delete video");
  }

  const deleteThumbnail = await deleteImageOnCloudinary(
    deletedVideo.thumbnail.public_id
  );
  const deleteVideoFile = await deleteVideoOnCloudinary(
    deletedVideo.videoFile.public_id
  );

  if (!deleteThumbnail) {
    throw new ApiError(500, "Internal Server error when delete thumbnail");
  }
  if (!deleteVideoFile) {
    throw new ApiError(500, "Internal Server error when delete videoFile");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Video delete successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const toggleVideo = await Video.findByIdAndUpdate(
    videoId,
    [{ $set: { isPublished: { $not: "$isPublished" } } }],
    {
      new: true,
    }
  );
  return res
    .status(200)
    .json(new ApiResponse(200, toggleVideo, "Toggle completed"));
});

const updateViews = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const updatedVideo = await Video.findByIdAndUpdate(
    videoId,
    {
      $inc: { views: 1 },
    },
    {
      new: true,
    }
  );
  if (updatedVideo && updatedVideo.length < 1) {
    throw new ApiError(400, "Send a valid video id");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, updatedVideo, "Views Update successfully"));
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
  updateViews,
};
