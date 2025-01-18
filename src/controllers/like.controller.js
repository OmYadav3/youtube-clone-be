import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params

    //TODO: toggle like on video
    //Check if user has already liked the video
    // If yes, remove like
    // If no, add like

    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid video Id")
    }

 const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(400, "Invalid Video ID");
  }

  const likedVideo = await Like.findOne({
    $and: [{ video: videoId }, { likedBy: req.user._id }],
  });

  if (!likedVideo) {
    const createdLike = await Like.create({
      video: videoId,
      likedBy: req.user._id,
    });

    if (!createdLike) {
      throw new ApiError(500, "Error while liking the video");
    }
    return res
      .status(200)
      .json(new ApiResponse(200, createdLike, "User liked the video"));
  }

  const unLikedVideo = await Like.findByIdAndDelete(likedVideo._id);

  if (!unLikedVideo) {
    throw new ApiError(500, "Error while unliking the video");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, unLikedVideo, "User unliked the video"));
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment

    if(!isValidObjectId(commentId)){
      throw new ApiError(400,"Invalid comment Id")
    }

    const comment = await Comment.findById(commentId);
    if(!comment){
      throw new ApiError(404, "Comment not found")
    }

    const likedComment = await Like.findOne({
      $and: [{ comment: commentId }, { likedBy: req.user._id }],
    });

    if(!likedComment){
      const createdLike = await Like.create({
        comment: commentId,
        likedBy: req.user._id,
      })

      if(!createdLike){
        throw new ApiError(500, "Error while liking the comment")
      }
      return res
       .status(200)
       .json(new ApiResponse(200, createdLike, "User liked the comment"))
    }

    const unLikedComment = await Like.findByIdAndDelete({
      _id: likedComment._id,
    })
    if(!unLikedComment){
      throw new ApiError(500, "Error while unliking the comment")
    }

    return res
     .status(200)
     .json(new ApiResponse(200, unLikedComment, "User unliked the comment"))

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet

    if(!inValidObjectId(tweetId)){
      throw new ApiError(500, "Invalid tweet id")
    }

    const tweet = await Tweet.findById(tweetId);
    if(!tweet){
      throw new ApiError(404, "Tweet not found")
    }

    const likedTweet = await Like.findOne({
      $and: [
        { tweet: tweetId },
        { likedBy: req.user._id}
      ]
    })

    if(!likedTweet){
      const createdLike = await Like.create({
        tweet: tweetId,
        likedBy: req.user._id,
      })
      if(!createdLike){
        throw new ApiError(500, "Error while liking the tweet")
      }
      return res
       .status(200)
       .json(new ApiResponse(200, createdLike, "User liked the tweet"))
    }

    const unlikedTweet = await Like.findByIdAndDelete({
      _id: likedTweet._id,
    })
    if(!unlikedTweet){
      throw new ApiError(500, "Error while unliking the tweet")
    }
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