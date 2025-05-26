# iWords - Text-to-Speech SvelteKit Application

This is a SvelteKit application that converts text to speech using the Speechify API. It allows users to input text, synthesize it into audio, play it back at various speeds, and see the currently spoken word highlighted.

## Features

- Text input for speech synthesis.
- Voice synthesis using the Speechify API.
- Audio playback with adjustable speed (0.5x, 0.75x, 1.0x, 1.25x, 1.5x, 2.0x).
- Real-time word highlighting during playback.
- Fetches available voices from the Speechify API.

## Project Setup

### Prerequisites

- Node.js (version 18.x or higher recommended)
- pnpm (or npm/yarn)

### Environment Variables

This project requires an API key from Speechify.

1.  Create a file named `.env` in the root directory of the project (e.g., `c:\data\workspace\svelte\iwords\.env`).
2.  Add your Speechify API key to the `.env` file as follows:

    ```env
    SPEECHIFY_API_KEY=your_speechify_api_key_here
    ```

    Replace `your_speechify_api_key_here` with your actual API key.

### Installation

1.  Clone the repository (if you haven't already).
2.  Navigate to the project directory:
    ```bash
    cd iwords
    ```
3.  Install the dependencies:
    ```bash
    pnpm install
    ```
    (or `npm install` / `yarn install`)

## Developing

Once you've set up the environment variables and installed dependencies, start the development server:

```bash
pnpm run dev
```

Or, to start the server and open the app in a new browser tab:

```bash
pnpm run dev -- --open
```

The application will typically be available at `http://localhost:5173/`.

## How to Use

1.  Open the application in your browser.
2.  Enter the text you want to synthesize in the text area.
3.  Select the desired playback speed from the dropdown menu.
4.  Click the "合成" (Synthesize) button.
5.  Once synthesized, click the "播放" (Play) button to listen to the audio.
6.  The words will be highlighted as they are spoken. You can change the playback speed while the audio is playing.

## Building for Production

To create a production version of your app:

```bash
pnpm run build
```

You can preview the production build with `pnpm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment. For example, to use `adapter-node` for a Node.js environment, you would have already installed it (it's in your dependencies) and configured it in `svelte.config.js`.

## Key Technologies

- [SvelteKit](https://kit.svelte.dev/)
- [Speechify API](https://speechify.com/text-to-speech-api/) (via `fetch`)
- TypeScript
- Vite

## API Endpoints

The application uses the following server-side API routes:

- `POST /api/tts`: Handles text-to-speech synthesis requests.
  - Expects a JSON body with `text` (string, required) and optionally `voice` (string) and `output_format` (string).
  - Returns synthesized audio data and speech marks.
- `GET /api/voices`: Fetches the list of available voices from the Speechify API.
- `GET /api/debug-env`: (If created for debugging) - typically used to check environment variables on the server.

---

This README provides a comprehensive guide to setting up, developing, and using the iWords application.
