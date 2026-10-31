/**
 * Shared, browser-safe portfolio content, sourced from Shreyansh Sachan's resume.
 * Journal posts remain sample writing (clearly labelled) until real articles are added.
 */

export const profile = {
  name: "Shreyansh Sachan",
  shortName: "Shreyansh",
  role: "Frontend developer",
  email: "shreyanshsachan2016@gmail.com",
  links: [
    { label: "GitHub", handle: "ShreYansHSachan11", href: "https://github.com/ShreYansHSachan11" },
    { label: "LinkedIn", handle: "shreyanshsachan11", href: "https://www.linkedin.com/in/shreyanshsachan11/" },
    { label: "LeetCode", handle: "ShreYanshSachan", href: "https://leetcode.com/u/ShreYanshSachan/" },
    { label: "CodeChef", handle: "shreyansh1407", href: "https://www.codechef.com/users/shreyansh1407" },
  ],
} as const;

export const skills = [
  "React.js", "Redux", "JavaScript", "Node.js", "Express.js", "Python", "C++", "FastAPI",
  "MongoDB", "Redis", "Socket.io", "RAG pipelines",
] as const;

export const skillGroups = [
  { title: "Languages", items: ["C++", "JavaScript", "Python"] },
  { title: "Web", items: ["React.js", "Redux", "Node.js", "Express.js", "HTML5", "CSS3", "REST APIs", "FastAPI", "Redis", "Socket.io", "JWT", "OAuth"] },
  { title: "Databases", items: ["MySQL", "MongoDB", "Firebase"] },
  { title: "AI & LLMs", items: ["Vector databases (FAISS / ChromaDB)", "OpenAI API", "RAG pipelines"] },
  { title: "Familiar with", items: ["Figma", "Flutter", "Dart", "Chai", "Mocha"] },
] as const;

export type ProjectArt = "redaction" | "embedding" | "ledger" | "translation";

export const projects = [
  {
    slug: "sherlock", number: "01", title: "Sherlock", category: "AI", art: "redaction",
    subtitle: "Data privacy in law enforcement.",
    description: "A data anonymization tool that finds and masks personally identifiable information in law-enforcement records.",
    stack: ["React.js", "Node.js", "MongoDB", "SpaCy", "Tesseract", "Presidio", "LLMs"],
    live: "https://sherlock-rose.vercel.app/", code: "https://github.com/ShreYansHSachan11/KSP_Project-Sherlock",
    overview: "Sensitive records need to be shared and analysed without exposing the people in them. Sherlock detects personal data in documents — including scanned ones — and anonymizes it before it moves through the workflow.",
    build: "A React.js front end and a Node.js + MongoDB back end, with an ML pipeline built on SpaCy, Tesseract OCR, LLMs and Microsoft Presidio to detect and anonymize PII.",
    impact: ["Boosted efficiency by 40% through UI and backend data workflows.", "Reduced operational costs by 35% and task completion time by 80%."],
  },
  {
    slug: "nexthire", number: "02", title: "NextHire", category: "AI", art: "embedding",
    subtitle: "An AI-powered job portal.",
    description: "A full-stack job portal with semantic search, personalised recommendations and AI resume parsing.",
    stack: ["Next.js", "PostgreSQL", "ChromaDB", "OpenAI API"],
    live: "https://next-hire-kappa.vercel.app/", code: "https://github.com/ShreYansHSachan11/NextHire",
    overview: "Keyword search misses good matches. NextHire matches candidates and roles by meaning, recommends relevant jobs, and parses resumes so screening takes less manual work.",
    build: "Next.js and PostgreSQL for the full-stack app, with ChromaDB and the OpenAI API powering semantic search, personalised job recommendations and AI resume parsing.",
    impact: ["Implemented AI resume parsing, reducing screening time by 40%."],
  },
  {
    slug: "guardian", number: "03", title: "Guardian", category: "Web3", art: "ledger",
    subtitle: "Disaster response, out in the open.",
    description: "A disaster-management platform with real-time updates and transparent, blockchain-backed crowdfunding.",
    stack: ["React.js", "Node.js", "WebSockets", "Solidity", "IPFS", "MetaMask"],
    live: null, code: "https://github.com/ShreYansHSachan11/GUARDIAN",
    overview: "During a disaster, people need live information and donors need to trust where their money goes. Guardian pairs real-time updates with on-chain crowdfunding.",
    build: "React.js and Node.js with WebSockets for live updates; Solidity smart contracts, IPFS and MetaMask for transparent donations.",
    impact: ["Improved crowdfunding transparency by 30% using blockchain.", "Achieved a 25% rise in user engagement through WebSockets."],
  },
  {
    slug: "faq-manager", number: "04", title: "FAQ Manager", category: "Backend", art: "translation",
    subtitle: "Answers in every language.",
    description: "A multilingual FAQ management system with automatic translation and Redis caching.",
    stack: ["Node.js", "MongoDB", "Redis", "Google Translate API"],
    live: "https://faqfrontend-shreyanshsachan11s-projects.vercel.app/", code: "https://github.com/ShreYansHSachan11/FAQbackend",
    overview: "FAQs are only useful if people can read them. This system stores questions and answers once and serves them in multiple languages through automated translation.",
    build: "A Node.js and MongoDB back end with the Google Translate API for automatic translations, and Redis caching in front of the database.",
    impact: ["Optimized performance with Redis, cutting database queries by 50%."],
  },
] as const satisfies readonly {
  slug: string; number: string; title: string; category: string; art: ProjectArt; subtitle: string; description: string;
  stack: readonly string[]; live: string | null; code: string; overview: string; build: string; impact: readonly string[];
}[];

