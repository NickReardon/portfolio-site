const productionBranch = "main";
const stagingBranch = "staging";
const productionUrl = "https://nick-reardon.com";
const stagingUrl = "https://staging.nick-reardon.com";

function normalizeUrl(url: string | undefined) {
  if (!url) {
    return undefined;
  }

  return /^https?:\/\//u.test(url) ? url : `https://${url}`;
}

const branch = import.meta.env.CF_PAGES_BRANCH;
const isCloudflarePages = import.meta.env.CF_PAGES === "1";
const deployedUrl =
  normalizeUrl(import.meta.env.SITE_URL) ??
  (branch === stagingBranch
    ? stagingUrl
    : branch && branch !== productionBranch
      ? (normalizeUrl(import.meta.env.CF_PAGES_URL) ?? productionUrl)
      : productionUrl);

export const site = {
  name: siteContent.identity.name,
  url: deployedUrl,
  isSearchIndexable: !isCloudflarePages || branch === productionBranch,
  role: siteContent.identity.role,
  focus: siteContent.identity.focus,
  description: siteContent.identity.description,
  defaultImage: "/images/social-card.png",
  email: siteContent.identity.email,
  resumeUrl: siteContent.identity.resumeUrl,
  resumePdfUrl: siteContent.identity.resumePdfUrl,
  githubUrl: siteContent.identity.githubUrl,
  itchUrl: siteContent.identity.itchUrl,
  linkedinUrl: siteContent.identity.linkedinUrl,
};

export const siteCopy = siteContent;

export const navigation = [
  { href: "/", label: "Home" },
  { href: "/projects/", label: "Projects" },
  { href: "/about/", label: "About" },
  { href: "/contact/", label: "Contact" },
];
import siteContent from "../../../content/public/site.json";
