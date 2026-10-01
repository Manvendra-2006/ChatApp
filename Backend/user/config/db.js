import mongoose from "mongoose";
export async function connectDb(){
    try{
        await mongoose.connect(process.env.MongoURL)
        console.log("DataBase is connected successfully")
    }
    catch(error){
        console.log("Database is not connected successfully ")
    }
}