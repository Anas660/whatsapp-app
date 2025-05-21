const { Client, LocalAuth, MessageMedia } = require("whatsapp-web.js");
const express = require("express");
const cors = require("cors");
const QRCode = require("qrcode");

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Add this near the top of your file, after imports
const clients = {};
let defaultClientId = "default";

// Function to create a new WhatsApp client
function createWhatsAppClient(clientId) {
  const newClient = new Client({
    authStrategy: new LocalAuth({ clientId: clientId }),
  });

  const qrData = { qr: null, timestamp: null };

  newClient.on("qr", (qr) => {
    qrData.qr = qr;
    qrData.timestamp = Date.now();
    console.log(`QR code generated for client ${clientId}`);
  });

  newClient.on("ready", () => {
    console.log(`WhatsApp client ${clientId} is ready!`);
    qrData.qr = null;
  });

  newClient.on("disconnected", () => {
    console.log(`WhatsApp client ${clientId} disconnected`);
  });

  return { client: newClient, qrData };
}

// Initialize the default client
clients[defaultClientId] = createWhatsAppClient(defaultClientId);
clients[defaultClientId].client.initialize();

// Create endpoint to generate a new client
app.post("/create-client", async (req, res) => {
  try {
    const { clientId } = req.body;

    if (!clientId) {
      return res.status(400).json({ error: "clientId is required" });
    }

    if (clients[clientId]) {
      return res.status(400).json({ error: "Client ID already exists" });
    }

    clients[clientId] = createWhatsAppClient(clientId);
    clients[clientId].client.initialize();

    res.json({ success: true, message: `Client ${clientId} created` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint to get QR for a specific client
app.get("/qr/:clientId?", async (req, res) => {
  const clientId = req.params.clientId || defaultClientId;

  if (!clients[clientId]) {
    return res.status(404).json({ error: `Client ${clientId} not found` });
  }

  const { client, qrData } = clients[clientId];

  // If not connected, ensure we're initializing
  if (!client.info && !client.pupPage) {
    try {
      await client.initialize();
      console.log(`Client ${clientId} initialization started`);

      // Give it a moment to generate QR
      if (!qrData.qr) {
        return res.send(`
          <h2>WhatsApp Client ${clientId} Connecting</h2>
          <p>Please wait while we generate a QR code...</p>
          <script>setTimeout(() => window.location.reload(), 3000);</script>
        `);
      }
    } catch (err) {
      console.error(`Failed to initialize client ${clientId}:`, err);
    }
  }

  if (!qrData.qr) {
    return res.send(
      `WhatsApp client ${clientId} is already connected or QR not generated yet.`
    );
  }

  res.setHeader("Content-Type", "text/html");
  const qrImage = await QRCode.toDataURL(qrData.qr);
  res.send(`
    <h2>Scan this QR with WhatsApp for Client ${clientId}</h2>
    <img src="${qrImage}" />
    <p>Generated at: ${new Date(qrData.timestamp).toLocaleString()}</p>
  `);
});

// Update the send-message endpoint to work with multiple clients
app.post("/send-message", async (req, res) => {
  const { number, message, pdfUrl, clientId = defaultClientId } = req.body;

  if (!number || (!message && !pdfUrl)) {
    return res.status(400).json({
      error: "number and message or pdfUrl are required",
    });
  }

  if (!clients[clientId]) {
    return res.status(404).json({
      error: `Client ${clientId} not found`,
    });
  }

  const client = clients[clientId].client;

  if (!client || !client.info) {
    return res.status(503).json({
      error: "WhatsApp client not connected",
      message: `Please connect WhatsApp client ${clientId} first using the QR code`,
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
      <p>Status: ${
        clients[defaultClientId].client.info ? "Connected" : "Disconnected"
      }</p>
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
