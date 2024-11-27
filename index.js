import express from "express";
import cors from "cors";
import axios from "axios";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { User } from "./models/user.model.js";
import { Order } from "./models/order.model.js";
import { app, server, io } from "./socket/socket.js";
import admin from "firebase-admin";
import { Notify } from "./models/notify.model.js";
// import socketIoClient from "socket.io-client";

dotenv.config();
const port = process.env.PORT || 3000;

const corsOptions = {
  origin: "*",
  // [
  //   // "http://localhost:3000",
  //   // "https://localhost:3000",
  //   // "http://localhost:5173",
  //   // "http://localhost:5174",
  //   "https://kuryer-sushi.vercel.app",
  //   "https://joinposter.com",
  //   "https://platform.joinposter.com",
  //   "http://localhost:5173",
  //   // "https://92ad-84-54-84-80.ngrok-free.app",
  //   // "https://c853-213-230-72-138.ngrok-free.app",
  //   "https://admin-rolling-sushi.vercel.app",
  //   "https://www.rollingsushiadmin.uz",
  // ],
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert({
    type: "service_account",
    project_id: "rolling-sushi-project",
    private_key_id: "46087e412a72d59c659b088b1cda997d870f0952",
    private_key:
      "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDA5oCbXBCdVLLl\nKMVHlPwDgsWah/H11TwsQ5lVc5qMcaOQIRPlLnZI5hqYQP7EPYvVltXiMbddozPT\nBIVQJRMV2thSr8pUZQCAe0/w1XJgVov52fMRUy1+G3VnpWGsDhq3J4G/DEZyNRfY\nGFfZHWbmBbBSCvJI3zUMlhHpFQt9Eu46iFk4tZoM05uyem65x/GmxfEDNxYIkvc5\nNZvvqFllvNCCdw8Q+2xRqYr41TKyUgzrhi2C1e0X8vce8sjWCpTCwS3M8Iah7BFg\nM1YljYrR3tyKU8XyW67d6diyq8Nhf7pywoYZYjjoM6uJO9/NQvZQnvDrQKxEz26g\np7SGewwXAgMBAAECggEAF+i6CgeYO5fy8HpkMWIi9mBwE55D/D9ozOe4CqJghoXT\nSxr+d0qR+KkkpLhxm2sxeNDQQ8/7tUx0MPR/fZaKzgupAl6tilZWgJZIK0aZfZ1c\njiRYf0469kV7ANS7zXKWFxt7dm2UEbXI9czWnp+JUHtmBlU7AJNB5QR4xdYI7YCD\nFQH8OurlOumewmvVr79mGq0XQITFRA/usyMGe1WWeQdA3oM15KQz7zRizjtkpzBf\npjuVWHQ+u7oTvl+uwlHHzy2P5Hfo9Q3y0JoxpDGwxbB3aTPMAQb4aOXcj+thD1Us\nm7smNwM9XuKnATyZPJuOzulqo4WvlTGnsr4Re3G28QKBgQDhH5NUSsobRTT86htL\nO3yGvQ7np+a7lxs+rLqR/lEbjlG13Zma5FGxHPHJd2AmmwuC0pPVYQjALjzKdLN8\nJENwWeNJ3l4DjKtYga+XJ31yTc4/NjBgfULywPr2TPpctzLmwXF2E7gf8ifUmSc/\n+DYq5aBV2PiXr077yDofcXIP7wKBgQDbW4e3V2XtmBlaC9PWQxsb7tB4xq+xvw1t\nQZO6OpSbtOLVoe59qk/k41W2A7xezPYV6ZJUeZ3NQ7G3SYtfqqt/xjQtbMxENfgF\nJpcWwDAFoEuTqfLC8BIaUR06pbv1mM05BI585ySmJXntMPOs/8qZW0rzSPtueEeI\n/P5LUeKeWQKBgEUdBIYkT9f/bz0WQjrekGRtNl44VcXRpjOfo8eeZBgpoTxMRBQh\ndFMDp9dKJuKzRt1q+KfRmnYlu9QL7+50059yeSz8b7B3R0NszROCtCibam5NnJyC\n2ELerC1hhJtiQuZFDShK9YQZO9ExE7O36ClTRd4VNnya/Yye8/kjQvlRAoGBAKga\njPdEUyix1zvatI0PAEd3zOvB2AMvluqTxtKA8kIhbXSqlEpZqsCON7E1S7aa/Dvu\ns+VpDjWwGxGLmvPFp4hULMhjCGd9tIS9/ivBPQwSu9h99TzPHhBs+SlouZKNdziq\n9UdjHAL31Wigix2ZKXo9LEMlOwp9wtSIjZjLOBCBAoGAMJKVvqJYB6/X629jrSuQ\njw3PVrNtzkc5PPSRbLIxCYq+7SJZNWL17aOOnyJw7Mwz7wlTeTFd9DT6QsFzOZm6\npbh1xT9c74h64gNpJZulz8VMfpfv3fUnEG+M9TDhPRKsVI6+tZ00IkS+TOK0Cjf9\nWq1pZiHLYmYVwuLfj1/2Hk8=\n-----END PRIVATE KEY-----\n",
    client_email:
      "firebase-adminsdk-rej5m@rolling-sushi-project.iam.gserviceaccount.com",
    client_id: "103596595117544440620",
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url:
      "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-rej5m%40rolling-sushi-project.iam.gserviceaccount.com",
    universe_domain: "googleapis.com",
  }),
});

