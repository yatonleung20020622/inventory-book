"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export type CvExperienceRecord = {
  id: string;
  company: string;
  role: string;
  summary: string;
  bullets: string[];
  companyUrl: string;
  sortOrder: number;
};

export type CvEducationRecord = {
  id: string;
  school: string;
  degree: string;
  detail: string;
  sortOrder: number;
};

export type CvSkillGroupRecord = {
  id: string;
  title: string;
  items: string[];
  sortOrder: number;
};

export type CvProfileRecord = {
  id: string;
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
  experiences: CvExperienceRecord[];
  educations: CvEducationRecord[];
  skillGroups: CvSkillGroupRecord[];
  updatedAt: string;
};

export type CvActionResult = {
  ok: boolean;
  message: string;
  id?: string;
};

function parseJsonStringArray(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

function encodeJsonStringArray(items: string[] | undefined): string {
  const cleaned = (items ?? [])
    .map((item) => item.trim())
    .filter(Boolean);
  return JSON.stringify(cleaned);
}

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  if (session.user.role !== "ADMIN") {
    throw new Error("Forbidden");
  }
  return session.user;
}

function revalidateCv() {
  revalidatePath("/public/cv");
  revalidatePath("/admin/cv");
}

const profileInclude = {
  experiences: { orderBy: { sortOrder: "asc" as const } },
  educations: { orderBy: { sortOrder: "asc" as const } },
  skillGroups: { orderBy: { sortOrder: "asc" as const } },
};

function toProfileRecord(
  profile: {
    id: string;
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
    updatedAt: Date;
    experiences: {
      id: string;
      company: string;
      role: string;
      summary: string;
      bullets: string;
      companyUrl: string;
      sortOrder: number;
    }[];
    educations: {
      id: string;
      school: string;
      degree: string;
      detail: string;
      sortOrder: number;
    }[];
    skillGroups: {
      id: string;
      title: string;
      items: string;
      sortOrder: number;
    }[];
  },
): CvProfileRecord {
  return {
    id: profile.id,
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
    experiences: profile.experiences.map((item) => ({
      id: item.id,
      company: item.company,
      role: item.role,
      summary: item.summary,
      bullets: parseJsonStringArray(item.bullets),
      companyUrl: item.companyUrl,
      sortOrder: item.sortOrder,
    })),
    educations: profile.educations.map((item) => ({
      id: item.id,
      school: item.school,
      degree: item.degree,
      detail: item.detail,
      sortOrder: item.sortOrder,
    })),
    skillGroups: profile.skillGroups.map((item) => ({
      id: item.id,
      title: item.title,
      items: parseJsonStringArray(item.items),
      sortOrder: item.sortOrder,
    })),
    updatedAt: profile.updatedAt.toISOString(),
  };
}

async function getOrCreateProfile() {
  const existing = await prisma.cvProfile.findFirst({
    include: profileInclude,
  });
  if (existing) return existing;

  return prisma.cvProfile.create({
    data: {
      displayName: "Your Name",
      headline: "Your Headline",
      summary: "",
      published: false,
    },
    include: profileInclude,
  });
}

/** Public: published CV only. */
export async function getPublishedCv(): Promise<CvProfileRecord | null> {
  const profile = await prisma.cvProfile.findFirst({
    where: { published: true },
    include: profileInclude,
  });
  return profile ? toProfileRecord(profile) : null;
}

/** Admin: always returns a profile (creates empty draft if missing). */
export async function getCvForAdmin(): Promise<CvProfileRecord> {
  await requireAdmin();
  const profile = await getOrCreateProfile();
  return toProfileRecord(profile);
}

export async function updateCvProfile(input: {
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
}): Promise<CvActionResult> {
  try {
    await requireAdmin();
    const profile = await getOrCreateProfile();
    const displayName = input.displayName.trim();
    if (!displayName) {
      return { ok: false, message: "Display name is required." };
    }

    await prisma.cvProfile.update({
      where: { id: profile.id },
      data: {
        displayName,
        headline: input.headline.trim(),
        summary: input.summary.trim(),
        phone: input.phone.trim(),
        whatsapp: input.whatsapp.trim(),
        email: input.email.trim(),
        websiteLabel: input.websiteLabel.trim(),
        websiteUrl: input.websiteUrl.trim(),
        ctaTitle: input.ctaTitle.trim(),
        ctaBody: input.ctaBody.trim(),
        ctaButtonLabel: input.ctaButtonLabel.trim(),
        footerText: input.footerText.trim(),
        published: Boolean(input.published),
      },
    });

    revalidateCv();
    return { ok: true, message: "Profile saved.", id: profile.id };
  } catch {
    return { ok: false, message: "Failed to save profile." };
  }
}

