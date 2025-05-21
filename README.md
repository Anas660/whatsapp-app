# WhatsApp Reminder & Invoice API

This Node.js application uses [whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js) to send WhatsApp messages. It exposes an Express API for integration with a Laravel CMS, allowing you to send reminders and invoices to customers.

## Features

- WhatsApp integration via whatsapp-web.js
- Express API endpoints for sending messages
- CORS enabled for cross-origin requests

## Getting Started

1. Install dependencies: `npm install`
2. Start the server: `node index.js`
3. Integrate with your Laravel CMS by making HTTP requests to the API endpoints.

## Configuration

- You may need to scan a QR code on first run to authenticate WhatsApp.
- Customize endpoints as needed for reminders and invoices.

## Security

- Ensure your API is protected if exposed to the internet.

---

For more details, see the source code and comments.
