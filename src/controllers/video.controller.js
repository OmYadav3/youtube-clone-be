import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary, deleteFromCloudinary} from "../utils/cloudinary.js"


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
    const videoFileLocalPath= req.files?.videoFile[0]?.path

    // console.log(videoFileLocalPath)
    // console.log(videoFileLocalPath)
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
    // console.log(videoFile)

    const thumbnailLocalPath= req.files?.thumbnail[0]?.path
    if(!thumbnailLocalPath){
        throw new ApiError("Video file is required", 400)
    }

    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)
    if(!thumbnail.url){
        throw new ApiError("Failed to upload video to cloudinary", 500)
    }

    const video = await Video.create({
        title,
        description,
        videoUrl: videoFile.url,
        thumbnailUrl: thumbnail.url,
        duration: videoFile.duration,
        userId: req.user?._id
    })

    console.log(video)

    if(!video){
        throw new ApiError(500, "Failed to create video")
    }
    

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
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
      }
    
    if(!videoId){
        throw new ApiError(400, "Video id is required")
    }

    const video = await Video.findById(videoId)

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
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
      }
    

    if(!title ||!description){
        throw new ApiError(400, "Title and description are required")
    }

    if(!videoId){
        throw new ApiError(400, "Video id is required")
    }

    const videoThumbnail = req.file?.path

    if(!videoThumbnail){
        throw new ApiError(400, "thumbnail file are required")
    }

    const video = await Video.findById(videoId)
    if(!video){
        throw new ApiError(400, "Video not found")
    }

    if(!video.owner.equals(req.user._id)){
        throw new ApiError(403, "You are not authorized to update this video")
    }

    const deleteThumbnailResponse = await deleteFromCloudinary(video.thumbnail, "image")
    if(deleteThumbnailResponse !== "ok"){
        throw new ApiError(500, "Failed to delete thumbnail from cloudinary")
    }

    const newThumbnail = await uploadOnCloudinary(videoThumbnail)
    if(!newThumbnail.url){
        throw new ApiError(500, "Error uploading new thumbnail")
    }

    const uploadVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                thumbnail: newThumbnail.url,
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
        uploadVideo,
        "Video file successfully updated"
    ))


    

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
      }
    
    if(!videoId){
        throw new ApiError(400, "Video id is not found")
    }

    const video = await Video.findById(videoId)
    if(!video){
        throw new ApiError(404, "Video not found")
    }
    console.log(video)
    // if(!video.owner.equals(req.user._id)){
    //     throw new ApiError(403, "You are not authorized to perform this action");
    // }

    const cloudnaryDeletedVideo = await deleteFromCloudinary(
        video.videoUrl,
        "video"
    )
    if(!cloudnaryDeletedVideo !=="ok"){
        throw new ApiError(500, "Failed to delete video from cloudinary")
    }

    const thumbnailVideo = await deleteFromCloudinary(
        video.thumbnail,
        "image"
    )
    if(!thumbnailVideo !=="ok"){
        throw new ApiError(
            500,
            "Failed to delete thumbnail from cloudinary"
        )
    }

    const deletedVideo = await Video.findByIdAndDelete(videoId)
    if(!deletedVideo){
        throw new ApiError(500, "Error while deleting the video")
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

    if(!isValidObjectId(videoId)){
        throw new ApiError(500, "Invalid videoId")
    }

    if(!videoId){
        throw new ApiError(400, "Video id are not found")
    }
    const video = await Video.findById(videoId)
    if(!video){
        throw new ApiError(400, "video not found")
    }

    if(!video.owner.equals(req.user?._id)){
        throw new ApiError(403, "You are not authorized to perform this action");
    }

    const modifiedVideo = await Video.findByIdAndUpdate(
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
        modifiedVideo,
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