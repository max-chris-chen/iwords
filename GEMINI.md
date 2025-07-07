# Gemini Code Assistant Configuration

This file helps the Gemini code assistant understand the project's structure, conventions, and commands.

## Project Overview

**iwords** is a web application built with SvelteKit. It appears to be a language-learning application with features for courses, lessons, dictation, and recording. It uses MongoDB for the database and JWT for authentication.

## Key Technologies

- **Framework**: SvelteKit
- **Language**: TypeScript
- **Styling**: Plain CSS (`src/app.css`)
- **Database**: MongoDB
- **Authentication**: JSON Web Tokens (JWT)
- **API Integrations**:
  - Speechify API (for text-to-speech)
  - Deepseek API (likely for AI-powered features)

## Project Structure

- `src/lib/`: Core application logic, components, and server-side code.
  - `src/lib/components/`: Reusable Svelte components.
  - `src/lib/server/`: Server-side logic, including database interactions and authentication.
  - `src/lib/models/`: Data models for the application (e.g., Course, User).
- `src/routes/`: SvelteKit's file-based routing.
  - `src/routes/api/`: API endpoints for the application.
- `static/`: Static assets like images and fonts.
- `package.json`: Project dependencies and scripts.
- `.env.example`: Required environment variables.

## Available Scripts

The following scripts are available in `package.json`:

- **`pnpm dev`**: Starts the development server.
- **`pnpm build`**: Builds the application for production.
- **`pnpm preview`**: Previews the production build.
- **`pnpm check`**: Type-checks the project using `svelte-check`.
- **`pnpm lint`**: Lints the project using ESLint.
- **`pnpm format`**: Formats the code using Prettier.

## Environment Variables

The following environment variables are required. A `.env.example` file is available for reference.

- `MONGODB_URI`: The connection string for the MongoDB database.
- `JWT_SECRET`: The secret key for signing JSON Web Tokens.
- `SPEECHIFY_API_KEY`: The API key for the Speechify service.
- `NODE_ENV`: The application environment (e.g., `development`, `production`).
- `DEEPSEEK_API_KEY`: The API key for the Deepseek service.

## Code Style and Conventions

- **Formatting**: Code is formatted with Prettier. Run `pnpm format` to format the code.
- **Linting**: Code is linted with ESLint. Run `pnpm lint` to check for linting errors.
- **Typing**: The project uses TypeScript. Run `pnpm check` to check for type errors.

## How to Get Help

You can ask me questions about the project, and I will use this file as a reference to provide more accurate and helpful responses. For example, you can ask me to:

- "Create a new component for..."
- "Add a new API endpoint to..."
- "Explain the code in..."
