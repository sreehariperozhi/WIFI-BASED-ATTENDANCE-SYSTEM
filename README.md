# WiFi-Based Attendance System

A modern web application for managing student attendance using WiFi-based detection. This system allows faculty to track student attendance automatically when students connect to the designated WiFi network.

## Features

- WiFi-based automatic attendance tracking
- Faculty dashboard for managing attendance
- Student portal for viewing attendance records
- Real-time attendance monitoring
- Export attendance data to Excel

## Technologies Used

This project is built with:

- **Vite** - Fast build tool and development server
- **TypeScript** - Type-safe JavaScript
- **React** - UI library
- **shadcn-ui** - Modern UI components
- **Tailwind CSS** - Utility-first CSS framework
- **Supabase** - Backend and database
- **React Router** - Client-side routing
- **React Query** - Data fetching and caching

## Getting Started

### Prerequisites

- Node.js (v18 or higher) - [Install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
- npm or yarn package manager

### Installation

1. Clone the repository:
```sh
git clone <YOUR_GIT_URL>
cd WIFI-BASED-ATTENDANCE-SYSTEM
```

2. Install dependencies:
```sh
npm install
```

3. Set up environment variables:
   - Create a `.env` file in the root directory
   - Add your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Start the development server:
```sh
npm run dev
```

The application will be available at `http://localhost:8080`

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build for production
- `npm run build:dev` - Build in development mode
- `npm run preview` - Preview the production build
- `npm run lint` - Run ESLint

## Project Structure

```
src/
├── components/     # Reusable UI components
├── pages/         # Page components (Landing, Faculty, Student)
├── lib/           # Utility functions and helpers
├── hooks/         # Custom React hooks
├── integrations/  # Third-party integrations (Supabase)
└── App.tsx        # Main application component
```

## Deployment

Build the project for production:

```sh
npm run build
```

The built files will be in the `dist` directory, ready to be deployed to any static hosting service like Vercel, Netlify, or AWS S3.

## License

See the LICENSE file for details.
