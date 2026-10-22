"use client";

import { DeleteOutlined } from "@ant-design/icons";
import { App, Button, Form, Input, Popconfirm } from "antd";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  createSaleComment,
  deleteSaleComment,
  type SaleCommentRecord,
} from "@/lib/actions/sale-comments";

type ListingCommentsProps = {
  listingId: string;
  comments: SaleCommentRecord[];
};

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString();
}

export function ListingComments({
  listingId,
  comments,
}: ListingCommentsProps) {
  const { message } = App.useApp();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form] = Form.useForm<{ body: string }>();

  function onSubmit(values: { body: string }) {
    startTransition(async () => {
      const result = await createSaleComment({
        listingId,
        body: values.body ?? "",
      });
      if (!result.ok) {
        message.error(result.message);
        return;
      }
      message.success(result.message);
      form.resetFields();
      router.refresh();
    });
  }

  function onDelete(id: string) {
    startTransition(async () => {
      const result = await deleteSaleComment(id);
      if (!result.ok) {
        message.error(result.message);
        return;
      }
      message.success(result.message);
      router.refresh();
    });
  }

  return (
    <section style={{ marginTop: 28, maxWidth: 720 }}>
      <h2 style={{ margin: "0 0 12px", fontSize: 18, fontWeight: 600 }}>
        Comments
        {comments.length > 0 ? (
          <span
            style={{
              marginLeft: 8,
              fontSize: 14,
              fontWeight: 500,
              color: "var(--muted)",
            }}
          >
            ({comments.length})
          </span>
        ) : null}
      </h2>

      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
        onFinish={onSubmit}
        style={{ marginBottom: 20 }}
      >
        <Form.Item
          name="body"
          rules={[
            {
              validator: (_, value: string) =>
                value?.trim()
                  ? Promise.resolve()
                  : Promise.reject(new Error("Write a comment")),
            },
          ]}
        >
          <Input.TextArea
            rows={3}
            maxLength={2000}
            showCount
            placeholder="Ask a question or leave a note about this listing…"
          />
        </Form.Item>
        <Button type="primary" htmlType="submit" loading={pending}>
          Post comment
        </Button>
      </Form>

      {comments.length === 0 ? (
        <div
          style={{
            padding: "16px 0",
            color: "var(--muted)",
            fontSize: 14,
          }}
        >
          No comments yet. Be the first to leave one.
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {comments.map((comment) => (
            <article
              key={comment.id}
              style={{
                padding: 14,
                borderRadius: 10,
                border: "1px solid var(--border-color)",
                background: "var(--page-bg)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: 12,
                  marginBottom: 8,
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>
                    {comment.authorUsername}
                    {comment.isOwn ? (
                      <span
                        style={{
                          marginLeft: 8,
                          fontSize: 12,
                          fontWeight: 500,
                          color: "var(--muted)",
                        }}
                      >
                        You
                      </span>
                    ) : null}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--muted)",
                      marginTop: 2,
                    }}
                  >
                    {formatDateTime(comment.createdAt)}
                  </div>
                </div>
                {comment.canDelete ? (
                  <Popconfirm
                    title="Delete this comment?"
                    okText="Delete"
                    cancelText="Cancel"
                    onConfirm={() => onDelete(comment.id)}
                  >
                    <Button
                      type="text"
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      aria-label="Delete comment"
                      loading={pending}
                    />
                  </Popconfirm>
                ) : null}
              </div>
              <div
                style={{
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  fontSize: 14,
                  lineHeight: 1.5,
                }}
              >
                {comment.body}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
