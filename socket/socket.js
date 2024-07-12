import http from "http";
import express from "express";
import { Server } from "socket.io";


const app = express();

const server = http.createServer(app);

const userSocketMap = {};
const users = {};

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "https://localhost:3000",
      "http://localhost:5174",
      "https://kuryer-sushi.vercel.app",
      "https://joinposter.com",
      "https://platform.joinposter.com",
      "https://c853-213-230-72-138.ngrok-free.app",
      "https://www.rollingsushiadmin.uz"
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// const otherServerSocket = socketIoClient("https://vm4983125.25ssd.had.wf:5000");

// otherServerSocket.on("connect", () => {
//   console.log("Connected to other server");
// });

// otherServerSocket.on("disconnect", (disconnect) => {
//   console.log("Socket disconnect:", disconnect);
// });
// otherServerSocket.on("error", (error) => {
//   console.error("Socket connection error:", error);
// });

io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;
  socket.join(+userId);

  if (userId !== undefined) userSocketMap[userId] = socket.id;

  socket.emit("onlineUsers", Object.keys(userSocketMap));
  users[socket.id] = true;
  // app.post("/", async (req, res) => {
  //   const { data } = req.body;
  //   const parsedData = JSON.parse(data);
  //   console.log(req.body);

  //   if (
  //     parsedData?.transactions_history.type_history === "changedeliveryinfo"
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

  //       console.log(prods.data.response);

  //       io.emit("message", items);
  //       console.log(items);
  //     } catch (error) {
  //       console.error("Error fetching transaction data:", error);
  //     }
  //   }

  //   res.sendStatus(200)
  // });

  socket.on("disconnect", () => {
    console.log("user disconnected", socket.id);
    delete userSocketMap[userId];
    io.emit("onlineUsers", Object.keys(userSocketMap));
    io.emit("userStatusUpdate", { userId: socket.id, online: false });
  });
});

export { server, io, app };
