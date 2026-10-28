# React Online Store

This is a fake online store that I created to start learning Typescript.

## Tech Stack

- Typescript
- React
- Material UI 
- Styled components
- Fake Store REST API
- Vite
- Vercel

## Running Locally

Requires Node 22.

```bash
npm ci
npm run dev        # local dev server
npm test           # Vitest
npm run lint
npm run build      # type-check, then production build in dist/
```

Deployed on Vercel; `vercel.json` selects the Vite preset and rewrites every path to
`index.html` so `/store` works on refresh.

