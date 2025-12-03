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
app.use(express.urlencoded({ extended: true })); // For form data

// Store multiple WhatsApp clients
const clients = {};
const defaultClientId = "default";

// ============================================
// AUTHENTICATION CONFIGURATION
// ============================================
const AUTH_USERNAME = process.env.AUTH_USERNAME || "admin";
const AUTH_PASSWORD = process.env.AUTH_PASSWORD || "whatsapp2024"; // CHANGE THIS!
const SESSION_SECRET =
  process.env.SESSION_SECRET || "your-secret-key-change-this";

// Simple session storage (in production, use Redis or database)
const sessions = new Map();

/**
 * Generate a simple session token
 */
function generateSessionToken() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * Authentication middleware
 */
function requireAuth(req, res, next) {
  const token =
    req.headers.authorization?.replace("Bearer ", "") ||
    req.query.token ||
    req.cookies?.session_token;

  if (token && sessions.has(token)) {
    const session = sessions.get(token);

    // Check if session is still valid (24 hours)
    if (Date.now() - session.createdAt < 24 * 60 * 60 * 1000) {
      return next();
    } else {
      sessions.delete(token); // Expired session
    }
  }

  // If it's an API call, return JSON error
  if (req.path.startsWith("/send-") || req.path.startsWith("/broadcast")) {
    return res.status(401).json({
      success: false,
      error: "Unauthorized. Please provide valid authentication token.",
    });
  }

  // For web pages, redirect to login
  return res.redirect("/login");
}

/**
 * Cookie parser middleware (simple implementation)
 */
app.use((req, res, next) => {
  req.cookies = {};
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    cookieHeader.split(";").forEach((cookie) => {
      const [name, value] = cookie.trim().split("=");
      req.cookies[name] = value;
    });
  }
  next();
});

/**
 * LOGIN PAGE
 */
