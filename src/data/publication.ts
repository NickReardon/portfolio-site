import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

export interface PublicProfile {
  name: string;
  role: string;
  focus: string;
  homepage: string[];
  about: string[];
  contact: {
    intro: string;
    email: string;
    phone?: string;
    location?: string;
  };
  links: Record<string, string>;
}

export interface ResumeData {
  basics: {
    name: string;
    label: string;
    email: string;
    phone?: string;
    url?: string;
    summary: string;
    location?: { city?: string; region?: string; countryCode?: string };
    profiles: Array<{ network: string; url: string }>;
  };
  projects: Array<{
    name: string;
    role?: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    dateLabel?: string;
    siteUrl?: string;
    url?: string;
    availability?: string;
    keywords?: string[];
    highlights: string[];
  }>;
  work: Array<{
    name: string;
    position?: string;
    startDate?: string;
    endDate?: string;
    location?: string;
    highlights: string[];
  }>;
  education: Array<{
    institution: string;
    area?: string;
    studyType?: string;
    endDate?: string;
    dateLabel?: string;
    summary?: string;
    highlights?: string[];
  }>;
  skills: Array<{ name: string; keywords: string[] }>;
  awards: unknown[];
}

export const profile = readPublication<PublicProfile>("profile.json");
export const resume = readPublication<ResumeData>("resumes/general.json");

function readPublication<T>(relativePath: string): T {
  const path = resolve(".local/publication", relativePath);
  if (!existsSync(path)) {
    throw new Error(
      `Publication input is missing at ${relativePath}. Run npm run content:prepare -- --vault <path> first.`,
    );
  }
  return JSON.parse(readFileSync(path, "utf8")) as T;
}
