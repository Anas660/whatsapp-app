# WhatsApp API Documentation (Internal)

This document contains detailed API documentation for internal reference only.

## Features

- WhatsApp integration via whatsapp-web.js
- Multi-client support
- Message sending (text, images, PDFs)
- Broadcasting capabilities
- QR code authentication

## Active Clients Management

The system supports multiple WhatsApp client instances. Each client can be managed independently.

## API Endpoints

### 1. Send Message

**POST** `/send-message`

Send a text message or PDF to a WhatsApp number.

**Request Body:**

```json
{
  "number": "923001234567",
  "message": "Your reminder message",
  "pdfUrl": "https://example.com/invoice.pdf", // optional
  "clientId": "default" // optional
}
```

**Response:**

```json
{
  "success": true,
  "message": "Message sent successfully"
}
```

---

### 2. Broadcast Message

**POST** `/broadcast`

Send messages to multiple recipients.

**Request Body:**

```json
{
  "numbers": ["923001234567", "923007654321"],
  "message": "Broadcast message",
  "pdfUrl": "https://example.com/file.pdf", // optional
  "clientId": "default", // optional
  "delayMs": 2000 // delay between messages (default: 2000ms)
}
```

**Response:**

```json
{
  "success": true,
  "results": [
    { "number": "923001234567", "success": true },
    { "number": "923007654321", "success": true }
  ]
}
```

---

### 3. Send Image

**POST** `/send-image`

Send an image with optional caption.

**Request Body:**

```json
{
  "number": "923001234567",
  "imageUrl": "https://example.com/image.jpg",
  "caption": "Your image caption", // optional
  "clientId": "default" // optional
}
```

**Response:**

```json
{
  "success": true,
  "message": "Image sent successfully"
}
```

---

### 4. Check Status

**GET** `/status`

Check client connection status.

**Query Parameters:**

- `clientId` (optional): Client identifier (default: "default")

**Example:**

```
GET /status?clientId=default
```

**Response:**

```json
{
  "clientId": "default",
  "ready": true,
  "authenticated": true,
  "hasQR": false,
  "info": {
    "name": "User Name",
    "phone": "923001234567"
  }
}
```

---

### 5. Get QR Code

**GET** `/qr`

Get QR code for authentication.

**Query Parameters:**

- `clientId` (optional): Client identifier (default: "default")

**Example:**

```
GET /qr?clientId=default
```

**Response:**

- HTML page with QR code image that can be scanned with WhatsApp

---

### 6. Create Client

**POST** `/create-client`

Create a new WhatsApp client instance.

**Request Body:**

```json
{
  "clientId": "client2"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Client client2 created successfully",
  "clientId": "client2"
}
```

---

### 7. Delete Client

**DELETE** `/delete-client/:clientId`

Delete a client instance.

**Example:**

```
DELETE /delete-client/client2
```

**Response:**

```json
{
  "success": true,
  "message": "Client client2 deleted successfully"
}
```

---

### 8. Logout

**POST** `/logout`

Logout and reset client session.

**Query Parameters:**

- `clientId` (optional): Client identifier (default: "default")

**Example:**

```
POST /logout?clientId=default
```

**Response:**

```json
{
  "success": true,
  "message": "Client logged out successfully"
}
```

---

### 9. Reconnect

**POST** `/reconnect`

Force reconnect client.

**Query Parameters:**

- `clientId` (optional): Client identifier (default: "default")

**Example:**

```
POST /reconnect?clientId=default
```

**Response:**

```json
{
  "success": true,
  "message": "Client reconnected successfully"
}
```

---

## Error Responses

All endpoints return error responses in the following format:

```json
{
  "success": false,
  "error": "Error description"
}
```

Common HTTP status codes:

- `400`: Bad Request (invalid parameters)
- `404`: Client not found or not ready
- `500`: Internal server error

---

## Phone Number Format

Phone numbers should be in international format without '+' sign:

- ✅ Correct: `923001234567` (Pakistan)
- ✅ Correct: `14155551234` (USA)
- ❌ Incorrect: `+923001234567`
- ❌ Incorrect: `03001234567`

---

## Multi-Client Support

The system supports multiple WhatsApp client instances. Each client:

- Has a unique `clientId`
- Maintains its own authentication session
- Can be used independently
- Has separate QR code for authentication

Default client ID is `"default"`.

---

## Integration Examples

### Laravel/PHP Example

```php
$response = Http::post('http://localhost:3000/send-message', [
    'number' => '923001234567',
    'message' => 'Your reminder message',
    'clientId' => 'default'
]);

$result = $response->json();
```

### cURL Example

```bash
curl -X POST http://localhost:3000/send-message \
  -H "Content-Type: application/json" \
  -d '{
    "number": "923001234567",
    "message": "Hello from API"
  }'
```

---

## Security Notes

⚠️ **Important Security Considerations:**

1. **API Protection**: This API should NOT be exposed publicly without authentication
2. **Use API Gateway**: Implement authentication middleware or use behind a secure API gateway
3. **Environment Variables**: Store sensitive configuration in environment variables
4. **Rate Limiting**: Implement rate limiting to prevent abuse
5. **Whitelist IPs**: Consider IP whitelisting for production
6. **HTTPS**: Always use HTTPS in production
7. **Input Validation**: All inputs are validated but additional sanitization may be needed

---

## Configuration

The server runs on port defined by `PORT` environment variable or defaults to 3000.

```bash
PORT=3000 node index.js
```

---

## Troubleshooting

### Client Not Ready

If client is not ready, ensure:

1. QR code has been scanned
2. Phone is connected to internet
3. Check `/status` endpoint for current state

### QR Code Not Appearing

1. Wait a few seconds after starting the server
2. Check console logs for errors
3. Try accessing `/qr?clientId=default`
4. May need to delete `.wwebjs_auth` folder and restart

### Message Not Sending

1. Verify client is ready (`/status`)
2. Check phone number format (international, no '+')
3. Ensure phone is connected to internet
4. Check console logs for detailed errors

---

_Last Updated: January 27, 2026_
