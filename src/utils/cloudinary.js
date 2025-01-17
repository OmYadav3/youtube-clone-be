import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
   api_key: process.env.CLOUDINARY_API_ID,
   api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
   try {
      if (!localFilePath) return null;
      // console.log(localFilePath, "aagya path bhai ");

      // upload the file on cloudinary
      const response = await cloudinary.uploader.upload(localFilePath, {
         resource_type: "auto"
      });
      // file has been upload sucessfull
      // console.log("File is uploaded on cloudinary", response.url);
      fs.unlinkSync(localFilePath);
      return response;
   } catch (error) {
      // remove the locally saved temporary file as the upload operationgot failed
      fs.unlinkSync(localFilePath);
      return null;
   }
};

const deleteFromCloudinary = async (cloudinaryFilepath, type) => {
   try {
      if (!cloudinaryFilepath) return null;
      // console.log(cloudinaryFilepath, "aagya path bhai ");
      // delete the file from cloudinary
      const response = await cloudinary.uploader.destroy(cloudinaryFilepath, {
         resource_type: type
      });
      // file has been deleted sucessfull
      // console.log("File is deleted from cloudinary", response);
      return response;


   } catch (error) {
     console.log("Error while deleting file from cloudinary : ", error);
     return null;
   }
 };

export { uploadOnCloudinary, deleteFromCloudinary };
