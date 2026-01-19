# 🚀 **UPDATED LOGGING & ERROR TRACKING INTEGRATION GUIDE**

This document outlines the optimized approach for logging and error tracking with Convex, based on official Convex documentation and best practices.

## 🎯 **STRATEGY OVERVIEW**

### **Two-Tier Logging Architecture**

| Layer | Tool | Purpose | History | Real-time |
|-------|------|---------|---------|-----------|
| **Next.js** | Pino + Loki Transport | Server actions, API routes | ✅ Long-term | ⚠️ Batched |
| **Convex** | Simple console.* + Optional Loki | Function execution | ✅ Dashboard + Optional Loki | ✅ Real-time |

### **Error Tracking**

| Component | Method | Pro Feature |
|-----------|--------|-------------|
| **Next.js** | Existing Sentry setup | ✅ Continues working |
| **Convex** | Native Sentry integration | ✅ Pro plan required |

---

## 🔧 **SETUP INSTRUCTIONS**

### **1. Convex Pro Plan Setup**

1. **Upgrade to Convex Pro** (required for Sentry integration)
2. **Navigate to Dashboard** → Deployment Settings → Integrations
3. **Configure Sentry** with your DSN: `https://90d0f3dd02d7a97c2fafca08eacf6d14@o4509634965602304.ingest.us.sentry.io/4509634981068800`

### **2. Environment Variables**

Add to your `.env.local`:

```bash
# Convex (existing)
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
NEXT_PUBLIC_CONVEX_SITE_URL=http://localhost:3000

# Loki (existing)
LOKI_ENABLED=true
LOKI_INSTANCE_ID=your-instance-id
LOKI_TOKEN=your-loki-token
LOKI_URL=https://logs-prod-036.grafana.net/loki/api/v1/push

# Sentry (existing - continues to work)
NEXT_PUBLIC_SENTRY_DSN=https://90d0f3dd02d7a97c2fafca08eacf6d14@o4509634965602304.ingest.us.sentry.io/4509634981068800
```

### **3. Update Convex Functions with Logging**

Use the new simplified logging patterns:

```typescript
import { createLoggingContext, extractTraceId } from "../lib/logging";
import { withErrorHandling } from "../lib/error-handling";

export const createPost = mutation({
  args: {
    title: v.string(),
    content: v.string(),
    eventId: v.id("events"),
    _traceId: v.optional(v.string()), // For request correlation
  },
  handler: async (ctx, { title, content, eventId, _traceId }) => {
    return withErrorHandling(
      async () => {
        const traceId = extractTraceId({ _traceId });
        const logger = createLoggingContext("posts", traceId);

        logger.info("Creating post", { title: title.slice(0, 50), eventId });

        // Your business logic here...

        logger.info("Post created successfully", { postId });
        return result;
      },
      { module: "posts", traceId, operation: "createPost" }
    );
  },
});
```

### **4. Frontend: Pass Trace ID to Convex**

Update your React components to pass trace IDs:

```typescript
// hooks/use-trace-id.ts
import { headers } from "next/headers";

export function useTraceId() {
  // In server components
  if (typeof window === "undefined") {
    const headersList = headers();
    return headersList.get("x-trace-id") || undefined;
  }

  // In client components, get from a context or generate
  return undefined;
}

// Component usage
export function CreatePostForm() {
  const traceId = useTraceId();
  const createPost = useMutation(api.posts.mutations.createPost);

  const handleSubmit = async (data) => {
    await createPost({
      ...data,
      _traceId: traceId, // Pass to Convex
    });
  };
}
```

---

## 📊 **LOGGING OUTPUTS**

### **Convex Dashboard Logs**

```
🔍 [DEBUG] Starting operation | { module: "posts", traceId: "abc123", operation: "createPost" }
ℹ️ [INFO] Creating post | { module: "posts", traceId: "abc123", title: "Hello World", eventId: "k1..." }
⚠️ [WARN] Slow query detected | { module: "posts", traceId: "abc123", duration: 1200 }
❌ [ERROR] Post creation failed | { module: "posts", traceId: "abc123", error: {...} }
```

