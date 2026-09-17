"use client";

import "@/lib/polyfill";
import { createAuthClient } from "@neondatabase/auth/next";

export const authClient = createAuthClient();
export const { useSession, signIn, signUp, signOut } = authClient;
