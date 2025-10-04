// new code
const express = require('express');
const admin = require('firebase-admin');
const path = require('path');

const { GoogleAuth } = require('google-auth-library'); // You'd need to install this package

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// In-memory token storage (use database in production)
const tokenStorage = new Map(); // Map<token, {language, userId?, lastUsed, isValid}>


async function getAccessToken() {
    // Replace '/path/to/serviceAccountKey.json' with the actual path to your downloaded file
    const serviceAccountPath = "./adminsdk.json"; // Ensure this path is correct
    const scopes = ['https://www.googleapis.com/auth/cloud-platform']; // A broad scope that generally works for Firebase services

    const auth = new GoogleAuth({
        keyFile: serviceAccountPath,
        scopes: scopes,
    });

    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();
    return accessToken.token;
}

// How to use it:
getAccessToken().then(token => {
    console.log('Your access token:', token);
}).catch(err => {
    console.error('Error getting access token:', err);
});

// Initialize Firebase Admin SDK
try {
  const serviceAccount = require(path.resolve(__dirname, 'adminsdk.json'));
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  
  console.log('✅ Firebase Admin SDK initialized successfully');
} catch (error) {
  console.error('❌ Error initializing Firebase Admin SDK:', error);
  process.exit(1);
}

// Notification messages in different languages
const notificationMessages = {
  en: {
    title: "Rolling Sushi",
    body: "Your order is ready for pickup!",
    orderReady: "Order Ready",
    newPromotion: "New Promotion Available!",
    welcomeMessage: "Welcome to Rolling Sushi!"
  },
  uz: {
    title: "Rolling Sushi",
    body: "Buyurtmangiz tayyor!",
    orderReady: "Buyurtma Tayyor",
    newPromotion: "Yangi chegirma mavjud!",
    welcomeMessage: "Rolling Sushi'ga xush kelibsiz!"
  },
  ru: {
    title: "Rolling Sushi",
    body: "Ваш заказ готов к выдаче!",
    orderReady: "Заказ Готов",
    newPromotion: "Доступна новая акция!",
    welcomeMessage: "Добро пожаловать в Rolling Sushi!"
  }
};

// Helper function to validate FCM token
async function validateFCMToken(token) {
  try {
    // Test the token by creating a dry-run message
    await admin.messaging().send({
      token: token,
      notification: {
        title: 'Test',
        body: 'Test'
      }
    }, true); // dry-run mode
    return true;
  } catch (error) {
    console.log(`❌ Token validation failed: ${error.code}`);
    return false;
  }
}

// Helper function to clean invalid tokens
async function cleanInvalidTokens() {
  const tokensToRemove = [];
  
  for (const [token, data] of tokenStorage) {
    if (!data.isValid || (Date.now() - data.lastUsed) > 30 * 24 * 60 * 60 * 1000) { // 30 days
      tokensToRemove.push(token);
    }
  }
  
  tokensToRemove.forEach(token => {
    tokenStorage.delete(token);
    console.log(`🧹 Cleaned invalid/old token: ${token.substring(0, 20)}...`);
  });
}

