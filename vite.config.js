import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

// This repo deploys as a GitHub Pages *project* site
// (https://keiranpoly2611.github.io/Kinlaig-Map-FS25/), not the domain root,
// so `base` must match the repo name or every built asset URL breaks in prod.
export default defineConfig({
  base: '/Kinlaig-Map-FS25/',
  plugins: [tailwindcss()],
});
