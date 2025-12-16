# Add API Route

Create a new Next.js API route with v0 SDK integration.

## Usage

`/add-api-route endpoint-name`

## Steps

1. Create directory: `app/api/$ARGUMENTS/`

2. Create route file: `app/api/$ARGUMENTS/route.ts`

3. Use this template:
```typescript
import { NextRequest, NextResponse } from "next/server";

interface RequestBody {
  // Define request type
}

interface ResponseData {
  // Define response type
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // 1. Validate input
    const body: RequestBody = await req.json();

    if (!body.requiredField) {
      return NextResponse.json(
        { error: "requiredField is required" },
        { status: 400 }
      );
    }

    // 2. Check environment
    if (!process.env.V0_API_KEY) {
      return NextResponse.json(
        { error: "V0_API_KEY not configured" },
        { status: 500 }
      );
    }

    // 3. Business logic (use v0 SDK if needed)
    // import { V0Client } from "v0-sdk";
    // const v0Client = new V0Client({ apiKey: process.env.V0_API_KEY });

    // 4. Return response
    const response: ResponseData = {
      // data
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
```

4. Type-check the API:
   ```bash
   bun typecheck app/api
   ```

5. Test the endpoint:
   ```bash
   bun run dev
   # In another terminal:
   curl -X POST http://localhost:3000/api/$ARGUMENTS \
     -H "Content-Type: application/json" \
     -d '{"field": "value"}'
   ```

6. Test in component (see `app/page.tsx` for pattern):
   ```typescript
   const response = await fetch("/api/$ARGUMENTS", {
     method: "POST",
     headers: { "Content-Type": "application/json" },
     body: JSON.stringify(data),
   });
   ```

7. Commit:
   ```bash
   git add app/api/$ARGUMENTS/route.ts
   git commit -m "feat: add $ARGUMENTS API endpoint"
   ```

## Rules to Follow

- ✅ Define request/response types as interfaces
- ✅ Validate all input fields
- ✅ Check environment variables before use
- ✅ Return appropriate HTTP status codes
- ✅ Handle all error paths with try-catch
- ✅ Log errors (but never secrets)
- ✅ Use v0 SDK for component generation
- ❌ Never commit secrets or API keys
- ❌ Don't trust client input (always validate)
- ❌ Don't log sensitive data

## HTTP Status Codes

- 200: OK - Request successful
- 201: Created - New resource created
- 400: Bad Request - Validation error
- 401: Unauthorized - Auth required
- 429: Too Many Requests - Rate limited
- 500: Internal Server Error - Server bug

Reference: `app/api/CLAUDE.md` for detailed patterns and v0 SDK integration.
