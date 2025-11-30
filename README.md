# DMart - E-Commerce Frontend

A modern, minimalistic e-commerce homepage built with Next.js, Tailwind CSS, and shadcn/ui. Features a beautiful bluish theme and integrates with a Spring Boot backend.

## Features

- 🎨 Modern, minimalistic design with a bluish theme
- 🛍️ Product showcase with featured products
- 📱 Fully responsive layout
- ⚡ Built with Next.js 16 and React 19
- 🎯 shadcn/ui components for consistent UI
- 🔌 API integration with Spring Boot backend

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Spring Boot backend running on `http://localhost:8080`

### Installation

1. Install dependencies:

```bash
npm install
# or
pnpm install
# or
yarn install
```

2. (Optional) Configure API URL by creating a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

3. Run the development server:

```bash
npm run dev
# or
pnpm dev
# or
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

- `app/` - Next.js app directory with pages and layouts
- `components/` - React components (Header, Footer, ProductCard, etc.)
- `components/ui/` - shadcn/ui components (Button, Card)
- `lib/` - Utility functions and API client
- `public/` - Static assets

## API Integration

The app expects the backend API to provide:

- `GET /api/products` - List all products
- `GET /api/products/featured` - Get featured products (optional, falls back to all products)
- `GET /api/categories` - List all categories

See `lib/api.ts` for the API client implementation.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
