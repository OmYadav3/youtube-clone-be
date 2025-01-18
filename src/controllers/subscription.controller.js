import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    // TODO: toggle subscription
    if(!isValidObjectId(channelId)){
        throw new ApiError(400,"Invalid channel ID")
    }
    
    const channel = await Subscription.findById(channelId)
    if(!channel){
        throw new ApiError(404, "Channel not found")
    }

    const subscribed = await Subscription.findOne(
        {
            $and: [
                {subscriber: req.user._id},
                {channel: channelId}
            ]
        },
    )

    if(!subscribed){
        const subscribe = await Subscription.create({
            subscriber: req.user._id,
            channel: channelId
        })
        if(!subscribe){
            throw new ApiError(500, "Error while subscribing")
        }   

        return res
       .status(200)
       .json(new ApiResponse(200, newSubscription, "Subscribed successfully"))
    }

    const unSubscribe = await Subscription.findByIdAndDelete(subscribed._id)
    if(!unSubscribe){
        throw new ApiError(500, "Error while unsubscribing")
    }

    return res
       .status(200)
       .json(new ApiResponse(200, {}, "Unsubscribed successfully"))
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}