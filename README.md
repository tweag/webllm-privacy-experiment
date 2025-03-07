# WebLLM Privacy Experiment

A React-based web application that demonstrates privacy-preserving LLM interactions by dynamically routing queries between local (WebLLM) and cloud-based (OpenAI) models based on complexity analysis.

## Overview

This project explores privacy-preserving approaches to LLM interactions by:
- Using WebLLM for simple queries that can be processed locally in the browser
- Falling back to OpenAI for more complex queries that require advanced capabilities
- Automatically analyzing query complexity to determine the appropriate model

## Features

- Dynamic model selection based on query complexity
- Local processing using WebLLM for simple queries
- Cloud-based processing using OpenAI for complex queries
- Privacy-preserving approach to LLM interactions
- Modern React + TypeScript implementation

## Tech Stack

- React 19
- TypeScript
- Vite
- WebLLM (@mlc-ai/web-llm)
- Shadcn UI
- React Router DOM

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the project for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview the production build locally

## Project Structure

```
src/
├── components/     # React components
├── hooks/         # Custom React hooks
├── models/        # Type definitions and interfaces
├── utils/         # Utility functions
├── config/        # Configuration files
└── assets/        # Static assets
```

## Development

This project uses ESLint for code quality. The configuration can be expanded to enable type-aware lint rules as described in the original template:

```js
export default tseslint.config({
  languageOptions: {
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request