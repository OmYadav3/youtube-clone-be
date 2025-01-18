import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    const totalVideos = await Video.aggregate(
        [
            {
                $match: {
                    owner: new mongoose.Types.ObjectId(req.user._id),
                },
            },
            {
                $group: {
                    _id: null,
                    totalVideos: {
                        $sum: 1,
                    },
                }
            },
            {
                $project: {
                    totalVideos: "$totalVideos",
                },
            }
        ]
    )

    if(!totalVideos){
        throw new ApiError(404, "No videos found for this channel");
    }

    const totalSubscribers = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(req.user._id),
            },
        },
        {
            $group: {
                _id: null,
                totalSubscribers: {
                    $sum: 1,
                },
            },
        },
        {
            $project: {
                totalSubscribers: "$totalSubscribers",
            },
        }
    ])
    
    if(!totalSubscribers){
        throw new ApiError(404, "No subscribers found for this channel");
    }

    const totalLikes = await Like.aggregate(
        [
            {
                $match: {
                    likedBy: new mongoose.Types.ObjectId(req.user._id),
                }
            },
            {
                $group: {
                    _id: null,
                    totalLikes: {
                        $sum: 1,
                    },
                },
            },
            {
                $project: {
                    totalLikes: "$totalLikes",
                },
            },
        ]
    )
    
    if(!totalLikes){
        throw new ApiError(404, "No likes found for this channel");
    }

    const totalViews = await Like.aggregate(
        [
            {
                $match: {
                    likedBy: new mongoose.Types.ObjectId(req.user._id),
                }
            },
            {
                $group: {
                    _id: null,
                    totalViews: {
                        $sum: "$views",
                    },
                },
            },
            {
                $project: {
                    totalViews: "$totalViews",
                },
            }
        ]
    )
    
    if(!totalViews){
        throw new ApiError(404, "No views found for this channel");
    }

    return res
   .status(200)
   .json(
    new ApiResponse(
        200,
        {
            totalVideos: totalVideos[0].totalVideos,
            totalSubscribers: totalSubscribers[0].totalSubscribers,
            totalLikes: totalLikes[0].totalLikes,
            totalViews: totalViews[0].totalViews,
        },
        "Channel stats fetched successfully"
    )
)
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel

    const videos = await Video.aggregate([
        {
          $match: {
            owner: new mongoose.Types.ObjectId(req.user._id),
          },
        },
        {
          $project: {
            videoFile: 1,
            thumbnail: 1,
            title: 1,
            duration: 1,
            views: 1,
            isPublished: 1,
            owner: 1,
            createdAt: 1,
            updatedAt: 1,
          },
        },
      ]);

    if(!videos.lenth){
        throw new ApiError(404, "No videos found for this channel");
    }

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        videos,
        "Channel videos fetched successfully"
    ))

})

export {
    getChannelStats, 
    getChannelVideos
    }