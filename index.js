import express from "express";
import cors from "cors";
import axios from "axios";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { User } from "./models/user.model.js";
import { app, server } from "./socket/socket.js";

dotenv.config();
const port = process.env.PORT || 3000;

const corsOptions = {
  origin: [
    "http://localhost:3000",
    "https://localhost:3000",
    "http://localhost:5173",
    "http://localhost:5174",
    "https://kuryer-sushi.vercel.app",
    "https://joinposter.com",
    "https://platform.joinposter.com",
    "https://92ad-84-54-84-80.ngrok-free.app",
    "https://c853-213-230-72-138.ngrok-free.app",
    "https://admin-rolling-sushi.vercel.app",
  ],
  methods: ["GET", "POST"],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", async (req, res) => {
  console.log(req.headers.origin);
  // res.setHeader("Access-Control-Allow-Origin", "https://localhost:5173");
  // res.setHeader("Access-Control-Allow-Methods", "GET, POST");
  // // Optionally, you can set more headers as needed

  // // Allow credentials if needed
  // res.setHeader("Access-Control-Allow-Credentials", "true");

  const responseData = [{ name: "foo", value: "bar" }];

  res.json(responseData);
});
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

app.get("/getSpot", async (req, res) => {
  const response = await axios.get(
    `${process.env.SPOTS}${process.env.TOKENSUSHI}`
  );

  res.json(response.data.response);
});

app.post("/login", async (req, res) => {
  try {
    const { email } = req.body; // Destructure email from req.body
    if (!email) {
      // Check if email is not provided
      return res.status(400).send({ message: "Email is required" });
    }

    const response = await axios.get(
      `${process.env.EMPLOYEE}${process.env.TOKENPOSSIBLE}`
    );

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
      const createUser = await User.find({ login: email });
      return res.status(200).send(createUser[0]);
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

app.post("/api/posttoposter", async (req, res) => {
  const { phone, spot_id, products } = req.body;

  console.log(req.body);
  try {
    const postData = await axios.post(
      `https://joinposter.com/api/incomingOrders.createIncomingOrder?token=${process.env.TOKENSUSHI}`,
      req.body
    );
    res.send(JSON.stringify(postData.data)); // Send API response
  } catch (err) {
    console.error(err);
    // Handle errors appropriately
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
