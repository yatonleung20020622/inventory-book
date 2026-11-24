"use client";

import { HeartFilled, HeartOutlined } from "@ant-design/icons";
import { Button } from "antd";
import { useDeclutterLikes } from "./use-declutter-likes";

type DeclutterLikeButtonProps = {
  listingId: string;
  size?: "small" | "middle";
};

export function DeclutterLikeButton({
  listingId,
  size = "middle",
}: DeclutterLikeButtonProps) {
  const { isLiked, toggleLike, hydrated } = useDeclutterLikes();
  const liked = hydrated && isLiked(listingId);

  return (
    <Button
      type="text"
      size={size}
      aria-label={liked ? "Remove from liked" : "Mark as liked"}
      aria-pressed={liked}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        toggleLike(listingId);
      }}
      icon={
        liked ? (
          <HeartFilled style={{ color: "var(--cv-accent)" }} />
        ) : (
          <HeartOutlined style={{ color: "var(--cv-muted)" }} />
        )
      }
      style={{ paddingInline: 8 }}
    />
  );
}
