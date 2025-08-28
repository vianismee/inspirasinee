"use client";

import { signOut } from "@/app/login/action";
import { Button } from "./ui/button";

export function NavUser() {
  return <Button onClick={signOut}>Log Out</Button>;
}
