# Renderer Static Assets (Public Directory)

Any files placed in this `public` directory will be served at the root of the React renderer process (both in development and in the compiled production build).

## How to use:

1. Save your custom logo image here (e.g. `logo.png` or `logo.svg`).
2. Reference it in your React/HTML code directly using an absolute path relative to this folder:
   ```tsx
   <img src="/logo.png" alt="Luna Logo" />
   ```
