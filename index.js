const { Client, LocalAuth, MessageMedia } = require("whatsapp-web.js");
const express = require("express");
const cors = require("cors");
const QRCode = require("qrcode");

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Add after your imports
let latestQR = null;

// WhatsApp client setup
const client = new Client({
  authStrategy: new LocalAuth(),
});

client.on("qr", (qr) => {
  latestQR = qr; // Save the QR code string
  console.log("Scan this QR code with your WhatsApp app:");
  console.log(qr);
});

client.on("ready", () => {
  console.log("WhatsApp client is ready!");
  latestQR = null; // Clear QR when ready
});

client.initialize();

app.get("/qr", async (req, res) => {
  if (!latestQR) {
    return res.send("WhatsApp is already connected or QR not generated yet.");
  }
  res.setHeader("Content-Type", "text/html");
  const qrImage = await QRCode.toDataURL(latestQR);
  res.send(`<h2>Scan this QR with WhatsApp</h2><img src="${qrImage}" />`);
});

// API endpoint to send a message
app.post("/send-message", async (req, res) => {
  const { number, message, pdfUrl } = req.body;

  if (!number || (!message && !pdfUrl)) {
    return res
      .status(400)
      .json({ error: "number and message or pdfUrl are required" });
  }

  if (!client || !client.info) {
    return res.status(503).json({
      error: "WhatsApp client not connected",
      message: "Please connect WhatsApp first using the QR code",
    });
  }

  try {
    const chatId = number.includes("@c.us") ? number : `${number}@c.us`;
    if (pdfUrl) {
      const media = await MessageMedia.fromUrl(pdfUrl, { unsafeMime: true });
      await client.sendMessage(chatId, media, { caption: message || "" });
    } else {
      await client.sendMessage(chatId, message);
    }
    res.json({ success: true });
  } catch (err) {
    console.error("Send message error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Check connection status
app.get("/status", (req, res) => {
  res.json({
    connected: client.info ? true : false,
    info: client.info || null,
  });
});

// Logout from WhatsApp
app.post("/logout", async (req, res) => {
  try {
    if (!client || !client.pupPage) {
      return res.json({ success: true, message: "Already disconnected" });
    }

    try {
      await client.logout().catch((err) => {
        console.log("Logout error handled:", err.message);
      });
    } catch (error) {
      console.error("Error during logout:", error);
      // Continue execution even if logout fails
    }

    res.json({ success: true, message: "Logged out successfully" });
  } catch (err) {
    console.error("Logout endpoint error:", err);
    res
      .status(500)
      .json({ error: "Failed to logout safely", details: err.message });
  }
});

// Force reconnection
app.post("/reconnect", async (req, res) => {
  try {
    // Safely destroy the client if it exists
    if (client) {
      try {
        if (client.pupPage) {
          await client.destroy().catch((err) => {
            console.log("Client destroy error handled:", err.message);
          });
        }
      } catch (error) {
        console.error("Error during client destroy:", error);
        // Continue execution even if destroy fails
      }
    }

    // Reset QR code
    latestQR = null;

    // Initialize a new client
    setTimeout(() => {
      client.initialize().catch((err) => {
        console.error("Client initialization error:", err);
      });
    }, 1000);

    res.json({ success: true, message: "Reconnecting WhatsApp..." });
  } catch (err) {
    console.error("Reconnect endpoint error:", err);
    res
      .status(500)
      .json({ error: "Failed to reconnect", details: err.message });
  }
});

app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>WhatsApp API for Laravel CMS</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        code { background: #f4f4f4; padding: 2px 5px; border-radius: 3px; }
        pre { background: #f4f4f4; padding: 10px; border-radius: 3px; overflow-x: auto; }
        .endpoint { margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 10px; }
        h3 { color: #333; }
      </style>
    </head>
    <body>
      <h1>WhatsApp API for Laravel CMS</h1>
      <p>Status: ${client.info ? "Connected" : "Disconnected"}</p>
      <p>Use <a href="/qr">/qr</a> to scan and connect WhatsApp.</p>
      
      <h2>API Endpoints</h2>
      
      <div class="endpoint">
        <h3>Send Message</h3>
        <code>POST /send-message</code>
        <pre>{
  "number": "923001234567", 
  "message": "Your invoice is ready",
  "pdfUrl": "https://example.com/invoice.pdf" (optional)
}</pre>
      </div>
      
      <div class="endpoint">
        <h3>Send to Multiple Recipients</h3>
        <code>POST /broadcast</code>
        <pre>{
  "numbers": ["923001234567", "923001234568"],
  "message": "Your invoice is ready",
  "pdfUrl": "https://example.com/invoice.pdf" (optional)
}</pre>
      </div>

      <div class="endpoint">
        <h3>Connection Management</h3>
        <code>GET /status</code> - Check connection status<br>
        <code>POST /logout</code> - Logout from WhatsApp<br>
        <code>POST /reconnect</code> - Force reconnection<br>
      </div>
    </body>
    </html>
  `);
});

// Add these endpoints after your existing ones

// Send to multiple recipients at once
app.post("/broadcast", async (req, res) => {
  const { numbers, message, pdfUrl } = req.body;

  if (!numbers || !Array.isArray(numbers) || numbers.length === 0) {
    return res
      .status(400)
      .json({ error: "Valid array of numbers is required" });
  }

  if (!message && !pdfUrl) {
    return res.status(400).json({ error: "Message or pdfUrl is required" });
  }

  try {
    const results = [];
    let media = null;

    if (pdfUrl) {
      media = await MessageMedia.fromUrl(pdfUrl, { unsafeMime: true });
    }

    for (const number of numbers) {
      try {
        const chatId = number.includes("@c.us") ? number : `${number}@c.us`;

        if (media) {
          await client.sendMessage(chatId, media, { caption: message || "" });
        } else {
          await client.sendMessage(chatId, message);
        }

        results.push({ number, success: true });
      } catch (err) {
        results.push({ number, success: false, error: err.message });
      }
    }

    res.json({ success: true, results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Send an image with a message
app.post("/send-image", async (req, res) => {
  const { number, caption, imageUrl } = req.body;

  if (!number || !imageUrl) {
    return res.status(400).json({ error: "number and imageUrl are required" });
  }

  try {
    const chatId = number.includes("@c.us") ? number : `${number}@c.us`;
    const media = await MessageMedia.fromUrl(imageUrl);
    await client.sendMessage(chatId, media, { caption: caption || "" });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get information about a chat/contact
app.get("/chat-info/:number", async (req, res) => {
  try {
    const number = req.params.number;
    const chatId = number.includes("@c.us") ? number : `${number}@c.us`;
    const chat = await client.getChatById(chatId);

    res.json({
      success: true,
      chat: {
        id: chat.id._serialized,
        name: chat.name,
        isGroup: chat.isGroup,
        timestamp: chat.timestamp,
        unreadCount: chat.unreadCount,
      },
    });
  } catch (err) {
    res.status(404).json({ error: "Chat not found or unavailable" });
  }
});

app.listen(port, () => {
  console.log(`API server running on http://localhost:${port}`);
});
