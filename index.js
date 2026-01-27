const { Client, LocalAuth, MessageMedia } = require("whatsapp-web.js");
const express = require("express");
const cors = require("cors");
const QRCode = require("qrcode");
const path = require("path");

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Store multiple WhatsApp clients
const clients = {};
const defaultClientId = "default";

/**
 * Creates a new WhatsApp client instance
 * @param {string} clientId - Unique identifier for the client
 * @returns {object} Client data object with client instance and QR data
 */
function createWhatsAppClient(clientId) {
  console.log(
    `[${new Date().toISOString()}] Creating WhatsApp client: ${clientId}`,
  );

  const client = new Client({
    authStrategy: new LocalAuth({
      clientId: clientId,
      dataPath: path.join(__dirname, ".wwebjs_auth"),
    }),
    puppeteer: {
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--disable-gpu",
        "--disable-blink-features=AutomationControlled", // Hide automation
        "--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      ],
      executablePath: process.env.CHROME_PATH || undefined,
    },
    webVersionCache: {
      type: "remote",
      remotePath:
        "https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html",
    },
  });

  const clientData = {
    client: client,
    qrCode: null,
    isReady: false,
    isAuthenticated: false,
    lastQRTimestamp: null,
  };

  // QR Code event
  client.on("qr", (qr) => {
    console.log(
      `[${new Date().toISOString()}] QR Code received for ${clientId}`,
    );
    clientData.qrCode = qr;
    clientData.lastQRTimestamp = Date.now();
  });

  // Ready event
  client.on("ready", () => {
    console.log(`[${new Date().toISOString()}] Client ${clientId} is ready!`);
    clientData.isReady = true;
    clientData.qrCode = null;
  });

  // Authenticated event
  client.on("authenticated", () => {
    console.log(
      `[${new Date().toISOString()}] Client ${clientId} authenticated`,
    );
    clientData.isAuthenticated = true;
    clientData.qrCode = null;
  });

  // Authentication failure event
  client.on("auth_failure", (msg) => {
    console.error(
      `[${new Date().toISOString()}] Auth failure for ${clientId}:`,
      msg,
    );
    clientData.isAuthenticated = false;
  });

  // Disconnected event
  client.on("disconnected", (reason) => {
    console.log(
      `[${new Date().toISOString()}] Client ${clientId} disconnected: ${reason}`,
    );
    clientData.isReady = false;
    clientData.isAuthenticated = false;
  });

  // Error event
  client.on("error", (error) => {
    console.error(
      `[${new Date().toISOString()}] Client ${clientId} error:`,
      error,
    );
  });

  return clientData;
}

/**
 * Initialize a client with retry logic
 * @param {string} clientId - Client identifier
 * @param {number} maxRetries - Maximum retry attempts
 */
