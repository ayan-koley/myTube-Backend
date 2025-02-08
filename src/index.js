import dotenv from 'dotenv';
dotenv.config({path: './env'})
import connectDB from './db/index.js';

connectDB();


// ------------------------------ one way of writting code ---------------------------
// import express from 'express'
// const app = express();
// (async () => {
//     try {
//         await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
//         app.on("error", (error) => {
//             console.log("ERRR: ", error);
//             throw error;
//         } )
//         app.listen(`${process.env.PORT}`, () => 
//         {
//             console.log("app is listing on ", process.env.PORT);
//         });
//     } catch (error) {
//         console.log("ERR: ", error);
//         throw error;
//     }
// } )()