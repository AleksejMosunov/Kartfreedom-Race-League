"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/app/components/ui";
import { apiFetch } from "@/app/services/api/request";

export function AdminLogoutButton() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogout = async () => {
    setIsSubmitting(true);
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.replace("/login");
      router.refresh();
      setIsSubmitting(false);
    }
  };

  return (
    <Button variant="ghost" size="sm" onClick={handleLogout} disabled={isSubmitting}>
      {isSubmitting ? "Вихід..." : "Вийти"}
    </Button>
  );
}
