"use client";
import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

const Toaster = ({
  ...props
}) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme}
      className="toaster"
      richColors
      closeButton
      expanded={false}
      toastOptions={{
        unstyled: true,
        duration: 5000,
        style: {
          backgroundColor: "#ffffff",
          background: "#ffffff",
          opacity: 1,
          color: "#000000",
          border: "1px solid #e2e8f0",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)"
        }
      }}
      {...props} />
  );
}

export { Toaster }
