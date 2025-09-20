// pages/index.tsx
import React from "react";

export default function Home() {
  console.log("Firebase API Key:", process.env.NEXT_PUBLIC_FIREBASE_API_KEY);

  return (
    <div>
      <h1>Hello Next.js</h1>
      <p>Firebase API Key: {process.env.NEXT_PUBLIC_FIREBASE_API_KEY}</p>
    </div>
  );
}