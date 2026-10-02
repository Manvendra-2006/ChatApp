import mongoose from "mongoose";
export async function connectDB(){
    try{
        await mongoose.connect(process.env.MongoURL)
        console.log("Database is connected successfully")
    }
    catch(error){
        console.log("Database is not connected succesffully")
    }
}