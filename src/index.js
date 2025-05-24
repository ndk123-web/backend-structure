import express from "express";
import connectDB from "./db/db.js";
import "dotenv/config"; // important because we are loading initially variables from .env files
import app from './app.js';

// it's async function which always returns the promise
connectDB()
  .then(() => {
    console.log("Success");

    // it's simply an EventEmitter , which also we used in websocket (websocket libraries used EventEmiiter internally)
    app.on("error", (err) => {
      console.log("Error in Server ", err.message);
      throw err;
    });

    app.listen(process.env.PORT, () => {
      console.log("Server is Listening");
    });

  })
  
  .catch((err) => {
    console.log("Error: ", err.message);
  });