async function sendNotificationToTopic(token, language, status) {
  const messages = {
    accept: {
      en: "Your order is accepted! Thank you for choosing us! ❤️🍱",
      ru: "Ваш заказ принят! Спасибо, что выбрали нас! ❤️🍱",
      uz: "Buyurtmangiz qabul qilindi! Bizni tanlaganingiz uchun rahmat! ❤️🍱",
    },
    cooking: {
      en: "Your order is being prepared with love and care! 💕👨‍🍳",
      ru: "Ваш заказ готовится с любовью и заботой! 💕👨‍🍳",
      uz: "Buyurtmangiz mehr va g‘amxo‘rlik bilan tayyorlanmoqda! 💕👨‍🍳",
    },
    delivery: {
      en: "Delivery is on the way — just a little more, and it will be delicious! 🚗💨🍣",
      ru: "Доставка в пути — ещё немного, и будет вкусно! 🚗💨🍣",
      uz: "Buyurtma yo‘lda — oz qoldi, va tez orada mazali bo‘ladi! 🚗💨🍣",
    },
    finished: {
      en: "Lovingly delivered! May your day be delicious! 💌🍱",
      ru: "С любовью доставлено! Пусть ваш день будет вкусным! 💌🍱",
      uz: "Muhabbat bilan yetkazildi! Kuningiz mazali o‘tsin! 💌🍱",
    },
  };

  const bodyMessage = messages[status]
    ? messages[status][language]
    : "Order status update";

  const payload = {
    // topic: topic,
    token: token,
    notification: {
      title: "Rolling sushi",
      body: bodyMessage,
    },
    data: {
      orderId: "123456",
      status: "Confirmed",
    },
  };

  try {
    const response = await admin.messaging().send(payload);
    console.log("Notification sent successfully to topic:", response);
  } catch (error) {
    console.error("Error sending notification to topic:", error);
  }
}

// const topic = "order_updates"; // Replace with your topic name
// sendNotificationToTopic(topic);

app.get("/", async (req, res) => {
  console.log(req.headers.origin);
  // res.setHeader("Access-Control-Allow-Origin", "https://localhost:5173");
  // res.setHeader("Access-Control-Allow-Methods", "GET, POST");
  // // Optionally, you can set more headers as needed

  // // Allow credentials if needed
  // res.setHeader("Access-Control-Allow-Credentials", "true");

  const result = await axios.get(
    "https://joinposter.com/api/menu.getProducts?token=046902:6281755091471320780488d484cc4b78"
  );
  res.send(result.data.response);

  const responseData = [{ name: "foo", value: "bar" }];

  // res.json(responseData);
});

const processingStatus = {};

app.post("/notify", async (req, res) => {
  console.log(req.body);
  const { fcm, fcm_lng, status } = req.body;
  sendNotificationToTopic(fcm, fcm_lng, status);
  res.send("ok");
});

app.get("/getNews", async (req, res) => {
  const news = await Notify.find({});
  res.send(news);
});

