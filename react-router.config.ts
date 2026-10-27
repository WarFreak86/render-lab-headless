import type {Config} from '@react-router/dev/config';
import {hydrogenPreset} from '@shopify/hydrogen/react-router-preset';

/**
 * React Router 7.9.x Configuration for Hydrogen
 *
 * This configuration uses the official Hydrogen preset to provide optimal
 * React Router settings for Shopify Oxygen deployment. The preset enables
 * validated performance optimizations while ensuring compatibility.
 */
export default {
  presets: [hydrogenPreset()],
  // Avoid the lazy /__manifest request-matching path (GHSA-chx6-hx7r-mcp5)
  // while Hydrogen 2026.4 requires React Router ~7.16.0. Route modules still
  // load on demand; only their metadata is included in the initial manifest.
  routeDiscovery: {mode: 'initial'},
} satisfies Config;
