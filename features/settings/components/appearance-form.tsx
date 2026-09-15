"use client";

import { useTheme } from "next-themes";
import { Check, Moon, Sun, Laptop } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const options = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Laptop },
];

export function AppearanceForm() {
  const { theme, setTheme } = useTheme();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Appearance</CardTitle>
        <CardDescription>Choose how WinnerAI looks on this device.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setTheme(option.value)}
              className={cn(
                "relative flex flex-col items-center gap-2 rounded-lg border p-4 text-sm transition-colors hover:border-primary",
                theme === option.value && "border-primary bg-accent"
              )}
            >
              {theme === option.value && <Check className="absolute right-2 top-2 h-3.5 w-3.5 text-primary" />}
              <option.icon className="h-5 w-5" />
              {option.label}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
