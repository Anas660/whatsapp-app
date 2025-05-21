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

// Update the QR endpoint to support forced regeneration
app.get("/qr", async (req, res) => {
  const clientId = req.query.clientId || defaultClientId;
  const forceRefresh = req.query.refresh === "true";

  if (!clients[clientId]) {
    return res.status(404).json({ error: `Client ${clientId} not found` });
  }

  const clientData = clients[clientId];
  const client = clientData.client;

  // Force reconnect if requested
  if (forceRefresh) {
    try {
      console.log(`Forcing QR refresh for client ${clientId}`);

      // Destroy the existing client if possible
      if (client) {
        try {
          await client.destroy();
          console.log(`Destroyed client ${clientId} for QR refresh`);
        } catch (e) {
          console.log(`Error destroying client ${clientId}: ${e.message}`);
        }
      }

      // Create a fresh client instance
      clients[clientId] = createWhatsAppClient(clientId);
      await clients[clientId].client.initialize();

      res.send(`
        <h2>Regenerating QR Code for client ${clientId}</h2>
        <p>Please wait a moment...</p>
        <script>
          setTimeout(() => window.location.href = '/qr?clientId=${clientId}', 5000);
        </script>
      `);
      return;
    } catch (err) {
      console.error(`Failed to refresh client ${clientId}:`, err);
    }
  }

  // Current client status details for better diagnostics
  const isConnected = client && client.info;
  const hasPupPage = client && client.pupPage;
  const hasQR = clientData.qrData && clientData.qrData.qr;

  // If not connected and no QR, attempt to initialize
  if (!isConnected && !hasQR) {
    try {
      if (!hasPupPage) {
        console.log(`Initializing client ${clientId} to generate QR code`);
        await client.initialize();
      }

      // Wait briefly to give it a chance to generate QR
      if (!clientData.qrData.qr) {
        return res.send(`
          <h2>WhatsApp Client ${clientId} Initializing</h2>
          <p>Please wait while we generate a QR code...</p>
          <p>Connection details: Connected=${isConnected}, Browser=${
          hasPupPage ? "Active" : "Not Active"
        }</p>
          <p><a href="/qr?clientId=${clientId}&refresh=true">Force refresh QR code</a></p>
          <script>setTimeout(() => window.location.reload(), 3000);</script>
        `);
      }
    } catch (err) {
      console.error(`Failed to initialize client ${clientId}:`, err);
    }
  }

  // Client is fully connected
  if (isConnected) {
    return res.send(`
      <h2>WhatsApp client ${clientId} is connected</h2>
      <p>Connected as: ${client.info.pushname} (${client.info.wid.user})</p>
      <p>If you want to reconnect with a different account, first logout:</p>
      <p><a href="/logout?clientId=${clientId}">Logout</a> | <a href="/qr?clientId=${clientId}&refresh=true">Force new QR Code</a></p>
    `);
  }

  // Still no QR code available
  if (!hasQR) {
    return res.send(`
      <h2>QR Code Not Available for ${clientId}</h2>
      <p>Connection details: Connected=${isConnected}, Browser=${
      hasPupPage ? "Active" : "Not Active"
    }</p>
      <p>The system hasn't generated a QR code yet.</p>
      <p><a href="/qr?clientId=${clientId}&refresh=true">Force refresh QR code</a></p>
      <script>setTimeout(() => window.location.reload(), 3000);</script>
    `);
  }

  // We have a QR code, show it
  res.setHeader("Content-Type", "text/html");
  const qrImage = await QRCode.toDataURL(clientData.qrData.qr);
  res.send(`
    <h2>Scan this QR with WhatsApp for Client ${clientId}</h2>
    <img src="${qrImage}" />
    <p>Generated at: ${new Date(
      clientData.qrData.timestamp
    ).toLocaleString()}</p>
    <p>If the QR code has expired, <a href="/qr?clientId=${clientId}&refresh=true">click here to generate a new one</a>.</p>
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
  // Get list of all clients
  const clientsList = Object.keys(clients).map((id) => {
    const client = clients[id].client;
    return {
      id,
      connected: client && client.info ? true : false,
      name: client && client.info ? client.info.pushname : null,
    };
  });

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
          .client-card { border: 1px solid #ddd; padding: 10px; margin-bottom: 10px; border-radius: 4px; }
          .connected { color: green; }
          .disconnected { color: red; }
          h3 { color: #333; }
          table { border-collapse: collapse; width: 100%; }
          th, td { text-align: left; padding: 8px; border-bottom: 1px solid #ddd; }
          tr:hover { background-color: #f5f5f5; }
        </style>
      </head>
      <body>
        <h1>WhatsApp API for Laravel CMS</h1>
        
        <h2>Clients</h2>
        <table>
          <tr>
            <th>Client ID</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
          ${clientsList
            .map(
              (client) => `
            <tr>
              <td>${client.id}</td>
              <td class="${client.connected ? "connected" : "disconnected"}">
                ${
                  client.connected
                    ? `Connected (${client.name})`
                    : "Disconnected"
                }
              </td>
              <td>
                <a href="/qr?clientId=${client.id}">QR Code</a> | 
                <a href="/status?clientId=${client.id}">Status</a>
              </td>
            </tr>
          `
            )
            .join("")}
        </table>
        
        <h3>Create New Client</h3>
        <form id="createClient" style="margin-bottom: 20px;">
          <input type="text" id="newClientId" placeholder="Enter client ID" required>
          <button type="submit">Create Client</button>
        </form>
        
        <h2>API Endpoints</h2>
        
        <div class="endpoint">
          <h3>Send Message</h3>
          <code>POST /send-message</code>
          <pre>{
    "number": "923001234567", 
    "message": "Your invoice is ready",
    "pdfUrl": "https://example.com/invoice.pdf" (optional),
    "clientId": "default" (optional)
  }</pre>
        </div>
        
        <div class="endpoint">
          <h3>Send to Multiple Recipients</h3>
          <code>POST /broadcast</code>
          <pre>{
    "numbers": ["923001234567", "923001234568"],
    "message": "Your invoice is ready",
    "pdfUrl": "https://example.com/invoice.pdf" (optional),
    "clientId": "default" (optional)
  }</pre>
        </div>
        
        <div class="endpoint">
          <h3>Send Image</h3>
          <code>POST /send-image</code>
          <pre>{
    "number": "923001234567", 
    "caption": "Your product image",
    "imageUrl": "https://example.com/image.jpg",
    "clientId": "default" (optional)
  }</pre>
        </div>
  
        <div class="endpoint">
          <h3>Connection Management</h3>
          <code>GET /status/:clientId?</code> - Check connection status<br>
          <code>POST /logout/:clientId?</code> - Logout from WhatsApp<br>
          <code>POST /reconnect/:clientId?</code> - Force reconnection<br>
          <code>POST /create-client</code> - Create a new client<br>
          <code>GET /qr/:clientId?</code> - Get QR code for connection<br>
        </div>

        <div class="endpoint">
          <h3>Connection Management</h3>
          <code>GET /status?clientId=default</code> - Check connection status<br>
          <code>POST /logout?clientId=default</code> - Logout from WhatsApp<br>
          <code>POST /reconnect?clientId=default</code> - Force reconnection<br>
          <code>POST /create-client</code> - Create a new client<br>
          <code>GET /qr?clientId=default</code> - Get QR code for connection<br>
        </div>
        
        <script>
          document.getElementById('createClient').addEventListener('submit', function(e) {
            e.preventDefault();
            const clientId = document.getElementById('newClientId').value;
            
            fetch('/create-client', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ clientId })
            })
            .then(response => response.json())
            .then(data => {
              if (data.success) {
                alert('Client created! Redirecting to QR code page...');
                window.location.href = '/qr?clientId=' + clientId;
              } else {
                alert('Error: ' + data.error);
              }
            })
            .catch(err => alert('Error: ' + err));
          });
        </script>
      </body>
      </html>
    `);
});
// Add these endpoints after your existing ones

