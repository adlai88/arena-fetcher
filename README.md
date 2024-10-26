# Are.na Fetcher

A simple tool to fetch URLs and blocks from Are.na channels.

## Setup

1. Clone the repository
2. Install dependencies:
```bash
npm install
```
3. Set up your environment variables:
   - Copy `.env.template` to `.env.local`
   - Add your Are.na API token to `.env.local`
4. Start the development server:
```bash
npm run dev
```

## Environment Variables

To use this app, you'll need an Are.na API token:
1. Go to [dev.are.na](https://dev.are.na)
2. Create a new application
3. Copy your API token
4. Create `.env.local` and add your token:
```env
VITE_ARENA_API_TOKEN=your-token-here
VITE_API_BASE_URL=https://api.are.na/v2
```

Note: `.env.local` is ignored by git to keep your API token private.
