# Mint AI - Setup Guide

Your v0-free component generator powered by Claude!

## Quick Start

### 1. Get an Anthropic API Key

1. Go to [https://console.anthropic.com/](https://console.anthropic.com/)
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key (starts with `sk-ant-...`)

### 2. Configure Environment

```bash
# Copy the example env file
cp .env.local.example .env.local

# Edit .env.local and add your API key
ANTHROPIC_API_KEY=sk-ant-api03-...
```

### 3. Install Dependencies

```bash
bun install
```

### 4. Run Development Server

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## How It Works

### Component Generation Flow

1. **User inputs prompt** → "Create a todo list component"
2. **Claude generates code** → Uses Claude 3.5 Sonnet via Anthropic API
3. **Code is displayed** → View in "Code" tab
4. **Copy and use** → Click "Copy Code" to use in your project

### What You Get

- **TypeScript Components**: Fully typed React components
- **Tailwind Styling**: Pre-styled with your mint color palette
- **Modern Patterns**: Functional components with hooks
- **Chat History**: Continues conversation context
- **Code Export**: Easy copy-paste functionality

### Mint Color Palette

Available in all generated components:
- `mint-50` through `mint-900`
- Defined in [tailwind.config.ts](tailwind.config.ts)

## API Usage

### Chat Endpoint

**POST** `/api/chat`

```typescript
{
  message: string;    // User's component request
  chatId?: string;    // Optional chat ID for continuation
}
```

**Response:**

```typescript
{
  id: string;        // Chat ID for follow-ups
  code: string;      // Generated component code
  message: string;   // Claude's full response
}
```

## Customization

### Change AI Model

Edit [app/api/chat/route.ts](app/api/chat/route.ts#L71):

```typescript
const response = await anthropic.messages.create({
  model: "claude-3-5-sonnet-20241022", // Change this
  // ...
});
```

Available models:
- `claude-3-5-sonnet-20241022` (recommended)
- `claude-3-opus-20240229` (most capable)
- `claude-3-haiku-20240307` (fastest/cheapest)

### Customize System Prompt

Edit [lib/prompts.ts](lib/prompts.ts) to change how components are generated.

### Add Live Preview

To render components live (currently shows placeholder):

1. Install a component renderer (like `react-live`)
2. Update [components/PreviewPanel.tsx](components/PreviewPanel.tsx#L91-L104)
3. Handle component imports and dependencies

## Cost Estimates

Using Claude 3.5 Sonnet:
- **Input**: ~$3 per million tokens
- **Output**: ~$15 per million tokens
- **Average request**: ~$0.01-0.05 per component

Much cheaper than v0 API! 💰

## Troubleshooting

### "ANTHROPIC_API_KEY not configured"

Make sure you:
1. Created `.env.local` file
2. Added your API key
3. Restarted the dev server

### Build Errors

```bash
# Clean build
rm -rf .next
bun run build
```

### TypeScript Errors

```bash
# Run type check
bun typecheck
```

## Next Steps

### Improvements You Can Make

1. **Add Live Preview**: Render components dynamically
2. **Syntax Highlighting**: Use `highlight.js` or `prism`
3. **Component Library**: Save favorite components
4. **Export to Project**: Directly save to file system
5. **Multi-file Support**: Generate full component sets
6. **Image Support**: Upload UI screenshots for cloning
7. **Streaming**: Show generation progress in real-time

### Alternative AI Providers

Want to use OpenAI instead?

```bash
# Install OpenAI SDK
bun add openai

# Update app/api/chat/route.ts
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});
```

## Resources

- [Anthropic API Docs](https://docs.anthropic.com/)
- [Claude Models](https://www.anthropic.com/api)
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/)

## License

MIT - Build whatever you want!
