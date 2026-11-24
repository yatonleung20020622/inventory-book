"use client";

import {
  DeleteOutlined,
  EditOutlined,
  ExportOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import {
  App,
  Button,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import dayjs from "dayjs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { TableFrame } from "@/components/table-frame";
import {
  deleteTravelPlanItem,
  upsertTravelPlan,
  upsertTravelPlanItem,
  type TravelPlanItemRecord,
  type TravelPlanRecord,
} from "@/lib/actions/travel-plans";
import type { TravelPlanItemStatus } from "@/lib/generated/prisma/enums";

type StatusFilter = "all" | TravelPlanItemStatus;

type PlanFormValues = {
  title: string;
  summary: string;
  dateRange?: [dayjs.Dayjs, dayjs.Dayjs] | null;
  notes: string;
};

type ItemFormValues = {
  title: string;
  notes: string;
  url: string;
  status: TravelPlanItemStatus;
  dateRange?: [dayjs.Dayjs, dayjs.Dayjs] | null;
  cost: string;
  sortOrder: number;
};

const STATUS_OPTIONS: { value: TravelPlanItemStatus; label: string }[] = [
  { value: "IDEA", label: "Idea" },
  { value: "RESEARCHING", label: "Researching" },
  { value: "BOOKED", label: "Booked" },
  { value: "SKIPPED", label: "Skipped" },
];

function statusColor(status: TravelPlanItemStatus) {
  switch (status) {
    case "IDEA":
      return "default";
    case "RESEARCHING":
      return "processing";
    case "BOOKED":
      return "success";
    case "SKIPPED":
      return "warning";
    default:
      return "default";
  }
}

function statusLabel(status: TravelPlanItemStatus) {
  return STATUS_OPTIONS.find((o) => o.value === status)?.label ?? status;
}

function formatRange(start: string, end: string) {
  if (!start && !end) return "—";
  if (start && end) return `${start} → ${end}`;
  return start || end;
}

export function TravelPlanDetail({ plan }: { plan: TravelPlanRecord }) {
  const { message } = App.useApp();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const [planOpen, setPlanOpen] = useState(false);
  const [planForm] = Form.useForm<PlanFormValues>();

  const [itemOpen, setItemOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TravelPlanItemRecord | null>(
    null,
  );
  const [itemForm] = Form.useForm<ItemFormValues>();

  const visibleItems = useMemo(() => {
    if (statusFilter === "all") return plan.items;
    return plan.items.filter((item) => item.status === statusFilter);
  }, [plan.items, statusFilter]);

  useEffect(() => {
    if (!planOpen) return;
    planForm.setFieldsValue({
      title: plan.title,
      summary: plan.summary,
      notes: plan.notes,
      dateRange:
        plan.startDate || plan.endDate
          ? [
              plan.startDate ? dayjs(plan.startDate) : dayjs(),
              plan.endDate
                ? dayjs(plan.endDate)
                : plan.startDate
                  ? dayjs(plan.startDate)
                  : dayjs(),
            ]
          : null,
    });
  }, [planOpen, plan, planForm]);

  useEffect(() => {
    if (!itemOpen) return;
    if (editingItem) {
      itemForm.setFieldsValue({
        title: editingItem.title,
        notes: editingItem.notes,
        url: editingItem.url,
        status: editingItem.status,
        cost: editingItem.cost,
        sortOrder: editingItem.sortOrder,
        dateRange:
          editingItem.startDate || editingItem.endDate
            ? [
                editingItem.startDate
                  ? dayjs(editingItem.startDate)
                  : dayjs(),
                editingItem.endDate
                  ? dayjs(editingItem.endDate)
                  : editingItem.startDate
                    ? dayjs(editingItem.startDate)
                    : dayjs(),
              ]
            : null,
      });
      return;
    }
    itemForm.setFieldsValue({
      title: "",
      notes: "",
      url: "",
      status: "IDEA",
      cost: "",
      sortOrder: plan.items.length,
      dateRange: null,
    });
  }, [itemOpen, editingItem, itemForm, plan.items.length]);

  function savePlan(values: PlanFormValues) {
    startTransition(async () => {
      const result = await upsertTravelPlan({
        id: plan.id,
        title: values.title,
        summary: values.summary ?? "",
        notes: values.notes ?? "",
        startDate: values.dateRange?.[0]?.format("YYYY-MM-DD") ?? "",
        endDate: values.dateRange?.[1]?.format("YYYY-MM-DD") ?? "",
      });
      if (!result.ok) {
        message.error(result.message);
        return;
      }
      message.success(result.message);
      setPlanOpen(false);
      router.refresh();
    });
  }

  function saveItem(values: ItemFormValues) {
    startTransition(async () => {
      const result = await upsertTravelPlanItem({
        id: editingItem?.id,
        planId: plan.id,
        title: values.title,
        notes: values.notes ?? "",
        url: values.url ?? "",
        status: values.status,
        cost: values.cost ?? "",
        sortOrder: values.sortOrder ?? 0,
        startDate: values.dateRange?.[0]?.format("YYYY-MM-DD") ?? "",
        endDate: values.dateRange?.[1]?.format("YYYY-MM-DD") ?? "",
      });
      if (!result.ok) {
        message.error(result.message);
        return;
      }
      message.success(result.message);
      setItemOpen(false);
      setEditingItem(null);
      router.refresh();
    });
  }

  function onDeleteItem(id: string) {
    startTransition(async () => {
      const result = await deleteTravelPlanItem(id);
      if (!result.ok) {
        message.error(result.message);
        return;
      }
      message.success(result.message);
      router.refresh();
    });
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Link href="/travel/plans" style={{ color: "var(--muted)" }}>
          ← All plans
        </Link>
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <div>
          <h2 style={{ margin: 0 }}>{plan.title}</h2>
          <Typography.Paragraph
            type="secondary"
            style={{ margin: "6px 0 0", maxWidth: 560 }}
          >
            {plan.summary || "No summary"}
          </Typography.Paragraph>
          <Space wrap size="middle" style={{ marginTop: 4 }}>
            <span style={{ color: "var(--muted)" }}>
              {formatRange(plan.startDate, plan.endDate)}
            </span>
            {plan.notes ? (
              <span style={{ color: "var(--muted)" }}>{plan.notes}</span>
            ) : null}
          </Space>
        </div>
        <Space wrap>
          <Button icon={<EditOutlined />} onClick={() => setPlanOpen(true)}>
            Edit plan
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingItem(null);
              setItemOpen(true);
            }}
          >
            Add research item
          </Button>
        </Space>
      </div>

      <div
        role="group"
        aria-label="Status filter"
        style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}
      >
        {(
          [
            { key: "all" as const, label: "All" },
            ...STATUS_OPTIONS.map((o) => ({
              key: o.value as StatusFilter,
              label: o.label,
            })),
          ] as const
        ).map((item) => {
          const active = statusFilter === item.key;
          return (
            <Button
              key={item.key}
              size="small"
              type={active ? "primary" : "default"}
              onClick={() => setStatusFilter(item.key)}
            >
              {item.label}
            </Button>
          );
        })}
      </div>

      <TableFrame>
        <Table
          rowKey="id"
          dataSource={visibleItems}
          pagination={{ pageSize: 20 }}
          locale={{ emptyText: "No research items in this filter." }}
          columns={[
            {
              title: "Title",
              dataIndex: "title",
              render: (title: string, row) => (
                <Space orientation="vertical" size={0}>
                  <span>{title}</span>
                  {row.notes ? (
                    <span style={{ color: "var(--muted)", fontSize: 12 }}>
                      {row.notes.length > 80
                        ? `${row.notes.slice(0, 80)}…`
                        : row.notes}
                    </span>
                  ) : null}
                </Space>
              ),
            },
            {
              title: "Status",
              dataIndex: "status",
              width: 120,
              render: (status: TravelPlanItemStatus) => (
                <Tag color={statusColor(status)}>{statusLabel(status)}</Tag>
              ),
            },
            {
              title: "Dates",
              key: "dates",
              width: 180,
              render: (_: unknown, row) =>
                formatRange(row.startDate, row.endDate),
            },
            {
              title: "Cost",
              dataIndex: "cost",
              width: 100,
              render: (cost: string) => cost || "—",
            },
            {
              title: "Link",
              dataIndex: "url",
              width: 80,
              render: (url: string) =>
                url ? (
                  <a href={url} target="_blank" rel="noreferrer">
                    <Button size="small" icon={<ExportOutlined />} />
                  </a>
                ) : (
                  "—"
                ),
            },
            {
              title: "Order",
              dataIndex: "sortOrder",
              width: 70,
            },
            {
              title: "Actions",
              key: "actions",
              width: 110,
              render: (_: unknown, row) => (
                <Space>
                  <Button
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => {
                      setEditingItem(row);
                      setItemOpen(true);
                    }}
                  />
                  <Popconfirm
                    title="Delete this item?"
                    onConfirm={() => onDeleteItem(row.id)}
                  >
                    <Button
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      loading={pending}
                    />
                  </Popconfirm>
                </Space>
              ),
            },
          ]}
        />
      </TableFrame>

      <Modal
        title="Edit plan"
        open={planOpen}
        onCancel={() => setPlanOpen(false)}
        onOk={() => planForm.submit()}
        confirmLoading={pending}
        destroyOnHidden
      >
        <Form form={planForm} layout="vertical" onFinish={savePlan}>
          <Form.Item
            label="Title"
            name="title"
            rules={[{ required: true, message: "Title is required" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item label="Summary" name="summary">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item label="Dates" name="dateRange">
            <DatePicker.RangePicker style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item label="Notes" name="notes">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={editingItem ? "Edit research item" : "Add research item"}
        open={itemOpen}
        onCancel={() => {
          setItemOpen(false);
          setEditingItem(null);
        }}
        onOk={() => itemForm.submit()}
        confirmLoading={pending}
        destroyOnHidden
        width="min(560px, calc(100vw - 24px))"
      >
        <Form form={itemForm} layout="vertical" onFinish={saveItem}>
          <Form.Item
            label="Title"
            name="title"
            rules={[{ required: true, message: "Title is required" }]}
          >
            <Input placeholder="e.g. Hotel near station" />
          </Form.Item>
          <Form.Item label="Notes" name="notes">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item label="URL" name="url">
            <Input placeholder="https://" />
          </Form.Item>
          <Form.Item
            label="Status"
            name="status"
            rules={[{ required: true }]}
          >
            <Select options={STATUS_OPTIONS} />
          </Form.Item>
          <Form.Item label="Dates" name="dateRange">
            <DatePicker.RangePicker style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item label="Rough cost" name="cost">
            <Input placeholder="e.g. $120 / night" />
          </Form.Item>
          <Form.Item label="Sort order" name="sortOrder">
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
