import "dotenv/config";
import connectionToDatabase from "../config/database/db";
import { PORT } from "../constants/env";
import app from "./app";

app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  await connectionToDatabase();
});