// In your Node.js server, test direct send:
app.post('/test-direct', async (req, res) => {
  const token = req.body.token; // Your token from logs
  
  try {
    const message = {
      token: token,
      notification: {
        title: 'Test Direct',
        body: 'This is a direct test message'
      },
      data: {
        messageType: 'test',
        timestamp: new Date().toISOString()
      },
      apns: {
        payload: {
          aps: {
            'content-available': 1,
            sound: 'default',
            alert: {
              title: 'Test Direct',
              body: 'This is a direct test message'
            }
          }
        }
      }
    };
    
    const response = await admin.messaging().send(message);
    console.log('Direct message sent:', response);
    res.json({ success: true, response });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

function getNotificationContent(language, messageType = 'body') {
  const supportedLanguages = ['en', 'uz', 'ru'];
  const lang = supportedLanguages.includes(language) ? language : 'en';
  
  return {
    title: notificationMessages[lang].title,
    body: notificationMessages[lang][messageType] || notificationMessages[lang].body
  };
}

async function sendNotificationToTopic(topic, language, messageType, customMessage, data = {}) {
  try {
    const content = customMessage || getNotificationContent(language, messageType);
    
    const payload = {
      topic: topic,
      notification: {
        title: content.title,
        body: content.body,
      },
      data: {
        language: language,
        messageType: messageType || 'general',
        timestamp: new Date().toISOString(),
        ...data
      },
      android: {
        notification: {
          icon: 'ic_notification',
          color: '#004032',
          sound: 'default',
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1
          }
        }
      }
    };

    const response = await admin.messaging().send(payload);
    console.log('✅ Notification sent successfully to topic:', topic, response);
    return { success: true, response };
  } catch (error) {
    console.error('❌ Error sending notification to topic:', error);
    throw error;
  }
}

// Enhanced function to send notification to specific device
async function sendNotificationToDevice(deviceToken, language, messageType, customMessage, data = {}) {
  try {
    // Check if token exists in our storage and is valid
    const tokenData = tokenStorage.get(deviceToken);
    if (tokenData && !tokenData.isValid) {
      throw new Error('Token is marked as invalid');
    }

    const content = customMessage || getNotificationContent(language, messageType);
    
    const payload = {
      token: deviceToken,
      notification: {
        title: content.title,
        body: content.body,
      },
      data: {
        language: language,
        messageType: messageType || 'general',
        timestamp: new Date().toISOString(),
        ...data
      },
      android: {
        notification: {
          icon: 'ic_notification',
          color: '#004032',
          sound: 'default',
          channelId: messageType === 'orderReady' ? 'high_importance_channel' : 'general_channel'
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1
          }
        }
      }
    };

    const response = await admin.messaging().send(payload);
    
    // Update token as valid and recently used
    if (tokenStorage.has(deviceToken)) {
      const tokenData = tokenStorage.get(deviceToken);
      tokenStorage.set(deviceToken, {
        ...tokenData,
        isValid: true,
        lastUsed: Date.now()
      });
    }

    console.log('✅ Notification sent successfully to device:', response);
    return { success: true, response };
  } catch (error) {
    console.error('❌ Error sending notification to device:', error);
    
    // Handle invalid tokens
    if (error.code === 'messaging/registration-token-not-registered' || 
        error.code === 'messaging/invalid-registration-token') {
      
      // Mark token as invalid
      if (tokenStorage.has(deviceToken)) {
        const tokenData = tokenStorage.get(deviceToken);
        tokenStorage.set(deviceToken, {
          ...tokenData,
          isValid: false
        });
      }
      
      console.log(`🗑️ Marked token as invalid: ${deviceToken.substring(0, 20)}...`);
    }
    
    throw error;
  }
}

// Enhanced function to send notification to multiple devices
async function sendNotificationToMultipleDevices(deviceTokens, language, messageType, customMessage, data = {}) {
  try {
    // Filter out invalid tokens
    const validTokens = deviceTokens.filter(token => {
      const tokenData = tokenStorage.get(token);
      return !tokenData || tokenData.isValid !== false;
    });

    if (validTokens.length === 0) {
      throw new Error('No valid tokens provided');
    }

    const content = customMessage || getNotificationContent(language, messageType);
    
    const payload = {
      tokens: validTokens,
      notification: {
        title: content.title,
        body: content.body,
      },
      data: {
        language: language,
        messageType: messageType || 'general',
        timestamp: new Date().toISOString(),
        ...data
      },
      android: {
        notification: {
          icon: 'ic_notification',
          color: '#004032',
          sound: 'default',
          channelId: messageType === 'orderReady' ? 'high_importance_channel' : 'general_channel'
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1
          }
        }
      }
    };

    const response = await admin.messaging().sendMulticast(payload);
    
    // Update successful tokens
    response.responses.forEach((resp, index) => {
      const token = validTokens[index];
      if (resp.success && tokenStorage.has(token)) {
        const tokenData = tokenStorage.get(token);
        tokenStorage.set(token, {
          ...tokenData,
          isValid: true,
          lastUsed: Date.now()
        });
      } else if (!resp.success && tokenStorage.has(token)) {
        // Mark failed tokens as potentially invalid
        const tokenData = tokenStorage.get(token);
        if (resp.error?.code === 'messaging/registration-token-not-registered' || 
            resp.error?.code === 'messaging/invalid-registration-token') {
          tokenStorage.set(token, {
            ...tokenData,
            isValid: false
          });
        }
      }
    });

    console.log('✅ Notifications sent to multiple devices:', response);
    return { success: true, response };
  } catch (error) {
    console.error('❌ Error sending notifications to multiple devices:', error);
    throw error;
  }
}

