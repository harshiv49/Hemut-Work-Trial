# Frontend Setup - Next.js 14 with Tailwind CSS

## Overview
This is a clean Next.js 14 application with TypeScript and Tailwind CSS, with all boilerplate removed.

## Tech Stack
- **Next.js**: 14.2.35
- **React**: 18
- **TypeScript**: 5
- **Tailwind CSS**: 3.4.1
- **ESLint**: 8 (with Next.js config)

## Project Structure
```
frontend/
├── app/
│   ├── favicon.ico
│   ├── globals.css       # Tailwind CSS imports
│   ├── layout.tsx        # Root layout (minimal)
│   └── page.tsx          # Home page (empty template)
├── node_modules/
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.mjs
├── next.config.mjs
└── next-env.d.ts
```

## Available Scripts

### Development
```bash
npm run dev
```
Starts the development server at http://localhost:3000

### Build
```bash
npm run build
```
Creates an optimized production build

### Start Production
```bash
npm run start
```
Starts the production server (requires build first)

### Lint
```bash
npm run lint
```
Runs ESLint to check code quality

## What Was Removed
- All Next.js boilerplate content from `page.tsx`
- Custom Geist fonts
- Default styling and CSS variables
- Default README.md

## What's Included
- Clean, minimal layout with proper TypeScript types
- Tailwind CSS configured and ready to use
- ESLint with Next.js recommended config
- TypeScript with strict mode enabled
- App Router (Next.js 14 default)

## Getting Started
The development server is already running at http://localhost:3000

You can start building your application by editing:
- `app/page.tsx` - Main home page
- `app/layout.tsx` - Root layout wrapper
- `app/globals.css` - Global styles and Tailwind directives

## Tailwind CSS
Tailwind is fully configured and ready to use. Simply add utility classes to your components:

```tsx
<div className="flex items-center justify-center min-h-screen">
  <h1 className="text-4xl font-bold text-blue-600">Hello World</h1>
</div>
```

## Next Steps
1. Create new pages in the `app/` directory
2. Add components in `app/components/` (create this directory)
3. Configure environment variables in `.env.local`
4. Add API routes in `app/api/` (create this directory)

