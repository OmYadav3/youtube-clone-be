import mongoose, { isValidObjectId } from "mongoose"
import { Playlist } from "../models/playlist.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body

    if (!name && !description) {
        throw new ApiError(400, "name and description is required")
    }

    try {
        const playlist = await Playlist.create({
            name,
            description,
            owner: req.user._id
        })

        if (!playlist) {
            throw new ApiError(400, "Error while creating playlist!")
        }

        return res.status(200).json(new ApiResponse(200, playlist, "Playlist created successfuly"))
    }
    catch (error) {
        throw new ApiError(400, error?.message || "Error while creating playlist")
    }

})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params
    //TODO: get user playlists
    if (!userId) {
        throw new ApiError(400, "Invalid userId params")
    }

    try {
        const playlists = await Playlist.find({ owner: userId })
        if (!playlists) {
            throw new ApiError(400, "No playlist found!")
        }

        return res.status(200).json(new ApiResponse(200, playlists, "Playlist fetched successfuly"))
    }
    catch (error) {
        throw new ApiError(400, error.message || "Error while fetching playlist")
    }
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    //TODO: get playlist by id

    try {
        if (!playlistId) {
            throw new ApiError(400, "playlistId param is required")
        }

        const playlist = await Playlist.findById(playlistId)

        if (!playlist) {
            throw new ApiError(400, "No playlist found!")
        }

        return res.status(200).json(new ApiResponse(200, playlist, "Playlist fetched successfuly"))
    } catch (error) {
        throw new ApiError(400, error?.message || "Invalid playlist")
    }
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params

    if (!playlistId && !videoId) {
        throw new ApiError(400, "playlistId and videoId is required")
    }


    try {
        let playlist = await Playlist.findById(playlistId)

        if (!playlist.owner.equals(req.user._id)) {
            throw new ApiError(400, "You don't have access to add video in this playlist")
        }
        
        //check if playlist already contains videoId
        if (playlist.videos.includes(videoId)) {
            throw new ApiError(400, "Video is already in the playlist")
        }


        playlist = await Playlist.findByIdAndUpdate(playlistId, {
            $push: {
                videos: videoId
            }
        },
            {
                new: true
            }
        )
        if (!playlist) {
            throw new ApiError(400, "Playlist not found")
        }
        return res.status(200).json(new ApiResponse(200, playlist, "Video added to playlist"))

    }
    catch (error) {
        throw new ApiError(400, error.message || "Error while adding video to playlist")
    }

})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params
    // TODO: remove video from playlist

    if (!playlistId && !videoId) {
        throw new ApiError(400, "playlistId and videoId is required")
    }

    try {
        let playlist = await Playlist.findById(playlistId)

        if (!playlist.owner.equals(req.user._id)) {
            throw new ApiError(400, "You don't have access to remove video from this playlist")
        }

        playlist = await Playlist.findByIdAndUpdate(playlistId, {
            $pull: {
                videos: videoId
            }
        },
            {
                new: true
            }
        )
        if (!playlist) {
            throw new ApiError(400, "Playlist not found")
        }
        return res.status(200).json(new ApiResponse(200, playlist, "Remove playlist"))

    }
    catch (e) {
        throw new ApiError(400, "Error while removing video from playlist")
    }




})

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    // TODO: delete playlist

    if (!playlistId) {
        throw new ApiError(400, "playlistId is required")
    }

    try {
        let playlist = await Playlist.findById(playlistId)

        if (!playlist.owner.equals(req.user._id)) {
            throw new ApiError(400, "You don't have access to delete this playlist")
        }

        playlist = await Playlist.findOneAndDelete(playlistId)
        return res.status(200).json(new ApiResponse(200, playlist, "Playlist deleted successfuly"))
    }
    catch (error) {
        throw new ApiError(500, "Error while deleting playlist")
    }


})

const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    const { name, description } = req.body
    //TODO: update playlist
    if (!playlistId && !name && !description) {
        throw new ApiError(400, "playlistId, name and description is required")
    }

    try {
        let playlist = await Playlist.findById(playlistId)

        if (!playlist.owner.equals(req.user._id)) {
            throw new ApiError(400, "You don't have access to delete this playlist")
        }

        playlist = await Playlist.findByIdAndUpdate(playlistId,

            {
                $set: {
                    name,
                    description
                }
            }, {
            new: true
        })
        
        return res.status(200).json(new ApiResponse(200, playlist, "name and description updated successfuly"))
    }
    catch (error) {
        throw new ApiError(500, "Error while updating playlist")
    }

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