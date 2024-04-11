import express from "express";
import cors from "cors";
import axios from "axios";
import dotenv from "dotenv";
import mongoose from "mongoose";
import admin from "firebase-admin";
// import credentials from "./key.json" assert { type: "json" };
import { User } from "./models/user.model.js";
import { app, server } from "./socket/socket.js";

dotenv.config();
const port = process.env.PORT || 3000;

const corsOptions = {
  origin: "*", // Allow requests from all origins during development
  methods: ["GET", "POST"], // Allow GET and POST requests
  credentials: true, // if your frontend sends cookies or any credentials, set this to true
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// const tokenSushi = "046902:6281755091471320780488d484cc4b78";
const tokenPossible = "967898:49355888e8e490af3bcca79c5e6b1abf";
const tokenNew = "378173:27544591ca7a63962c67f75cdcad03da"
const employee = "https://joinposter.com/api/access.getEmployees?token=";
// const spots = "https://joinposter.com/api/spots.getSpots?token=";

app.post("/login", async (req, res) => {
  try {
    const { email } = req.body; // Destructure email from req.body
    if (!email) {
      // Check if email is not provided
      return res.status(400).send({ message: "Email is required" });
    }

    const response = await axios.get(`${employee}${tokenNew}`);

    const externalData = response.data.response.filter(
      (item) => item.role_name === "курьер" || item.role_name === "Кур’єр"
    );

    const userOnPoster = externalData.find(
      (courier) => courier.login === email
    );

    // console.log("userp", userOnPoster, login);
    const userOnMongo = await User.find({ login: email }); // Wait for the findOne operation to complete

    if (userOnPoster && !userOnMongo.length) {
      await User.create(userOnPoster);
      return res.status(200).send(userOnPoster[0]);
    } else if (userOnPoster && userOnMongo) {
      return res.status(200).send(userOnMongo[0]);
    } else {
      return res.status(404).json({ message: "User not found" });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "User not found" });
  }
});

mongoose
  .connect(process.env.CONNECT_DB)
  .then(() => {
    console.log("Connected to MongoDB Atlas");
    server.listen(port, () => {
      console.log(`Server listening on port ${port}`);
    });
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB Atlas:", err);
  });