app.get("/login", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Login - WhatsApp API</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .login-container {
          background: white;
          padding: 40px;
          border-radius: 10px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.2);
          width: 100%;
          max-width: 400px;
        }
        h1 {
          color: #128C7E;
          margin-bottom: 10px;
          font-size: 28px;
        }
        p {
          color: #666;
          margin-bottom: 30px;
        }
        .form-group {
          margin-bottom: 20px;
        }
        label {
          display: block;
          color: #333;
          margin-bottom: 5px;
          font-weight: 500;
        }
        input[type="text"],
        input[type="password"] {
          width: 100%;
          padding: 12px;
          border: 2px solid #ddd;
          border-radius: 5px;
          font-size: 14px;
          transition: border-color 0.3s;
        }
        input[type="text"]:focus,
        input[type="password"]:focus {
          outline: none;
          border-color: #25D366;
        }
        button {
          width: 100%;
          padding: 12px;
          background: #25D366;
          color: white;
          border: none;
          border-radius: 5px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.3s;
        }
        button:hover {
          background: #128C7E;
        }
        .error {
          background: #fee;
          color: #c33;
          padding: 10px;
          border-radius: 5px;
          margin-bottom: 20px;
          display: none;
        }
        .error.show {
          display: block;
        }
        .logo {
          text-align: center;
          margin-bottom: 20px;
          font-size: 50px;
        }
      </style>
    </head>
    <body>
      <div class="login-container">
        <div class="logo">📱</div>
        <h1>WhatsApp API</h1>
        <p>Please login to continue</p>
        
        <div class="error" id="error"></div>
        
        <form id="loginForm">
          <div class="form-group">
            <label for="username">Username</label>
            <input type="text" id="username" name="username" required autofocus>
          </div>
          
          <div class="form-group">
            <label for="password">Password</label>
            <input type="password" id="password" name="password" required>
          </div>
          
          <button type="submit">Login</button>
        </form>
      </div>
      
      <script>
        document.getElementById('loginForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          
          const username = document.getElementById('username').value;
          const password = document.getElementById('password').value;
          const errorDiv = document.getElementById('error');
          
          try {
            const response = await fetch('/api/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ username, password })
            });
            
            const data = await response.json();
            
            if (data.success) {
              // Store token in cookie
              document.cookie = 'session_token=' + data.token + '; path=/; max-age=' + (24 * 60 * 60);
              window.location.href = '/';
            } else {
              errorDiv.textContent = data.error || 'Login failed';
              errorDiv.classList.add('show');
            }
          } catch (error) {
            errorDiv.textContent = 'Network error. Please try again.';
            errorDiv.classList.add('show');
          }
        });
      </script>
    </body>
    </html>
  `);
});

/**
 * LOGIN API
 */
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  if (username === AUTH_USERNAME && password === AUTH_PASSWORD) {
    const token = generateSessionToken();
    sessions.set(token, {
      username: username,
      createdAt: Date.now(),
    });

    res.json({
      success: true,
      token: token,
      message: "Login successful",
    });
  } else {
    res.status(401).json({
      success: false,
      error: "Invalid username or password",
    });
  }
});

/**
 * LOGOUT
 */
app.get("/api/logout", (req, res) => {
  const token = req.cookies?.session_token;
  if (token) {
    sessions.delete(token);
  }
  res.clearCookie("session_token");
  res.redirect("/login");
});

/**
 * Creates a new WhatsApp client instance
 * @param {string} clientId - Unique identifier for the client
 * @returns {object} Client data object with client instance and QR data
 */
function createWhatsAppClient(clientId) {
  console.log(
    `[${new Date().toISOString()}] Creating WhatsApp client: ${clientId}`
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
        "--disable-blink-features=AutomationControlled",
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

  client.on("qr", (qr) => {
    console.log(
      `[${new Date().toISOString()}] QR Code received for ${clientId}`
    );
    clientData.qrCode = qr;
    clientData.lastQRTimestamp = Date.now();
  });

  client.on("ready", () => {
    console.log(`[${new Date().toISOString()}] Client ${clientId} is ready!`);
    clientData.isReady = true;
    clientData.qrCode = null;
  });

  client.on("authenticated", () => {
    console.log(
      `[${new Date().toISOString()}] Client ${clientId} authenticated`
    );
    clientData.isAuthenticated = true;
    clientData.qrCode = null;
  });

  client.on("auth_failure", (msg) => {
    console.error(
      `[${new Date().toISOString()}] Auth failure for ${clientId}:`,
      msg
    );
    clientData.isAuthenticated = false;
  });

  client.on("disconnected", (reason) => {
    console.log(
      `[${new Date().toISOString()}] Client ${clientId} disconnected: ${reason}`
    );
    clientData.isReady = false;
    clientData.isAuthenticated = false;
  });

  client.on("error", (error) => {
    console.error(
      `[${new Date().toISOString()}] Client ${clientId} error:`,
      error
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
        }/${maxRetries})`
      );
      await clients[clientId].client.initialize();
      return true;
    } catch (error) {
      retries++;
      console.error(
        `[${new Date().toISOString()}] Failed to initialize ${clientId} (attempt ${retries}):`,
        error.message
      );

      if (retries < maxRetries) {
        const delay = retries * 5000;
        console.log(`[${new Date().toISOString()}] Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  console.error(
    `[${new Date().toISOString()}] Failed to initialize ${clientId} after ${maxRetries} attempts`
  );
  return false;
}

// Initialize default client on startup
(async () => {
  clients[defaultClientId] = createWhatsAppClient(defaultClientId);
  await initializeClient(defaultClientId);
})();

/**
 * HOME PAGE - API Documentation (PROTECTED)
 */
app.get("/", requireAuth, (req, res) => {
  const clientsList = Object.keys(clients).map((id) => {
    const clientData = clients[id];
    return {
      id,
      ready: clientData.isReady,
      authenticated: clientData.isAuthenticated,
      info:
        clientData.isReady && clientData.client.info
          ? {
              name: clientData.client.info.pushname,
              phone: clientData.client.info.wid.user,
            }
          : null,
    };
  });

  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>WhatsApp API for Laravel CMS</title>
      <style>
        * { box-sizing: border-box; }
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
          max-width: 1200px; 
          margin: 0 auto; 
          padding: 20px;
          background: #f5f5f5;
        }
        .container { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        h1 { color: #25D366; margin: 0; }
        h2 { color: #128C7E; border-bottom: 2px solid #25D366; padding-bottom: 10px; }
        h3 { color: #075E54; }
        code { background: #f4f4f4; padding: 3px 6px; border-radius: 3px; font-family: monospace; }
        pre { 
          background: #2d2d2d; 
          color: #f8f8f2;
          padding: 15px; 
          border-radius: 5px; 
          overflow-x: auto;
          border-left: 4px solid #25D366;
        }
        .endpoint { 
          margin: 20px 0; 
          padding: 15px; 
          background: #f9f9f9; 
          border-left: 4px solid #128C7E;
          border-radius: 4px;
        }
        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin: 20px 0;
          background: white;
        }
        th, td { 
          text-align: left; 
          padding: 12px; 
          border-bottom: 1px solid #ddd; 
        }
        th { background: #25D366; color: white; }
        tr:hover { background-color: #f5f5f5; }
        .status-ready { color: #25D366; font-weight: bold; }
        .status-not-ready { color: #e74c3c; font-weight: bold; }
        .btn { 
          display: inline-block;
          padding: 8px 16px;
          margin: 0 5px;
          background: #25D366;
          color: white;
          text-decoration: none;
          border-radius: 4px;
          font-size: 14px;
        }
        .btn:hover { background: #128C7E; }
        .btn-secondary { background: #3498db; }
        .btn-secondary:hover { background: #2980b9; }
        .btn-danger { background: #e74c3c; }
        .btn-danger:hover { background: #c0392b; }
        form { margin: 20px 0; }
        input[type="text"] {
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          width: 300px;
          margin-right: 10px;
        }
        button {
          padding: 10px 20px;
          background: #25D366;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        button:hover { background: #128C7E; }
        .method { 
          display: inline-block;
          padding: 4px 8px;
          border-radius: 3px;
          font-weight: bold;
          font-size: 12px;
          margin-right: 8px;
        }
        .method-get { background: #3498db; color: white; }
        .method-post { background: #2ecc71; color: white; }
        .method-delete { background: #e74c3c; color: white; }
        .alert {
          padding: 12px;
          border-radius: 4px;
          margin-bottom: 20px;
        }
        .alert-info {
          background: #d1ecf1;
          color: #0c5460;
          border-left: 4px solid #17a2b8;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📱 WhatsApp API for Laravel CMS</h1>
          <a href="/api/logout" class="btn btn-danger">Logout</a>
        </div>
        
        <div class="alert alert-info">
          <strong>🔒 Authenticated Session</strong> - You are logged in securely. Session valid for 24 hours.
        </div>
        
        <p>Node.js application using whatsapp-web.js for sending messages, reminders, and invoices via WhatsApp.</p>
        
        <h2>Active Clients</h2>
        <table>
          <thead>
            <tr>
              <th>Client ID</th>
              <th>Status</th>
              <th>User Info</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${clientsList
              .map(
                (client) => `
              <tr>
                <td><strong>${client.id}</strong></td>
                <td class="${
                  client.ready ? "status-ready" : "status-not-ready"
                }">
                  ${client.ready ? "✓ Connected" : "✗ Disconnected"}
                </td>
                <td>${
                  client.info
                    ? `${client.info.name} (${client.info.phone})`
                    : "-"
                }</td>
                <td>
                  <a href="/qr?clientId=${
                    client.id
                  }" class="btn btn-secondary">QR Code</a>
                  <a href="/status?clientId=${
                    client.id
                  }" class="btn btn-secondary">Status</a>
                </td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
        
        <h3>Create New Client</h3>
        <form id="createClientForm">
          <input type="text" id="newClientId" placeholder="Enter unique client ID" required>
          <button type="submit">Create Client</button>
        </form>
        
        <h2>API Endpoints</h2>
        
        <div class="alert alert-info">
          <strong>API Authentication:</strong> Include your session token in API requests:<br>
          <code>Authorization: Bearer YOUR_TOKEN</code> or <code>?token=YOUR_TOKEN</code>
        </div>
        
        <div class="endpoint">
          <h3><span class="method method-post">POST</span> /send-message</h3>
          <p>Send a text message or PDF to a WhatsApp number</p>
          <pre>{
  "number": "923001234567",
  "message": "Your reminder message",
  "pdfUrl": "https://example.com/invoice.pdf",  // optional
  "clientId": "default"  // optional
}</pre>
        </div>
        
        <div class="endpoint">
          <h3><span class="method method-post">POST</span> /broadcast</h3>
          <p>Send messages to multiple recipients</p>
          <pre>{
  "numbers": ["923001234567", "923007654321"],
  "message": "Broadcast message",
  "pdfUrl": "https://example.com/file.pdf",  // optional
  "clientId": "default",  // optional
  "delayMs": 2000  // delay between messages (default: 2000ms)
}</pre>
        </div>
        
        <div class="endpoint">
          <h3><span class="method method-post">POST</span> /send-image</h3>
          <p>Send an image with optional caption</p>
          <pre>{
  "number": "923001234567",
  "imageUrl": "https://example.com/image.jpg",
  "caption": "Your image caption",  // optional
  "clientId": "default"  // optional
}</pre>
        </div>
        
        <div class="endpoint">
          <h3><span class="method method-get">GET</span> /status</h3>
          <p>Check client connection status</p>
          <code>/status?clientId=default</code>
        </div>
        
        <div class="endpoint">
          <h3><span class="method method-get">GET</span> /qr</h3>
          <p>Get QR code for authentication</p>
          <code>/qr?clientId=default</code>
        </div>
        
        <div class="endpoint">
          <h3><span class="method method-post">POST</span> /create-client</h3>
          <p>Create a new WhatsApp client instance</p>
          <pre>{ "clientId": "client2" }</pre>
        </div>
        
        <div class="endpoint">
          <h3><span class="method method-delete">DELETE</span> /delete-client/:clientId</h3>
          <p>Delete a client instance</p>
          <code>/delete-client/client2</code>
        </div>
        
        <div class="endpoint">
          <h3><span class="method method-post">POST</span> /logout</h3>
          <p>Logout and reset client session</p>
          <code>/logout?clientId=default</code>
        </div>
        
        <div class="endpoint">
          <h3><span class="method method-post">POST</span> /reconnect</h3>
          <p>Force reconnect client</p>
          <code>/reconnect?clientId=default</code>
        </div>
      </div>
      
      <script>
        document.getElementById('createClientForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          const clientId = document.getElementById('newClientId').value.trim();
          
          if (!clientId) {
            alert('Please enter a client ID');
            return;
          }
          
          try {
            const response = await fetch('/create-client', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ clientId })
            });
            
            const data = await response.json();
            
            if (data.success) {
              alert('Client created successfully! Redirecting to QR code...');
              window.location.href = '/qr?clientId=' + clientId;
            } else {
              alert('Error: ' + (data.error || 'Unknown error'));
            }
          } catch (error) {
            alert('Error: ' + error.message);
          }
        });
      </script>
    </body>
    </html>
  `);
});

/**
 * CREATE CLIENT - Create a new WhatsApp client (PROTECTED)
 */
app.post("/create-client", requireAuth, async (req, res) => {
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
 * QR CODE - Display QR code for authentication (PROTECTED)
 */
app.get("/qr", requireAuth, async (req, res) => {
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

  if (forceRefresh) {
    try {
      await clientData.client.destroy();
      delete clients[clientId];

      clients[clientId] = createWhatsAppClient(clientId);
      await initializeClient(clientId);

      await new Promise((resolve) => setTimeout(resolve, 3000));

      return res.redirect(`/qr?clientId=${clientId}`);
    } catch (error) {
      console.error("Refresh error:", error);
    }
  }

  if (clientData.isReady && clientData.client.info) {
    return res.send(`
      <h2>✓ Client Connected</h2>
      <p>Client ID: <strong>${clientId}</strong></p>
      <p>User: <strong>${clientData.client.info.pushname}</strong></p>
      <p>Phone: <strong>${clientData.client.info.wid.user}</strong></p>
      <hr>
      <a href="/logout?clientId=${clientId}">Logout WhatsApp</a> | 
      <a href="/">Back to Home</a>
    `);
  }

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
          clientData.lastQRTimestamp
        ).toLocaleString()}</p>
        <p><a href="/qr?clientId=${clientId}">Refresh</a> | <a href="/qr?clientId=${clientId}&refresh=true">Force New QR</a></p>
        <script>setTimeout(() => location.reload(), 30000);</script>
      `);
    });
    return;
  }

  res.send(`
    <h2>Initializing...</h2>
    <p>Client ID: <strong>${clientId}</strong></p>
    <p>Waiting for QR code to be generated...</p>
    <script>setTimeout(() => location.reload(), 3000);</script>
  `);
});

