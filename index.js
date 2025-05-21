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
  console.log(`Creating new WhatsApp client: ${clientId}`);

  const newClient = new Client({
    authStrategy: new LocalAuth({ clientId: clientId }),
    puppeteer: {
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--disable-gpu",
        "--disable-extensions",
      ],
      headless: "new", // Use the new headless mode
      timeout: 60000, // Increase timeout to 1 minute
    },
  });

  const qrData = { qr: null, timestamp: null };

  // Add more detailed event handlers with debug logging
  newClient.on("qr", (qr) => {
    console.log(
      `QR Code generated for client ${clientId} at ${new Date().toLocaleString()}`
    );
    qrData.qr = qr;
    qrData.timestamp = Date.now();
  });

  newClient.on("ready", () => {
    console.log(
      `WhatsApp client ${clientId} is ready at ${new Date().toLocaleString()}`
    );
    qrData.qr = null;
  });

  newClient.on("authenticated", () => {
    console.log(
      `WhatsApp client ${clientId} authenticated at ${new Date().toLocaleString()}`
    );
  });

  newClient.on("disconnected", (reason) => {
    console.log(
      `WhatsApp client ${clientId} disconnected. Reason: ${reason || "Unknown"}`
    );
  });

  newClient.on("auth_failure", (msg) => {
    console.error(`Authentication failure for client ${clientId}:`, msg);
  });

  // Add debugging for critical events
  newClient.on("loading_screen", (percent, message) => {
    console.log(`WhatsApp loading (${clientId}): ${percent}% - ${message}`);
  });

  // Log all browser console messages
  newClient.on("message_create", (msg) => {
    console.log(`New message event for ${clientId}`);
  });

  const initializeWithRetry = async () => {
    let initializationAttempts = 0;
    const MAX_INIT_ATTEMPTS = 3;

    const tryInit = async () => {
      if (initializationAttempts >= MAX_INIT_ATTEMPTS) {
        console.error(
          `Max initialization attempts reached for client ${clientId}`
        );
        return false;
      }

      initializationAttempts++;
      console.log(
        `Initialization attempt ${initializationAttempts} for client ${clientId}`
      );

      try {
        console.log(`Starting initialization for ${clientId}...`);
        await newClient.initialize();
        console.log(`Client ${clientId} successfully initialized`);
        return true;
      } catch (err) {
        console.error(
          `Failed to initialize client ${clientId} (attempt ${initializationAttempts}):`,
          err
        );

        if (initializationAttempts < MAX_INIT_ATTEMPTS) {
          console.log(`Will retry in 5 seconds...`);
          await new Promise((resolve) => setTimeout(resolve, 5000));
          return tryInit();
        }
        return false;
      }
    };

    return tryInit();
  };

  return {
    client: newClient,
    qrData,
    initializeWithRetry,
  };
}

