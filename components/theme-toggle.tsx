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
  const label = isDark ? "Switch to light mode" : "Switch to dark mode";

  return (
    <Tooltip
      title={label}
      // Keep popup next to the trigger so Ant Design does not warn about
      // mismatched document / shadow roots (default portal is document.body).
      getPopupContainer={(trigger) => trigger.parentElement ?? document.body}
    >
      <span style={{ display: "inline-flex" }}>
        <Button
          className={className}
          type="text"
          aria-label={label}
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
      </span>
    </Tooltip>
  );
}
