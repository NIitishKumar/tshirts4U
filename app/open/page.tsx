"use client";

import { useEffect } from "react";

export default function OpenApp() {
  useEffect(() => {
    const playStoreUrl =
      "https://play.google.com/store/apps/details?id=com.schoolapp.app";

    const timer = setTimeout(() => {
      window.location.href = playStoreUrl;
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
      }}
    >
      <h1>Opening SchoolApp...</h1>

      <p>
        If the app does not open, you will be redirected to Google Play.
      </p>
    </main>
  );
}
