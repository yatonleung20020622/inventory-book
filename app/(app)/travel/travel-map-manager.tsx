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
  Drawer,
  Empty,
  Form,
  Input,
  Modal,
  Popconfirm,
  Space,
  Typography,
} from "antd";
import dayjs, { type Dayjs } from "dayjs";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { PageCardless } from "@/components/page-above-card";
import { useIsMobile } from "@/lib/hooks/use-is-mobile";
import {
  createTravelPlace,
  createTravelVisit,
  deleteTravelPlace,
  deleteTravelVisit,
  updateTravelPlace,
  updateTravelVisit,
  type TravelPlaceRecord,
  type TravelVisitRecord,
} from "@/lib/actions/travel";

const TravelLeafletMap = dynamic(
  () =>
    import("./travel-leaflet-map").then((mod) => mod.TravelLeafletMap),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          height: "100%",
          display: "grid",
          placeItems: "center",
          color: "var(--muted)",
          background: "var(--card-bg)",
          borderRadius: 8,
        }}
      >
        Loading map…
      </div>
    ),
  },
);

type PlaceFormValues = {
  name: string;
  address: string;
  visitedAt: Dayjs;
  notes: string;
  companions: string;
};

type VisitFormValues = {
  visitedAt: Dayjs;
  notes: string;
  companions: string;
};

type EditPlaceFormValues = {
  name: string;
  address: string;
};

type TravelMapManagerProps = {
  places: TravelPlaceRecord[];
};

function formatVisitDate(value: string) {
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format("YYYY-MM-DD") : value;
}

