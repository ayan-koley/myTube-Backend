import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.models.js"
import {Video} from "../models/video.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body
    if(name == undefined || name.trim() == "") {
        throw new ApiError(400, "Send a valid name of playlist");
    }
    if(description == undefined || description.trim() == "") {
        throw new ApiError(400, "Send a valid description of playlist");
    }

    const newPlaylist = await Playlist.create({
        name,
        description,
        owner: req.user?._id
    })

    if(!newPlaylist) {
        throw new ApiError(401, "Unauthorized requst")
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200, newPlaylist, "Successfully create new playlist")
    )
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists
    const playlists = await Playlist.find({
        owner: userId
    })
    if(!playlists) {
        throw new ApiError(400, "playlist is not found")
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200, playlists, "Successfully Fetched all playlist")
    )
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    
    const playlist = await Playlist.findById(playlistId);
    if(!playlist) {
        throw new ApiError(400, "Invalid playlist id")
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
        throw new ApiError(400, "Send a valid video id");
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
    if(!addvideo) {
        throw new ApiError(400, "Send a valid palylist id");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, addvideo, "Video add  successfully")
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
    const {playlistId} = req.params
    // TODO: delete playlist
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
    console.log(name, description)

    if(name == undefined || name.trim() == "" ) {
        throw new ApiError(400, "Send a valid name of playlist");
    }
    if(description == undefined || description.trim() == "" ) {
        throw new ApiError(400, "Send a valid description of playlist");
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

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}