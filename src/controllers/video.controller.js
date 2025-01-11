import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType } = req.query
    //TODO: get all videos based on query, sort, pagination

    const videos = await Video.aggregate([
        {
            $match:{            // match the video with the specified query string 
                $or: [
                    {
                        title: {$regex: query, $options: "i"}
                    },
                    {
                        description: {$regex: query, $options: "i"}
                    }
                ]
            }
        },
        {
            $lookup: {                    // this $lookup operation join the two document
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "createdBy"
            }
        },
        {
            $unwind: "$createdBy"       // this $unwind operation create the 2 or more documents with same id  
        },
        {
            $project: {                // this $project operation project these value only 
               videoFile: 1,
               thumbnail: 1,
               title: 1,
               description: 1,
               createdBy: {
                fullName: 1,
                username: 1,
                avatar: 1
               },     
            }
        },
        {
            $sort:{         // this $sort operation sort these value by their associated 
                [sortBy]: sortType  === 'asc'? 1 : -1, 
            }
        },
        {
            $skip: (page - 1) * limit  // this $skip operation skip the first page and return the first page with the given value       
        },
        {
            $limit: parseInt(limit)   // this $limit operation limit the first page and return the first page with the given
        }
    ])
    
    return res
    .status(200)
    .json(new ApiResponse(
        200,
        videos,
        "Videos fetched successfully"
    ))

})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    const {videoFileLocalPath, thumbnailLocalPath }= req.files?.path

    // TODO: get video, upload to cloudinary, create video
    // TODO: validate input fields
    // TODO: uploading video to cloudinary
    // TODO: create video in database with user id
    // TODO: return video object with success message

    if(!title || !description){
        throw new ApiError(400, "Title and description are required")
    }

    if(!videoFileLocalPath){
        throw new ApiError("Video file is required", 400)
    }

    const videoFile = await uploadOnCloudinary(videoFileLocalPath)
    if(!videoFile.url){
        throw new ApiError("Failed to upload video to cloudinary", 500)
    }


    if(!thumbnailLocalPath){
        throw new ApiError("Video file is required", 400)
    }

    const thumbnail = await uploadOnCloudinary(videoFileLocalPath)
    if(!thumbnail.url){
        throw new ApiError("Failed to upload video to cloudinary", 500)
    }

    const video = await Video.create({
        title,
        description,
        videoUrl: videoFile.url,
        thumbnailUrl: thumbnail.url,
        userId: req.user?._id
    })

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        video,
        "Video file sucessfully upload and published"
    )
    )
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
    if(!videoId){
        throw new ApiError(400, "Video id is required")
    }

    const video = await Video.findById(
        [
            {
                $match:{
                    _id: new mongoose.Types.ObjectId(videoId)
                }
            },
            {
                $lookup: {
                    from: "users",
                    localfield: "owner",  
                    foreignField: "_id",
                    as: "owner"
                }
            },
            {
                $project: {
                    _id: 1,
                    title: 1,
                    description: 1,
                    videoUrl: 1,
                    thumbnailUrl: 1,
                    owner: {
                        _id: 1,
                        username: 1,
                        fullName: 1,
                        avatar: 1
                    },
                }
            }
        ]
    )

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        video,
        "Video fetched successfully"
    ))
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const { title, description } = req.body
    //TODO: update video details like title, description, thumbnail

    if(!title ||!description){
        throw new ApiError(400, "Title and description are required")
    }

    if(!videoId){
        throw new ApiError(400, "Video id is required")
    }

    const thumbnailLocalPath = req.file?.path
    if(!thumbnailLocalPath){
        throw new ApiError(400, "thumbnail local path are not found")
    }
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)
    if(!thumbnail.url){
        throw new ApiError(400, "thumbnail url is not found")
    }

    const video = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                thumbnail: thumbnail.url,
                title,
                description
            }
        },
        {
            new: true
        }
    )

    return res
    .status(200)
    .jaon(new ApiResponse(
        200,
        video,
        "Video file successfully updated"
    ))


    

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video

    if(!videoId){
        throw new ApiError(400, "Video id is not found")
    }

    const video = await Video.findByIdAndDelete(videoId)
    if(!video){
        throw new ApiError(404, "Video not found")
    }

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        {},
        "Video deleted successfully"
    ))


})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if(!videoId){
        throw new ApiError(400, "Video id is required")
    }

    const video = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                isPublished:!video.isPublished
            }
        },
        {
            new: true
        }
    )

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        video,
        "Video publish status toggled successfully"
    ))
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}