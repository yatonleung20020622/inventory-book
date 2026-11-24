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
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Space,
  Switch,
  Table,
  Tabs,
  Typography,
} from "antd";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { TableFrame } from "@/components/table-frame";
import {
  deleteCvEducation,
  deleteCvExperience,
  deleteCvSkillGroup,
  updateCvProfile,
  upsertCvEducation,
  upsertCvExperience,
  upsertCvSkillGroup,
  type CvEducationRecord,
  type CvExperienceRecord,
  type CvProfileRecord,
  type CvSkillGroupRecord,
} from "@/lib/actions/cv";

type ProfileFormValues = {
  displayName: string;
  headline: string;
  summary: string;
  phone: string;
  whatsapp: string;
  email: string;
  websiteLabel: string;
  websiteUrl: string;
  ctaTitle: string;
  ctaBody: string;
  ctaButtonLabel: string;
  footerText: string;
  published: boolean;
};

type ExperienceFormValues = {
  company: string;
  role: string;
  summary: string;
  bulletsText: string;
  companyUrl: string;
  sortOrder: number;
};

type EducationFormValues = {
  school: string;
  degree: string;
  detail: string;
  sortOrder: number;
};

type SkillFormValues = {
  title: string;
  itemsText: string;
  sortOrder: number;
};

type CvCmsManagerProps = {
  profile: CvProfileRecord;
};

