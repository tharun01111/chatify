import mongoose from "mongoose";

export const connectDb = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDb connected on: " + conn.connection.host);
  } catch (error) {
    console.error("Error connecting to mongoDb: " + error);
    process.exit(1);
  }
};
