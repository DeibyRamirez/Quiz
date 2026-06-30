"use client"

// Firebase configuration for hosting compatibility
// This component ensures the app works correctly when deployed to Firebase Hosting

import { useEffect } from "react"

export function FirebaseConfig() {
  useEffect(() => {
    // Configure Firebase Hosting settings
    if (typeof window !== "undefined") {
      // Set up service worker for Firebase Hosting
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker
          .register("/sw.js")
          .then((registration) => {
            console.log("SW registered: ", registration)
          })
          .catch((registrationError) => {
            console.log("SW registration failed: ", registrationError)
          })
      }

      // Configure Firebase Hosting redirects and rewrites
      const meta = document.createElement("meta")
      meta.name = "firebase-hosting-config"
      meta.content = JSON.stringify({
        rewrites: [
          {
            source: "**",
            destination: "/index.html",
          },
        ],
        headers: [
          {
            source: "**/*.@(js|css)",
            headers: [
              {
                key: "Cache-Control",
                value: "max-age=31536000",
              },
            ],
          },
        ],
      })
      document.head.appendChild(meta)
    }
  }, [])

  return null
}