### **Loki (Optional Streaming)**

Query in Grafana:
```logql
{service="groupi", source="convex"} | json | traceId="abc123"
```

Sample log entry:
```json
{
  "timestamp": 1703123456789,
  "level": "info",
  "module": "posts",
  "traceId": "abc123",
  "message": "Post created successfully",
  "postId": "k1b2c3d4"
}
```

### **Sentry (Automatic via Convex Pro)**

Convex automatically adds these tags to errors:
- `func`: Function name ("posts/mutations:createPost")
- `func_type`: "mutation"
- `environment`: "dev"/"prod"
- `request_id`: Convex request ID
- `user`: Auth token identifier

---

## 🔄 **TRACE CORRELATION**

### **Request Flow**

```
1. Next.js Middleware → x-trace-id: abc123
2. React Component → passes _traceId: abc123
3. Convex Function → logs with traceId: abc123
4. Loki Logs → filterable by traceId
5. Sentry Errors → includes request context
```

### **Debugging Workflow**

1. **User reports issue** → Get approximate timestamp
2. **Check Convex Dashboard** → Filter by time, function name
3. **Find trace ID** → Copy from log entry
4. **Query Loki** → `{service="groupi"} | json | traceId="abc123"`
5. **Check Sentry** → Look for corresponding errors

---

## 📈 **PERFORMANCE & COSTS**

### **Logging Volume Estimates**

| Source | Logs/Day | Cost Impact |
|--------|----------|-------------|
| **Convex Dashboard** | All | ✅ Free (short retention) |
| **Loki Streaming** | Important only | 💰 Grafana Cloud rates |
| **Sentry Errors** | Errors only | 💰 Sentry error budget |

### **Optimization Tips**

1. **Debug logs**: Only in development
2. **Info logs**: Key business events
3. **Warn logs**: Performance issues
4. **Error logs**: Always captured

---

## 🚨 **ERROR HANDLING PATTERNS**

### **Expected Errors (ConvexError)**

```typescript
import { createPermissionError } from "../lib/error-handling";

if (membership.role !== "ORGANIZER") {
  throw createPermissionError(
    "Only organizers can delete events",
    { module: "events", traceId, operation: "deleteEvent" },
    { requiredRole: "ORGANIZER", userRole: membership.role }
  );
}
```

### **Unexpected Errors (Auto-handled)**

```typescript
import { withErrorHandling } from "../lib/error-handling";

export const riskyOperation = mutation({
  handler: async (ctx, args) => {
    return withErrorHandling(
      async () => {
        // Any thrown error automatically becomes ConvexError
        await externalApiCall(); // If this fails, auto-handled
        return result;
      },
      { module: "external", traceId, operation: "riskyOperation" }
    );
  },
});
```

---

## 🎯 **MIGRATION CHECKLIST**

- ✅ **Keep existing Pino + Loki** in Next.js layer
- ✅ **Keep existing Sentry** setup in Next.js
- ✅ **Use simplified console logging** in Convex functions
- ✅ **Pass trace IDs** from frontend to Convex
- ✅ **Enable Convex Pro** for native Sentry integration
- ✅ **Optional Loki streaming** for important Convex events
- ✅ **Unified error patterns** with ConvexError

---

## 🏆 **BENEFITS ACHIEVED**

### **Simplified Architecture**
- ❌ No Pino overhead in Convex functions
- ✅ Native Convex logging (fast, built-in)
- ✅ Consistent error handling patterns

### **Better Developer Experience**
- ✅ Beautiful logs in Convex dashboard
- ✅ Automatic Sentry tagging
- ✅ Request correlation with trace IDs

### **Production Ready**
- ✅ Long-term retention via Loki
- ✅ Error alerting via Sentry
- ✅ Performance monitoring via both

This setup gives you the best of both worlds: simple, fast logging in Convex functions with optional integration to your existing observability stack.