async function initializeClient(clientId, maxRetries = 3) {
  let retries = 0;

  while (retries < maxRetries) {
    try {
      console.log(
        `[${new Date().toISOString()}] Initializing client ${clientId} (attempt ${
          retries + 1
        }/${maxRetries})`,
      );
      await clients[clientId].client.initialize();
      return true;
    } catch (error) {
      retries++;
      console.error(
        `[${new Date().toISOString()}] Failed to initialize ${clientId} (attempt ${retries}):`,
        error.message,
      );

      if (retries < maxRetries) {
        const delay = retries * 5000; // Exponential backoff
        console.log(`[${new Date().toISOString()}] Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  console.error(
    `[${new Date().toISOString()}] Failed to initialize ${clientId} after ${maxRetries} attempts`,
  );
  return false;
}

// Initialize default client on startup
(async () => {
  clients[defaultClientId] = createWhatsAppClient(defaultClientId);
  await initializeClient(defaultClientId);
})();

/**
 * HOME PAGE - API Documentation
 */
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "WhatsApp API Server is running",
    version: "1.0.0",
    endpoints: {
      status: "/status",
      qr: "/qr",
    },
  });
});

/**
 * CREATE CLIENT - Create a new WhatsApp client
 */
app.post("/create-client", async (req, res) => {
  try {
    const { clientId } = req.body;

    if (!clientId || typeof clientId !== "string") {
      return res.status(400).json({
        success: false,
        error: "Valid clientId is required",
      });
    }

    if (clients[clientId]) {
      return res.status(400).json({
        success: false,
        error: "Client ID already exists",
      });
    }

    clients[clientId] = createWhatsAppClient(clientId);
    const initialized = await initializeClient(clientId);

    if (!initialized) {
      delete clients[clientId];
      return res.status(500).json({
        success: false,
        error: "Failed to initialize WhatsApp client",
      });
    }

    res.json({
      success: true,
      message: `Client ${clientId} created successfully`,
      clientId: clientId,
    });
  } catch (error) {
    console.error("Create client error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * QR CODE - Display QR code for authentication
 */
app.get("/qr", async (req, res) => {
  const clientId = req.query.clientId || defaultClientId;
  const forceRefresh = req.query.refresh === "true";

  if (!clients[clientId]) {
    return res.status(404).send(`
      <h2>Client Not Found</h2>
      <p>Client "${clientId}" does not exist.</p>
      <a href="/">Back to Home</a>
    `);
  }

  const clientData = clients[clientId];

  // Force refresh if requested
  if (forceRefresh) {
    try {
      await clientData.client.destroy();
      delete clients[clientId];

      clients[clientId] = createWhatsAppClient(clientId);
      await initializeClient(clientId);

      // Wait for QR code to be generated
      await new Promise((resolve) => setTimeout(resolve, 3000));

      return res.redirect(`/qr?clientId=${clientId}`);
    } catch (error) {
      console.error("Refresh error:", error);
    }
  }

  // Client is ready
  if (clientData.isReady && clientData.client.info) {
    return res.send(`
      <h2>✓ Client Connected</h2>
      <p>Client ID: <strong>${clientId}</strong></p>
      <p>User: <strong>${clientData.client.info.pushname}</strong></p>
      <p>Phone: <strong>${clientData.client.info.wid.user}</strong></p>
      <hr>
      <a href="/logout?clientId=${clientId}">Logout</a> | 
      <a href="/">Back to Home</a>
    `);
  }

  // QR code available
  if (clientData.qrCode) {
    QRCode.toDataURL(clientData.qrCode, (err, url) => {
      if (err) {
        return res.status(500).send(`
          <h2>QR Code Error</h2>
          <p>${err.message}</p>
          <a href="/qr?clientId=${clientId}&refresh=true">Try Again</a>
        `);
      }

      res.send(`
        <h2>Scan QR Code</h2>
        <p>Client ID: <strong>${clientId}</strong></p>
        <img src="${url}" alt="QR Code" style="width: 300px; height: 300px;">
        <p>Generated: ${new Date(
          clientData.lastQRTimestamp,
        ).toLocaleString()}</p>
        <p><a href="/qr?clientId=${clientId}">Refresh</a> | <a href="/qr?clientId=${clientId}&refresh=true">Force New QR</a></p>
        <script>setTimeout(() => location.reload(), 30000);</script>
      `);
    });
    return;
  }

  // Waiting for QR code
  res.send(`
    <h2>Initializing...</h2>
    <p>Client ID: <strong>${clientId}</strong></p>
    <p>Waiting for QR code to be generated...</p>
    <script>setTimeout(() => location.reload(), 3000);</script>
  `);
});

/**
 * SEND MESSAGE - Send text/PDF message to a number
 */
app.post("/send-message", async (req, res) => {
  try {
    const { number, message, pdfUrl, clientId = defaultClientId } = req.body;

    if (!number) {
      return res.status(400).json({
        success: false,
        error: "Phone number is required",
      });
    }

    if (!message && !pdfUrl) {
      return res.status(400).json({
        success: false,
        error: "Either message or pdfUrl is required",
      });
    }

    if (!clients[clientId]) {
      return res.status(404).json({
        success: false,
        error: `Client ${clientId} not found`,
      });
    }

    const clientData = clients[clientId];

    if (!clientData.isReady) {
      return res.status(503).json({
        success: false,
        error: "WhatsApp client not ready",
        message: `Please scan QR code at /qr?clientId=${clientId}`,
      });
    }

    const chatId = number.includes("@c.us") ? number : `${number}@c.us`;

    if (pdfUrl) {
      const media = await MessageMedia.fromUrl(pdfUrl, { unsafeMime: true });
      await clientData.client.sendMessage(chatId, media, {
        caption: message || "",
        sendSeen: false, // Add this option
      });
    } else {
      await clientData.client.sendMessage(chatId, message, {
        sendSeen: false, // Add this option
      });
    }

    res.json({
      success: true,
      message: "Message sent successfully",
      to: number,
      clientId: clientId,
    });
  } catch (error) {
    console.error("Send message error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * BROADCAST - Send message to multiple numbers
 */
app.post("/broadcast", async (req, res) => {
  try {
    const {
      numbers,
      message,
      pdfUrl,
      clientId = defaultClientId,
      delayMs = 2000,
    } = req.body;

    if (!numbers || !Array.isArray(numbers) || numbers.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Valid array of phone numbers is required",
      });
    }

    if (!message && !pdfUrl) {
      return res.status(400).json({
        success: false,
        error: "Either message or pdfUrl is required",
      });
    }

    if (!clients[clientId]) {
      return res.status(404).json({
        success: false,
        error: `Client ${clientId} not found`,
      });
    }

    const clientData = clients[clientId];

    if (!clientData.isReady) {
      return res.status(503).json({
        success: false,
        error: "WhatsApp client not ready",
      });
    }

    const results = [];
    let media = null;

    if (pdfUrl) {
      media = await MessageMedia.fromUrl(pdfUrl, { unsafeMime: true });
    }

    for (let i = 0; i < numbers.length; i++) {
      const number = numbers[i];

      try {
        const chatId = number.includes("@c.us") ? number : `${number}@c.us`;

        if (media) {
          await clientData.client.sendMessage(chatId, media, {
            caption: message || "",
          });
        } else {
          await clientData.client.sendMessage(chatId, message);
        }

        results.push({ number, success: true });
        console.log(`Message sent to ${number} (${i + 1}/${numbers.length})`);

        // Delay between messages
        if (i < numbers.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      } catch (error) {
        console.error(`Failed to send to ${number}:`, error.message);
        results.push({ number, success: false, error: error.message });
      }
    }

    const successCount = results.filter((r) => r.success).length;

    res.json({
      success: true,
      message: `Sent to ${successCount}/${numbers.length} recipients`,
      results: results,
    });
  } catch (error) {
    console.error("Broadcast error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * SEND IMAGE - Send image with caption
 */
app.post("/send-image", async (req, res) => {
  try {
    const { number, imageUrl, caption, clientId = defaultClientId } = req.body;

    if (!number || !imageUrl) {
      return res.status(400).json({
        success: false,
        error: "Phone number and imageUrl are required",
      });
    }

    if (!clients[clientId]) {
      return res.status(404).json({
        success: false,
        error: `Client ${clientId} not found`,
      });
    }

    const clientData = clients[clientId];

    if (!clientData.isReady) {
      return res.status(503).json({
        success: false,
        error: "WhatsApp client not ready",
      });
    }

    const chatId = number.includes("@c.us") ? number : `${number}@c.us`;
    const media = await MessageMedia.fromUrl(imageUrl);

    await clientData.client.sendMessage(chatId, media, {
      caption: caption || "",
    });

    res.json({
      success: true,
      message: "Image sent successfully",
      to: number,
    });
  } catch (error) {
    console.error("Send image error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * STATUS - Get client connection status
 */
app.get("/status", async (req, res) => {
  const clientId = req.query.clientId || defaultClientId;

  if (!clients[clientId]) {
    return res.status(404).json({
      success: false,
      error: `Client ${clientId} not found`,
    });
  }

  const clientData = clients[clientId];

  try {
    const state = await clientData.client.getState();

    res.json({
      success: true,
      clientId: clientId,
      connected: clientData.isReady,
      authenticated: clientData.isAuthenticated,
      state: state,
      info:
        clientData.isReady && clientData.client.info
          ? {
              name: clientData.client.info.pushname,
              phone: clientData.client.info.wid.user,
              platform: clientData.client.info.platform,
            }
          : null,
    });
  } catch (error) {
    res.json({
      success: false,
      clientId: clientId,
      connected: false,
      error: error.message,
    });
  }
});

/**
 * LOGOUT - Logout and reset client
 */
app.post("/logout", async (req, res) => {
  const clientId = req.query.clientId || defaultClientId;

  if (!clients[clientId]) {
    return res.status(404).json({
      success: false,
      error: `Client ${clientId} not found`,
    });
  }

  try {
    await clients[clientId].client.logout();
    await clients[clientId].client.destroy();

    // Recreate client
    clients[clientId] = createWhatsAppClient(clientId);
    await initializeClient(clientId);

    res.json({
      success: true,
      message: `Client ${clientId} logged out successfully`,
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * RECONNECT - Force reconnect client
 */
app.post("/reconnect", async (req, res) => {
  const clientId = req.query.clientId || defaultClientId;

  if (!clients[clientId]) {
    return res.status(404).json({
      success: false,
      error: `Client ${clientId} not found`,
    });
  }

  try {
    await clients[clientId].client.destroy();

    clients[clientId] = createWhatsAppClient(clientId);
    await initializeClient(clientId);

    res.json({
      success: true,
      message: `Client ${clientId} reconnecting. Scan QR at /qr?clientId=${clientId}`,
    });
  } catch (error) {
    console.error("Reconnect error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * DELETE CLIENT - Remove a client instance
 */
app.delete("/delete-client/:clientId", async (req, res) => {
  const { clientId } = req.params;

  if (clientId === defaultClientId) {
    return res.status(400).json({
      success: false,
      error: "Cannot delete default client",
    });
  }

  if (!clients[clientId]) {
    return res.status(404).json({
      success: false,
      error: `Client ${clientId} not found`,
    });
  }

  try {
    await clients[clientId].client.destroy();
    delete clients[clientId];

    res.json({
      success: true,
      message: `Client ${clientId} deleted successfully`,
    });
  } catch (error) {
    console.error("Delete client error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Start Express server
 */
app.listen(port, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   WhatsApp API Server - Running on port ${port}             ║
║                                                            ║
║   � Scan QR at http://localhost:${port}/qr                 ║
║   📄 API Documentation: See API_DOCS.md                    ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\nShutting down gracefully...");

  for (const clientId in clients) {
    try {
      await clients[clientId].client.destroy();
      console.log(`Client ${clientId} destroyed`);
    } catch (error) {
      console.error(`Error destroying client ${clientId}:`, error.message);
    }
  }

  process.exit(0);
});
