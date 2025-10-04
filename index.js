// old code
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
import { Time } from "./models/time.model.js";
// import socketIoClient from "socket.io-client";
import cookieParser from "cookie-parser";
import errorMiddleware from "./middlewares/error.middleware.js";
import routesPay from "./routes/index.js";

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
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));

app.use("/api", routesPay);

app.use(errorMiddleware);

function convertPhoneNumber(phoneNumber) {
  // Remove the "+" if it exists
  if (phoneNumber.startsWith("+")) {
    phoneNumber = phoneNumber.slice(1);
  }

  // Add "998" at the front if the length is less than 12
  if (phoneNumber.length < 12) {
    phoneNumber = "998" + phoneNumber;
  }

  // Return the processed phone number
  return phoneNumber;
}

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert({
    type: "service_account",
    project_id: "rolling-sushi-fcf2c",
    private_key_id: "a29bbdd38399d1614b9e07435db66ed16a95a2e6",
    private_key:
      "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCfXJ4+IPXoUpwY\nhuREcXLkEOZ3bADKIiVb10AAIu3S7MXUoYGWAHeDbnRApR+Fcq+TH3WT/bTkwEa9\nkn9D3He1cebzetXemT/CZIPyP7MTO9EksYd+BPDtWbkGs2TD5+k3KABqRaPYNC1i\nMcGDekme+tfbtgtuJmUojnCfhWkW0ucUyE9iTR9NXr1P7AZzi6TVkUPOq+qIrfhv\nwPvQFOnOCHWoM+AyKLQWRoX+OIrq1eoBMqonSVZGTMFZY6pLDzFCFGL7N3YkTLZj\nasci7nPSfOUf7pOY6ytr7cyNxaATlkld/3k1qRecqkfrh/PbjteTqNtz0tr8G9wd\nR/GYmZ29AgMBAAECggEABLPo/5BdcWOus5KXfeWTLGPLSU7onw5u58zsWJSvTAAs\nvl+dwV12KWzDBX1Z9sgxojfVcm6UPgPmkoWWN9xzs+kOlbTURuNi3Eu3ERkMIc8s\nFtceVnuy2G5DZY05tgZL/ZKyoHA5q5GunS02triPH5/ratJud+uuJIo/jJWVSlUX\nC0kYv0RlU+yj9efQKXryFUWoBUQiXpg5iD6NqGVzMChLTvD6n+BmYuQXPCY/9ZTu\n9V+LS3KcojaTkt3iy9YeeI6eiloiPQA1k1qZJRXw0M7/YABgd5fdTbNx7pT/PE3j\nAgTe5/IXEdkcTpPAshy2+wouGQ+abB2eXpRMlBGNiQKBgQDQh19IgVgk57r2t53b\ncmSxDJIuJbpW7Dg8Zjk58CMRIuNbVirX/llMKvHzZGsVqsGgd3Wo5SmwdMVRMCUi\ntg+L9Ycw6b7G+jv0MzCT2q8lj3md/SVEsor/wsv1n/UebfOSPasX9fz/ZHVElkvp\nkU9odlTFh9Yy0+/oJto9e8/0OwKBgQDDo+TrTEnhNGcql85KmgXrBSBFMLueXm7V\np5EJOlaATHAYCf0tJvecbk/Kbajo9l1IcEHQamA7jM1bUhXOCeQSi63gqmZW22Ep\nfk0yABhnDDyzi6ef6cX5rtt34pKVELSLMUnuxkqJiO2DgbPMGEpoh1WGAXhba6yM\n9DjeKCduZwKBgEp8sKqDmWrFY+GRQVAMEq+zn9vgGinGg2f/091ATCZo4fHUW8V/\n04IDrR2V9zJsJnIdeef0w+mGLJ2NpxY5FmCWOc5dEIqfBB980ZNfAEVYdMbckB1z\n8XberGB23OYbvG+2m5EZi1/nEISJc2BhSY41Bp7woLDTR9UTW82ull/VAoGAYiEK\n6ZrSU8tdE9gg+PpYjZF8pjfTY5QqM7Bg5ygDy0aL0wLvon4xJJ2QGBD48CDimTr1\nR/yTWEs/ldaOaVI8u7Cj/lR6EIbpLU7UmYfCta1FpSkfYu53Bs3V90QGEg7XABow\n4ztCl8m+mH+uF2j3qYZ4N0b1f6V6XxkAjS3G2XECgYEAliZalzPK6sGwCtGv2D0z\njEzZO3AfEP+hm0QLd03iEd2+jRUmJljUp7PBbo+dMTqplC+dVabONoSV66nHt350\nj3iRdW8b8nZ+0qmZl7+2xWfPQf9SAcia4SCjH8pcGHHx3sbh6MSaG/6sMnb1Q1gV\n97co2XtVokx3r4Rnb7LDNiY=\n-----END PRIVATE KEY-----\n",
    client_email:
      "firebase-adminsdk-fbsvc@rolling-sushi-fcf2c.iam.gserviceaccount.com",
    client_id: "118127532521355853972",
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url:
      "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40rolling-sushi-fcf2c.iam.gserviceaccount.com",
    universe_domain: "googleapis.com",
  }),
});

