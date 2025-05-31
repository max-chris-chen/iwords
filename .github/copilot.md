# Repository Custom Instructions for GitHub Copilot

<!--
For details, see: https://docs.github.com/en/copilot/customizing-copilot/adding-repository-custom-instructions-for-github-copilot?tool=vscode
-->

## How should GitHub Copilot work in this repository?
- Follow SvelteKit conventions for routing, endpoints, and file structure.
- Use MongoDB via the `$lib/mongodb` helper. Always check `locals.user._id` for authentication before DB operations.
- Course documents have nested `sections` and `lessons` arrays. Use MongoDB positional operators for updates.
- API endpoints are in `src/routes/api/courses/` and follow RESTful patterns.
- Always return proper HTTP status codes and JSON responses for API endpoints.
- Use TypeScript throughout. Place shared types in `src/lib/models/`.
- Never expose sensitive user data. Always check course ownership before returning or modifying data.
- Use Tailwind CSS for styling Svelte components in `src/lib/`.
- Use async/await for all asynchronous code.
- Add comments for complex logic and keep code concise.
- For UI elements (buttons, tables, forms, etc.), use Tailwind CSS utility classes and follow the existing style conventions in the app. Buttons should be accessible, visually consistent, and use Tailwind classes for color, padding, and hover/focus states. Tables should be responsive and styled with Tailwind for clarity and readability. Maintain a clean, modern look for all UI components.

## What programming style or best practices should Copilot follow?
- Use clear, descriptive variable names and destructuring for parameters.
- Prefer concise, readable code with comments for non-obvious logic.
- Use SvelteKit's conventions for endpoints and UI components.
- Ensure all API endpoints are robustly error-handled.
- Use modern JavaScript/TypeScript features.

## Example MongoDB Course Document
```json
{
  "_id": ObjectId,
  "user": ObjectId, // owner
  "title": string,
  "coverImage": string,
  "description": string,
  "isPublic": boolean,
  "sections": [
    {
      "_id": ObjectId,
      "title": string,
      "lessons": [
        { "_id": ObjectId, "title": string, "content": string }
      ]
    }
  ],
  "updatedAt": Date
}
```

---

*This file provides Copilot and developers with project-specific instructions to ensure consistency and best practices across the codebase.*
