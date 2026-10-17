/**
 * Supabase Auth messages, turned into what a student should read.
 *
 * Two rules: never say whether an email has an account (sign-in and sign-up
 * get the same "email or password" line), and never show a raw provider
 * message — anything unrecognised becomes a plain retry.
 */
export function friendlyAuthError(message: string | null | undefined): string {
  const m = (message ?? "").toLowerCase();
  if (!m) return "Something went wrong. Please try again.";
  if (
    m.includes("invalid login credentials") ||
    m.includes("invalid credentials") ||
    m.includes("already registered") ||
    m.includes("already been registered") ||
    m.includes("already exists") ||
    m.includes("user not found")
  ) {
    return "The email or password is incorrect.";
  }
  if (m.includes("token has expired") || m.includes("otp") || m.includes("invalid token")) {
    return "That code is incorrect or has expired. Check it, or request a new code.";
  }
  if (m.includes("email not confirmed")) {
    return "Please verify your email first — check your inbox for the code.";
  }
  if (m.includes("rate limit") || m.includes("too many") || m.includes("security purposes")) {
    return "Too many attempts. Please wait a minute and try again.";
  }
  if (m.includes("password should be") || m.includes("weak password") || m.includes("at least")) {
    return "Choose a stronger password — at least 6 characters.";
  }
  if (m.includes("permanent email")) return message as string;
  return "Something went wrong. Please try again.";
}
