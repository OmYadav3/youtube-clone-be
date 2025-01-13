import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params

    //TODO: toggle like on video
    //Check if user has already liked the video
    // If yes, remove like
    // If no, add like
    
    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid video Id")
    }
    
    const video = await Video.findById(videoId)
    if(!video){
        throw new ApiError(400,"Video not found")
    }

    if(!video.user.equals(req.user._id)){
        throw new ApiError(403, "You are not authorized to perform this action");
    }

    const like = await Like.aggregate(
        [
            {
                $match: {
                    video: mongoose.Types.objectId(videoId),
                    user: req.user._id
                }
            },
            {
               $lookup: {
                from: "video",
                localField: "video",
                foreign: "_id",
                as: "likedVideo",
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
                                    }
                                },
                                
                            ]
                        }
                    },
                    {
                        $addFields: {
                            likedVideo: {
                                $arrayElemAt: ["$likedVideo", 0]
                            }
                        }
                    }  

                ]
                
               } 
            },
        ]
    )

    return res 
    .status(200)
    .json(
        new ApiResponse(
            200,
            like.length > 0? "Like removed successfully" : "Like added successfully",
            "Like toggled successfully"
        )
    )

})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}