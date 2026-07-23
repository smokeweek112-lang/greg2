// Runs once when the Next.js server process starts (Node runtime only).
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Prefer IPv4 when resolving hostnames. Node's fetch (undici) can otherwise
    // pick a single, occasionally-unreachable IPv6 address for hosts like
    // api.telegram.org and hang for the full connect timeout instead of falling
    // back to a working IPv4 address (as curl/Happy Eyeballs would).
    const { setDefaultResultOrder } = await import("node:dns")
    setDefaultResultOrder("ipv4first")
  }
}
