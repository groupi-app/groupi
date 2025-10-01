# Testing DEBUG environment variable

## Without DEBUG (info level only):

DEBUG=false pnpm run dev

## With DEBUG (debug level):

DEBUG=true pnpm run dev

## In production (always info level, ignores DEBUG):

NODE_ENV=production DEBUG=true pnpm run dev

The DEBUG environment variable controls debug logging:

- DEBUG=true: Shows debug, info, warn, error, fatal logs
- DEBUG=false or unset: Shows info, warn, error, fatal logs only
- In production: Always info level regardless of DEBUG value
