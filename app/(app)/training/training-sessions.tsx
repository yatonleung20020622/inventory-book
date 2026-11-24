"use client";

import {
  DeleteOutlined,
  ThunderboltOutlined,
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
  Tag,
} from "antd";
import dayjs from "dayjs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { TableFrame } from "@/components/table-frame";
import {
  createTrainSession,
  deleteTrainSession,
  type TrainSessionListItem,
} from "@/lib/actions/training";

type PastFormValues = {
  startedAt: dayjs.Dayjs;
  title: string;
  notes: string;
};

export function TrainingSessionsManager({
  sessions,
}: {
  sessions: TrainSessionListItem[];
}) {
  const { message } = App.useApp();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [pastOpen, setPastOpen] = useState(false);
  const [form] = Form.useForm<PastFormValues>();

  function startWorkout() {
    startTransition(async () => {
      const result = await createTrainSession({ status: "IN_PROGRESS" });
      if (!result.ok || !result.id) {
        message.error(result.message);
        return;
      }
      message.success("Workout started.");
      router.push(`/training/session/${result.id}`);
    });
  }

  function logPast(values: PastFormValues) {
    startTransition(async () => {
      const result = await createTrainSession({
        status: "COMPLETED",
        startedAt: values.startedAt.toISOString(),
        title: values.title ?? "",
        notes: values.notes ?? "",
      });
      if (!result.ok || !result.id) {
        message.error(result.message);
        return;
      }
      message.success("Past session created.");
      setPastOpen(false);
      form.resetFields();
      router.push(`/training/session/${result.id}`);
    });
  }

  function onDelete(id: string) {
    startTransition(async () => {
      const result = await deleteTrainSession(id);
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
          <h2 style={{ margin: 0 }}>Training</h2>
          <p style={{ margin: "4px 0 0", color: "var(--muted)" }}>
            Log sets, reps, and rest between sets.
          </p>
        </div>
        <Space wrap>
          <Link href="/training/exercises">
            <Button>Exercises</Button>
          </Link>
          <Button
            onClick={() => {
              form.setFieldsValue({
                startedAt: dayjs(),
                title: "",
                notes: "",
              });
              setPastOpen(true);
            }}
          >
            Log past session
          </Button>
          <Button
            type="primary"
            icon={<ThunderboltOutlined />}
            loading={pending}
            onClick={startWorkout}
          >
            Start workout
          </Button>
        </Space>
      </div>

      <TableFrame>
        <Table
          rowKey="id"
          dataSource={sessions}
          pagination={{ pageSize: 20 }}
          locale={{ emptyText: "No sessions yet. Start a workout." }}
          columns={[
            {
              title: "When",
              dataIndex: "startedAt",
              render: (value: string) =>
                dayjs(value).format("YYYY-MM-DD HH:mm"),
              width: 160,
            },
            {
              title: "Status",
              dataIndex: "status",
              width: 120,
              render: (status: TrainSessionListItem["status"]) => (
                <Tag color={status === "IN_PROGRESS" ? "processing" : "success"}>
                  {status === "IN_PROGRESS" ? "In progress" : "Completed"}
                </Tag>
              ),
            },
            {
              title: "Exercises",
              dataIndex: "exerciseNames",
              render: (names: string[]) =>
                names.length ? names.join(", ") : "—",
            },
            {
              title: "Sets",
              dataIndex: "totalSets",
              width: 80,
            },
            {
              title: "Title",
              dataIndex: "title",
              ellipsis: true,
              render: (title: string) => title || "—",
            },
            {
              title: "Actions",
              key: "actions",
              width: 160,
              render: (_: unknown, row: TrainSessionListItem) => (
                <Space>
                  <Link href={`/training/session/${row.id}`}>
                    <Button size="small" type="primary">
                      Open
                    </Button>
                  </Link>
                  <Popconfirm
                    title="Delete this session?"
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
        title="Log past session"
        open={pastOpen}
        onCancel={() => setPastOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={pending}
        okText="Create"
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={logPast}>
          <Form.Item
            label="Date & time"
            name="startedAt"
            rules={[{ required: true, message: "Required" }]}
          >
            <DatePicker showTime style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item label="Title" name="title">
            <Input placeholder="Optional" />
          </Form.Item>
          <Form.Item label="Notes" name="notes">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
