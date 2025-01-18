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

    if(!isValidObjectId(channelId)){
        throw new ApiError(400,"Invalid channel ID")
    }

    const subscriberList = await Subscription.aggregate(
        [
            {
                $match: {
                    channel: mongoose.Types.objectId(channelId)
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField:'subscriber',
                    foreignField: '_id',
                    as:'subscriber',
                    pipeline: [
                        {
                            $project: {
                                _id: 1,
                                username: 1,
                                fullName: 1,
                                avatar: 1
                            }
                        }
                    ]
                }
            },
            {
                $unwind: '$subscriber'
            },
            {
                $project: {
                    _id: '$subscriber._id',
                    username: '$subscriber.username',
                    fullName: '$subscriber.fullName',
                    avatar: '$subscriber.avatar'
                }
            }
        ]
    )

    if (subscriberList.length === 0) {
        return res
          .status(404)
          .json(new ApiResponse(404, [], "No subscribers found for this channel"));
      }

    return res
       .status(200)
       .json(
        new ApiResponse(
            200,
            subscriberList,
            "Subscribed users list fetched successfully"
        )
    )

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