export async function upsertCvExperience(input: {
  id?: string;
  company: string;
  role: string;
  summary: string;
  bullets: string[];
  companyUrl: string;
  sortOrder: number;
}): Promise<CvActionResult> {
  try {
    await requireAdmin();
    const profile = await getOrCreateProfile();
    const company = input.company.trim();
    const role = input.role.trim();
    if (!company || !role) {
      return { ok: false, message: "Company and role are required." };
    }

    const data = {
      company,
      role,
      summary: input.summary.trim(),
      bullets: encodeJsonStringArray(input.bullets),
      companyUrl: input.companyUrl.trim(),
      sortOrder: Number.isFinite(input.sortOrder) ? input.sortOrder : 0,
    };

    if (input.id) {
      const existing = await prisma.cvExperience.findFirst({
        where: { id: input.id, profileId: profile.id },
        select: { id: true },
      });
      if (!existing) {
        return { ok: false, message: "Experience not found." };
      }
      await prisma.cvExperience.update({ where: { id: input.id }, data });
      revalidateCv();
      return { ok: true, message: "Experience updated.", id: input.id };
    }

    const created = await prisma.cvExperience.create({
      data: { ...data, profileId: profile.id },
    });
    revalidateCv();
    return { ok: true, message: "Experience added.", id: created.id };
  } catch {
    return { ok: false, message: "Failed to save experience." };
  }
}

export async function deleteCvExperience(id: string): Promise<CvActionResult> {
  try {
    await requireAdmin();
    const profile = await getOrCreateProfile();
    const existing = await prisma.cvExperience.findFirst({
      where: { id, profileId: profile.id },
      select: { id: true },
    });
    if (!existing) {
      return { ok: false, message: "Experience not found." };
    }
    await prisma.cvExperience.delete({ where: { id } });
    revalidateCv();
    return { ok: true, message: "Experience deleted." };
  } catch {
    return { ok: false, message: "Failed to delete experience." };
  }
}

export async function upsertCvEducation(input: {
  id?: string;
  school: string;
  degree: string;
  detail: string;
  sortOrder: number;
}): Promise<CvActionResult> {
  try {
    await requireAdmin();
    const profile = await getOrCreateProfile();
    const school = input.school.trim();
    const degree = input.degree.trim();
    if (!school || !degree) {
      return { ok: false, message: "School and degree are required." };
    }

    const data = {
      school,
      degree,
      detail: input.detail.trim(),
      sortOrder: Number.isFinite(input.sortOrder) ? input.sortOrder : 0,
    };

    if (input.id) {
      const existing = await prisma.cvEducation.findFirst({
        where: { id: input.id, profileId: profile.id },
        select: { id: true },
      });
      if (!existing) {
        return { ok: false, message: "Education not found." };
      }
      await prisma.cvEducation.update({ where: { id: input.id }, data });
      revalidateCv();
      return { ok: true, message: "Education updated.", id: input.id };
    }

    const created = await prisma.cvEducation.create({
      data: { ...data, profileId: profile.id },
    });
    revalidateCv();
    return { ok: true, message: "Education added.", id: created.id };
  } catch {
    return { ok: false, message: "Failed to save education." };
  }
}

export async function deleteCvEducation(id: string): Promise<CvActionResult> {
  try {
    await requireAdmin();
    const profile = await getOrCreateProfile();
    const existing = await prisma.cvEducation.findFirst({
      where: { id, profileId: profile.id },
      select: { id: true },
    });
    if (!existing) {
      return { ok: false, message: "Education not found." };
    }
    await prisma.cvEducation.delete({ where: { id } });
    revalidateCv();
    return { ok: true, message: "Education deleted." };
  } catch {
    return { ok: false, message: "Failed to delete education." };
  }
}

export async function upsertCvSkillGroup(input: {
  id?: string;
  title: string;
  items: string[];
  sortOrder: number;
}): Promise<CvActionResult> {
  try {
    await requireAdmin();
    const profile = await getOrCreateProfile();
    const title = input.title.trim();
    if (!title) {
      return { ok: false, message: "Skill group title is required." };
    }

    const data = {
      title,
      items: encodeJsonStringArray(input.items),
      sortOrder: Number.isFinite(input.sortOrder) ? input.sortOrder : 0,
    };

    if (input.id) {
      const existing = await prisma.cvSkillGroup.findFirst({
        where: { id: input.id, profileId: profile.id },
        select: { id: true },
      });
      if (!existing) {
        return { ok: false, message: "Skill group not found." };
      }
      await prisma.cvSkillGroup.update({ where: { id: input.id }, data });
      revalidateCv();
      return { ok: true, message: "Skill group updated.", id: input.id };
    }

    const created = await prisma.cvSkillGroup.create({
      data: { ...data, profileId: profile.id },
    });
    revalidateCv();
    return { ok: true, message: "Skill group added.", id: created.id };
  } catch {
    return { ok: false, message: "Failed to save skill group." };
  }
}

export async function deleteCvSkillGroup(id: string): Promise<CvActionResult> {
  try {
    await requireAdmin();
    const profile = await getOrCreateProfile();
    const existing = await prisma.cvSkillGroup.findFirst({
      where: { id, profileId: profile.id },
      select: { id: true },
    });
    if (!existing) {
      return { ok: false, message: "Skill group not found." };
    }
    await prisma.cvSkillGroup.delete({ where: { id } });
    revalidateCv();
    return { ok: true, message: "Skill group deleted." };
  } catch {
    return { ok: false, message: "Failed to delete skill group." };
  }
}
