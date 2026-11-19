import { createAuthClient } from "better-auth/react";
import { magicLinkClient } from "better-auth/client/plugins";

/** Browser-side login client (same origin as the app). */
export const authClient = createAuthClient({
  plugins: [magicLinkClient()],
});
