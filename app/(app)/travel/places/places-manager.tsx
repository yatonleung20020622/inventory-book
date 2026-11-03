"use client";

import { EnvironmentOutlined, TagsOutlined } from "@ant-design/icons";
import { Button, Select, Table, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { CategoryTag } from "@/components/category-tag";
import {
  MobileEmpty,
  MobileRecordList,
  mobileRecordCardStyle,
  mobileRecordMetaStyle,
} from "@/components/mobile-record-list";
import { PageCardless } from "@/components/page-above-card";
import { TableFrame } from "@/components/table-frame";
import { useIsMobile } from "@/lib/hooks/use-is-mobile";
import type { TravelGroupRecord } from "@/lib/actions/travel-groups";
import type { TravelPlaceRecord } from "@/lib/actions/travel";
import { TravelGroupsModal } from "./travel-groups-modal";

const TravelLeafletMap = dynamic(
  () =>
    import("../travel-leaflet-map").then((mod) => mod.TravelLeafletMap),
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

type PlaceTableRow = TravelPlaceRecord & {
  lastVisitedAt: string;
  lastCompanions: string;
  lastNotes: string;
  visitCount: number;
};

type PlacesManagerProps = {
  places: TravelPlaceRecord[];
  groups: TravelGroupRecord[];
};

function formatVisitDate(value: string) {
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format("YYYY-MM-DD") : value;
}

export function PlacesManager({ places, groups }: PlacesManagerProps) {
  const isMobile = useIsMobile();
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [focusToken, setFocusToken] = useState(0);
  const [groupFilter, setGroupFilter] = useState<string>("all");
  const [groupsOpen, setGroupsOpen] = useState(false);

  const tableRows: PlaceTableRow[] = useMemo(() => {
    const filtered =
      groupFilter === "all"
        ? places
        : groupFilter === "ungrouped"
          ? places.filter((place) => !place.groupId)
          : places.filter((place) => place.groupId === groupFilter);

    return filtered.map((place) => {
      const latest = place.visits[0];
      return {
        ...place,
        lastVisitedAt: latest?.visitedAt ?? "",
        lastCompanions: latest?.companions ?? "",
        lastNotes: latest?.notes ?? "",
        visitCount: place.visits.length,
      };
    });
  }, [places, groupFilter]);

  function focusPlaceOnMap(placeId: string) {
    setSelectedPlaceId(placeId);
    setFocusToken((value) => value + 1);
  }

  const columns: ColumnsType<PlaceTableRow> = useMemo(
    () => [
      {
        title: "Place",
        dataIndex: "name",
        key: "name",
        ellipsis: true,
      },
      {
        title: "Group",
        key: "group",
        width: 140,
        render: (_value, record) =>
          record.groupName ? (
            <CategoryTag name={record.groupName} color={record.groupColor} />
          ) : (
            "—"
          ),
      },
      {
        title: "Address",
        dataIndex: "address",
        key: "address",
        ellipsis: true,
        render: (value: string) => value || "—",
      },
      {
        title: "Last visit",
        dataIndex: "lastVisitedAt",
        key: "lastVisitedAt",
        width: 120,
        render: (value: string) => (value ? formatVisitDate(value) : "—"),
      },
      {
        title: "Visits",
        dataIndex: "visitCount",
        key: "visitCount",
        width: 80,
        align: "right",
      },
      {
        title: "With",
        dataIndex: "lastCompanions",
        key: "lastCompanions",
        ellipsis: true,
        render: (value: string) => value || "—",
      },
      {
        title: "Notes",
        dataIndex: "lastNotes",
        key: "lastNotes",
        ellipsis: true,
        render: (value: string) => value || "—",
      },
      {
        title: "Action",
        key: "action",
        width: 72,
        align: "center",
        render: (_value, record) => (
          <Button
            type="link"
            icon={<EnvironmentOutlined />}
            aria-label={`Show ${record.name} on map`}
            onClick={() => focusPlaceOnMap(record.id)}
          />
        ),
      },
    ],
    [],
  );

  const mapPlaces =
    groupFilter === "all"
      ? places
      : groupFilter === "ungrouped"
        ? places.filter((place) => !place.groupId)
        : places.filter((place) => place.groupId === groupFilter);

  const mapPanel = (
    <div
      style={{
        flex: isMobile ? undefined : 3,
        width: isMobile ? "100%" : undefined,
        minWidth: 0,
        minHeight: isMobile ? 260 : 0,
        height: isMobile ? 260 : undefined,
        position: "relative",
        border: "1px solid var(--border-color)",
        borderRadius: 8,
        overflow: "hidden",
        background: "var(--card-bg)",
      }}
    >
      <TravelLeafletMap
        places={mapPlaces}
        selectedPlaceId={selectedPlaceId}
        focusToken={focusToken}
        onSelectPlace={focusPlaceOnMap}
        onMapClick={() => {}}
      />
    </div>
  );

  const tablePanel = (
    <div
      style={{
        flex: isMobile ? undefined : 7,
        width: isMobile ? "100%" : undefined,
        minWidth: 0,
        minHeight: 0,
        background: "var(--card-bg)",
        border: "1px solid var(--border-color)",
        borderRadius: 8,
        padding: isMobile ? 12 : 16,
        overflow: "auto",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          alignItems: isMobile ? "stretch" : "flex-start",
          flexDirection: isMobile ? "column" : "row",
          marginBottom: 12,
        }}
      >
        <div>
          <Typography.Title
            level={isMobile ? 4 : 3}
            style={{ margin: 0, fontSize: isMobile ? 18 : 22 }}
          >
            Travel places
          </Typography.Title>
          <Typography.Paragraph
            type="secondary"
            style={{ marginBottom: 0, marginTop: 4 }}
          >
            Use the map action to move the map to a place.
          </Typography.Paragraph>
        </div>
        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <Select
            value={groupFilter}
            onChange={setGroupFilter}
            style={{ minWidth: 180 }}
            options={[
              { value: "all", label: "All groups" },
              { value: "ungrouped", label: "Ungrouped" },
              ...groups.map((group) => ({
                value: group.id,
                label: group.name,
              })),
            ]}
          />
          <Button icon={<TagsOutlined />} onClick={() => setGroupsOpen(true)}>
            Manage groups
          </Button>
        </div>
      </div>

      {isMobile ? (
        tableRows.length === 0 ? (
          <MobileEmpty>No places yet. Add one from the travel map.</MobileEmpty>
        ) : (
          <MobileRecordList>
            {tableRows.map((row) => {
              const active = row.id === selectedPlaceId;
              return (
                <div
                  key={row.id}
                  style={{
                    ...mobileRecordCardStyle,
                    borderColor: active
                      ? "var(--ant-color-primary, #1677ff)"
                      : "var(--border-color)",
                    boxShadow: active
                      ? "0 0 0 1px var(--ant-color-primary, #1677ff)"
                      : undefined,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 8,
                      alignItems: "flex-start",
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontWeight: 600, marginBottom: 6 }}>
                        {row.name}
                      </div>
                      {row.groupName ? (
                        <div style={{ marginBottom: 6 }}>
                          <CategoryTag
                            name={row.groupName}
                            color={row.groupColor}
                          />
                        </div>
                      ) : null}
                      <div style={mobileRecordMetaStyle}>
                        <span>
                          {row.lastVisitedAt
                            ? formatVisitDate(row.lastVisitedAt)
                            : "No visits"}
                        </span>
                        <span>{row.visitCount} visits</span>
                        {row.lastCompanions ? (
                          <span>With {row.lastCompanions}</span>
                        ) : null}
                      </div>
                      {row.lastNotes ? (
                        <div
                          style={{
                            marginTop: 8,
                            fontSize: 13,
                            color: "var(--foreground)",
                          }}
                        >
                          {row.lastNotes}
                        </div>
                      ) : null}
                    </div>
                    <Button
                      type="text"
                      icon={<EnvironmentOutlined />}
                      aria-label={`Show ${row.name} on map`}
                      onClick={() => focusPlaceOnMap(row.id)}
                    />
                  </div>
                </div>
              );
            })}
          </MobileRecordList>
        )
      ) : (
        <TableFrame>
          <Table<PlaceTableRow>
            rowKey="id"
            size="middle"
            columns={columns}
            dataSource={tableRows}
            pagination={
              tableRows.length > 10
                ? { pageSize: 10, showSizeChanger: false }
                : false
            }
            locale={{
              emptyText: "No places yet. Add one from the travel map.",
            }}
            rowClassName={(record) =>
              record.id === selectedPlaceId ? "ant-table-row-selected" : ""
            }
          />
        </TableFrame>
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
          minHeight: isMobile ? undefined : 480,
        }}
      >
        {isMobile ? (
          <>
            {mapPanel}
            {tablePanel}
          </>
        ) : (
          <>
            {tablePanel}
            {mapPanel}
          </>
        )}
      </div>
      <TravelGroupsModal
        open={groupsOpen}
        groups={groups}
        onClose={() => setGroupsOpen(false)}
      />
    </>
  );
}
