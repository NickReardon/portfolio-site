import { profile } from "./data/publication";

const productionUrl = "https://nick-reardon.com";

export const site = {
  name: profile.name,
  url: productionUrl,
  role: profile.role,
  tagline: profile.homepage[0],
  availability: profile.homepage[1],
  focus: profile.focus,
  description: profile.homepage[0],
  defaultImage: "/images/social-card.png",
  email: profile.contact.email,
  resumeUrl: "/resume/",
  resumePdfUrl: "/resume.pdf",
  githubUrl: profile.links.github,
  itchUrl: profile.links["itch.io"],
  linkedinUrl: profile.links.linkedin,
};

export const navigation = [
  { href: "/", label: "Home" },
  { href: "/projects/", label: "Projects" },
  { href: "/about/", label: "About" },
  { href: "/resume/", label: "Resume" },
  { href: "/contact/", label: "Contact" },
];
