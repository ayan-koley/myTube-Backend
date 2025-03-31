import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.models.js"
import {Video} from "../models/video.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body
    if(!name || name.trim() == "") {
        throw new ApiError(406, "Fullname is required.");
    }
    if(!description || description.trim() == "") {
        throw new ApiError(406, "desciption is required.");
    }

    const newPlaylist = await Playlist.create({
        name,
        description,
        owner: req.user?._id
    })

    if(!newPlaylist) {
        throw new ApiError(401, "Unauthorized requst");
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200, newPlaylist, "Successfully create new playlist")
    )
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    if(!isValidObjectId(userId)) {
        throw new ApiError(401, "Invalid userId");
    }
    const playlists = await Playlist.find({
        owner: userId
    })
    if(!playlists) {
        throw new ApiError(404, "playlist is not found")
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200, playlists, "Successfully Fetched all playlist")
    )
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    if(!isValidObjectId(playlistId)) {
        throw new ApiError(404, "Invalid playlistId");
    }
    const playlist = await Playlist.findById(playlistId);
    if(!playlist) {
        throw new ApiError(404, "Playlist not found.");
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200, playlist, "Successfully fetched playlist")
    )
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    const video = await Video.findById(videoId);
    if(!video) {
        throw new ApiError(404, "Send a valid video id");
    }
    const playlist = await Playlist.findById(playlistId);
    
    if(!playlist) {
        throw new ApiError(404, "Send a valid playlist id");
    } 
    const status = playlist.video.includes(videoId);

    if(status) {
        return res
        .status(200)
        .json(
            new ApiResponse(200, {playlist}, "Video is already have in playlist")
        )
    }

    const addvideo = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $push: {
                videos: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            new: true
        }
    )
    
    return res
    .status(200)
    .json(
        new ApiResponse(200, {addvideo}, "Video added successfully")
    )
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    const video = await Video.findById(videoId);
    if(!video) {
        throw new ApiError(400, "Send a valid video id");
    }

    const removeVideo = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $pull: {
                videos: videoId
            }
        },
        {
            new: true
        }
    )
    if(!removeVideo) {
        throw new ApiError(400, "Send a valid palylist id");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, removeVideo, "Video add  successfully")
    )

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params;
    const deleteList = await Playlist.findByIdAndDelete(playlistId);
    if(!deleteList) {
        throw new ApiError(400, "Send a valid palylist id");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, deleteList, "playlist delete successfully")
    )
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body

    if(!name || name.trim() == "" ) {
        throw new ApiError(406, "Invalid playlist name");
    }
    if(!description || description.trim() == "" ) {
        throw new ApiError(406, "Invalid description");
    }
    
    const updatedPlaylist = await Playlist.findByIdAndUpdate(playlistId,
        {
            $set: {
                name,
                description
            }
        },
        {
            new: true
        }
    )
    if(!updatedPlaylist) {
        throw new ApiError(400, "Send a valid playlist id");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, updatedPlaylist, "playlist update successfully")
    )
})
const updateName = asyncHandler(async(req, res) => {
    const {playlistId} = req.params;
    const {name} = req.body;
    if(!name || name.trim() == "") {
        throw new ApiError(404, "Invalid name");
    }
    const updatedPlaylist = await Playlist.findByIdAndUpdate(playlistId,
        {
            name
        },
        {
            new: true
        }
    )
    if(!updatedPlaylist) {
        throw new ApiError(404, "Invalid playlistId.")
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200, updatePlaylist, "name update successfully")
    )
})

const updateDesciption = asyncHandler(async(req, res) => {
    const {playlistId} = req.params;
    const {description} = req.body;
    if(!description || description.trim() == "") {
        throw new ApiError(404, "Invalid description");
    }
    const updatedPlaylist = await Playlist.findByIdAndUpdate(playlistId,
        {
            description
        },
        {
            new: true
        }
    )
    if(!updatedPlaylist) {
        throw new ApiError(404, "Invalid playlistId.")
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200, updatePlaylist, "description update successfully")
    )
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist,
    updateName,
    updateDesciption
}