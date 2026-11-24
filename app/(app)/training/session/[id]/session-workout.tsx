"use client";

import {
  CheckOutlined,
  DeleteOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import {
  App,
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  InputNumber,
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
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import {
  addExerciseToSession,
  deleteTrainSet,
  finishTrainSession,
  removeExerciseFromSession,
  updateSessionExercise,
  updateTrainSession,
  updateTrainSetRest,
  upsertTrainSet,
  type TrainExerciseRecord,
  type TrainSessionRecord,
} from "@/lib/actions/training";

type RestState = {
  setId: string;
  sessionExerciseId: string;
  remaining: number;
  planned: number;
} | null;

function formatCountdown(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function SessionWorkout({
  session,
  exercises,
}: {
  session: TrainSessionRecord;
  exercises: TrainExerciseRecord[];
}) {
  const { message } = App.useApp();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [exerciseId, setExerciseId] = useState<string | undefined>();
  const [rest, setRest] = useState<RestState>(null);
  const restRef = useRef(rest);
  restRef.current = rest;
  const isLive = session.status === "IN_PROGRESS";

  const finishRest = useCallback(
    (takenSec: number) => {
      const current = restRef.current;
      if (!current) return;
      const setId = current.setId;
      const sessionExerciseId = current.sessionExerciseId;
      setRest(null);
      startTransition(async () => {
        const result = await updateTrainSetRest({
          id: setId,
          restAfterSec: Math.max(0, takenSec),
        });
        if (!result.ok) {
          message.error(result.message);
          return;
        }
        router.refresh();
        requestAnimationFrame(() => {
          const el = document.getElementById(
            `reps-${sessionExerciseId}`,
          ) as HTMLInputElement | null;
          el?.focus();
        });
      });
    },
    [message, router],
  );

  useEffect(() => {
    if (!rest) return;
    if (rest.remaining <= 0) {
      const taken = rest.planned;
      finishRest(taken);
      return;
    }
    const id = window.setInterval(() => {
      setRest((prev) => {
        if (!prev) return prev;
        if (prev.remaining <= 1) {
          return { ...prev, remaining: 0 };
        }
        return { ...prev, remaining: prev.remaining - 1 };
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [rest, finishRest]);

  function saveMeta(values: {
    title: string;
    notes: string;
    startedAt: dayjs.Dayjs;
  }) {
    startTransition(async () => {
      const result = await updateTrainSession({
        id: session.id,
        title: values.title,
        notes: values.notes,
        startedAt: values.startedAt.toISOString(),
      });
      if (!result.ok) {
        message.error(result.message);
        return;
      }
      message.success(result.message);
      router.refresh();
    });
  }

  function addExercise() {
    if (!exerciseId) {
      message.warning("Pick an exercise first.");
      return;
    }
    startTransition(async () => {
      const result = await addExerciseToSession({
        sessionId: session.id,
        exerciseId,
      });
      if (!result.ok) {
        message.error(result.message);
        return;
      }
      message.success(result.message);
      setExerciseId(undefined);
      router.refresh();
    });
  }

  function logSet(
    sessionExerciseId: string,
    targetRestSec: number,
    values: { reps: number; durationSec?: number },
  ) {
    startTransition(async () => {
      const result = await upsertTrainSet({
        sessionExerciseId,
        reps: values.reps,
        durationSec: values.durationSec ?? 0,
        restAfterSec: 0,
      });
      if (!result.ok || !result.id) {
        message.error(result.message);
        return;
      }
      message.success(result.message);
      router.refresh();
      if (isLive && targetRestSec > 0) {
        setRest({
          setId: result.id,
          sessionExerciseId,
          remaining: targetRestSec,
          planned: targetRestSec,
        });
      }
    });
  }

  function onFinish() {
    startTransition(async () => {
      const result = await finishTrainSession(session.id);
      if (!result.ok) {
        message.error(result.message);
        return;
      }
      message.success(result.message);
      setRest(null);
      router.refresh();
    });
  }

  const availableExercises = exercises.filter(
    (ex) => !session.exercises.some((se) => se.exerciseId === ex.id),
  );

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <Link href="/training" style={{ color: "var(--muted)" }}>
            ← All sessions
          </Link>
          <h2 style={{ margin: "8px 0 0" }}>
            {session.title.trim() || "Workout"}
          </h2>
          <Tag
            color={isLive ? "processing" : "success"}
            style={{ marginTop: 8 }}
          >
            {isLive ? "In progress" : "Completed"}
          </Tag>
        </div>
        <Space wrap>
          {isLive ? (
            <Button
              type="primary"
              icon={<CheckOutlined />}
              loading={pending}
              onClick={onFinish}
            >
              Finish workout
            </Button>
          ) : null}
        </Space>
      </div>

      {rest ? (
        <Card
          style={{
            textAlign: "center",
            background: "var(--card-bg)",
            borderColor: "var(--border-color)",
          }}
        >
          <Typography.Text type="secondary">Rest</Typography.Text>
          <div
            style={{
              fontSize: "clamp(3rem, 12vw, 5rem)",
              fontWeight: 700,
              lineHeight: 1.1,
              margin: "8px 0 16px",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {formatCountdown(rest.remaining)}
          </div>
          <Space wrap>
            <Button
              onClick={() =>
                setRest((prev) =>
                  prev
                    ? { ...prev, remaining: prev.remaining + 15 }
                    : prev,
                )
              }
            >
              +15s
            </Button>
            <Button
              onClick={() => {
                const current = restRef.current;
                if (!current) return;
                finishRest(current.planned - current.remaining);
              }}
            >
              Skip
            </Button>
            <Button
              danger
              onClick={() => {
                const current = restRef.current;
                if (!current) return;
                finishRest(current.planned - current.remaining);
              }}
            >
              Stop
            </Button>
          </Space>
        </Card>
      ) : null}

      <Card size="small" title="Session details">
        <Form
          layout="vertical"
          initialValues={{
            title: session.title,
            notes: session.notes,
            startedAt: dayjs(session.startedAt),
          }}
          onFinish={saveMeta}
          key={session.updatedAt}
        >
          <Space wrap style={{ width: "100%" }} styles={{ item: { flex: 1 } }}>
            <Form.Item
              label="Title"
              name="title"
              style={{ flex: 1, minWidth: 160 }}
            >
              <Input placeholder="Optional" />
            </Form.Item>
            <Form.Item
              label="Started"
              name="startedAt"
              rules={[{ required: true }]}
              style={{ minWidth: 200 }}
            >
              <DatePicker showTime style={{ width: "100%" }} />
            </Form.Item>
          </Space>
          <Form.Item label="Notes" name="notes">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={pending}>
            Save details
          </Button>
        </Form>
      </Card>

      <Card
        size="small"
        title="Add exercise"
        extra={
          <Space.Compact>
            <Select
              style={{ minWidth: 200 }}
              placeholder="Choose exercise"
              value={exerciseId}
              onChange={setExerciseId}
              options={availableExercises.map((ex) => ({
                value: ex.id,
                label: `${ex.name} (${ex.defaultRestSec}s rest)`,
              }))}
              showSearch
              optionFilterProp="label"
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              loading={pending}
              onClick={addExercise}
            >
              Add
            </Button>
          </Space.Compact>
        }
      >
        {availableExercises.length === 0 ? (
          <Typography.Text type="secondary">
            All catalog exercises are already in this session.{" "}
            <Link href="/training/exercises">Manage exercises</Link>
          </Typography.Text>
        ) : (
          <Typography.Text type="secondary">
            Pick an exercise to start logging sets.
          </Typography.Text>
        )}
      </Card>

      {session.exercises.map((ex) => (
        <Card
          key={ex.id}
          size="small"
          title={ex.exerciseName}
          extra={
            <Space>
              <span style={{ color: "var(--muted)", fontSize: 13 }}>
                Rest target
              </span>
              <InputNumber
                min={0}
                value={ex.targetRestSec}
                addonAfter="s"
                onChange={(value) => {
                  startTransition(async () => {
                    const result = await updateSessionExercise({
                      id: ex.id,
                      targetRestSec: Number(value) || 0,
                    });
                    if (!result.ok) {
                      message.error(result.message);
                      return;
                    }
                    router.refresh();
                  });
                }}
              />
              <Popconfirm
                title="Remove this exercise and its sets?"
                onConfirm={() => {
                  startTransition(async () => {
                    const result = await removeExerciseFromSession(ex.id);
                    if (!result.ok) {
                      message.error(result.message);
                      return;
                    }
                    message.success(result.message);
                    router.refresh();
                  });
                }}
              >
                <Button size="small" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            </Space>
          }
        >
          <Table
            rowKey="id"
            size="small"
            pagination={false}
            dataSource={ex.sets}
            locale={{ emptyText: "No sets yet" }}
            columns={[
              { title: "Set", dataIndex: "setIndex", width: 60 },
              { title: "Reps", dataIndex: "reps", width: 80 },
              {
                title: "Duration",
                dataIndex: "durationSec",
                width: 90,
                render: (sec: number) => (sec ? `${sec}s` : "—"),
              },
              {
                title: "Rest after",
                dataIndex: "restAfterSec",
                width: 100,
                render: (sec: number) => `${sec}s`,
              },
              {
                title: "",
                key: "actions",
                width: 60,
                render: (_: unknown, row) => (
                  <Popconfirm
                    title="Delete set?"
                    onConfirm={() => {
                      startTransition(async () => {
                        const result = await deleteTrainSet(row.id);
                        if (!result.ok) {
                          message.error(result.message);
                          return;
                        }
                        message.success(result.message);
                        router.refresh();
                      });
                    }}
                  >
                    <Button size="small" danger icon={<DeleteOutlined />} />
                  </Popconfirm>
                ),
              },
            ]}
          />

          <Form
            layout="inline"
            style={{ marginTop: 12, flexWrap: "wrap", gap: 8 }}
            onFinish={(values: { reps: number; durationSec?: number }) =>
              logSet(ex.id, ex.targetRestSec, values)
            }
            initialValues={{ reps: undefined, durationSec: 0 }}
          >
            <Form.Item
              name="reps"
              rules={[{ required: true, message: "Reps" }]}
              style={{ marginBottom: 8 }}
            >
              <InputNumber
                id={`reps-${ex.id}`}
                min={0}
                placeholder="Reps"
              />
            </Form.Item>
            <Form.Item name="durationSec" style={{ marginBottom: 8 }}>
              <InputNumber min={0} placeholder="Duration (s)" />
            </Form.Item>
            <Form.Item style={{ marginBottom: 8 }}>
              <Button type="primary" htmlType="submit" loading={pending}>
                Log set
              </Button>
            </Form.Item>
          </Form>
        </Card>
      ))}
    </div>
  );
}
