# eckoWALLET

### The Kadena ecosystem gateway

## Prerequisites

- Node.js v22

## Development setup

1. Clone the repository
2. Copy environment file:

```bash
cp .env.example .env

```

3. Install dependencies:

```bash
npm install

```

4. Start development watch mode:

```
npm start
```

5. Load the extension in Chrome:

- Open chrome://extensions/
- Enable "Developer mode" in the top right
- Click "Load unpacked"
- Select the build folder of the project

The extension will automatically reload when you make changes to the code.

## Production build

To create a production build:

```
npm run build
```

For a development build with source maps:

```
npm run build:dev
```

Installing the built extension

1. Go to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked"
4. Select the build folder
