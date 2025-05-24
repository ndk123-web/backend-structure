import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGO_URI}${DB_NAME}`,
    );
    console.log(
      "MongoDB Connected !! DB Host: ",
      connectionInstance.connection.host,
    );
  } catch (err) {
    console.log("Mongo Connection Failed: ", err);
    process.exit(1); // 1 code means exit with error , // 0 means exit with success
  }
};

export default connectDB;
