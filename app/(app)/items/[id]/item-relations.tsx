"use client";

import { DeleteOutlined } from "@ant-design/icons";
import { App, Button, Form, Input, Popconfirm, Select } from "antd";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  createItemRelation,
  deleteItemRelation,
  type ItemRelationRecord,
} from "@/lib/actions/item-relations";

type ItemOption = {
  id: string;
  name: string;
  brand: string;
};

type ItemRelationsProps = {
  itemId: string;
  itemName: string;
  relations: ItemRelationRecord[];
  itemOptions: ItemOption[];
};

type RelationFormValues = {
  toItemId: string;
  type: string;
};

export function ItemRelations({
  itemId,
  itemName,
  relations,
  itemOptions,
}: ItemRelationsProps) {
  const { message } = App.useApp();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form] = Form.useForm<RelationFormValues>();

  const outgoing = relations.filter((relation) => relation.direction === "from");
  const incoming = relations.filter((relation) => relation.direction === "to");

  function onSubmit(values: RelationFormValues) {
    startTransition(async () => {
      const result = await createItemRelation({
        fromItemId: itemId,
        toItemId: values.toItemId,
        type: values.type ?? "",
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
      const result = await deleteItemRelation(id);
      if (!result.ok) {
        message.error(result.message);
        return;
      }
      message.success(result.message);
      router.refresh();
    });
  }

  function RelationCard({ relation }: { relation: ItemRelationRecord }) {
    const otherLabel = relation.otherItemBrand
      ? `${relation.otherItemName} (${relation.otherItemBrand})`
      : relation.otherItemName;

    return (
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
          padding: 14,
          borderRadius: 10,
          border: "1px solid var(--border-color)",
          background: "var(--page-bg)",
        }}
      >
        <div style={{ minWidth: 0, fontSize: 14, lineHeight: 1.5 }}>
          {relation.direction === "from" ? (
            <>
              <span style={{ fontWeight: 600 }}>{itemName}</span>
              <span style={{ color: "var(--muted)" }}> {relation.type} </span>
              <Link href={`/items/${relation.otherItemId}`}>{otherLabel}</Link>
            </>
          ) : (
            <>
              <Link href={`/items/${relation.otherItemId}`}>{otherLabel}</Link>
              <span style={{ color: "var(--muted)" }}> {relation.type} </span>
              <span style={{ fontWeight: 600 }}>{itemName}</span>
            </>
          )}
        </div>
        <Popconfirm
          title="Remove this relation?"
          okText="Remove"
          cancelText="Cancel"
          onConfirm={() => onDelete(relation.id)}
        >
          <Button
            type="text"
            danger
            size="small"
            icon={<DeleteOutlined />}
            aria-label="Remove relation"
            loading={pending}
          />
        </Popconfirm>
      </div>
    );
  }

  return (
    <section
      className="item-relations-panel"
      style={{
        width: "100%",
        minWidth: 0,
        boxSizing: "border-box",
        padding: 16,
        borderRadius: 8,
        background: "var(--card-bg)",
        border: "1px solid var(--border-color)",
        alignSelf: "start",
      }}
    >
      <h2 style={{ margin: "0 0 12px", fontSize: 18, fontWeight: 600 }}>
        Related items
      </h2>

      <Form
        form={form}
        layout="vertical"
        requiredMark="optional"
        onFinish={onSubmit}
        style={{ marginBottom: 20 }}
      >
        <Form.Item
          label="Related item"
          name="toItemId"
          required
          rules={[{ required: true, message: "Select an item" }]}
        >
          <Select
            showSearch
            optionFilterProp="label"
            placeholder="Choose an item"
            options={itemOptions.map((item) => ({
              value: item.id,
              label: item.brand ? `${item.name} (${item.brand})` : item.name,
            }))}
            disabled={itemOptions.length === 0}
          />
        </Form.Item>
        <Form.Item
          label="Relation type"
          name="type"
          required
          rules={[
            {
              validator: (_, value: string) =>
                value?.trim()
                  ? Promise.resolve()
                  : Promise.reject(new Error("Type is required")),
            },
          ]}
        >
          <Input placeholder="e.g. for, fits, contains" maxLength={80} />
        </Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          loading={pending}
          disabled={itemOptions.length === 0}
        >
          Add relation
        </Button>
        {itemOptions.length === 0 ? (
          <div style={{ marginTop: 8, color: "var(--muted)", fontSize: 13 }}>
            Add another item first to create a relation.
          </div>
        ) : null}
      </Form>

      {relations.length === 0 ? (
        <div style={{ padding: "8px 0", color: "var(--muted)", fontSize: 14 }}>
          No related items yet. Example: this case <em>for</em> iPhone 13.
        </div>
      ) : (
        <div style={{ display: "grid", gap: 16 }}>
          {outgoing.length > 0 ? (
            <div>
              <div
                style={{
                  fontSize: 13,
                  color: "var(--muted)",
                  marginBottom: 8,
                }}
              >
                This item relates to
              </div>
              <div style={{ display: "grid", gap: 10 }}>
                {outgoing.map((relation) => (
                  <RelationCard key={relation.id} relation={relation} />
                ))}
              </div>
            </div>
          ) : null}
          {incoming.length > 0 ? (
            <div>
              <div
                style={{
                  fontSize: 13,
                  color: "var(--muted)",
                  marginBottom: 8,
                }}
              >
                Other items that relate here
              </div>
              <div style={{ display: "grid", gap: 10 }}>
                {incoming.map((relation) => (
                  <RelationCard key={relation.id} relation={relation} />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}
