# Mint AI

Generate UI fast with AI. A v0.dev-style component generator powered by the v0 Platform API.

## Features

- **Chat-based UI generation** - Describe what you want, and AI generates the code
- **Live preview** - See your component rendered in real-time
- **Split-screen interface** - Chat on the left, live preview on the right
- **Built with modern stack** - Next.js 16, TypeScript, Tailwind CSS, shadcn/ui
- **Type-safe** - Full TypeScript support throughout
- **Toast notifications** - Feedback on generation status and errors

## Quick Start

### Prerequisites

- [Bun](https://bun.sh) (as package manager and runtime)
- A [v0 Platform API key](https://v0.dev/settings/api-keys)

### Installation

```bash
# Install dependencies
bun install

# Set up environment
cp .env.local.example .env.local
# Edit .env.local and add your V0_API_KEY
```

### Development

```bash
# Start development server
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) and start describing components to generate.

### Build & Deploy

```bash
# Build for production
bun run build

# Start production server
bun run start
```

## Project Structure

```
.
├── app/
│   ├── api/chat/route.ts      # Chat API endpoint with v0 integration
│   ├── page.tsx                # Main split-screen interface
│   ├── layout.tsx              # Root layout with metadata
│   └── globals.css             # Global styles
├── components/
│   ├── ChatPanel.tsx           # Chat interface component
│   └── PreviewPanel.tsx        # Live preview component
├── next.config.ts             # Next.js configuration
├── tailwind.config.ts         # Tailwind CSS configuration
└── tsconfig.json              # TypeScript configuration
```

## Configuration

Create a `.env.local` file with:

```
V0_API_KEY=your_v0_api_key_here
```

Get your API key from [v0.dev/settings/api-keys](https://v0.dev/settings/api-keys).

## API Reference

### POST /api/chat

Sends a message to generate a component.

**Request:**
```typescript
{
  message: string;      // Component description
  chatId?: string;      // Optional chat ID for continuing conversations
}
```

**Response:**
```typescript
{
  id: string;           // Chat ID for future messages
  demo: string;         // URL to live preview
  message?: string;     // Response message from AI
}
```

## Technologies

- **Framework**: Next.js 16
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Package Manager**: Bun
- **Runtime**: Bun
- **AI Integration**: v0 Platform API (via v0-sdk)
- **Notifications**: Sonner
- **Icons**: Lucide React

## License

MIT
