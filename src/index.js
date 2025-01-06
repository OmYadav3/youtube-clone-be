import dotenv from "dotenv"
import connectDB from './db/index.js';
import { app } from "./app.js"

dotenv.config({
   path:'./.env'
})

// Basically a async function are giving a promise so we use then and catch 
connectDB()
.then(() => {
   app.listen(process.env.PORT || 8000, () => {
      console.log(`Server is running at port ${process.env.PORT}`);
      
   } )
})
.catch((error) => {
   console.log("MongoDB Connection Failed  !!!", error )
})