export function TravelMapManager({ places }: TravelMapManagerProps) {
  const { message } = App.useApp();
  const router = useRouter();
  const isMobile = useIsMobile();
  const [pending, startTransition] = useTransition();
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createCoords, setCreateCoords] = useState<{
    lat: number;
    lon: number;
  } | null>(null);
  const [editPlaceOpen, setEditPlaceOpen] = useState(false);
  const [visitModal, setVisitModal] = useState<{
    mode: "create" | "edit";
    visit?: TravelVisitRecord;
  } | null>(null);

  const [createForm] = Form.useForm<PlaceFormValues>();
  const [editPlaceForm] = Form.useForm<EditPlaceFormValues>();
  const [visitForm] = Form.useForm<VisitFormValues>();

  const selectedPlace = useMemo(
    () => places.find((place) => place.id === selectedPlaceId) ?? null,
    [places, selectedPlaceId],
  );

  useEffect(() => {
    if (selectedPlaceId && !places.some((p) => p.id === selectedPlaceId)) {
      setSelectedPlaceId(null);
      setPanelOpen(false);
    }
  }, [places, selectedPlaceId]);

  useEffect(() => {
    if (!createOpen) return;
    createForm.setFieldsValue({
      name: "",
      address: "",
      visitedAt: dayjs(),
      notes: "",
      companions: "",
    });
  }, [createOpen, createForm]);

  useEffect(() => {
    if (!editPlaceOpen || !selectedPlace) return;
    editPlaceForm.setFieldsValue({
      name: selectedPlace.name,
      address: selectedPlace.address,
    });
  }, [editPlaceOpen, selectedPlace, editPlaceForm]);

  useEffect(() => {
    if (!visitModal) return;
    if (visitModal.mode === "edit" && visitModal.visit) {
      visitForm.setFieldsValue({
        visitedAt: dayjs(visitModal.visit.visitedAt),
        notes: visitModal.visit.notes,
        companions: visitModal.visit.companions,
      });
      return;
    }
    visitForm.setFieldsValue({
      visitedAt: dayjs(),
      notes: "",
      companions: "",
    });
  }, [visitModal, visitForm]);

  function openPlace(placeId: string) {
    setSelectedPlaceId(placeId);
    setPanelOpen(true);
  }

  function onMapClick(lat: number, lon: number) {
    setCreateCoords({ lat, lon });
    setCreateOpen(true);
  }

  function submitCreatePlace(values: PlaceFormValues) {
    if (!createCoords) return;
    startTransition(async () => {
      const result = await createTravelPlace({
        name: values.name,
        address: values.address,
        lat: createCoords.lat,
        lon: createCoords.lon,
        firstVisit: {
          visitedAt: values.visitedAt.format("YYYY-MM-DD"),
          notes: values.notes,
          companions: values.companions,
        },
      });
      if (!result.ok) {
        message.error(result.message);
        return;
      }
      message.success(result.message);
      setCreateOpen(false);
      setCreateCoords(null);
      if (result.placeId) {
        setSelectedPlaceId(result.placeId);
        setPanelOpen(true);
      }
      router.refresh();
    });
  }

  function submitEditPlace(values: EditPlaceFormValues) {
    if (!selectedPlace) return;
    startTransition(async () => {
      const result = await updateTravelPlace({
        id: selectedPlace.id,
        name: values.name,
        address: values.address,
        lat: selectedPlace.lat,
        lon: selectedPlace.lon,
      });
      if (!result.ok) {
        message.error(result.message);
        return;
      }
      message.success(result.message);
      setEditPlaceOpen(false);
      router.refresh();
    });
  }

  function submitVisit(values: VisitFormValues) {
    if (!selectedPlace) return;
    startTransition(async () => {
      if (visitModal?.mode === "edit" && visitModal.visit) {
        const result = await updateTravelVisit({
          id: visitModal.visit.id,
          visitedAt: values.visitedAt.format("YYYY-MM-DD"),
          notes: values.notes,
          companions: values.companions,
        });
        if (!result.ok) {
          message.error(result.message);
          return;
        }
        message.success(result.message);
      } else {
        const result = await createTravelVisit({
          placeId: selectedPlace.id,
          visitedAt: values.visitedAt.format("YYYY-MM-DD"),
          notes: values.notes,
          companions: values.companions,
        });
        if (!result.ok) {
          message.error(result.message);
          return;
        }
        message.success(result.message);
      }
      setVisitModal(null);
      router.refresh();
    });
  }

  function onDeletePlace() {
    if (!selectedPlace) return;
    startTransition(async () => {
      const result = await deleteTravelPlace(selectedPlace.id);
      if (!result.ok) {
        message.error(result.message);
        return;
      }
      message.success(result.message);
      setSelectedPlaceId(null);
      setPanelOpen(false);
      router.refresh();
    });
  }

  function onDeleteVisit(visitId: string) {
    startTransition(async () => {
      const result = await deleteTravelVisit(visitId);
      if (!result.ok) {
        message.error(result.message);
        return;
      }
      message.success(result.message);
      if (result.message.includes("place deleted")) {
        setSelectedPlaceId(null);
        setPanelOpen(false);
      }
      router.refresh();
    });
  }

  const placePanel = (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {selectedPlace ? (
        <>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 8,
              alignItems: "flex-start",
            }}
          >
            <div style={{ minWidth: 0 }}>
              <Typography.Title level={4} style={{ margin: 0 }}>
                {selectedPlace.name}
              </Typography.Title>
              {selectedPlace.address ? (
                <Typography.Paragraph
                  type="secondary"
                  style={{ marginBottom: 0, marginTop: 4 }}
                >
                  {selectedPlace.address}
                </Typography.Paragraph>
              ) : null}
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {selectedPlace.lat.toFixed(5)}, {selectedPlace.lon.toFixed(5)}
              </Typography.Text>
            </div>
            <Space>
              <Button
                icon={<EditOutlined />}
                onClick={() => setEditPlaceOpen(true)}
              />
              <Popconfirm
                title="Delete this place and all visits?"
                onConfirm={onDeletePlace}
                okButtonProps={{ danger: true, loading: pending }}
              >
                <Button danger icon={<DeleteOutlined />} />
              </Popconfirm>
            </Space>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography.Text strong>Visits</Typography.Text>
            <Button
              type="primary"
              size="small"
              icon={<PlusOutlined />}
              onClick={() => setVisitModal({ mode: "create" })}
            >
              Add visit
            </Button>
          </div>

          {selectedPlace.visits.length === 0 ? (
            <Empty description="No visits yet" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {selectedPlace.visits.map((visit) => (
                <div
                  key={visit.id}
                  style={{
                    border: "1px solid var(--border-color)",
                    borderRadius: 8,
                    padding: 12,
                    background: "var(--page-bg)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 8,
                      marginBottom: 6,
                    }}
                  >
                    <Typography.Text strong>
                      {formatVisitDate(visit.visitedAt)}
                    </Typography.Text>
                    <Space size={4}>
                      <Button
                        size="small"
                        type="text"
                        icon={<EditOutlined />}
                        onClick={() =>
                          setVisitModal({ mode: "edit", visit })
                        }
                      />
                      <Popconfirm
                        title="Delete this visit?"
                        onConfirm={() => onDeleteVisit(visit.id)}
                        okButtonProps={{ danger: true, loading: pending }}
                      >
                        <Button
                          size="small"
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                        />
                      </Popconfirm>
                    </Space>
                  </div>
                  {visit.companions ? (
                    <Typography.Paragraph style={{ marginBottom: 4 }}>
                      <Typography.Text type="secondary">With: </Typography.Text>
                      {visit.companions}
                    </Typography.Paragraph>
                  ) : null}
                  {visit.notes ? (
                    <Typography.Paragraph style={{ marginBottom: 0 }}>
                      {visit.notes}
                    </Typography.Paragraph>
                  ) : (
                    <Typography.Text type="secondary">
                      No notes
                    </Typography.Text>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <Empty
          description="Click the map to add a place, or select a pin"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      )}
    </div>
  );

  return (
    <>
      <PageCardless />
      <div
        style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          gap: 12,
          height: isMobile ? "auto" : "calc(100dvh - 180px)",
          minHeight: isMobile ? 520 : 480,
        }}
      >
        <div
          style={{
            flex: 1,
            minWidth: 0,
            minHeight: isMobile ? 360 : 0,
            position: "relative",
            border: "1px solid var(--border-color)",
            borderRadius: 8,
            overflow: "hidden",
            background: "var(--card-bg)",
          }}
        >
          <div
            style={{
              position: "absolute",
              zIndex: 500,
              top: 12,
              left: 12,
              right: 12,
              display: "flex",
              justifyContent: "space-between",
              gap: 8,
              pointerEvents: "none",
            }}
          >
            <div
              style={{
                pointerEvents: "auto",
                background: "var(--card-bg)",
                border: "1px solid var(--border-color)",
                borderRadius: 8,
                padding: "8px 12px",
                boxShadow: "0 2px 8px rgba(0,0,0,.08)",
                maxWidth: 320,
              }}
            >
              <Typography.Text strong>Travel map</Typography.Text>
              <div>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  Click the map to reveal a place. Unvisited areas stay dark.
                </Typography.Text>
              </div>
            </div>
            {isMobile && selectedPlace ? (
              <Button
                style={{ pointerEvents: "auto" }}
                onClick={() => setPanelOpen(true)}
              >
                Journal
              </Button>
            ) : null}
          </div>
          <TravelLeafletMap
            places={places}
            selectedPlaceId={selectedPlaceId}
            onSelectPlace={openPlace}
            onMapClick={onMapClick}
          />
        </div>

        {!isMobile ? (
          <div
            style={{
              width: 360,
              flexShrink: 0,
              background: "var(--card-bg)",
              border: "1px solid var(--border-color)",
              borderRadius: 8,
              padding: 16,
              overflow: "auto",
            }}
          >
            {placePanel}
          </div>
        ) : (
          <Drawer
            title={selectedPlace?.name ?? "Place"}
            open={panelOpen}
            onClose={() => setPanelOpen(false)}
            size="large"
            styles={{ body: { paddingTop: 12 } }}
          >
            {placePanel}
          </Drawer>
        )}
      </div>

      <Modal
        title="Add place"
        open={createOpen}
        onCancel={() => {
          setCreateOpen(false);
          setCreateCoords(null);
        }}
        onOk={() => createForm.submit()}
        confirmLoading={pending}
        okText="Create"
        destroyOnHidden
        width="min(520px, calc(100vw - 24px))"
      >
        {createCoords ? (
          <Typography.Paragraph type="secondary">
            Pin at {createCoords.lat.toFixed(5)}, {createCoords.lon.toFixed(5)}
          </Typography.Paragraph>
        ) : null}
        <Form
          form={createForm}
          layout="vertical"
          onFinish={submitCreatePlace}
          requiredMark="optional"
        >
          <Form.Item
            name="name"
            label="Place name"
            rules={[{ required: true, message: "Name is required" }]}
          >
            <Input placeholder="e.g. Victoria House" />
          </Form.Item>
          <Form.Item name="address" label="Address">
            <Input placeholder="Optional" />
          </Form.Item>
          <Form.Item
            name="visitedAt"
            label="Visit date"
            rules={[{ required: true, message: "Date is required" }]}
          >
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="companions" label="Who did you go with?">
            <Input placeholder="e.g. Alice, Bob" />
          </Form.Item>
          <Form.Item name="notes" label="What did you do?">
            <Input.TextArea rows={3} placeholder="Notes from this visit" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Edit place"
        open={editPlaceOpen}
        onCancel={() => setEditPlaceOpen(false)}
        onOk={() => editPlaceForm.submit()}
        confirmLoading={pending}
        okText="Save"
        destroyOnHidden
        width="min(480px, calc(100vw - 24px))"
      >
        <Form
          form={editPlaceForm}
          layout="vertical"
          onFinish={submitEditPlace}
          requiredMark="optional"
        >
          <Form.Item
            name="name"
            label="Place name"
            rules={[{ required: true, message: "Name is required" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="address" label="Address">
            <Input />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={visitModal?.mode === "edit" ? "Edit visit" : "Add visit"}
        open={Boolean(visitModal)}
        onCancel={() => setVisitModal(null)}
        onOk={() => visitForm.submit()}
        confirmLoading={pending}
        okText={visitModal?.mode === "edit" ? "Save" : "Add"}
        destroyOnHidden
        width="min(520px, calc(100vw - 24px))"
      >
        <Form
          form={visitForm}
          layout="vertical"
          onFinish={submitVisit}
          requiredMark="optional"
        >
          <Form.Item
            name="visitedAt"
            label="Visit date"
            rules={[{ required: true, message: "Date is required" }]}
          >
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="companions" label="Who did you go with?">
            <Input placeholder="e.g. Alice, Bob" />
          </Form.Item>
          <Form.Item name="notes" label="What did you do?">
            <Input.TextArea rows={3} placeholder="Notes from this visit" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
