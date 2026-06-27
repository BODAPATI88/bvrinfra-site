# Contributing to bvrinfra-site

Thank you for your interest in contributing!

## Getting Started

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0 or yarn >= 3.0.0
- Git

### Setup

```bash
# Clone repository
git clone https://github.com/BODAPATI88/bvrinfra-site.git
cd bvrinfra-site

# Install dependencies
npm install

# Create feature branch
git checkout -b feature/your-feature-name

# Copy environment file
cp .env.example .env.local

# Start development server
npm run dev
```

## Development Workflow

### 1. Create Feature Branch

```bash
git checkout -b feature/descriptive-name
```

### 2. Make Changes

```bash
# Edit pages/components
vim src/pages/about.tsx

# Test changes
npm run dev
```

### 3. Code Quality

```bash
# Format code
npm run format

# Lint code
npm run lint

# Type check
npm run type-check
```

### 4. Run Tests

```bash
# Run all tests
npm run test

# Run with coverage
npm run test:coverage
```

### 5. Commit & Push

```bash
git add .
git commit -m "feat: add new blog section"
git push origin feature/your-feature-name
```

## Commit Message Guidelines

```
feat(pages): add services page

Detailed explanation of changes.

Closes #123
```

## Pull Request Process

### Before Submitting
1. [ ] Code formatted: `npm run format`
2. [ ] Linting passes: `npm run lint`
3. [ ] Tests pass: `npm run test`
4. [ ] No TypeScript errors: `npm run type-check`
5. [ ] Documentation updated

### PR Template

```markdown
## Description
Brief description

## Type of Change
- [ ] New page/component
- [ ] Bug fix
- [ ] Content update
- [ ] Documentation

## Testing
How tested?

## Checklist
- [ ] Code formatted
- [ ] Linting passes
- [ ] Tests pass
- [ ] Documentation updated

## Related Issues
Closes #123
```

## Questions?

Feel free to open an issue or discussion!