/**
 * SEND MESSAGE - Send text/PDF message to a number (PROTECTED)
 */
app.post("/send-message", requireAuth, async (req, res) => {
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
      });
    } else {
      await clientData.client.sendMessage(chatId, message);
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
 * BROADCAST - Send message to multiple numbers (PROTECTED)
 */
app.post("/broadcast", requireAuth, async (req, res) => {
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
 * SEND IMAGE - Send image with caption (PROTECTED)
 */
app.post("/send-image", requireAuth, async (req, res) => {
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
 * STATUS - Get client connection status (PROTECTED)
 */
app.get("/status", requireAuth, async (req, res) => {
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
 * LOGOUT - Logout and reset client (PROTECTED)
 */
app.post("/logout", requireAuth, async (req, res) => {
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
 * RECONNECT - Force reconnect client (PROTECTED)
 */
app.post("/reconnect", requireAuth, async (req, res) => {
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
 * DELETE CLIENT - Remove a client instance (PROTECTED)
 */
app.delete("/delete-client/:clientId", requireAuth, async (req, res) => {
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
║   📱 Open http://localhost:${port} to view API docs         ║
║   🔒 Login: admin / whatsapp2024 (CHANGE THIS!)           ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `);

  console.log("\n⚠️  IMPORTANT: Change default credentials in production!");
  console.log("Set environment variables: AUTH_USERNAME and AUTH_PASSWORD\n");
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
