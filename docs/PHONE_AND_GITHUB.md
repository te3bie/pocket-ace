# Open Pocket Ace on your phone and share the demo

## Phone browser: simplest verified demo route

In Terminal, inside this Pocket Ace folder:

```sh
npm ci
npm run build
npm run preview:phone
```

If port 8081 is already used, press Ctrl+C in the old server terminal, or run `PORT=8082 npm run preview:phone`.

Keep the Mac and phone on the same trusted Wi-Fi. The terminal prints a local network URL such as `http://192.168.1.25:8081`. Open the actual printed URL in Safari or Chrome on your phone. `localhost` on the phone means the phone itself, so use the printed network address. Select **Explore the fictional demo**. Keep the Mac awake and server terminal open. If macOS asks whether Node may accept incoming connections, allow it for your local demo. School/guest Wi-Fi may block communication between devices.

This exposes only the exported website to your local network. No tunnel or public deployment is created. The demo saves changes separately in each browser/device. It does not require Supabase, banking or AI credentials. Banking and live AI remain clearly unavailable; demo opportunities are fictional. Safari's Add to Home Screen can create a shortcut, but offline/installable PWA support is not implemented.

## Native phone preview with Expo Go

Install Expo Go, then run `npm start` from the project folder and scan the terminal QR code. Use the same Wi-Fi and a client compatible with Expo SDK 58. On iOS, current Expo documentation requires the CLI and Expo Go to use the same Expo account (`npx expo login` on the Mac). A development build is required if the available Expo Go app does not support this SDK. Native builds and notification delivery have not been verified here; the browser demo is the tested route.

## Add the source to your GitHub

The folder is already a local Git repository with source, lockfile, backend, tests, docs and screenshots. No GitHub remote is configured and nothing has been pushed.

1. On GitHub, create an empty repository named `pocket-ace`. Choose its visibility yourself. Leave the generated README/license/.gitignore options unchecked because this project already has files.
2. In Terminal, from this Pocket Ace folder, replace YOUR_USERNAME below:

```sh
git remote add origin https://github.com/YOUR_USERNAME/pocket-ace.git
git push -u origin main
```

GitHub may ask you to authenticate through your credential manager. Do not enter an account password into the code or commit a token. `.env`, dependencies and generated builds are ignored; `.env.example` has placeholders only.

Suggested repository description: “A Canadian student budgeting and university-planning app built with Expo, React Native, TypeScript and Supabase. Includes a persistent fictional demo, automated tests and documented integration boundaries.”

GitHub stores the source. It does not automatically host a working Expo website. To share a public clickable demo, choose and approve a static hosting provider, connect this repository, build with `npm run build`, publish `dist`, and configure clean URLs (`/profile` → `/profile.html`). No provider has been connected or published. Live accounts/AI/banking are optional later configuration; they are not needed for the fictional portfolio demo.

## Public demo on GitHub Pages

This repository includes `.github/workflows/pages.yml`. It builds a fictional demo with live Supabase configuration excluded, tests the app, uploads `dist`, and deploys using GitHub's official Pages actions. The Expo base path is read from GitHub Pages configuration so the project works at `https://te3bie.github.io/pocket-ace/`. Directory indexes support refreshing individual routes.

One-time setup on GitHub: repository → Settings → Pages → Build and deployment → Source → **GitHub Actions**. Then push the deployment commit or open Actions → **Publish Pocket Ace demo** → **Run workflow**. Wait until both build/deploy jobs are green. Open the URL shown by the deployment job and choose **Explore the fictional demo**. No Mac server needs to remain running for the hosted version. Later pushes to `main` rebuild it automatically.

Local Pages export: `npm run build:pages` (defaults to `/pocket-ace`). Normal `npm run build` keeps the local/native root path unchanged. A successful local export does not mean GitHub has published the site; check the Actions result and public URL.
