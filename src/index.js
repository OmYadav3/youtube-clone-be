import dotenv from "dotenv"
import connectDB from './db/index.js';

dotenv.config({
   path:'./env'
})

import express from "express";
const app = express();


connectDB()

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




app.get("/", (req, res) => {
   res.send("Server is ready buddy!");
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
   console.log(`Server at http://localhost:${port}`);
});