export const experience = [
  {
    company: "Pinntag", role: "Frontend Developer", period: "Jan 2026 – Present", kind: "Experience",
    points: [
      "Built scalable React features for a real-time promotions platform.",
      "Integrated POS systems and Stripe subscription billing, coordinating payment workflows and subscription state across the application.",
      "Implemented deep linking and authentication redirects, preserving navigation context across login flows and application entry points.",
    ],
  },
  {
    company: "Alankaeon", role: "Frontend Developer Intern", period: "Jun 2025 – Nov 2025", kind: "Experience",
    points: [
      "Refactored Redux state management, reducing load time by 25%.",
      "Integrated API endpoints with RTK Query caching, cutting API calls by 40%.",
    ],
  },
  {
    company: "Google Developer Groups", role: "Web Developer", period: "Oct 2022 – May 2025", kind: "Position of responsibility",
    points: [
      "Developed and maintained web applications supporting 200+ users, streamlining workflows for technical club initiatives.",
      "Coordinated 6+ technical events.",
    ],
  },
] as const;

export const achievements = [
  { tag: "1st place", type: "Recognition", title: "Karnataka State Police Datathon.", detail: "Secured first place, outperforming over 1,100 teams.", icon: "award", link: null },
  { tag: "500+", type: "Problem solving", title: "500+ DSA problems solved.", detail: "Across competitive programming platforms including LeetCode and CodeChef.", icon: "code", link: { label: "LeetCode", href: "https://leetcode.com/u/ShreYanshSachan/" } },
  { tag: "2 certs", type: "Certifications", title: "Generative AI & GitHub.", detail: "Career Essentials in Generative AI by Microsoft, and Career Essentials in GitHub — version control, CI/CD and GitHub Actions.", icon: "badge", link: null },
] as const;

export const education = [
  { school: "Ajay Kumar Garg Engineering College", detail: "B.Tech in Computer Science and Engineering (Data Science)", year: "2025", place: "Ghaziabad" },
  { school: "Durgaprasad Vidyaniketan School", detail: "Intermediate (CBSE) · 91%", year: "2020", place: "Kanpur" },
  { school: "St. Thomas School", detail: "High School (ICSE) · 87%", year: "2018", place: "Bhadohi" },
] as const;

export const posts = [
  { slug: "interfaces-that-feel-alive", title: "Interfaces that feel a little more alive", category: "Design", date: "Oct 24, 2026", minutes: 5, excerpt: "A few thoughts on motion, personality, and the small details that make software feel human.", theme: "secondary", sections: [
    { title: "Start with the moment", text: "Before adding motion, ask what the person is doing. Opening a document, saving a thought, and exploring a new idea are different moments. Each deserves a different rhythm. An animation should acknowledge an action, explain a change, or make a relationship clearer." },
    { title: "Personality is in the details", text: "A tiny shift in a button, a deliberate transition between views, or a little warmth in an empty state can carry more personality than an entire screen of decoration. The trick is restraint: choose one expressive detail and let the rest of the interface support it." },
    { title: "Leave room for quiet", text: "Not everything needs to move. Stillness gives the meaningful moments contrast. Respect reduced-motion preferences, keep content readable, and make sure every interaction works just as well without its animation." },
  ] },
  { slug: "learning-three-js", title: "What building in 3D taught me about the web", category: "Engineering", date: "Oct 12, 2026", minutes: 7, excerpt: "Light, materials, and a whole new way to think about a browser canvas.", theme: "primary", sections: [
    { title: "Light comes before detail", text: "A simple shape with thoughtful lighting often feels more convincing than a complex model with flat illumination. Start with a bright key light, a soft fill, and an environment that gives materials something to reflect." },
    { title: "The browser is a real constraint", text: "Geometry, shadows, and resolution all have a cost. A scene should be built for the people who will use it, not just the machine it was created on. Keep object counts modest, reuse materials, and check the composition on a smaller screen early." },
    { title: "Interaction is the point", text: "The web is not a rendered poster. Let a person turn the object, change a material, or discover a different perspective. Give the scene a purpose and keep the rest of the page accessible without WebGL." },
  ] },
  { slug: "building-small", title: "In praise of building small things", category: "Notes", date: "Sep 28, 2026", minutes: 3, excerpt: "Why side projects don't always need a roadmap, a pitch deck, or a grand plan.", theme: "accent", sections: [
    { title: "A question is enough", text: "A small project can begin with curiosity rather than a business plan. What would a journal sound like? Could a chart become a place? How much can a single interaction communicate? These are perfectly good reasons to start." },
    { title: "Finish one good loop", text: "Choose the central action and make it satisfying. Create, explore, save, or play. A project with one complete loop is more useful than a larger collection of disconnected promises." },
    { title: "Keep the experiment", text: "Not every experiment becomes a product. Some become a lesson, a reusable technique, or the confidence to try something harder. That is a result worth keeping." },
  ] },
] as const;

export type Project = (typeof projects)[number];
export type Post = (typeof posts)[number];

export const PROJECT_CATEGORIES = ["All", "AI", "Web3", "Backend"] as const;
export const POST_CATEGORIES = ["All", "Design", "Engineering", "Notes"] as const;

export function filterByCategory<T extends { category: string }>(items: readonly T[], category: string): T[] {
  return items.filter((item) => category === "All" || item.category === category);
}

export const findProject = (slug: string) => projects.find((p) => p.slug === slug);
export const findPost = (slug: string) => posts.find((p) => p.slug === slug);
