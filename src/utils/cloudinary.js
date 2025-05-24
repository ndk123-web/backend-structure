import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (filePath) => {
  try {
    if (!fs.existsSync(filePath)) {
      return new Error("File does not exist");
    }
    const result = await cloudinary.uploader.upload(filePath, {
      resource_type: "auto", // detects the resource type automatically
    });
    // file has been uploaded successfully
    console.log("File uploaded successfully:", result.url);
    return result;
  } catch (err) {
    // if error then remove file from server
    fs.unlinkSync(filePath);

    console.error("Error uploading to Cloudinary:", err);
    return null;
  }
};

// log the cloudinary config
console.log(cloudinary.config());

export { uploadOnCloudinary };
