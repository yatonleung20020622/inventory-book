"use client";

import { MoonOutlined, SunOutlined } from "@ant-design/icons";
import { Button, Tooltip } from "antd";
import { useThemeMode } from "@/components/theme-provider";

type ThemeToggleProps = {
  className?: string;
};

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { mode, toggle } = useThemeMode();
  const isDark = mode === "dark";
  const iconColor = isDark ? "#ffffff" : "rgba(0, 0, 0, 0.88)";

  return (
    <Tooltip title={isDark ? "Switch to light mode" : "Switch to dark mode"}>
      <Button
        className={className}
        type="text"
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        icon={
          isDark ? (
            <SunOutlined style={{ color: iconColor, fontSize: 18 }} />
          ) : (
            <MoonOutlined style={{ color: iconColor, fontSize: 18 }} />
          )
        }
        onClick={toggle}
        style={{ color: iconColor }}
      />
    </Tooltip>
  );
}