// In-memory FCM token storage
const tokenStorage = new Map(); // Map<token, { language, userId?, registeredAt, lastUsed, isValid }>

// Notification messages in different languages
const notificationMessages = {
  en: {
    title: "Rolling Sushi",
    body: "Your order is ready for pickup!",
    orderReady: "Order Ready",
    newPromotion: "New Promotion Available!",
    welcomeMessage: "Welcome to Rolling Sushi!",
  },
  uz: {
    title: "Rolling Sushi",
    body: "Buyurtmangiz tayyor!",
    orderReady: "Buyurtma Tayyor",
    newPromotion: "Yangi chegirma mavjud!",
    welcomeMessage: "Rolling Sushi'ga xush kelibsiz!",
  },
  ru: {
    title: "Rolling Sushi",
    body: "Ваш заказ готов к выдаче!",
    orderReady: "Заказ Готов",
    newPromotion: "Доступна новая акция!",
    welcomeMessage: "Добро пожаловать в Rolling Sushi!",
  },
};

// Helpers for enhanced FCM handling
function getNotificationContent(language, messageType = "body") {
  const supported = ["en", "uz", "ru"];
  const lang = supported.includes(language) ? language : "en";
  return {
    title: notificationMessages[lang].title,
    body:
      notificationMessages[lang][messageType] ||
      notificationMessages[lang].body,
  };
}

async function validateFCMToken(token) {
  try {
    await admin.messaging().send(
      {
        token,
        notification: { title: "Test", body: "Test" },
      },
      true // dry-run validation
    );
    return true;
  } catch (error) {
    console.log(`Token validation failed: ${error.code}`);
    return false;
  }
}

async function cleanInvalidTokens() {
  const tokensToRemove = [];
  for (const [token, data] of tokenStorage) {
    if (
      !data.isValid ||
      Date.now() - data.lastUsed > 30 * 24 * 60 * 60 * 1000
    ) {
      tokensToRemove.push(token);
    }
  }
  tokensToRemove.forEach((t) => tokenStorage.delete(t));
}

async function sendLocalizedNotificationToTopic(
  topic,
  language,
  messageType,
  customMessage,
  data = {}
) {
  const content =
    customMessage || getNotificationContent(language, messageType);
  const payload = {
    topic,
    notification: { title: content.title, body: content.body },
    data: {
      language,
      messageType: messageType || "general",
      timestamp: new Date().toISOString(),
      ...data,
    },
    android: {
      notification: {
        icon: "ic_notification",
        color: "#004032",
        sound: "default",
      },
    },
    apns: { payload: { aps: { sound: "default", badge: 1 } } },
  };
  const response = await admin.messaging().send(payload);
  return response;
}

