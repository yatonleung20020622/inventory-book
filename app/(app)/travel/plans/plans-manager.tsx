"use client";

import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import {
  App,
  Button,
  DatePicker,
  Form,
  Input,
  Modal,
  Popconfirm,
  Space,
  Table,
} from "antd";
import dayjs from "dayjs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { TableFrame } from "@/components/table-frame";
import {
  deleteTravelPlan,
  upsertTravelPlan,
  type TravelPlanListItem,
} from "@/lib/actions/travel-plans";
import type { TravelPlanItemStatus } from "@/lib/generated/prisma/enums";

type PlanFormValues = {
  title: string;
  summary: string;
  dateRange?: [dayjs.Dayjs, dayjs.Dayjs] | null;
  notes: string;
};

const emptyForm: PlanFormValues = {
  title: "",
  summary: "",
  dateRange: null,
  notes: "",
};

function formatRange(start: string, end: string) {
  if (!start && !end) return "—";
  if (start && end) return `${start} → ${end}`;
  return start || end;
}

function statusSummary(counts: Record<TravelPlanItemStatus, number>) {
  const parts: string[] = [];
  if (counts.IDEA) parts.push(`${counts.IDEA} idea`);
  if (counts.RESEARCHING) parts.push(`${counts.RESEARCHING} researching`);
  if (counts.BOOKED) parts.push(`${counts.BOOKED} booked`);
  if (counts.SKIPPED) parts.push(`${counts.SKIPPED} skipped`);
  return parts.length ? parts.join(" · ") : "No items";
}

export function TravelPlansManager({ plans }: { plans: TravelPlanListItem[] }) {
  const { message } = App.useApp();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TravelPlanListItem | null>(null);
  const [form] = Form.useForm<PlanFormValues>();

  useEffect(() => {
    if (!open) return;
    if (editing) {
      form.setFieldsValue({
        title: editing.title,
        summary: editing.summary,
        notes: editing.notes,
        dateRange:
          editing.startDate || editing.endDate
            ? [
                editing.startDate ? dayjs(editing.startDate) : dayjs(),
                editing.endDate
                  ? dayjs(editing.endDate)
                  : editing.startDate
                    ? dayjs(editing.startDate)
                    : dayjs(),
              ]
            : null,
      });
      return;
    }
    form.setFieldsValue(emptyForm);
  }, [open, editing, form]);

  function closeModal() {
    setOpen(false);
    setEditing(null);
  }

  function onSubmit(values: PlanFormValues) {
    startTransition(async () => {
      const startDate = values.dateRange?.[0]?.format("YYYY-MM-DD") ?? "";
      const endDate = values.dateRange?.[1]?.format("YYYY-MM-DD") ?? "";
      const result = await upsertTravelPlan({
        id: editing?.id,
        title: values.title,
        summary: values.summary ?? "",
        notes: values.notes ?? "",
        startDate,
        endDate,
      });
      if (!result.ok) {
        message.error(result.message);
        return;
      }
      message.success(result.message);
      closeModal();
      if (!editing && result.id) {
        router.push(`/travel/plans/${result.id}`);
        return;
      }
      router.refresh();
    });
  }

  function onDelete(id: string) {
    startTransition(async () => {
      const result = await deleteTravelPlan(id);
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
          <h2 style={{ margin: 0 }}>Travel plans</h2>
          <p style={{ margin: "4px 0 0", color: "var(--muted)" }}>
            Research trips before you go — notes, links, dates, and rough costs.
          </p>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          New plan
        </Button>
      </div>

      <TableFrame>
        <Table
          rowKey="id"
          dataSource={plans}
          pagination={{ pageSize: 20 }}
          locale={{ emptyText: "No plans yet. Create one to start researching." }}
          columns={[
            {
              title: "Trip",
              dataIndex: "title",
              render: (title: string, row) => (
                <Space orientation="vertical" size={0}>
                  <Link href={`/travel/plans/${row.id}`}>{title}</Link>
                  {row.summary ? (
                    <span style={{ color: "var(--muted)", fontSize: 12 }}>
                      {row.summary}
                    </span>
                  ) : null}
                </Space>
              ),
            },
            {
              title: "Dates",
              key: "dates",
              width: 200,
              render: (_: unknown, row) =>
                formatRange(row.startDate, row.endDate),
            },
            {
              title: "Items",
              dataIndex: "itemCount",
              width: 80,
            },
            {
              title: "Status mix",
              key: "status",
              render: (_: unknown, row) => statusSummary(row.statusCounts),
            },
            {
              title: "Actions",
              key: "actions",
              width: 160,
              render: (_: unknown, row) => (
                <Space>
                  <Link href={`/travel/plans/${row.id}`}>
                    <Button size="small" type="primary">
                      Open
                    </Button>
                  </Link>
                  <Button
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => {
                      setEditing(row);
                      setOpen(true);
                    }}
                  />
                  <Popconfirm
                    title="Delete this plan and all research items?"
                    onConfirm={() => onDelete(row.id)}
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
        title={editing ? "Edit plan" : "New plan"}
        open={open}
        onCancel={closeModal}
        onOk={() => form.submit()}
        confirmLoading={pending}
        destroyOnHidden
        width="min(560px, calc(100vw - 24px))"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onSubmit}
          initialValues={emptyForm}
        >
          <Form.Item
            label="Title"
            name="title"
            rules={[{ required: true, message: "Title is required" }]}
          >
            <Input placeholder="e.g. Japan 2026" />
          </Form.Item>
          <Form.Item label="Summary" name="summary">
            <Input.TextArea rows={2} placeholder="Short overview" />
          </Form.Item>
          <Form.Item label="Dates" name="dateRange">
            <DatePicker.RangePicker style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item label="Notes" name="notes">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
