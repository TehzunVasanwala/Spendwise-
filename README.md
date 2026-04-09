# SpendWise - Smart Budget Manager

This project was built with React, Vite, and Tailwind CSS.

## 🚀 Getting Started

To run this project locally:

1. **Clone the repository**:
   ```bash
   git clone <your-repo-url>
   cd <repo-name>
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run the development server**:
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:3000`.

## 📦 Deployment to GitHub Pages

If you want to host this on GitHub Pages:

1. **Build the project**:
   ```bash
   npm run build
   ```
   This creates a `dist` folder with optimized production files.

2. **Deploy the `dist` folder**:
   You can use the `gh-pages` package or configure a GitHub Action to deploy the contents of the `dist` folder to the `gh-pages` branch.

### Why did I see a 404 error?
If you try to view the site directly from the GitHub repository files (without running a build), the browser will fail to load `.tsx` files because it doesn't understand them. You must either:
- Run the **development server** (`npm run dev`) for local testing.
- Use the **production build** (`npm run build`) for hosting.

I have updated `vite.config.ts` with `base: './'` to ensure that assets load correctly even if your GitHub Pages site is hosted at a sub-path (like `username.github.io/repo-name/`).
