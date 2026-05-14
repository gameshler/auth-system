import mongoose from "mongoose";
import { MONGO_URI } from "../../constants/env";

const connectionToDatabase = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to database");
  } catch (error) {
    console.error("Error connecting to database", error);
    process.exit(1);
  }
};

export default connectionToDatabase;
