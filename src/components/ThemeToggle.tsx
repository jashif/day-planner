import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Check, Moon, Palette } from "lucide-react";
import { THEMES, useTheme } from "../hooks/useTheme";

export const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  const activeTheme = THEMES.find((item) => item.id === theme) ?? THEMES[0];

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          className="theme-toggle theme-picker-trigger"
          type="button"
          aria-label={`Theme: ${activeTheme.label}`}
          title={`Theme: ${activeTheme.label}`}
        >
          {theme === "dark" ? (
            <Moon size={15} aria-hidden="true" />
          ) : (
            <Palette size={15} aria-hidden="true" />
          )}
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content className="theme-menu" align="end" sideOffset={8}>
          <DropdownMenu.Label className="theme-menu-label">Theme</DropdownMenu.Label>
          {THEMES.map((item) => (
            <DropdownMenu.Item
              key={item.id}
              className="theme-menu-item"
              onSelect={() => setTheme(item.id)}
            >
              <span className={`theme-swatch ${item.id}`} aria-hidden="true" />
              <span className="theme-menu-copy">
                <span>{item.label}</span>
                <small>{item.description}</small>
              </span>
              {theme === item.id && <Check size={14} aria-hidden="true" />}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
};