function linesToList(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function CvCmsManager({ profile }: CvCmsManagerProps) {
  const { message } = App.useApp();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [profileForm] = Form.useForm<ProfileFormValues>();

  const [expOpen, setExpOpen] = useState(false);
  const [editingExp, setEditingExp] = useState<CvExperienceRecord | null>(null);
  const [expForm] = Form.useForm<ExperienceFormValues>();

  const [eduOpen, setEduOpen] = useState(false);
  const [editingEdu, setEditingEdu] = useState<CvEducationRecord | null>(null);
  const [eduForm] = Form.useForm<EducationFormValues>();

  const [skillOpen, setSkillOpen] = useState(false);
  const [editingSkill, setEditingSkill] =
    useState<CvSkillGroupRecord | null>(null);
  const [skillForm] = Form.useForm<SkillFormValues>();

  useEffect(() => {
    profileForm.setFieldsValue({
      displayName: profile.displayName,
      headline: profile.headline,
      summary: profile.summary,
      phone: profile.phone,
      whatsapp: profile.whatsapp,
      email: profile.email,
      websiteLabel: profile.websiteLabel,
      websiteUrl: profile.websiteUrl,
      ctaTitle: profile.ctaTitle,
      ctaBody: profile.ctaBody,
      ctaButtonLabel: profile.ctaButtonLabel,
      footerText: profile.footerText,
      published: profile.published,
    });
  }, [profile, profileForm]);

  useEffect(() => {
    if (!expOpen) return;
    if (editingExp) {
      expForm.setFieldsValue({
        company: editingExp.company,
        role: editingExp.role,
        summary: editingExp.summary,
        bulletsText: editingExp.bullets.join("\n"),
        companyUrl: editingExp.companyUrl,
        sortOrder: editingExp.sortOrder,
      });
      return;
    }
    expForm.setFieldsValue({
      company: "",
      role: "",
      summary: "",
      bulletsText: "",
      companyUrl: "",
      sortOrder: profile.experiences.length,
    });
  }, [editingExp, expForm, expOpen, profile.experiences.length]);

  useEffect(() => {
    if (!eduOpen) return;
    if (editingEdu) {
      eduForm.setFieldsValue({
        school: editingEdu.school,
        degree: editingEdu.degree,
        detail: editingEdu.detail,
        sortOrder: editingEdu.sortOrder,
      });
      return;
    }
    eduForm.setFieldsValue({
      school: "",
      degree: "",
      detail: "",
      sortOrder: profile.educations.length,
    });
  }, [editingEdu, eduForm, eduOpen, profile.educations.length]);

  useEffect(() => {
    if (!skillOpen) return;
    if (editingSkill) {
      skillForm.setFieldsValue({
        title: editingSkill.title,
        itemsText: editingSkill.items.join("\n"),
        sortOrder: editingSkill.sortOrder,
      });
      return;
    }
    skillForm.setFieldsValue({
      title: "",
      itemsText: "",
      sortOrder: profile.skillGroups.length,
    });
  }, [editingSkill, profile.skillGroups.length, skillForm, skillOpen]);

  function saveProfile(values: ProfileFormValues) {
    startTransition(async () => {
      const result = await updateCvProfile(values);
      if (!result.ok) {
        message.error(result.message);
        return;
      }
      message.success(result.message);
      router.refresh();
    });
  }

  function saveExperience(values: ExperienceFormValues) {
    startTransition(async () => {
      const result = await upsertCvExperience({
        id: editingExp?.id,
        company: values.company,
        role: values.role,
        summary: values.summary,
        bullets: linesToList(values.bulletsText),
        companyUrl: values.companyUrl,
        sortOrder: values.sortOrder,
      });
      if (!result.ok) {
        message.error(result.message);
        return;
      }
      message.success(result.message);
      setExpOpen(false);
      setEditingExp(null);
      router.refresh();
    });
  }

  function saveEducation(values: EducationFormValues) {
    startTransition(async () => {
      const result = await upsertCvEducation({
        id: editingEdu?.id,
        school: values.school,
        degree: values.degree,
        detail: values.detail,
        sortOrder: values.sortOrder,
      });
      if (!result.ok) {
        message.error(result.message);
        return;
      }
      message.success(result.message);
      setEduOpen(false);
      setEditingEdu(null);
      router.refresh();
    });
  }

  function saveSkill(values: SkillFormValues) {
    startTransition(async () => {
      const result = await upsertCvSkillGroup({
        id: editingSkill?.id,
        title: values.title,
        items: linesToList(values.itemsText),
        sortOrder: values.sortOrder,
      });
      if (!result.ok) {
        message.error(result.message);
        return;
      }
      message.success(result.message);
      setSkillOpen(false);
      setEditingSkill(null);
      router.refresh();
    });
  }

  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          alignItems: "flex-start",
          flexWrap: "wrap",
          marginBottom: 20,
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>CV CMS</h1>
          <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
            Edit the public page at /public/cv. Admin only.
          </Typography.Paragraph>
        </div>
        <Link href="/public/cv" target="_blank">
          <Button icon={<ExportOutlined />}>Preview public CV</Button>
        </Link>
      </div>

      <Tabs
        items={[
          {
            key: "profile",
            label: "Profile",
            children: (
              <Form
                form={profileForm}
                layout="vertical"
                onFinish={saveProfile}
                requiredMark="optional"
                style={{ maxWidth: 720 }}
              >
                <Form.Item
                  name="displayName"
                  label="Display name"
                  rules={[{ required: true, message: "Name is required" }]}
                >
                  <Input />
                </Form.Item>
                <Form.Item name="headline" label="Headline">
                  <Input placeholder="e.g. Full-Stack Developer" />
                </Form.Item>
                <Form.Item name="summary" label="Professional summary">
                  <Input.TextArea rows={4} />
                </Form.Item>
                <Form.Item name="phone" label="Phone">
                  <Input />
                </Form.Item>
                <Form.Item
                  name="whatsapp"
                  label="WhatsApp"
                  extra="Digits only preferred, e.g. 85266913032"
                >
                  <Input />
                </Form.Item>
                <Form.Item name="email" label="Email">
                  <Input />
                </Form.Item>
                <Form.Item name="websiteLabel" label="Website label">
                  <Input />
                </Form.Item>
                <Form.Item name="websiteUrl" label="Website URL">
                  <Input placeholder="https://" />
                </Form.Item>
                <Form.Item name="ctaTitle" label="CTA title">
                  <Input />
                </Form.Item>
                <Form.Item name="ctaBody" label="CTA body">
                  <Input.TextArea rows={2} />
                </Form.Item>
                <Form.Item name="ctaButtonLabel" label="CTA button label">
                  <Input />
                </Form.Item>
                <Form.Item name="footerText" label="Footer text">
                  <Input.TextArea rows={2} />
                </Form.Item>
                <Form.Item
                  name="published"
                  label="Published"
                  valuePropName="checked"
                >
                  <Switch checkedChildren="Live" unCheckedChildren="Draft" />
                </Form.Item>
                <Button type="primary" htmlType="submit" loading={pending}>
                  Save profile
                </Button>
              </Form>
            ),
          },
          {
            key: "experience",
            label: "Experience",
            children: (
              <>
                <div style={{ marginBottom: 12, textAlign: "right" }}>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => {
                      setEditingExp(null);
                      setExpOpen(true);
                    }}
                  >
                    Add experience
                  </Button>
                </div>
                <TableFrame>
                  <Table<CvExperienceRecord>
                    rowKey="id"
                    size="middle"
                    dataSource={profile.experiences}
                    pagination={false}
                    columns={[
                      { title: "Role", dataIndex: "role" },
                      { title: "Company", dataIndex: "company" },
                      {
                        title: "Order",
                        dataIndex: "sortOrder",
                        width: 80,
                        align: "right",
                      },
                      {
                        title: "Action",
                        width: 100,
                        render: (_value, record) => (
                          <Space size={0}>
                            <Button
                              type="link"
                              icon={<EditOutlined />}
                              onClick={() => {
                                setEditingExp(record);
                                setExpOpen(true);
                              }}
                            />
                            <Popconfirm
                              title="Delete this experience?"
                              onConfirm={() =>
                                startTransition(async () => {
                                  const result = await deleteCvExperience(
                                    record.id,
                                  );
                                  if (!result.ok) {
                                    message.error(result.message);
                                    return;
                                  }
                                  message.success(result.message);
                                  router.refresh();
                                })
                              }
                            >
                              <Button
                                type="link"
                                danger
                                icon={<DeleteOutlined />}
                              />
                            </Popconfirm>
                          </Space>
                        ),
                      },
                    ]}
                  />
                </TableFrame>
              </>
            ),
          },
          {
            key: "education",
            label: "Education",
            children: (
              <>
                <div style={{ marginBottom: 12, textAlign: "right" }}>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => {
                      setEditingEdu(null);
                      setEduOpen(true);
                    }}
                  >
                    Add education
                  </Button>
                </div>
                <TableFrame>
                  <Table<CvEducationRecord>
                    rowKey="id"
                    size="middle"
                    dataSource={profile.educations}
                    pagination={false}
                    columns={[
                      { title: "Degree", dataIndex: "degree" },
                      { title: "School", dataIndex: "school" },
                      {
                        title: "Order",
                        dataIndex: "sortOrder",
                        width: 80,
                        align: "right",
                      },
                      {
                        title: "Action",
                        width: 100,
                        render: (_value, record) => (
                          <Space size={0}>
                            <Button
                              type="link"
                              icon={<EditOutlined />}
                              onClick={() => {
                                setEditingEdu(record);
                                setEduOpen(true);
                              }}
                            />
                            <Popconfirm
                              title="Delete this education?"
                              onConfirm={() =>
                                startTransition(async () => {
                                  const result = await deleteCvEducation(
                                    record.id,
                                  );
                                  if (!result.ok) {
                                    message.error(result.message);
                                    return;
                                  }
                                  message.success(result.message);
                                  router.refresh();
                                })
                              }
                            >
                              <Button
                                type="link"
                                danger
                                icon={<DeleteOutlined />}
                              />
                            </Popconfirm>
                          </Space>
                        ),
                      },
                    ]}
                  />
                </TableFrame>
              </>
            ),
          },
          {
            key: "skills",
            label: "Skills",
            children: (
              <>
                <div style={{ marginBottom: 12, textAlign: "right" }}>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => {
                      setEditingSkill(null);
                      setSkillOpen(true);
                    }}
                  >
                    Add skill group
                  </Button>
                </div>
                <TableFrame>
                  <Table<CvSkillGroupRecord>
                    rowKey="id"
                    size="middle"
                    dataSource={profile.skillGroups}
                    pagination={false}
                    columns={[
                      { title: "Title", dataIndex: "title" },
                      {
                        title: "Items",
                        dataIndex: "items",
                        render: (items: string[]) => items.join(", "),
                      },
                      {
                        title: "Order",
                        dataIndex: "sortOrder",
                        width: 80,
                        align: "right",
                      },
                      {
                        title: "Action",
                        width: 100,
                        render: (_value, record) => (
                          <Space size={0}>
                            <Button
                              type="link"
                              icon={<EditOutlined />}
                              onClick={() => {
                                setEditingSkill(record);
                                setSkillOpen(true);
                              }}
                            />
                            <Popconfirm
                              title="Delete this skill group?"
                              onConfirm={() =>
                                startTransition(async () => {
                                  const result = await deleteCvSkillGroup(
                                    record.id,
                                  );
                                  if (!result.ok) {
                                    message.error(result.message);
                                    return;
                                  }
                                  message.success(result.message);
                                  router.refresh();
                                })
                              }
                            >
                              <Button
                                type="link"
                                danger
                                icon={<DeleteOutlined />}
                              />
                            </Popconfirm>
                          </Space>
                        ),
                      },
                    ]}
                  />
                </TableFrame>
              </>
            ),
          },
        ]}
      />

      <Modal
        title={editingExp ? "Edit experience" : "Add experience"}
        open={expOpen}
        onCancel={() => {
          setExpOpen(false);
          setEditingExp(null);
        }}
        onOk={() => expForm.submit()}
        confirmLoading={pending}
        destroyOnHidden
        width="min(560px, calc(100vw - 24px))"
      >
        <Form
          form={expForm}
          layout="vertical"
          onFinish={saveExperience}
          requiredMark="optional"
        >
          <Form.Item
            name="role"
            label="Role"
            rules={[{ required: true, message: "Role is required" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="company"
            label="Company"
            rules={[{ required: true, message: "Company is required" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="companyUrl" label="Company URL">
            <Input placeholder="https://" />
          </Form.Item>
          <Form.Item name="summary" label="Summary">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item
            name="bulletsText"
            label="Bullets"
            extra="One bullet per line"
          >
            <Input.TextArea rows={5} />
          </Form.Item>
          <Form.Item name="sortOrder" label="Sort order">
            <InputNumber style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={editingEdu ? "Edit education" : "Add education"}
        open={eduOpen}
        onCancel={() => {
          setEduOpen(false);
          setEditingEdu(null);
        }}
        onOk={() => eduForm.submit()}
        confirmLoading={pending}
        destroyOnHidden
        width="min(520px, calc(100vw - 24px))"
      >
        <Form
          form={eduForm}
          layout="vertical"
          onFinish={saveEducation}
          requiredMark="optional"
        >
          <Form.Item
            name="degree"
            label="Degree"
            rules={[{ required: true, message: "Degree is required" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="school"
            label="School"
            rules={[{ required: true, message: "School is required" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="detail" label="Detail">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="sortOrder" label="Sort order">
            <InputNumber style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={editingSkill ? "Edit skill group" : "Add skill group"}
        open={skillOpen}
        onCancel={() => {
          setSkillOpen(false);
          setEditingSkill(null);
        }}
        onOk={() => skillForm.submit()}
        confirmLoading={pending}
        destroyOnHidden
        width="min(520px, calc(100vw - 24px))"
      >
        <Form
          form={skillForm}
          layout="vertical"
          onFinish={saveSkill}
          requiredMark="optional"
        >
          <Form.Item
            name="title"
            label="Title"
            rules={[{ required: true, message: "Title is required" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="itemsText"
            label="Items"
            extra="One skill per line"
          >
            <Input.TextArea rows={5} />
          </Form.Item>
          <Form.Item name="sortOrder" label="Sort order">
            <InputNumber style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
