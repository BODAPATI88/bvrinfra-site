# BVRInfra Website

## Overview

BVRInfra Website is a modern, responsive website built with Next.js and React. It showcases company information, services, portfolio, and provides contact functionality.

## Key Features

- ⚡ **Fast Performance**: Next.js with SSR/SSG
- 📊 **SEO Optimized**: Built-in SEO features
- 🌙 **Dark Mode**: Theme switching support
- 📋 **CMS Integration**: Headless CMS support
- 🔐 **Secure**: HTTPS, security headers
- ♿ **Accessible**: WCAG 2.1 AA compliant
- 🚀 **Performance**: Optimized images, code splitting
- 📱 **Responsive**: Mobile-first design

## Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | Next.js 13+ |
| Framework | React 18+ |
| Language | TypeScript |
| Styling | Tailwind CSS |
| CMS | Contentful / Sanity |
| Deployment | Vercel / Netlify |
| Analytics | Google Analytics 4 |
| Testing | Jest + React Testing Library |

## Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0 or yarn >= 3.0.0
- Git
- Code editor

## Quick Start

### 1. Clone Repository

```bash
git clone https://github.com/BODAPATI88/bvrinfra-site.git
cd bvrinfra-site
```

### 2. Install Dependencies

```bash
# Using npm
npm install

# Or using yarn
yarn install
```

### 3. Environment Setup

```bash
# Copy environment template
cp .env.example .env.local

# Edit .env.local with your configuration
vim .env.local
```

### 4. Start Development Server

```bash
# Using npm
npm run dev

# Or using yarn
yarn dev
```

Access at: http://localhost:3000

### 5. Build for Production

```bash
# Using npm
npm run build
npm run start

# Or using yarn
yarn build
yarn start
```

## Project Structure

```
bvrinfra-site/
├── README.md
├── package.json
├── next.config.js
├── tsconfig.json
├── .env.example
├── .gitignore
│
├── public/
│   ├── images/
│   │   ├── logo.svg
│   │   ├── favicon.ico
│   │   └── og-image.png
│   │
│   ├── fonts/
│   └── robots.txt
│
├── src/
│   ├── pages/
│   │   ├── index.tsx              # Home page
│   │   ├── about.tsx              # About page
│   │   ├── services.tsx           # Services page
│   │   ├── portfolio.tsx          # Portfolio page
│   │   ├── contact.tsx            # Contact page
│   │   ├── blog/
│   │   │   ├── index.tsx
│   │   │   └── [slug].tsx
│   │   │
│   │   ├── api/
│   │   │   ├── contact.ts
│   │   │   └── newsletter.ts
│   │   │
│   │   ├── _app.tsx
│   │   ├── _document.tsx
│   │   └── _error.tsx
│   │
│   ├── components/
│   │   ├── Layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── Navigation.tsx
│   │   │
│   │   ├── Common/
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   └── Section.tsx
│   │   │
│   │   ├── Hero.tsx
│   │   ├── Features.tsx
│   │   └── CTA.tsx
│   │
│   ├── lib/
│   │   ├── api.ts
│   │   ├── cms.ts
│   │   └── utils.ts
│   │
│   ├── types/
│   │   ├── index.ts
│   │   ├── api.ts
│   │   └── models.ts
│   │
│   └── styles/
│       ├── globals.css
│       ├── variables.css
│       └── themes.css
│
├── tests/
│   ├── pages/
│   ├── components/
│   └── __mocks__/
│
├── .github/
│   └── workflows/
│       ├── build.yml
│       └── deploy.yml
│
└── docker/
    ├── Dockerfile
    └── docker-compose.yml
```

## Development

### Available Scripts

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run tests
npm run test

# Lint code
npm run lint

# Format code
npm run format

# Type checking
npm run type-check
```

## SEO Configuration

### Meta Tags

```typescript
// In pages/about.tsx
import Head from 'next/head';

export default function About() {
  return (
    <>
      <Head>
        <title>About BVRInfra | Infrastructure Solutions</title>
        <meta name="description" content="Learn about BVRInfra" />
        <meta name="og:title" content="About BVRInfra" />
        <meta name="og:description" content="Learn about BVRInfra" />
        <meta name="og:type" content="website" />
        <meta name="og:url" content="https://bvrinfra.in/about" />
      </Head>
      <h1>About Us</h1>
    </>
  );
}
```

### Sitemap & Robots

```bash
# Generate sitemap
npm run generate-sitemap

# robots.txt is in public/robots.txt
```

## Content Management

### Fetching Content

```typescript
// src/lib/cms.ts
import { createClient } from 'contentful';

const client = createClient({
  space: process.env.CONTENTFUL_SPACE_ID,
  accessToken: process.env.CONTENTFUL_ACCESS_TOKEN,
});

export async function getBlogPosts() {
  const entries = await client.getEntries({
    content_type: 'blogPost',
  });
  return entries.items;
}
```

## Image Optimization

```typescript
// Using Next.js Image component
import Image from 'next/image';

export default function Hero() {
  return (
    <Image
      src="/images/hero.png"
      alt="Hero image"
      width={1200}
      height={600}
      priority
    />
  );
}
```

## Performance

### Lighthouse Score

- Performance: 90+
- Accessibility: 95+
- Best Practices: 90+
- SEO: 100

## Deployment

### Vercel (Recommended)

```bash
# Deploy to Vercel
vercel

# Set environment variables
vercel env add NEXT_PUBLIC_API_URL
```

### Docker

```bash
# Build image
docker build -f docker/Dockerfile -t bvrinfra-site:latest .

# Run container
docker run -p 3000:3000 bvrinfra-site:latest
```

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed instructions.

## Testing

```bash
# Run tests
npm run test

# Run tests with coverage
npm run test:coverage

# Run specific test
npm run test -- pages/index.test.tsx
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT License - See [LICENSE](LICENSE) for details.

## Support

For issues and questions:
- Create an issue on GitHub
- Check documentation in `docs/`
- Email: support@bvrinfra.in