async function sendNotificationToDevice(
  deviceToken,
  language,
  messageType,
  customMessage,
  data = {}
) {
  const content =
    customMessage || getNotificationContent(language, messageType);
  const payload = {
    token: deviceToken,
    notification: { title: content.title, body: content.body },
    data: {
      language,
      messageType: messageType || "general",
      timestamp: new Date().toISOString(),
      ...data,
    },
    android: {
      notification: {
        icon: "ic_notification",
        color: "#004032",
        sound: "default",
        channelId:
          messageType === "orderReady"
            ? "high_importance_channel"
            : "general_channel",
      },
    },
    apns: { payload: { aps: { sound: "default", badge: 1 } } },
  };

  try {
    const response = await admin.messaging().send(payload);
    if (tokenStorage.has(deviceToken)) {
      const tokenData = tokenStorage.get(deviceToken);
      tokenStorage.set(deviceToken, {
        ...tokenData,
        isValid: true,
        lastUsed: Date.now(),
      });
    }
    return response;
  } catch (error) {
    if (
      error.code === "messaging/registration-token-not-registered" ||
      error.code === "messaging/invalid-registration-token"
    ) {
      if (tokenStorage.has(deviceToken)) {
        const tokenData = tokenStorage.get(deviceToken);
        tokenStorage.set(deviceToken, { ...tokenData, isValid: false });
      }
    }
    throw error;
  }
}

async function sendNotificationToMultipleDevices(
  deviceTokens,
  language,
  messageType,
  customMessage,
  data = {}
) {
  const validTokens = deviceTokens.filter((t) => {
    const td = tokenStorage.get(t);
    return !td || td.isValid !== false;
  });
  if (!validTokens.length) throw new Error("No valid tokens provided");

  const content =
    customMessage || getNotificationContent(language, messageType);
  const payload = {
    tokens: validTokens,
    notification: { title: content.title, body: content.body },
    data: {
      language,
      messageType: messageType || "general",
      timestamp: new Date().toISOString(),
      ...data,
    },
    android: {
      notification: {
        icon: "ic_notification",
        color: "#004032",
        sound: "default",
        channelId:
          messageType === "orderReady"
            ? "high_importance_channel"
            : "general_channel",
      },
    },
    apns: { payload: { aps: { sound: "default", badge: 1 } } },
  };

  const response = await admin.messaging().sendMulticast(payload);
  response.responses.forEach((resp, idx) => {
    const token = validTokens[idx];
    if (tokenStorage.has(token)) {
      const td = tokenStorage.get(token);
      if (resp.success) {
        tokenStorage.set(token, { ...td, isValid: true, lastUsed: Date.now() });
      } else if (
        resp.error?.code === "messaging/registration-token-not-registered" ||
        resp.error?.code === "messaging/invalid-registration-token"
      ) {
        tokenStorage.set(token, { ...td, isValid: false });
      }
    }
  });
  return response;
}

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
    token: token,
    notification: {
      title: "Rolling sushi",
      body: bodyMessage,
    },
  };

  try {
    const response = await admin.messaging().send(payload);
    console.log("Notification sent successfully to topic:", response);
  } catch (error) {
    console.error("Error sending notification to topic:", error);
  }
}

app.get("/", async (req, res) => {
  res.send("hello world");
});

app.get("/get_time", async (req, res) => {
  const time = await Time.findOne({});
  res.send(time);
});

app.post("/edit_time", async (req, res) => {
  const { opened_time, closed_time } = req.body;
  const getItem = await Time.findOne({});
  if (getItem) {
    const result = await Time.updateOne(
      { _id: getItem._id },
      { $set: req.body }
    );
    res.send(result);
  } else {
    const result = await Time.create(req.body);
    res.send(result);
  }
});

const processingStatus = {};

