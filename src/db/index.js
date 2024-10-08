import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
   try {
      const connectionInstance = await mongoose.connect(
         `${process.env.MONGODB_URL}/${DB_NAME}`
      );
      console.log(
         `MongoDB connected Successfully !! DB Host: ${connectionInstance.connection.host}`
      );
   } catch (error) {
      console.log(" MONGODB connection FAILED ", error);
      process.exit(1);
   }
};

export default connectDB;

/*
(async () => {
   try {
      await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`);
      app.on("ERROR: ", (error) => {
         console.error("ERROR: ", error);
         throw error;
      });

      app.listen(process.env.PORT,  () => {
         console.log(`App is listen on port ${process.env.PORT}`);
         
      })
   } catch (error) {
      console.error("ERROR: ", error);
      throw error;
   }
})();
*/
