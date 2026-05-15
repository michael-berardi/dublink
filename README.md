# Dublink by DubHaven

QR-based digital menu display system for cannabis dispensaries. Open a TV to a URL, scan the QR code with your phone, and configure the menu in real-time.

## How It Works

1. **Open TV Display**: Navigate to `https://your-domain.com/tv/{session-id}` on any smart TV or display
2. **Scan QR Code**: Point your phone camera at the QR code shown on screen
3. **Configure Menu**: Use the mobile interface to add/edit products, categories, prices, and styling
4. **Real-Time Updates**: Changes appear instantly on the TV display via WebSocket

## Features

- **Zero-Install TV Setup**: Any device with a browser becomes a menu board
- **Phone-Based Configuration**: No keyboard or mouse needed for the TV
- **Real-Time Sync**: WebSocket-powered instant updates
- **Multiple Layouts**: Grid, list, or card views
- **Stock Management**: Toggle items in/out of stock with one tap
- **Custom Branding**: Colors, fonts, dispensary name
- **THC/CBD Display**: Optional potency indicators
- **Strain Types**: Indica/Sativa/Hybrid badges
- **Auto Fullscreen**: TV enters kiosk mode automatically
- **Dark/Light Themes**: Choose your aesthetic

## Tech Stack

- Next.js 16 + React 19 + TypeScript
- Tailwind CSS v4
- Socket.io for real-time communication
- QRCode.js for QR generation
- Custom Node.js server (Socket.io + Next.js)

## Quick Start

```bash
# Install dependencies
npm install

# Development (starts custom server with Socket.io)
npm run dev

# Production build
npm run build
npm start
```

The app runs on port 3000 by default (or set `PORT` env var).

## Usage

### TV Display
Open `http://localhost:3000/tv/demo` on your TV. Click "Show Demo Menu" to see the sample menu, or scan the QR code to configure.

### Mobile Config
Scan the QR code on the TV, or navigate directly to `http://localhost:3000/config/demo`.

### Custom Session IDs
Replace `demo` with any unique identifier:
- TV: `http://localhost:3000/tv/my-dispensary-123`
- Config: `http://localhost:3000/config/my-dispensary-123`

## Menu Management

### Categories
- Flower
- Edibles
- Concentrates
- Vapes
- (Add your own)

### Product Fields
- Name
- Price
- THC/CBD percentages
- Strain type (Indica/Sativa/Hybrid)
- In-stock status
- Description (optional)

## Deployment

### Railway (Recommended)
```bash
railway up
```

### Self-Hosted
```bash
npm run build
PORT=3000 node server.js
```

### Environment Variables
- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Set to `production` for production mode

## Architecture

```
src/
  app/
    tv/[sessionId]/      # TV display page (kiosk mode)
    config/[sessionId]/  # Mobile config interface
    api/socket/          # Socket.io initialization endpoint
    layout.tsx           # Root layout
    page.tsx             # Redirects to /tv/demo
  lib/
    types.ts             # TypeScript interfaces
    session-store.ts     # Session management
server.js                # Custom Next.js + Socket.io server
```

## License

Proprietary - DubHaven

## Support

For support, contact DubHaven.
