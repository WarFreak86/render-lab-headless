/// <reference types="vite/client" />
/// <reference types="react-router" />
/// <reference types="@shopify/oxygen-workers-types" />
/// <reference types="@shopify/hydrogen/react-router-types" />

// Enhance TypeScript's built-in typings.
import '@total-typescript/ts-reset';

// Oxygen runtime bindings: server-only, absent/invalid values disable staging.
declare global {
  interface Env {
    ROOM_PREVIEW_STAGING_ENABLED?: string;
    ROOM_PREVIEW_STAGING_HOST?: string;
  }
}
