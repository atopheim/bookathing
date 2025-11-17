# BookAThing

A modern, feature-rich resource booking system similar to Calendly. Perfect for shared spaces, coworking areas, residential buildings, and businesses that need to manage bookable resources like washing machines, meeting rooms, parking spots, and more.

![BookAThing](https://img.shields.io/badge/version-2.0.0-blue.svg)
![License](https://img.shields.io/badge/license-ISC-green.svg)

## Features

- **Multi-Resource Management** - Book washing machines, meeting rooms, saunas, parking spots, and more
- **Real-Time Status Tracking** - See if resources are currently in use (on/off state)
- **YAML Configuration** - Easy-to-customize settings without code changes
- **Modern UI** - Fresh, responsive design with Tailwind CSS and smooth animations
- **Embeddable Widget** - Integrate booking into any website with an iframe
- **Admin Dashboard** - Manage bookings, approve requests, and view statistics
- **Conflict Detection** - Prevents double bookings automatically
- **Timezone Support** - Works across different timezones
- **Flexible Scheduling** - Configurable working hours per resource and day

## Tech Stack

### Frontend
- React 18 with Hooks
- Tailwind CSS for styling
- Framer Motion for animations
- React Router 6 for navigation
- Heroicons for icons
- date-fns for date handling

### Backend
- Node.js + Express
- YAML configuration
- Firebase Firestore (optional)
- In-memory storage fallback
- RESTful API

## Quick Start

### Prerequisites

- Node.js 16+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/bookathing.git
   cd bookathing
   ```

2. **Install server dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Install client dependencies**
   ```bash
   cd ../client
   npm install
   ```

4. **Configure the application**

   Edit `server/config.yaml` to customize:
   - Resources (washing machines, rooms, etc.)
   - Working hours
   - Slot durations
   - Business information

5. **Start the server**
   ```bash
   cd ../server
   npm start
   # Server runs on http://localhost:5000
   ```

6. **Start the client** (in a new terminal)
   ```bash
   cd client
   npm start
   # Client runs on http://localhost:3000
   ```

7. **Open your browser**
   Navigate to `http://localhost:3000`

## Configuration

The entire system is configured via `server/config.yaml`. Here's what you can customize:

### App Settings
```yaml
app:
  name: "BookAThing"
  description: "Modern resource booking system"
  primaryColor: "#6366f1"
```

### Business Information
```yaml
business:
  name: "Shared Living Community"
  timezone: "Europe/Oslo"
  currency: "NOK"
```

### Working Hours
```yaml
workingHours:
  monday:
    enabled: true
    start: "06:00"
    end: "23:00"
  # ... other days
```

### Resources
```yaml
resources:
  - id: "washing-machine-1"
    name: "Washing Machine #1"
    type: "appliance"
    description: "Front-loading washer, 8kg capacity"
    icon: "washing-machine"
    color: "#3b82f6"
    location: "Basement - Room 101"
    slotDuration: 120  # minutes
    maxBookingsPerDay: 3
    showStatus: true  # Show on/off indicator
    tags: ["laundry", "appliance"]
```

### Embed Settings
```yaml
embed:
  enabled: true
  allowedDomains: ["*"]
  defaultTheme: "light"
```

## API Endpoints

### Configuration
- `GET /api/config` - Get app configuration
- `GET /api/health` - Health check

### Resources
- `GET /api/resources` - List all resources
- `GET /api/resources/:id` - Get single resource
- `GET /api/resources/:id/status` - Get resource status (on/off)
- `PUT /api/resources/:id/status` - Update resource status (for IoT)
- `GET /api/resources/:id/slots?date=YYYY-MM-DD&timezone=UTC` - Get available slots

### Bookings
- `POST /api/bookings` - Create a booking
- `GET /api/bookings` - List bookings (with filters)
- `GET /api/bookings/:id` - Get single booking
- `DELETE /api/bookings/:id` - Cancel booking
- `PUT /api/bookings/:id/status` - Update booking status

### Statistics
- `GET /api/stats` - Get dashboard statistics

## Embedding

Embed the booking widget on any website:

### Full Widget
```html
<iframe
  src="https://your-domain.com/embed"
  width="100%"
  height="800"
  frameborder="0">
</iframe>
```

### Single Resource Widget
```html
<iframe
  src="https://your-domain.com/embed/washing-machine-1"
  width="100%"
  height="700"
  frameborder="0">
</iframe>
```

## Project Structure

```
bookathing/
├── client/                    # React frontend
│   ├── public/               # Static assets
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   │   ├── Layout.js     # Main layout wrapper
│   │   │   ├── Calendar.js   # Date picker
│   │   │   ├── TimeSlotPicker.js
│   │   │   └── ResourceCard.js
│   │   ├── pages/            # Route pages
│   │   │   ├── HomePage.js   # Resource listing
│   │   │   ├── BookingPage.js
│   │   │   ├── ConfirmationPage.js
│   │   │   ├── AdminPage.js  # Dashboard
│   │   │   └── EmbedPage.js  # Embeddable widget
│   │   ├── hooks/            # Custom React hooks
│   │   ├── utils/            # API client
│   │   ├── App.js
│   │   └── index.css         # Tailwind CSS
│   ├── tailwind.config.js
│   └── package.json
│
├── server/                    # Express backend
│   ├── config.yaml           # Main configuration
│   ├── configLoader.js       # YAML parser
│   ├── server.js             # API endpoints
│   ├── db.js                 # Firebase connection
│   └── package.json
│
└── README.md
```

## Deployment

### Production Build

1. Build the client:
   ```bash
   cd client
   npm run build
   ```

2. Copy build to server:
   ```bash
   cp -r build ../server/
   ```

3. Deploy server (Heroku, Railway, etc.)

### Environment Variables

**Server:**
- `PORT` - Server port (default: 5000)
- Firebase credentials (optional)

**Client:**
- `REACT_APP_API_URL` - Backend API URL

## IoT Integration

For real-time status tracking (e.g., detecting if a washing machine is running):

```bash
# Update resource status
curl -X PUT http://localhost:5000/api/resources/washing-machine-1/status \
  -H "Content-Type: application/json" \
  -d '{"status": "in_use"}'
```

Status options: `available`, `in_use`, `maintenance`, `offline`

## Customization

### Adding New Resource Types

1. Edit `server/config.yaml`
2. Add icon mapping in `client/src/components/ResourceCard.js`
3. Restart the server (config auto-reloads)

### Theming

Modify `client/tailwind.config.js` to change:
- Primary colors
- Animations
- Spacing

### Adding Authentication

The system is ready for auth integration:
1. Add middleware to server
2. Implement login in client
3. Set `admin.requireAuth: true` in config

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

ISC License

## Support

For issues and feature requests, please open a GitHub issue.

---

Built with React, Express, and Tailwind CSS
