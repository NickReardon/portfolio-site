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
  name: "Nicholas Reardon",
  url: deployedUrl,
  isSearchIndexable: !isCloudflarePages || branch === productionBranch,
  role: "Gameplay and Systems Programmer",
  focus:
    "Unreal Engine, C++, modular gameplay architecture, and designer-friendly content workflows",
  description:
    "A portfolio of Unreal Engine gameplay systems, technical design, tools, and game jam work.",
  defaultImage: "/images/social-card.svg",
  email: "reardon.ntr@gmail.com",
  resumeUrl: "/resume/",
  resumePdfUrl: "/resume.pdf",
  githubUrl: "https://github.com/NickReardon",
  itchUrl: "https://thingofnightmare.itch.io/",
  linkedinUrl: "https://www.linkedin.com/in/nicholas-reardon/",
};

export const navigation = [
  { href: "/", label: "Home" },
  { href: "/projects/", label: "Projects" },
  { href: "/blog/", label: "Blog" },
  { href: "/about/", label: "About" },
  { href: "/contact/", label: "Contact" },
];
