# OpenRouter Model Guide

## Best FREE Models for Code Generation

### 1. Qwen 3 Coder (FREE) ⭐ RECOMMENDED
```
qwen/qwen3-coder:free
```
- **Best for**: Code generation, debugging, React/TypeScript
- **Strengths**: Excellent code quality, fast, specialized for coding
- **Context**: 32k tokens
- **Cost**: FREE!

### 2. Google Gemini Flash 1.5 8B (FREE)
```
google/gemini-flash-1.5-8b
```
- **Best for**: Fast responses, simple tasks
- **Strengths**: Very fast, good for quick components
- **Context**: 1M tokens
- **Cost**: FREE!

## Best PAID Models for Code Generation (Cheap)

### 1. DeepSeek Coder V2 Instruct ⭐ BEST VALUE
```
deepseek/deepseek-coder-v2-instruct
```
- **Best for**: Complex components, full applications
- **Strengths**: State-of-the-art code generation
- **Context**: 128k tokens
- **Cost**: $0.14 per 1M input tokens, $0.28 per 1M output
- **Note**: ~100x cheaper than GPT-4!

### 2. Qwen 2.5 Coder 32B (Paid)
```
qwen/qwen-2.5-coder-32b-instruct
```
- **Best for**: When free tier is exhausted
- **Strengths**: Excellent code quality
- **Context**: 32k tokens
- **Cost**: $0.12 per 1M input, $1.2 per 1M output

### 3. Claude 3.5 Sonnet (Premium)
```
anthropic/claude-3.5-sonnet
```
- **Best for**: Production apps, complex logic
- **Strengths**: Best reasoning, excellent TypeScript
- **Context**: 200k tokens
- **Cost**: $3 per 1M input, $15 per 1M output

## How to Change Models

### Option 1: Environment Variable (Recommended)
Edit your `.env.local`:
```bash
OPENROUTER_MODEL=qwen/qwen3-coder:free
```

### Option 2: Direct API Edit
Edit `app/api/chat/route.ts`:
```typescript
const model = "deepseek/deepseek-coder-v2-instruct";
```

## Model Comparison for Component Generation

| Model | Quality | Speed | Cost | Context |
|-------|---------|-------|------|---------|
| Qwen 3 Coder Free | ⭐⭐⭐⭐⭐ | ⚡⚡⚡⚡ | FREE | 32k |
| Gemini Flash 1.5 8B | ⭐⭐⭐ | ⚡⚡⚡⚡⚡ | FREE | 1M |
| DeepSeek Coder V2 | ⭐⭐⭐⭐⭐ | ⚡⚡⚡ | $0.0001/req | 128k |
| Claude 3.5 Sonnet | ⭐⭐⭐⭐⭐ | ⚡⚡ | $0.01/req | 200k |

## Cost Examples (Typical Component Request)

**Qwen 3 Coder Free**:
- Cost: $0.00
- Quality: Excellent (specialized for coding)
- Speed: Fast

**DeepSeek Coder V2**:
- Input: ~500 tokens = $0.00007
- Output: ~2000 tokens = $0.00056
- **Total: ~$0.0006 per component** (less than a penny!)

**Claude 3.5 Sonnet**:
- Input: ~500 tokens = $0.0015
- Output: ~2000 tokens = $0.03
- **Total: ~$0.03 per component**

## Getting Your OpenRouter API Key

1. Visit: https://openrouter.ai/keys
2. Sign up (free)
3. Click "Create Key"
4. Copy your key (starts with `sk-or-...`)
5. Add to `.env.local`:
   ```bash
   OPENROUTER_API_KEY=sk-or-v1-...
   ```

## Free Tier Limits

OpenRouter free tier:
- **Daily limit**: Varies by model
- **Rate limit**: ~10 requests/minute
- **Quality**: Same as paid!

No credit card required for free models!

## Advanced: Model Routing

Want to use the best model available automatically?

Edit `app/api/chat/route.ts`:
```typescript
const models = [
  "qwen/qwen-2.5-coder-32b-instruct:free", // Try free first
  "deepseek/deepseek-coder-v2-instruct",   // Fallback to cheap
];

// Try each model until one works
for (const model of models) {
  try {
    const stream = await client.chat.completions.create({
      model,
      // ... rest of config
    });
    break; // Success!
  } catch (error) {
    continue; // Try next model
  }
}
```

## Recommended Setup

### For Development (Free):
```bash
OPENROUTER_MODEL=qwen/qwen3-coder:free
```

### For Production (Best Value):
```bash
OPENROUTER_MODEL=deepseek/deepseek-coder
```

### For Enterprise (Best Quality):
```bash
OPENROUTER_MODEL=anthropic/claude-3.5-sonnet
```

## Testing Different Models

Try each model and see which works best for your needs:

```bash
# Test 1: Qwen 3 Coder Free (best for coding)
OPENROUTER_MODEL=qwen/qwen3-coder:free bun run dev

# Test 2: DeepSeek (cheap, excellent quality)
OPENROUTER_MODEL=deepseek/deepseek-coder bun run dev

# Test 3: Gemini (fast)
OPENROUTER_MODEL=google/gemini-flash-1.5-8b bun run dev
```

## Model Performance Tips

1. **For code generation**: Use Qwen 3 Coder (free, specialized)
2. **For complex apps**: Use DeepSeek or Claude
3. **For fast iteration**: Use Gemini Flash
4. **For production**: Use DeepSeek (great quality + cheap)

## Troubleshooting

### "Model not available"
- Check model name spelling
- Verify OpenRouter API key is valid
- Try a different model from the free list

### "Rate limit exceeded"
- Wait 60 seconds
- Switch to a different free model
- Consider upgrading to paid tier

### Slow responses
- Try Gemini Flash for speed
- Check your internet connection
- Consider using a paid model

## Resources

- **Model List**: https://openrouter.ai/models
- **Pricing**: https://openrouter.ai/docs#models
- **API Docs**: https://openrouter.ai/docs

---

**TL;DR**: Start with `qwen/qwen3-coder:free` - it's FREE and excellent for code generation!