// Initialize the default client with retry capabilities
clients[defaultClientId] = createWhatsAppClient(defaultClientId);
clients[defaultClientId].initializeWithRetry().catch((err) => {
  console.error("Failed to initialize default client:", err);
});

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

    // Use the new initialization method
    const success = await clients[clientId].initializeWithRetry();

    if (!success) {
      return res.status(500).json({
        error: "Failed to initialize WhatsApp client",
        message:
          "There might be issues with browser dependencies. Check system requirements.",
      });
    }

    res.json({ success: true, message: `Client ${clientId} created` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update the QR endpoint with better monitoring
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

      // Create a fresh client instance with explicit debug logging
      clients[clientId] = createWhatsAppClient(clientId);

      // Initialize with QR monitoring
      const initPromise = clients[clientId].client.initialize();

      // Set a timeout to wait for the QR code
      const qrPromise = new Promise((resolve) => {
        const qrCheckInterval = setInterval(() => {
          if (clients[clientId].qrData && clients[clientId].qrData.qr) {
            clearInterval(qrCheckInterval);
            resolve();
          }
        }, 1000);

        // Give up after 30 seconds
        setTimeout(() => {
          clearInterval(qrCheckInterval);
          resolve();
        }, 30000);
      });

      // Wait for initialization or timeout
      await initPromise;
      await qrPromise;

      // Check if we have a QR code or need to redirect
      if (clients[clientId].qrData && clients[clientId].qrData.qr) {
        const qrImage = await QRCode.toDataURL(clients[clientId].qrData.qr);
        res.send(`
          <h2>QR Code Generated for Client ${clientId}</h2>
          <img src="${qrImage}" />
          <p>Generated at: ${new Date().toLocaleString()}</p>
          <p>If the QR code doesn't work, <a href="/qr?clientId=${clientId}&refresh=true">click here to generate a new one</a>.</p>
        `);
        return;
      } else {
        res.send(`
          <h2>Regenerating QR Code for client ${clientId}</h2>
          <p>Please wait a moment...</p>
          <p>Debug: QR event didn't fire within timeout period.</p>
          <script>
            setTimeout(() => window.location.href = '/qr?clientId=${clientId}', 5000);
          </script>
        `);
        return;
      }
    } catch (err) {
      console.error(`Failed to refresh client ${clientId}:`, err);
      res.send(`
        <h2>Error Refreshing Client ${clientId}</h2>
        <p>Error: ${err.message}</p>
        <p><a href="/qr?clientId=${clientId}&refresh=true">Try again</a></p>
      `);
      return;
    }
  }

  // Current client status details for better diagnostics
  const isConnected = client && client.info;
  const hasPupPage = client && client.pupPage;
  const hasQR = clientData.qrData && clientData.qrData.qr;

  // Add debug logging
  console.log(`Client ${clientId} status:`, {
    isConnected,
    hasPupPage,
    hasQR,
    qrTimestamp: clientData.qrData ? clientData.qrData.timestamp : null,
  });

  // If not connected and no QR, attempt to initialize
  if (!isConnected && !hasQR) {
    try {
      if (!hasPupPage) {
        console.log(`Initializing client ${clientId} to generate QR code`);

        // Track start time for QR generation
        const startTime = Date.now();

        // Initialize client with timeout
        const initPromise = client.initialize();
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error("Initialization timeout")), 30000);
        });

        try {
          await Promise.race([initPromise, timeoutPromise]);

          // Wait for up to 10 seconds for QR to be generated
          const qrWaitPromise = new Promise((resolve) => {
            const checkInterval = setInterval(() => {
              if (clientData.qrData && clientData.qrData.qr) {
                clearInterval(checkInterval);
                resolve(true);
              } else if (Date.now() - startTime > 10000) {
                clearInterval(checkInterval);
                resolve(false);
              }
            }, 1000);
          });

          const qrGenerated = await qrWaitPromise;

          if (qrGenerated) {
            // We got a QR code, show it
            const qrImage = await QRCode.toDataURL(clientData.qrData.qr);
            return res.send(`
              <h2>Scan this QR with WhatsApp for Client ${clientId}</h2>
              <img src="${qrImage}" />
              <p>Generated at: ${new Date(
                clientData.qrData.timestamp
              ).toLocaleString()}</p>
              <p>If the QR code has expired, <a href="/qr?clientId=${clientId}&refresh=true">click here to generate a new one</a>.</p>
            `);
          }
        } catch (err) {
          console.error(
            `Client ${clientId} initialization failed:`,
            err.message
          );
          return res.send(`
            <h2>WhatsApp Connection Error</h2>
            <p>There was a problem initializing the WhatsApp connection:</p>
            <pre>${err.message}</pre>
            
            <h3>Troubleshooting Steps</h3>
            <ul>
              <li>Make sure your internet connection is stable</li>
              <li>Try restarting your application</li>
              <li>Check if WhatsApp Web is accessible in your browser</li>
            </ul>
            
            <p><a href="/qr?clientId=${clientId}&refresh=true">Try Again</a></p>
          `);
        }
      }

      // Check if the QR was generated while we were waiting
      if (clientData.qrData && clientData.qrData.qr) {
        const qrImage = await QRCode.toDataURL(clientData.qrData.qr);
        return res.send(`
          <h2>Scan this QR with WhatsApp for Client ${clientId}</h2>
          <img src="${qrImage}" />
          <p>Generated at: ${new Date(
            clientData.qrData.timestamp
          ).toLocaleString()}</p>
          <p>If the QR code has expired, <a href="/qr?clientId=${clientId}&refresh=true">click here to generate a new one</a>.</p>
        `);
      }

      // If we're still waiting for WhatsApp to generate the QR
      return res.send(`
        <h2>WhatsApp Client ${clientId} Initializing</h2>
        <p>Please wait while we generate a QR code...</p>
        <p>Connection details: Connected=${isConnected}, Browser=${
        hasPupPage ? "Active" : "Not Active"
      }</p>
        <p><a href="/qr?clientId=${clientId}&refresh=true">Force refresh QR code</a></p>
        <script>setTimeout(() => window.location.reload(), 3000);</script>
      `);
    } catch (err) {
      console.error(`Failed to initialize client ${clientId}:`, err);
      return res.send(`
        <h2>WhatsApp Initialization Error</h2>
        <p>There was an error initializing the WhatsApp client:</p>
        <pre>${err.message}</pre>
        <p><a href="/qr?clientId=${clientId}&refresh=true">Try again</a></p>
      `);
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
    clients[clientId].initializeWithRetry();

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
    clients[clientId].initializeWithRetry();

    res.json({
      success: true,
      message: `Reconnecting WhatsApp client ${clientId}. Use /qr?clientId=${clientId} to scan the QR code.`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a diagnostic endpoint
app.get("/system-check", async (req, res) => {
  try {
    const puppeteer = require("puppeteer-core");

    res.setHeader("Content-Type", "text/html");
    res.write("<h1>System Check</h1>");
    res.write("<pre>Running browser launch test...</pre>");

    try {
      // Try launching browser directly with puppeteer
      res.write("<pre>Attempting to launch browser...</pre>");

      const browser = await puppeteer.launch({
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
        ],
        headless: true,
      });

      res.write(
        "<pre style='color:green'>Browser launched successfully!</pre>"
      );

      // Check version
      const version = await browser.version();
      res.write(`<pre>Browser version: ${version}</pre>`);

      await browser.close();
      res.write("<pre>Browser closed successfully.</pre>");

      // Check system libraries
      res.write("<h2>System Libraries</h2>");
      const { execSync } = require("child_process");

      try {
        const libCheck = execSync("ldconfig -p | grep libatk").toString();
        res.write(`<pre>${libCheck}</pre>`);
      } catch (err) {
        res.write(
          `<pre style='color:red'>Error checking libraries: ${err.message}</pre>`
        );
      }

      res.write("<h2>Environment</h2>");
      res.write(`<pre>Node.js: ${process.version}</pre>`);
      res.write(`<pre>Platform: ${process.platform}</pre>`);

      res.end("<p>System check complete!</p>");
    } catch (browserErr) {
      res.write(
        `<pre style='color:red'>Browser launch failed: ${browserErr.message}</pre>`
      );
      res.write("<h2>Recommended Solution</h2>");
      res.write(`<pre>
1. SSH into your server
2. Run: sudo apt-get update
3. Run: sudo apt-get install -y libatk1.0-0 libatk-bridge2.0-0 libcups2 libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 libpango-1.0-0 libcairo2 libasound2 libnss3 libx11-xcb1 libxss1
4. Restart the application: pm2 restart whatsapp
</pre>`);
      res.end();
    }
  } catch (err) {
    res.status(500).send(`System check error: ${err.message}`);
  }
});

app.listen(port, () => {
  console.log(`API server running on http://localhost:${port}`);
});
