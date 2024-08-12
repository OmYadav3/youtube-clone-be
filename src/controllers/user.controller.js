import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"



const registerUser = asyncHandler( async (req, res) => {
    
    // get user details form frontend
    // check the field is empty or not 
    // check if user is already exits or not 
    // check for images and avatar 
    // upload them to cloudinary ,avatar 
    // create new obj - create entru on db
    // remove password and refreshtoken from response 
    // check user creation 
    // return response 

    const { fullName, email, username, password } = req.body

    if(
        [ fullName, email, username, password].some((field) => field?.trim() === "") 
    ) {
        throw new ApiError(400, "All Fields are required")
    }

    const existedUser = await User.findOne({
        $or: [{ email }, { username }]
    })

    if (existedUser) {
        throw new ApiError(409, "user with email or username are already exists ")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path; 
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }

    const user = await User.create(
        {
            email,
            username: username.toLowerCase(),
            fullName,
            avatar: avatar.url,
            coverImage: coverImage?.url || "",
            password
        }
    )

    const createdUser = await User.findById(_id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(200).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    )

})

export { registerUser }