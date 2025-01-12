import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { response } from "express"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body
    const userId = req.user?._id
    
    //TODO: check name and description field is not empty
    //TODO: Check if the playlist are already present or not 
    //TODO: create playlist
    //TODO: return playlist object with success message

    if(!name ||!description){
        throw new ApiError(400, "Name and description are required")
    }

    const existedPlaylist = await Playlist.findOne({
        $and: [{name},{owner: userId}]
    })
    if(existedPlaylist){
        throw new ApiError(400, "Playlist with the same name already exists")
    }

    // if(!existedPlaylist.owner.equals(req.user?._id)){
    //     throw new ApiError(400, "Playlist with the same owner")
    // }

    const newPlaylist = await Playlist.create({
        name,
        description,
        owner: req.user?._id
    })

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            newPlaylist,
            "Playlist created successfully"
        )
    )
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists
    // console.log(userId, "playlist")

    if(!isValidObjectId(userId)){
        throw new ApiError(400, "Invalid user ID");
    }

//    const userPlaylists = await Playlist.find({owner: userId})
//    if(!userPlaylists){
//     throw new ApiError(404, "UserPlaylist not found");
//    }
const userPlaylists = await Playlist.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "videos",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    username: 1,
                    avatar: 1,
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
            $project: {
              title: 1,
              thumbnail: 1,
              description: 1,
              owner: 1,
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "createdBy",
        pipeline: [
          {
            $project: {
              avatar: 1,
              fullName: 1,
              username: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        createdBy: {
          $first: "$createdBy",
        },
      },
    },
    {
      $project: {
        videos: 1,
        createdBy: 1,
        name: 1,
        description: 1,
      },
    },
  ]);


   return res
   .status(200)
   .json(
    new ApiResponse(
        200,
        userPlaylists,
        "Playlists fetched successfully"
    )
   )
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid playlist ID");
    }

//    const playlist = await Playlist.findById(playlistId)

const playlist = await Playlist.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(playlistId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "createdBy",
        pipeline: [
          {
            $project: {
              fullName: 1,
              username: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        createdBy: {
          $first: "$createdBy",
        },
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "videos",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    username: 1,
                    avatar: 1,
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
            $project: {
              thumbnail: 1,
              title: 1,
              duration: 1,
              views: 1,
              owner: 1,
              createdAt: 1,
              updatedAt: 1,
            },
          },
        ],
      },
    },
    {
      $project: {
        videos: 1,
        description: 1,
        name: 1,
        createdBy: 1,
      },
    },
  ]);

   if(!playlist){
    throw new ApiError(404, "playlist not found");
   }
   
   return res
   .status(200)
   .json(
    new ApiResponse(
        200,
        playlist,
        "playlist fetched successfully"
    )
   )
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: add video to playlist
    // TODO: check if video already exists in the playlist
    // TODO: check user are authenticated or not 
    // TODO: add video to playlist
    // TODO: return playlist object with success message

    // if(!videoId?.length){
    //     throw new ApiError(400, "Video id is required");
    // }

    //QUESTION : aggr video id hai hi nahi toh yeh error kyu nahi de raaha 

    if(!playlistId && !videoId){
        throw new ApiError(400, "Playlist and video id are required");
    }

    const playlist = await Playlist.findById(playlistId)
    if(!playlist?.video?.videoId === videoId){
        throw new ApiError(400, "Video already exists in the playlist"); 
    }

    if(!playlist.owner.equals(req.user._id)){
        throw new ApiError(403, "You are not authorized to perform this action");
    }

    const addVideo = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $push: {
                video: req.params?.videoId 
            }
        },
        {
            new: true,
        }
    )

    if(!addVideo){
        throw new ApiError(500, "Failed to add video to playlist");
    }
    
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            addVideo,
            "Video added successfully in playlist"
        )
    )
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist
    // TODO: check user are authenticated or not 
    // TODO: remove video from playlist
    // TODO: return playlist object with success message

    if(!playlistId &&!videoId){
        throw new ApiError(400, "Playlist and video id are required");
    }
    
    const playlist = await Playlist.findById(playlistId)
    if(!playlist?.video?.videoId === videoId){
        throw new ApiError(400, "Video does not exist in the playlist"); 
    }
    
    if(!playlist.owner.equals(req.user._id)){
        throw new ApiError(403, "You are not authorized to perform this action");
    }
    
    const removeVideo = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $pull: {
                video: req.params?.videoId
            }
        },
        {
            new: true,
        }
    )

    if(!removeVideo){
        throw new ApiError(500, "Failed to remove video from playlist");
    }
    
    return res
   .status(200)
   .json(
    new ApiResponse(
        200,
        removeVideo,
        "Video removed successfully from playlist"
    )
   )
})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist
    // TODO: check user are authenticated or not 
    // TODO: delete playlist
    // TODO: return playlist object with success message

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid playlist ID");
    }

    const playlist = await Playlist.findById(playlistId)
    if(!playlist){
        throw new ApiError(404, "Playlist not found");
    }

    if(!playlist.owner.equals(req.user._id)){
        throw new ApiError(403, "You are not authorized to perform this action");
    }

    const deletedPlaylist = await Playlist.deleteOne(playlistId)

    if(!deletedPlaylist){
        throw new ApiError(500, "Failed to delete playlist");
    }
    
    return res
   .status(200)
   .json(
    new ApiResponse(
        200,
        {},
        "Playlist deleted successfully"
    )
   )
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist
    // TODO: check user are authenticated or not 
    // TODO: update playlist
    // TODO: return playlist object with success message

    if(!name || !description){
        throw new ApiError(400, "Name and description are required");
    }

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid playlist ID");
    }

    const existedPlaylist = await Playlist.findById(playlistId)
    if(!existedPlaylist){
        throw new ApiError(404, "Playlist not found");
    }

    if(!existedPlaylist.owner.equals(req.user._id)){
        throw new ApiError(403, "You are not authorized to perform this action");
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $set: {
                name,
                description
            },   
        },
        {
            new: true,  // returns the updated document rather than the original
        }
    )

    if(!updatedPlaylist){
        throw new ApiError(500, "Failed to update playlist");
    }
    
    return res
   .status(200)
   .json(
    new ApiResponse(
        200,
        updatedPlaylist,
        "Playlist updated successfully"
    )
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