app.post("/notify", async (req, res) => {
  const { fcm, fcm_lng, status } = req.body;
  sendNotificationToTopic(fcm, fcm_lng, status);
  res.send("ok");
});

// New FCM utility endpoints
app.get("/tokens-get", (req, res) => {
  res.send(Array.from(tokenStorage.entries()));
});

app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    supportedLanguages: ["en", "uz", "ru"],
    totalTokens: tokenStorage.size,
    validTokens: Array.from(tokenStorage.values()).filter(
      (t) => t.isValid !== false
    ).length,
  });
});

app.post("/test-direct", async (req, res) => {
  const token = req.body.token;
  try {
    const message = {
      token,
      notification: {
        title: "Test Direct",
        body: "This is a direct test message",
      },
      data: { messageType: "test", timestamp: new Date().toISOString() },
      apns: {
        payload: {
          aps: {
            "content-available": 1,
            sound: "default",
            alert: {
              title: "Test Direct",
              body: "This is a direct test message",
            },
          },
        },
      },
    };
    const response = await admin.messaging().send(message);
    res.json({ success: true, response });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/tokens/register", async (req, res) => {
  try {
    const { deviceToken, language = "en", userId } = req.body;
    if (!deviceToken)
      return res.status(400).json({ error: "Device token is required" });
    if (!["en", "uz", "ru"].includes(language))
      return res
        .status(400)
        .json({ error: "Unsupported language. Use: en, uz, or ru" });

    const isValid = await validateFCMToken(deviceToken);
    tokenStorage.set(deviceToken, {
      language,
      userId: userId || null,
      registeredAt: Date.now(),
      lastUsed: Date.now(),
      isValid,
    });

    const topic = `all_users_${language}`;
    try {
      await admin.messaging().subscribeToTopic([deviceToken], topic);
      await admin.messaging().subscribeToTopic([deviceToken], "all_users");
    } catch (subscriptionError) {
      console.error("Error subscribing to topics:", subscriptionError);
    }

    res.json({
      success: true,
      message: "Token registered successfully",
      tokenValid: isValid,
      language,
      subscribedTopics: ["all_users", topic],
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to register token", details: error.message });
  }
});

app.put("/tokens/language", async (req, res) => {
  try {
    const { deviceToken, newLanguage } = req.body;
    if (!deviceToken || !newLanguage)
      return res
        .status(400)
        .json({ error: "Device token and new language are required" });
    if (!["en", "uz", "ru"].includes(newLanguage))
      return res
        .status(400)
        .json({ error: "Unsupported language. Use: en, uz, or ru" });
    const tokenData = tokenStorage.get(deviceToken);
    if (!tokenData)
      return res
        .status(404)
        .json({ error: "Token not found. Please register first." });

    const oldLanguage = tokenData.language;
    try {
      await admin
        .messaging()
        .unsubscribeFromTopic([deviceToken], `all_users_${oldLanguage}`);
      await admin
        .messaging()
        .subscribeToTopic([deviceToken], `all_users_${newLanguage}`);
    } catch (subscriptionError) {
      console.error("Error updating topic subscriptions:", subscriptionError);
    }

    tokenStorage.set(deviceToken, {
      ...tokenData,
      language: newLanguage,
      lastUsed: Date.now(),
    });
    res.json({
      success: true,
      message: "Language updated successfully",
      oldLanguage,
      newLanguage,
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to update language", details: error.message });
  }
});

app.delete("/tokens/unregister", async (req, res) => {
  try {
    const { deviceToken } = req.body;
    if (!deviceToken)
      return res.status(400).json({ error: "Device token is required" });
    const tokenData = tokenStorage.get(deviceToken);
    if (tokenData) {
      try {
        await admin
          .messaging()
          .unsubscribeFromTopic([deviceToken], "all_users");
        await admin
          .messaging()
          .unsubscribeFromTopic(
            [deviceToken],
            `all_users_${tokenData.language}`
          );
      } catch (unsubscribeError) {
        console.error("Error unsubscribing from topics:", unsubscribeError);
      }
      tokenStorage.delete(deviceToken);
    }
    res.json({ success: true, message: "Token unregistered successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to unregister token", details: error.message });
  }
});

app.get("/tokens/:token", (req, res) => {
  try {
    const { token } = req.params;
    const tokenData = tokenStorage.get(token);
    if (!tokenData) return res.status(404).json({ error: "Token not found" });
    res.json({
      success: true,
      tokenData: {
        ...tokenData,
        registeredAt: new Date(tokenData.registeredAt).toISOString(),
        lastUsed: new Date(tokenData.lastUsed).toISOString(),
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to get token info", details: error.message });
  }
});

app.post("/admin/clean-tokens", async (req, res) => {
  try {
    const before = tokenStorage.size;
    await cleanInvalidTokens();
    const after = tokenStorage.size;
    res.json({
      success: true,
      message: "Token cleanup completed",
      removedCount: before - after,
      remainingCount: after,
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to clean tokens", details: error.message });
  }
});

app.post("/send/topic/:language", async (req, res) => {
  try {
    const { language } = req.params;
    const { messageType, customTitle, customBody, data } = req.body;
    if (!["en", "uz", "ru"].includes(language))
      return res
        .status(400)
        .json({ error: "Unsupported language. Use: en, uz, or ru" });
    const customMessage =
      customTitle && customBody
        ? { title: customTitle, body: customBody }
        : null;
    const topic = `all_users_${language}`;
    const result = await sendLocalizedNotificationToTopic(
      topic,
      language,
      messageType,
      customMessage,
      data
    );
    res.json({
      success: true,
      message: `Notification sent to all ${language.toUpperCase()} users`,
      topic,
      result,
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to send notification", details: error.message });
  }
});

app.post("/send/all-languages", async (req, res) => {
  try {
    const { messageType, customMessages, data } = req.body;
    const languages = ["en", "uz", "ru"];
    const results = [];
    for (const language of languages) {
      const topic = `all_users_${language}`;
      const customMessage =
        customMessages && customMessages[language]
          ? customMessages[language]
          : null;
      try {
        const result = await sendLocalizedNotificationToTopic(
          topic,
          language,
          messageType,
          customMessage,
          data
        );
        results.push({ language, topic, success: true, response: result });
      } catch (err) {
        results.push({ language, topic, success: false, error: err.message });
      }
    }
    await Notify.create(req.body);
    res.json({
      success: true,
      message: "Notifications sent to all languages",
      results,
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to send notifications", details: error.message });
  }
});

app.post("/send/device", async (req, res) => {
  try {
    const {
      deviceToken,
      language = "en",
      messageType,
      customTitle,
      customBody,
      data,
    } = req.body;
    if (!deviceToken)
      return res.status(400).json({ error: "Device token is required" });
    if (!["en", "uz", "ru"].includes(language))
      return res
        .status(400)
        .json({ error: "Unsupported language. Use: en, uz, or ru" });
    const customMessage =
      customTitle && customBody
        ? { title: customTitle, body: customBody }
        : null;
    const result = await sendNotificationToDevice(
      deviceToken,
      language,
      messageType,
      customMessage,
      data
    );
    res.json({ success: true, message: "Notification sent to device", result });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to send notification", details: error.message });
  }
});

app.post("/send/devices", async (req, res) => {
  try {
    const {
      deviceTokens,
      language = "en",
      messageType,
      customTitle,
      customBody,
      data,
    } = req.body;
    if (!deviceTokens || !Array.isArray(deviceTokens) || !deviceTokens.length)
      return res.status(400).json({ error: "Device tokens array is required" });
    if (!["en", "uz", "ru"].includes(language))
      return res
        .status(400)
        .json({ error: "Unsupported language. Use: en, uz, or ru" });
    const customMessage =
      customTitle && customBody
        ? { title: customTitle, body: customBody }
        : null;
    const result = await sendNotificationToMultipleDevices(
      deviceTokens,
      language,
      messageType,
      customMessage,
      data
    );
    res.json({
      success: true,
      message: `Notification sent to ${deviceTokens.length} devices`,
      result,
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to send notifications", details: error.message });
  }
});

// Legacy compatibility
app.post("/subscribe", async (req, res) => {
  try {
    const { deviceToken, language } = req.body;
    if (!deviceToken)
      return res.status(400).json({ error: "Device token is required" });
    if (!["en", "uz", "ru"].includes(language))
      return res
        .status(400)
        .json({ error: "Unsupported language. Use: en, uz, or ru" });
    const isValid = await validateFCMToken(deviceToken);
    tokenStorage.set(deviceToken, {
      language,
      registeredAt: Date.now(),
      lastUsed: Date.now(),
      isValid: isValid,
    });
    const topic = `all_users_${language}`;
    await admin.messaging().subscribeToTopic([deviceToken], topic);
    await admin.messaging().subscribeToTopic([deviceToken], "all_users");
    res.json({
      success: true,
      message: `Device subscribed to ${language.toUpperCase()} notifications`,
      topic,
      tokenValid: isValid,
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to subscribe device", details: error.message });
  }
});

app.post("/unsubscribe", async (req, res) => {
  try {
    const { deviceToken, language } = req.body;
    if (!deviceToken)
      return res.status(400).json({ error: "Device token is required" });
    if (!["en", "uz", "ru"].includes(language))
      return res
        .status(400)
        .json({ error: "Unsupported language. Use: en, uz, or ru" });
    const topic = `all_users_${language}`;
    await admin.messaging().unsubscribeFromTopic([deviceToken], topic);
    if (tokenStorage.has(deviceToken)) tokenStorage.delete(deviceToken);
    res.json({
      success: true,
      message: `Device unsubscribed from ${language.toUpperCase()} notifications`,
      topic,
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to unsubscribe device", details: error.message });
  }
});

app.get("/messages", (req, res) => {
  res.json({
    supportedLanguages: ["en", "uz", "ru"],
    messageTypes: ["body", "orderReady", "newPromotion", "welcomeMessage"],
    messages: notificationMessages,
  });
});

app.get("/stats", (req, res) => {
  const stats = {
    totalTokens: tokenStorage.size,
    validTokens: 0,
    invalidTokens: 0,
    languageBreakdown: { en: 0, uz: 0, ru: 0 },
    registeredToday: 0,
  };
  const today = new Date().toDateString();
  for (const tokenData of tokenStorage.values()) {
    if (tokenData.isValid === false) stats.invalidTokens++;
    else stats.validTokens++;
    if (
      tokenData.language &&
      stats.languageBreakdown[tokenData.language] !== undefined
    ) {
      stats.languageBreakdown[tokenData.language]++;
    }
    if (new Date(tokenData.registeredAt).toDateString() === today)
      stats.registeredToday++;
  }
  res.json({ success: true, stats, timestamp: new Date().toISOString() });
});

app.get("/posterClientGroup", async (req, res) => {
  try {
    const getClients = await axios.get(
      `https://joinposter.com/api/clients.getGroups?token=${process.env.PAST}`
    );
    res.send(getClients.data.response); // Send API response
  } catch (err) {
    res.send({ err });
    console.error(err);
    // Handle errors appropriately
  }
});

app.get("/posterClient/:id", async (req, res) => {
  try {
    const getClient = await axios.get(
      `https://joinposter.com/api/clients.getClient?token=${process.env.PAST}&client_id=${req.params.id}`
    );
    res.send(getClient.data); // Send API response
  } catch (err) {
    res.send({ err });
    console.error(err);
    // Handle errors appropriately
  }
});

app.post("/posterCreateClient", async (req, res) => {
  try {
    const postData = await axios.post(
      `https://joinposter.com/api/clients.createClient?token=${process.env.PAST}`,
      req.body
    );
    res.send(postData.data); // Send API response
  } catch (err) {
    console.error(err);
    // Handle errors appropriately
    res.send({ err });
  }
});

app.get("/getNews", async (req, res) => {
  const news = await Notify.find({});
  res.send(news);
});

app.post("/createNews", async (req, res) => {
  try {
    const { en, ru, uz, messageType, customMessages, data } = req.body;
    const languages = ["en", "ru", "uz"];
    const results = [];

    for (const language of languages) {
      const topic = `all_users_${language}`;
      const customMessage =
        (customMessages && customMessages[language]) || req.body[language] || null;

      try {
        const response = await sendLocalizedNotificationToTopic(
          topic,
          language,
          messageType,
          customMessage,
          data
        );
        results.push({ language, topic, success: true, response });
      } catch (err) {
        console.error(`Error sending to ${language}:`, err);
        results.push({ language, topic, success: false, error: err.message });
      }
    }

    // Persist news payload if provided (backward compatible)
    if (en || ru || uz) {
      await Notify.create({ en, ru, uz });
    }

    res.json({ success: true, message: "Notifications processed", results });
  } catch (error) {
    console.error("Error creating news:", error);
    res.status(500).send("Error creating notifications");
  }
});

app.get("/posterClients", async (req, res) => {
  try {
    const getClients = await axios.get(
      `https://joinposter.com/api/clients.getClients?token=${process.env.PAST}`
    );
    res.send(getClients.data.response); // Send API response
  } catch (err) {
    res.send({ err });
    console.error(err);
    // Handle errors appropriately
  }
});

app.get("/posterProducts", async (req, res) => {
  try {
    const getClients = await axios.get(
      `https://joinposter.com/api/menu.getProducts?token=${process.env.PAST}`
    );
    res.send(getClients.data.response); // Send API response
  } catch (err) {
    res.send({ err });
    console.error(err);
    // Handle errors appropriately
  }
});

app.get("/posterCategories", async (req, res) => {
  try {
    const getClients = await axios.get(
      `https://joinposter.com/api/menu.getCategories?token=${process.env.PAST}`
    );
    res.send(getClients.data.response); // Send API response
  } catch (err) {
    res.send({ err });
    console.error(err);
    // Handle errors appropriately
  }
});

app.delete("/deleteNews/:newsId", async (req, res) => {
  const { newsId } = req.params;
  const result = await Notify.deleteOne({ _id: newsId });
  res.send(result);
});

app.get("/getClientTransaction/:phone", async (req, res) => {
  const { phone } = req.params;
  const cnvNumber = convertPhoneNumber(phone);

  try {
    const response = await axios.get(
      `https://joinposter.com/api/clients.getClients?token=${process.env.PAST}&phone=${cnvNumber}`
    );

    if (!response.data.response) {
      return res.send({ error: "No client found." });
    }

    res.send(response.data.response[0]);
  } catch (error) {
    console.error("Error fetching client:", error);
    res.status(500).send({ error: "Internal Server Error" }); // Handle general errors
  }
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
          `${process.env.AURL}/get_order/${transaction.transaction_comment}`
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

app.get("/sendMessageToTelegram", async (req, res) => {
  const { message } = req.query;
  const url = `https://api.telegram.org/bot7051935328:AAFJxJAVsRTPxgj3rrHWty1pEUlMkBgg9_o/sendMessage?chat_id=-1002211902296&text=${encodeURIComponent(
    message
  )}`;
  try {
    const response = await axios.get(url);
    res.json(response.data);
  } catch (error) {
    console.error("Error sending message to Telegram:", error);
    res.status(500).json({ error: "Failed to send message" });
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

// Periodic cleanup of invalid/old tokens (every hour)
setInterval(cleanInvalidTokens, 60 * 60 * 1000);

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
