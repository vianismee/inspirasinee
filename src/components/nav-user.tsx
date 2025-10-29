"use client";

import { useAuth } from "@/contexts/auth-context";
import { Button } from "./ui/button";

export function NavUser() {
  const { signOut } = useAuth();

  return <Button onClick={signOut}>Log Out</Button>;
}
