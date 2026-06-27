import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext()

export function ThemeProvider({ children }) {
  // DESIGN.md specifies a light-only warm cream canvas aesthetic.
  // Dark mode is removed from the UI. This context is kept for API compatibility.
  const [theme] = useState('light')

  useEffect(() => {
    // Always ensure light mode — remove any previously set dark class
    document.documentElement.classList.remove('dark')
    localStorage.setItem('theme', 'light')
  }, [])

  const toggleTheme = () => {
    // no-op: dark mode is not supported per DESIGN.md
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
