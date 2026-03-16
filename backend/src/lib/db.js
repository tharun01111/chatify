import mongoose from "mongoose";
import { ENV } from "./env.js";

export const connectDb = async () => {
  console.log(ENV.MONGO_URI);
  try {
    const conn = await mongoose.connect(ENV.MONGO_URI);
    
    console.log("MongoDb connected on: " + conn.connection.host);
  } catch (error) {
    console.error("Error connecting to mongoDb: " + error);
    process.exit(1);
  }
};
