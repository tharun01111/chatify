import mongoose from "mongoose";

export const connectDb = async () => {
  try {
    const {MONGO_URI} = process.env.MONGO_URI
    if(!MONGO_URI) throw new Error("MONGO_URI not set");
    const conn = await mongoose.connect(MONGO_URI);
    console.log("MongoDb connected on: " + conn.connection.host);
  } catch (error) {
    console.error("Error connecting to mongoDb: " + error);
    process.exit(1);
  }
};
