import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";

function normalizeHandle(raw: unknown): string {
  const handle = String(raw ?? "")
    .trim()
    .toLowerCase();
  if (!/^[a-z0-9_]{3,20}$/.test(handle)) {
    throw new Error("Handle must be 3-20 lowercase letters, numbers, or underscores.");
  }
  return handle;
}

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password({
      profile(params) {
        const handle = normalizeHandle(params.username);
        return { email: `${handle}@handle.dsajourney.local`, name: handle };
      },
    }),
  ],
});