app.get("/getfirebase", (req, res) => {

getAccessToken().then(token => {

    console.log('Your access token:', token);
    res.send(token);
}).catch(err => {
    console.error('Error getting access token:', err);
});
})

app.get("/tokens-get", (req, res) => {
    res.send(Array.from(tokenStorage.entries()));
})

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    supportedLanguages: ['en', 'uz', 'ru'],
    totalTokens: tokenStorage.size,
    validTokens: Array.from(tokenStorage.values()).filter(t => t.isValid !== false).length
  });
});

// Register/update FCM token
app.post('/tokens/register', async (req, res) => {
  try {
    const { deviceToken, language = 'en', userId } = req.body;
    
    if (!deviceToken) {
      return res.status(400).json({
        error: 'Device token is required'
      });
    }
    
    if (!['en', 'uz', 'ru'].includes(language)) {
      return res.status(400).json({
        error: 'Unsupported language. Use: en, uz, or ru'
      });
    }

    // Validate the token
    const isValid = await validateFCMToken(deviceToken);
    
    // Store token information
    const tokenData = {
      language: language,
      userId: userId || null,
      registeredAt: Date.now(),
      lastUsed: Date.now(),
      isValid: isValid
    };
    
    tokenStorage.set(deviceToken, tokenData);
    
    // Subscribe to appropriate topics
    const topic = `all_users_${language}`;
    try {
      await admin.messaging().subscribeToTopic([deviceToken], topic);
      await admin.messaging().subscribeToTopic([deviceToken], 'all_users');
      console.log(`✅ Token subscribed to topics: all_users, ${topic}`);
    } catch (subscriptionError) {
      console.error('❌ Error subscribing to topics:', subscriptionError);
    }
    
    res.json({
      success: true,
      message: 'Token registered successfully',
      tokenValid: isValid,
      language: language,
      subscribedTopics: ['all_users', topic]
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to register token',
      details: error.message
    });
  }
});

// Update token language
app.put('/tokens/language', async (req, res) => {
  try {
    const { deviceToken, newLanguage } = req.body;
    
    if (!deviceToken || !newLanguage) {
      return res.status(400).json({
        error: 'Device token and new language are required'
      });
    }
    
    if (!['en', 'uz', 'ru'].includes(newLanguage)) {
      return res.status(400).json({
        error: 'Unsupported language. Use: en, uz, or ru'
      });
    }
    
    const tokenData = tokenStorage.get(deviceToken);
    if (!tokenData) {
      return res.status(404).json({
        error: 'Token not found. Please register first.'
      });
    }
    
    const oldLanguage = tokenData.language;
    
    // Unsubscribe from old language topic
    try {
      await admin.messaging().unsubscribeFromTopic([deviceToken], `all_users_${oldLanguage}`);
      await admin.messaging().subscribeToTopic([deviceToken], `all_users_${newLanguage}`);
    } catch (subscriptionError) {
      console.error('❌ Error updating topic subscriptions:', subscriptionError);
    }
    
    // Update token data
    tokenStorage.set(deviceToken, {
      ...tokenData,
      language: newLanguage,
      lastUsed: Date.now()
    });
    
    res.json({
      success: true,
      message: 'Language updated successfully',
      oldLanguage: oldLanguage,
      newLanguage: newLanguage
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to update language',
      details: error.message
    });
  }
});

// Remove/unregister token
app.delete('/tokens/unregister', async (req, res) => {
  try {
    const { deviceToken } = req.body;
    
    if (!deviceToken) {
      return res.status(400).json({
        error: 'Device token is required'
      });
    }
    
    const tokenData = tokenStorage.get(deviceToken);
    if (tokenData) {
      // Unsubscribe from all topics
      try {
        await admin.messaging().unsubscribeFromTopic([deviceToken], 'all_users');
        await admin.messaging().unsubscribeFromTopic([deviceToken], `all_users_${tokenData.language}`);
      } catch (unsubscribeError) {
        console.error('❌ Error unsubscribing from topics:', unsubscribeError);
      }
      
      // Remove from storage
      tokenStorage.delete(deviceToken);
    }
    
    res.json({
      success: true,
      message: 'Token unregistered successfully'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to unregister token',
      details: error.message
    });
  }
});

