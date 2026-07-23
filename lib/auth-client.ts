interface LoginResponse {
  success: boolean
  error?: string
}

interface AuthSession {
  isAuthenticated: boolean
  username?: string
}

// Login function
export async function login(username: string, password: string): Promise<LoginResponse> {
  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    })

    const data = await response.json()

    if (response.ok && data.success) {
      return { success: true }
    } else {
      return { success: false, error: data.error || "Login failed" }
    }
  } catch (error) {
    console.error("Login error:", error)
    return { success: false, error: "Network error" }
  }
}

// Logout function
export async function logout(): Promise<void> {
  try {
    await fetch("/api/auth/logout", {
      method: "POST",
    })
  } catch (error) {
    console.error("Logout error:", error)
  }
}

// Check authentication status
export async function checkAuth(): Promise<AuthSession> {
  try {
    const response = await fetch("/api/auth/me")
    const data = await response.json()

    if (response.ok && data.success) {
      return {
        isAuthenticated: true,
        username: data.user.username,
      }
    }
  } catch (error) {
    console.error("Auth check error:", error)
  }

  return { isAuthenticated: false }
}

// Token refresh (simplified)
let refreshInterval: ReturnType<typeof setInterval> | null = null

export function startTokenRefresh(): void {
  // Avoid stacking multiple intervals if called more than once.
  if (refreshInterval) return

  // Refresh token every 23 hours
  refreshInterval = setInterval(async () => {
    try {
      await fetch("/api/auth/refresh", { method: "POST" })
    } catch (error) {
      console.error("Token refresh error:", error)
    }
  }, 23 * 60 * 60 * 1000)
}

export function stopTokenRefresh(): void {
  if (refreshInterval) {
    clearInterval(refreshInterval)
    refreshInterval = null
  }
}