# Stripe Connect API for FlutterFlow

This API provides endpoints to connect your FlutterFlow app with Stripe Connect, allowing you to build a marketplace platform.

## Project Structure

```
stripe-connect-api/
├── config/               # Configuration files
│   └── index.js          # Main config
├── controllers/          # Business logic
│   ├── stripeConnectController.js
│   └── webhookController.js
├── models/               # Data models
│   └── db.js             # Database module (in-memory for development)
├── routes/               # API routes
│   ├── stripeConnectRoutes.js
│   └── webhookRoutes.js
├── .env                  # Environment variables (create from .env.example)
├── .env.example          # Example environment variables
├── package.json          # Project dependencies
├── README.md             # This file
└── server.js             # Entry point
```

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Stripe account with Connect enabled
- FlutterFlow project

## Installation

1. Clone this repository:
   ```
   git clone https://github.com/yourusername/stripe-connect-api.git
   cd stripe-connect-api
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file from the example:
   ```
   cp .env.example .env
   ```

4. Update the `.env` file with your Stripe API keys and other configuration.

## Configuration

1. Create a Stripe account and enable Connect.
2. Get your API keys from the Stripe Dashboard.
3. Set up a webhook endpoint in Stripe to point to your `/webhook` endpoint.
4. Update the `.env` file with your configuration.

## Running the Server

### Development
```
npm run dev
```

### Production
```
npm start
```

## API Endpoints

### Create a Connected Account

Creates a new Stripe Connect account for a seller.

```
POST /api/stripe/connect/create-account
```

**Request Body:**
```json
{
  "email": "seller@example.com",
  "uid": "user_123",
  "name": "John Seller",
  "phone": "+5511912345678",
  "country": "BR",
  "business_type": "individual"
}
```

### Get Account Status

Retrieves the status of a seller's Stripe Connect account.

```
GET /api/stripe/connect/status/:uid
```

### Refresh Onboarding Link

Generates a new onboarding link for incomplete accounts.

```
POST /api/stripe/connect/refresh-onboarding/:uid
```

## FlutterFlow Integration

See the [FlutterFlow Implementation Guide](docs/flutterflow-integration.md) for detailed instructions on how to integrate this API with your FlutterFlow app.

## Webhook Events

The API handles the following Stripe webhook events:

- `account.updated`
- `account.application.authorized`
- `account.application.deauthorized`
- `account.external_account.created`
- `capability.updated`
- `person.updated`

## Production Deployment

Before deploying to production:

1. Replace the in-memory database with a proper database solution (MongoDB, PostgreSQL, etc.)
2. Add authentication and authorization
3. Add error logging and monitoring
4. Set up appropriate security headers
5. Configure proper rate limiting

## License

This project is licensed under the ISC License.