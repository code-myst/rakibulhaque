import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProjectDetail } from "@/components/site/project-detail";
import { DEFAULT_SITE_CONTENT } from "@/lib/default-site-content";
import { fetchPublicSiteContent } from "@/lib/site-content-server";
import { siteBaseUrl } from "@/lib/site-url";

interface ProjectPageProps {
  params: { id: string };
}

async function findProject(id: string) {
  const site = (await fetchPublicSiteContent()) ?? DEFAULT_SITE_CONTENT;
  return site.projects.find((project) => project.id === id);
}

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const project = await findProject(params.id);
  if (!project) return { title: "Project not found", robots: { index: false, follow: false } };

  const title = project.title.en || project.title.bn;
  const description = project.description.en || project.description.bn;
  const path = `/projects/${encodeURIComponent(project.id)}`;

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "article",
      url: new URL(path, siteBaseUrl),
      title,
      description,
      ...(project.image ? { images: [{ url: project.image, alt: title }] } : {}),
    },
    twitter: {
      card: project.image ? "summary_large_image" : "summary",
      title,
      description,
      ...(project.image ? { images: [project.image] } : {}),
    },
  };
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const project = await findProject(params.id);
  if (!project) notFound();
  return <ProjectDetail project={project} />;
}
