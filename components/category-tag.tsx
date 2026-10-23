import { Tag } from "antd";

function isHexColor(value: string) {
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value.trim());
}

export function CategoryTag({
  name,
  color,
}: {
  name: string;
  color?: string | null;
}) {
  const trimmed = (color ?? "").trim();
  const hasColor = Boolean(trimmed) && isHexColor(trimmed);

  return (
    <Tag
      color={hasColor ? trimmed : undefined}
      style={{ marginInlineEnd: 0 }}
    >
      {name}
    </Tag>
  );
}