app.post("/createNews", async (req, res) => {
  console.log(req.body);
  const { title, subTitle, text } = req.body;
  // const createNews = await Notify.create({ title, subTitle, text });
  const payload = {
    topic: "all_users",
    notification: { title, body: subTitle },
    data: {},
  };

  try {
    const response = await admin.messaging().send(payload);
    console.log("Notification sent successfully to topic:", response);
  } catch (error) {
    console.error("Error sending notification to topic:", error);
    res.send("error");
  }
  res.json({hello: "world"});
});

app.post("/", async (req, res) => {
  console.log(req.body);
  const { data } = req.body;
  const parsedData = JSON?.parse(data);
  // console.log("history", parsedData?.transactions_history.type_history);
  // console.log("value", parsedData?.transactions_history.value);

  if (
    parsedData?.transactions_history.type_history ===
      "changeprocessingstatus" &&
    parsedData?.transactions_history.value == 40
  ) {
    const transactionId = req.body?.object_id;

    // Check if the transaction is already being processed
    if (processingStatus[transactionId]) {
      console.log(`Transaction ${transactionId} is already being processed`);
      return res.status(200).send("Already processing");
    }

    // Mark the transaction as processing
    processingStatus[transactionId] = true;

    try {
      const response = await axios.get(
        `https://joinposter.com/api/dash.getTransaction?token=${process.env.PAST}&transaction_id=${transactionId}&include_delivery=true&include_history=true&include_products=true`
      );
      const responseData = response.data;

      const items = responseData.response;

      const prods = await axios.get(
        `https://joinposter.com/api/dash.getTransactionProducts?token=${process.env.PAST}&transaction_id=${transactionId}`
      );

      const products = prods.data.response;

      const existOrder = await Order.findOne({
        order_id: items[0]?.transaction_id,
      });

      if (existOrder) {
        return;
      }

      io.to(items[0]?.delivery?.courier_id).emit("message", {
        order_id: items[0]?.transaction_id,
        courier_id: items[0]?.delivery?.courier_id,
        orderData: items[0],
        products,
        status: "waiting",
      });

      await Order.create({
        order_id: items[0]?.transaction_id,
        courier_id: items[0]?.delivery?.courier_id,
        orderData: items[0],
        products,
        status: "waiting",
      });

      console.log("Order created:", transactionId);
    } catch (error) {
      console.error("Error fetching transaction data:", error);
    } finally {
      // Unlock the transaction once processing is complete
      delete processingStatus[transactionId];
    }
  }
  res.send(200);
});

const processingStatus2 = {};

app.post("/posterFromMe", async (req, res) => {
  console.log("poster sended", req.body);
  const transactionId = +req.body?.order.orderName;

  // Check if the transaction is already being processed
  if (processingStatus2[transactionId]) {
    console.log(`Transaction ${transactionId} is already being processed`);
    return res.status(200).send("Already processing");
  }

  // Mark the transaction as processing
  processingStatus2[transactionId] = true;
  try {
    const response = await axios.get(
      `https://joinposter.com/api/dash.getTransaction?token=${process.env.PAST}&transaction_id=${transactionId}&include_delivery=true&include_history=true&include_products=true`
    );

    const responseData = response.data;

    const items = responseData.response;

    console.log("creating order", items);

    const prods = await axios.get(
      `https://joinposter.com/api/dash.getTransactionProducts?token=${process.env.PAST}&transaction_id=${transactionId}`
    );

    const products = prods.data.response;

    const existOrder = await Order.findOne({
      order_id: items[0]?.transaction_id,
    });

    if (existOrder) {
      return;
    }

    console.log("courierid", items[0]?.delivery?.courier_id);
    console.log("req courierid", req.body.order.deliveryInfo.courierId);
    io.to(items[0]?.delivery?.courier_id).emit("message", {
      order_id: items[0]?.transaction_id,
      courier_id: items[0]?.delivery?.courier_id,
      orderData: items[0],
      products,
      status: "waiting",
    });

    await Order.create({
      order_id: items[0]?.transaction_id,
      courier_id:
        Number(items[0]?.delivery?.courier_id) ||
        Number(req.body.order.deliveryInfo.courierId),
      orderData: items[0],
      products,
      status: "waiting",
    });
    const sendData = {
      order_id: items[0]?.transaction_id,
      courier_id: items[0]?.delivery?.courier_id,
      orderData: items[0],
      products,
      status: "waiting",
    };
    res.send(sendData);

    console.log("Order created:", transactionId);
  } catch (error) {
    console.error("Error fetching transaction data:", error);
  } finally {
    // Unlock the transaction once processing is complete
    delete processingStatus2[transactionId];
  }
});