// Send to multiple recipients at once
app.post("/broadcast", async (req, res) => {
  const { numbers, message, pdfUrl, clientId = defaultClientId } = req.body;

  if (!numbers || !Array.isArray(numbers) || numbers.length === 0) {
    return res
      .status(400)
      .json({ error: "Valid array of numbers is required" });
  }

  if (!message && !pdfUrl) {
    return res.status(400).json({ error: "Message or pdfUrl is required" });
  }

  if (!clients[clientId]) {
    return res.status(404).json({ error: `Client ${clientId} not found` });
  }

  const client = clients[clientId].client;

  if (!client || !client.info) {
    return res.status(503).json({
      error: "WhatsApp client not connected",
      message: `Please connect WhatsApp client ${clientId} first using the QR code`,
    });
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
  const { number, caption, imageUrl, clientId = defaultClientId } = req.body;

  if (!number || !imageUrl) {
    return res.status(400).json({ error: "number and imageUrl are required" });
  }

  if (!clients[clientId]) {
    return res.status(404).json({ error: `Client ${clientId} not found` });
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
    const media = await MessageMedia.fromUrl(imageUrl);
    await client.sendMessage(chatId, media, { caption: caption || "" });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get information about a chat/contact
app.get("/chat-info/:number", async (req, res) => {
  const { clientId = defaultClientId } = req.query;
  const number = req.params.number;

  if (!clients[clientId]) {
    return res.status(404).json({ error: `Client ${clientId} not found` });
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

// Status endpoint
app.get("/status", async (req, res) => {
  const clientId = req.query.clientId || defaultClientId;

  if (!clients[clientId]) {
    return res.status(404).json({ error: `Client ${clientId} not found` });
  }

  const client = clients[clientId].client;
  const isConnected = client && client.info ? true : false;

  res.json({
    success: true,
    client: clientId,
    connected: isConnected,
    info: isConnected
      ? {
          name: client.info.pushname,
          phone: client.info.wid.user,
        }
      : null,
  });
});

// Logout endpoint
app.post("/logout", async (req, res) => {
  const clientId = req.query.clientId || defaultClientId;

  if (!clients[clientId]) {
    return res.status(404).json({ error: `Client ${clientId} not found` });
  }

  const client = clients[clientId].client;

  try {
    if (client && client.info) {
      await client.logout();
      console.log(`Client ${clientId} logged out`);
    }

    // Recreate the client
    clients[clientId] = createWhatsAppClient(clientId);
    clients[clientId].client.initialize();

    res.json({
      success: true,
      message: `WhatsApp client ${clientId} logged out`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reconnect endpoint
app.post("/reconnect", async (req, res) => {
  const clientId = req.query.clientId || defaultClientId;

  if (!clients[clientId]) {
    return res.status(404).json({ error: `Client ${clientId} not found` });
  }

  try {
    // Stop the current client if exists
    if (clients[clientId].client) {
      try {
        await clients[clientId].client.destroy();
        console.log(`Client ${clientId} destroyed`);
      } catch (e) {
        console.log(`Error destroying client ${clientId}:`, e.message);
      }
    }

    // Create a new client instance
    clients[clientId] = createWhatsAppClient(clientId);
    clients[clientId].client.initialize();

    res.json({
      success: true,
      message: `Reconnecting WhatsApp client ${clientId}. Use /qr?clientId=${clientId} to scan the QR code.`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`API server running on http://localhost:${port}`);
});
