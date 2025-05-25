// import mongoose, { ModifiedPathsSnapshot } from "mongoose";
import { Video } from "./video.models.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowecase: true,
      trim: true,
      index: true, // optimized for searching
    },
    password: {
      type: String,
      required: [true, "Password Required"],
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    fullname: {
      type: String,
      required: true,
      index: true,
    },
    avtar: {
      type: String, // cloud stoarage link
      required: true,
    },
    coverImage: {
      type: String, // cloud stoarage link
    },
    watchHistory: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video",
      },
    ],
    refreshToken: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

// pre is a middleware means before storing data into the DB ,
// what to do
// this is pointing to the current document that is being saved
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  // because bcrypts takes time to hash the password 
  this.password = await bcrypt.hash(this.password, 8);
  next();
});

// we can create methods inside mongoose
userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};


// jwt methods are synchronous
// if function is async then we can use await inside it but we cant get the return value
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.username,
      fullname: this.fullname,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    },
  );
};


// jwt methods are synchronous
// if function is async then we can use await inside it but we cant get the return value
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    },
  );
};

export const User = new mongoose.model("User", userSchema);