app.post("/socketData", async (req, res) => {
  console.log(req.body);
  io.emit("sct_msg", {
    order_id: items[0]?.transaction_id,
    courier_id: items[0]?.delivery?.courier_id,
    orderData: items[0],
    products,
    status: "waiting",
  });
  res.send("hello");
});

app.post("/deleteOrder", async (req, res) => {
  console.log("poster deleted", req.body);

  const result = await Order.deleteOne({
    "orderData.transaction_comment": req.body.comment,
  });

  io.emit("removeOrder", req.body.comment);

  res.send("ok");
});

app.post("/postFromStark", async (req, res) => {
  console.log(req.body);
  io.emit("orderItem", req.body);
  res.send("posted successfully");
});

app.get("/getOrders/:id", async (req, res) => {
  const orders = await Order.find({ courier_id: req.params.id });
  res.send(orders);
});

app.get("/getTransaction", async (req, res) => {
  const { id, date } = req.query;

  try {
    const response = await axios.get(
      `https://joinposter.com/api/dash.getTransactions?token=${process.env.PAST}&dateFrom=${date}&dateTo=${date}&include_delivery=true&include_products=true&courier_id=${id}&include_history=true`
    );

    if (!response.data.response) {
      return res.send({ error: "No transactions found." });
    }

    const transactions = response.data.response.map(async (transaction) => {
      try {
        const orders = await axios.get(
          `https://joinposter.com/api/dash.getTransactionProducts?token=${process.env.PAST}&transaction_id=${transaction.transaction_id}`
        );
        if (orders.data && orders.data.response) {
          transaction.products_name = orders.data.response;
        } else {
          transaction.products_name = []; // Set to empty array if no product data
        }
      } catch (error) {
        console.error(
          "Error fetching products for transaction:",
          transaction.transaction_comment,
          error
        );
        transaction.products_name = []; // Set to empty array on error
      }

      try {
        const backOrder = await axios.get(
          `https://vm4983125.25ssd.had.wf:5000/get_order/${transaction.transaction_comment}`
        );
        if (backOrder.data) transaction.backOrder = backOrder?.data;
      } catch (error) {
        console.error(
          "Error fetching back order for transaction:",
          transaction.transaction_id,
          error
        );
      }

      return transaction;
    });

    const processedTransactions = await Promise.all(transactions);
    res.send(processedTransactions);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).send({ error: "Internal Server Error" }); // Handle general errors
  }
});

// app.get("/getTransaction", async (req, res) => {
//   const { id, date } = req.query;

//   try {
//     const response = await axios.get(
//       `https://joinposter.com/api/dash.getTransactions?token=${process.env.PAST}&dateFrom=${date}&dateTo=${date}&include_delivery=true&include_products=true&courier_id=${id}&include_history=true`
//     );

//     if (!response.data.response) {
//       return res.send({ error: "No transactions found." });
//     }

//     const transactions = response.data.response.map(async (transaction) => {
//       try {
//         const orders = await axios.get(
//           `https://joinposter.com/api/dash.getTransactionProducts?token=${process.env.PAST}&transaction_id=${transaction.transaction_comment}`
//         );
//         console.log("pr_name", orders?.data);
//         transaction.products_name = orders?.data.response;
//       } catch (error) {
//         console.error("Error fetching products for transaction:", transaction.transaction_comment, error);
//       }

//       try {
//         const backOrder = await axios.get(
//           `https://vm4983125.25ssd.had.wf:5000/get_order/${transaction.transaction_comment}`
//         );
//         if (backOrder.data) transaction.backOrder = backOrder?.data;
//       } catch (error) {
//         console.error("Error fetching back order for transaction:", transaction.transaction_id, error);
//       }

//       return transaction;
//     });