// Get token info
app.get('/tokens/:token', (req, res) => {
  try {
    const { token } = req.params;
    const tokenData = tokenStorage.get(token);
    
    if (!tokenData) {
      return res.status(404).json({
        error: 'Token not found'
      });
    }
    
    res.json({
      success: true,
      tokenData: {
        ...tokenData,
        registeredAt: new Date(tokenData.registeredAt).toISOString(),
        lastUsed: new Date(tokenData.lastUsed).toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get token info',
      details: error.message
    });
  }
});

// Clean invalid tokens (admin endpoint)
app.post('/admin/clean-tokens', async (req, res) => {
  try {
    const beforeCount = tokenStorage.size;
    await cleanInvalidTokens();
    const afterCount = tokenStorage.size;
    
    res.json({
      success: true,
      message: 'Token cleanup completed',
      removedCount: beforeCount - afterCount,
      remainingCount: afterCount
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to clean tokens',
      details: error.message
    });
  }
});

// Send notification to topic (enhanced)
app.post('/send/topic/:language', async (req, res) => {
  try {
    const { language } = req.params;
    const { messageType, customTitle, customBody, data } = req.body;
    
    if (!['en', 'uz', 'ru'].includes(language)) {
      return res.status(400).json({
        error: 'Unsupported language. Use: en, uz, or ru'
      });
    }
    
    const topic = `all_users_${language}`;
    const customMessage = customTitle && customBody ? 
      { title: customTitle, body: customBody } : null;
    
    const result = await sendNotificationToTopic(topic, language, messageType, customMessage, data);
    
    res.json({
      success: true,
      message: `Notification sent to all ${language.toUpperCase()} users`,
      topic: topic,
      result: result.response
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to send notification',
      details: error.message
    });
  }
});

// Send notification to all languages (enhanced)
app.post('/send/all-languages', async (req, res) => {
  try {
    const { messageType, customMessages, data } = req.body;
    const languages = ['en', 'uz', 'ru'];
    const results = [];
    
    for (const language of languages) {
      const topic = `all_users_${language}`;
      const customMessage = customMessages && customMessages[language] ? 
        customMessages[language] : null;
      
      try {
        const result = await sendNotificationToTopic(topic, language, messageType, customMessage, data);
        results.push({ language, topic, success: true, response: result.response });
      } catch (error) {
        results.push({ language, topic, success: false, error: error.message });
      }
    }
    
    res.json({
      success: true,
      message: 'Notifications sent to all languages',
      results
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to send notifications',
      details: error.message
    });
  }
});

// Send notification to specific device (enhanced)
app.post('/send/device', async (req, res) => {
  try {
    const { deviceToken, language = 'en', messageType, customTitle, customBody, data } = req.body;
    
    if (!deviceToken) {
      return res.status(400).json({
        error: 'Device token is required'
      });
    }
    
    if (!['en', 'uz', 'ru'].includes(language)) {
      return res.status(400).json({
        error: 'Unsupported language. Use: en, uz, or ru'
      });
    }
    
    const customMessage = customTitle && customBody ? 
      { title: customTitle, body: customBody } : null;
    
    const result = await sendNotificationToDevice(deviceToken, language, messageType, customMessage, data);
    
    res.json({
      success: true,
      message: 'Notification sent to device',
      result: result.response
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to send notification',
      details: error.message
    });
  }
});

// Send notification to multiple devices (enhanced)
app.post('/send/devices', async (req, res) => {
  try {
    const { deviceTokens, language = 'en', messageType, customTitle, customBody, data } = req.body;
    
    if (!deviceTokens || !Array.isArray(deviceTokens) || deviceTokens.length === 0) {
      return res.status(400).json({
        error: 'Device tokens array is required'
      });
    }
    
    if (!['en', 'uz', 'ru'].includes(language)) {
      return res.status(400).json({
        error: 'Unsupported language. Use: en, uz, or ru'
      });
    }
    
    const customMessage = customTitle && customBody ? 
      { title: customTitle, body: customBody } : null;
    
    const result = await sendNotificationToMultipleDevices(deviceTokens, language, messageType, customMessage, data);
    
    res.json({
      success: true,
      message: `Notification sent to ${deviceTokens.length} devices`,
      successCount: result.response.successCount,
      failureCount: result.response.failureCount,
      result: result.response
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to send notifications',
      details: error.message
    });
  }
});

// Legacy subscribe endpoint (kept for backward compatibility)
app.post('/subscribe', async (req, res) => {
  try {
    const { deviceToken, language } = req.body;
    
    if (!deviceToken) {
      return res.status(400).json({
        error: 'Device token is required'
      });
    }
    
    if (!['en', 'uz', 'ru'].includes(language)) {
      return res.status(400).json({
        error: 'Unsupported language. Use: en, uz, or ru'
      });
    }
    
    // Register the token using the new system
    const isValid = await validateFCMToken(deviceToken);
    
    const tokenData = {
      language: language,
      registeredAt: Date.now(),
      lastUsed: Date.now(),
      isValid: isValid
    };
    
    tokenStorage.set(deviceToken, tokenData);
    
    const topic = `all_users_${language}`;
    const subsTopic = await admin.messaging().subscribeToTopic([deviceToken], topic);
    const subsTopicAll = await admin.messaging().subscribeToTopic([deviceToken], 'all_users');
    
    console.log(subsTopic)
    console.log(subsTopicAll, "all")
    res.json({
      success: true,
      message: `Device subscribed to ${language.toUpperCase()} notifications`,
      topic: topic,
      tokenValid: isValid
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to subscribe device',
      details: error.message
    });
  }
});

// Legacy unsubscribe endpoint
app.post('/unsubscribe', async (req, res) => {
  try {
    const { deviceToken, language } = req.body;
    
    if (!deviceToken) {
      return res.status(400).json({
        error: 'Device token is required'
      });
    }
    
    if (!['en', 'uz', 'ru'].includes(language)) {
      return res.status(400).json({
        error: 'Unsupported language. Use: en, uz, or ru'
      });
    }
    
    const topic = `all_users_${language}`;
    await admin.messaging().unsubscribeFromTopic([deviceToken], topic);
    
    // Remove from storage if exists
    if (tokenStorage.has(deviceToken)) {
      tokenStorage.delete(deviceToken);
    }
    
    res.json({
      success: true,
      message: `Device unsubscribed from ${language.toUpperCase()} notifications`,
      topic: topic
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to unsubscribe device',
      details: error.message
    });
  }
});

// Get supported messages and languages
app.get('/messages', (req, res) => {
  res.json({
    supportedLanguages: ['en', 'uz', 'ru'],
    messageTypes: ['body', 'orderReady', 'newPromotion', 'welcomeMessage'],
    messages: notificationMessages
  });
});

// Get statistics
app.get('/stats', (req, res) => {
  const stats = {
    totalTokens: tokenStorage.size,
    validTokens: 0,
    invalidTokens: 0,
    languageBreakdown: { en: 0, uz: 0, ru: 0 },
    registeredToday: 0
  };
  
  const today = new Date().toDateString();
  
  for (const tokenData of tokenStorage.values()) {
    if (tokenData.isValid === false) {
      stats.invalidTokens++;
    } else {
      stats.validTokens++;
    }
    
    if (tokenData.language && stats.languageBreakdown[tokenData.language] !== undefined) {
      stats.languageBreakdown[tokenData.language]++;
    }
    
    if (new Date(tokenData.registeredAt).toDateString() === today) {
      stats.registeredToday++;
    }
  }
  
  res.json({
    success: true,
    stats: stats,
    timestamp: new Date().toISOString()
  });
});

// Periodic cleanup (run every hour)
setInterval(cleanInvalidTokens, 60 * 60 * 1000);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    details: err.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    availableRoutes: [
      'GET /health',
      'GET /messages',
      'GET /stats',
      'POST /tokens/register',
      'PUT /tokens/language',
      'DELETE /tokens/unregister',
      'GET /tokens/:token',
      'POST /admin/clean-tokens',
      'POST /send/topic/:language',
      'POST /send/all-languages',
      'POST /send/device',
      'POST /send/devices',
      'POST /subscribe (legacy)',
      'POST /unsubscribe (legacy)'
    ]
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Firebase Push Notification Service Ready`);
  console.log(`🌍 Supporting languages: en, uz, ru`);
  console.log(`💾 Token storage initialized`);
});

module.exports = app;