import { prisma } from "@/lib/db";
import { buildSystemPrompt } from "./prompt-builder";
import type { ProcessSummary } from "./schemas";

interface CachedConfig {
  config: {
    industry: string;
    sector?: string;
    customTerminology?: Record<string, { de: string; en: string }>;
    interviewTemplateRefs?: string[];
  };
  expiresAt: number;
}

const TTL_MS = 5 * 60 * 1000; // 5 minutes

const cache = new Map<string, CachedConfig>();

export async function getOrBuildConfig(projectId: string) {
  const now = Date.now();
  const cached = cache.get(projectId);

  if (cached && cached.expiresAt > now) {
    return cached.config;
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { configuration: true },
  });

  if (!project) {
    throw new Error(`Project not found: ${projectId}`);
  }

  const configData = project.configuration;
  const industryClassification = (configData?.industryClassification ?? {}) as {
    sector?: string;
  };

  const config: CachedConfig["config"] = {
    industry: project.industry,
    sector: industryClassification.sector,
    customTerminology:
      (configData?.customTerminology as Record<
        string,
        { de: string; en: string }
      >) ?? undefined,
    interviewTemplateRefs:
      (configData?.interviewTemplateRefs as string[]) ?? undefined,
  };

  cache.set(projectId, { config, expiresAt: now + TTL_MS });

  return config;
}

export function buildCachedSystemPrompt(
  cachedConfig: CachedConfig["config"],
  opts: {
    processCategory: string;
    processTitle?: string;
    language: string;
    currentSummary?: ProcessSummary;
  }
) {
  return buildSystemPrompt({
    ...cachedConfig,
    ...opts,
  });
}

export function invalidateConfig(projectId: string) {
  cache.delete(projectId);
}