//     const processedTransactions = await Promise.all(transactions);
//     res.send(processedTransactions);
//   } catch (error) {
//     console.error("Error fetching transactions:", error);
//     res.status(500).send({ error: "Internal Server Error" }); // Handle general errors
//   }
// });

// app.get("/getTransaction", async (req, res) => {
//   const { id, date } = req.query;
//   const response = await axios.get(
//     `https://joinposter.com/api/dash.getTransactions?token=${
//       process.env.PAST
//     }&dateFrom=${date}&dateTo=${
//       +date + 1
//     }&include_delivery=true&include_products=true&courier_id=${id}&include_history=true`
//   );

//   if (!response.data.response) {
//     return res.send({ error: "No transactions found." }); // Handle no transactions
//   }
//   for (let i = 0; i < response.data.response?.length; i++) {
//     const orders = await axios.get(
//       `https://joinposter.com/api/dash.getTransactionProducts?token=${process.env.PAST}&transaction_id=${response?.data.response[i].transaction_id}`
//     );
//     response.data.response[i].products_name = orders?.data.response;
//     const backOrder = await axios.get(
//       `https://vm4983125.25ssd.had.wf:5000/get_order/${response?.data.response[i].transaction_comment}`
//     );
//     if (backOrder.data) response.data.response[i].backOrder = backOrder?.data;
//   }

//   res.send(
//     response.data.response
//       ? response.data.response
//       : [{ data: "order not found" }]
//   );
// });

app.put("/changeStatus/:orderId", async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;
  const result = await Order.updateOne(
    { order_id: orderId },
    { $set: { status } }
  );
  res.send(result);
});
app.delete("/deleteOrder/:orderId", async (req, res) => {
  const { orderId } = req.params;
  const result = await Order.deleteOne({ order_id: orderId });
  res.send(result);
});

app.delete("/deleteOrders/:clientId", async (req, res) => {
  console.log(req.params.clientId);
  const data = await Order.deleteMany({ courier_id: req.params.clientId });
  console.log(data);
  res.send(`delete successfully ${req.params.clientId}`);
});

app.get("/findOrder/:orderId", async (req, res) => {
  const { orderId } = req.params;
  const response = await Order.findOne({ order_id: orderId });

  res.send(response);
});

// app.post("/", async (req, res) => {
//   const { data } = req.body;
//   const parsedData = JSON.parse(data);

//   if (
//     parsedData?.transactions_history.type_history ===
//       "changeprocessingstatus" &&
//     parsedData?.transactions_history.value == 40
//   ) {
//     try {
//       const response = await axios.get(
//         `https://joinposter.com/api/dash.getTransaction?token=${process.env.PAST}&transaction_id=${req.body?.object_id}&include_delivery=true&include_history=true&include_products=true`
//       );
//       const responseData = response.data;

//       const items = responseData.response;

//       const prods = await axios.get(
//         `https://joinposter.com/api/dash.getTransactionProducts?token=${process.env.PAST}&transaction_id=${req?.body?.object_id}`
//       );

//       const products = prods.data.response;

//       const existOrder = await Order.findOne({
//         order_id: items[0]?.transaction_id,
//       });
//       console.log(existOrder);

//       if (existOrder) {
//         return;
//       }
//       io.to(items[0]?.delivery?.courier_id).emit("message", {
//         order_id: items[0]?.transaction_id,
//         courier_id: items[0]?.delivery?.courier_id,
//         orderData: items[0],
//         products,
//       });
//       await Order.create({
//         order_id: items[0]?.transaction_id,
//         courier_id: items[0]?.delivery?.courier_id,
//         orderData: items[0],
//         products,
//       });

//       console.log("sendData");
//       // You can emit events or perform other actions specific to this room
//       // For example:
//     } catch (error) {
//       console.error("Error fetching transaction data:", error);
//     }
//   }
//   res.status(200).send("hello");
// });

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
      `${process.env.EMPLOYEE}${process.env.PAST}`
    );

    const externalData = response.data.response.filter(
      (item) =>
        item.role_name === "курьер" ||
        item.role_name === "Кур’єр" ||
        item.role_name === "Курьер"
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
  try {
    const postData = await axios.post(
      `https://joinposter.com/api/incomingOrders.createIncomingOrder?token=${process.env.PAST}`,
      req.body
    );
    res.send(postData.data); // Send API response
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
