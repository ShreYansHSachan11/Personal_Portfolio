import type { Square } from "chess.js";

/**
 * Shared, browser-safe portfolio content, sourced from Shreyansh Sachan's resume.
 * The journal currently holds reading notes on classic software essays (see `posts`).
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

/**
 * The journal. For now it holds reading notes on classic essays about software: each
 * credits the original and links to it, and the summaries are written fresh, not quoted.
 * Shreyansh's own posts can sit alongside them later: leave out `source` and give a `date`.
 */
export interface PostSection { title: string; text: string }
export interface Post {
  slug: string;
  title: string;
  category: PostCategory;
  excerpt: string;
  /** Reading time of these notes, not of the original. */
  minutes: number;
  theme: "primary" | "secondary" | "accent";
  /** Short typographic motif drawn on the card cover. */
  mark: string;
  /** Present on reading notes: who wrote the original, when, and where to read it. */
  source?: { author: string; year: number; url: string };
  /** Publication date for Shreyansh's own posts. */
  date?: string;
  sections: readonly PostSection[];
}

export const POST_CATEGORIES = ["All", "Engineering", "Design", "Process"] as const;
export type PostCategory = Exclude<(typeof POST_CATEGORIES)[number], "All">;

export const posts: readonly Post[] = [
  {
    slug: "no-silver-bullet", title: "No Silver Bullet", category: "Engineering", minutes: 4, theme: "secondary", mark: "×10?",
    source: { author: "Fred Brooks", year: 1986, url: "https://www.cs.unc.edu/techreports/86-020.pdf" },
    excerpt: "Why no single tool will ever make software ten times easier to build, and what actually helps.",
    sections: [
      { title: "The argument", text: "Brooks splits the difficulty of software into two kinds. Accidental difficulty comes from our tools: slow machines, clumsy languages, awkward workflows. Essential difficulty comes from the problem itself. Software is complex, has to conform to a messy world, keeps changing, and can't be seen or drawn the way a building can. Past breakthroughs like high-level languages and time-sharing mostly removed accidental difficulty, so he predicted that no single technique would bring a tenfold gain within a decade." },
      { title: "What he thought would help", text: "Rather than a magic tool, he pointed to steady, compounding habits: buy software instead of building it when you can, use prototypes to discover what people really need, grow a system incrementally so it always runs, and invest in great designers, because the gap between good and great design is enormous." },
      { title: "My takeaway", text: "Every new framework promises to make things easy, and it usually does make the accidental parts easier. The hard part is still understanding the problem well enough to model it. When a project feels slow, I now ask which kind of difficulty I'm fighting before reaching for a new tool." },
    ],
  },
  {
    slug: "go-to-considered-harmful", title: "Go To Statement Considered Harmful", category: "Engineering", minutes: 3, theme: "primary", mark: "goto",
    source: { author: "Edsger W. Dijkstra", year: 1968, url: "https://www.cs.utexas.edu/~EWD/transcriptions/EWD02xx/EWD215.html" },
    excerpt: "A one-page letter that changed how we write code, and why it's really about reasoning, not keywords.",
    sections: [
      { title: "The argument", text: "Dijkstra's point is that our minds are good at understanding static text and bad at tracking a process unfolding over time. So code should make the running program easy to picture from the written one. With loops, conditionals and procedure calls you can always say where you are in the execution. Jumping anywhere with go to destroys that, and the program's behaviour becomes hard to reason about." },
      { title: "Why it lasted", text: "The famous title was added by the journal's editor, and it started a whole genre of \"considered harmful\" essays. The underlying idea won so completely that structured control flow is now simply how programming languages work." },
      { title: "My takeaway", text: "The same principle applies long after go to disappeared. Deeply nested callbacks, scattered global state and event listeners that change things from far away make it hard to see what happens when. I try to write code whose order on the screen matches the order things happen at runtime." },
    ],
  },
  {
    slug: "things-you-should-never-do", title: "Things You Should Never Do, Part I", category: "Process", minutes: 3, theme: "accent", mark: "rm -rf",
    source: { author: "Joel Spolsky", year: 2000, url: "https://www.joelonsoftware.com/2000/04/06/things-you-should-never-do-part-i/" },
    excerpt: "The case against rewriting working software from scratch, told through Netscape's costly mistake.",
    sections: [
      { title: "The argument", text: "Spolsky calls throwing away a working codebase to start over the single worst strategic mistake a software company can make, using Netscape's long rewrite of its browser as the example. Developers want to rewrite because reading code is harder than writing it, so old code always looks worse than it is. But the ugly parts are often bug fixes for real situations someone already ran into, and a rewrite throws that knowledge away." },
      { title: "What to do instead", text: "Improve the code you have: refactor the confusing parts, untangle the architecture piece by piece, and speed up the slow paths. You keep shipping the whole time, and you keep every lesson the old code learned." },
      { title: "My takeaway", text: "When I join a codebase and something looks strange, I assume it's there for a reason until I can prove otherwise. Small, steady refactors have nearly always beaten my urge to start again." },
    ],
  },
  {
    slug: "makers-schedule", title: "Maker's Schedule, Manager's Schedule", category: "Process", minutes: 3, theme: "secondary", mark: "9→5",
    source: { author: "Paul Graham", year: 2009, url: "https://paulgraham.com/makersschedule.html" },
    excerpt: "Why a single meeting can wreck a programmer's afternoon, and how to plan around it.",
    sections: [
      { title: "The argument", text: "Managers divide the day into one-hour slots, and a meeting is just one more slot to fill. People who make things, like programmers and writers, need long uninterrupted stretches, often half a day, to get anything substantial done. For them, one meeting in the middle of the afternoon breaks it into two pieces too small for hard work." },
      { title: "The fix he suggests", text: "Graham describes keeping meetings to the end of the day, like office hours, so the productive part of the day stays whole. More broadly, makers and managers should each understand that the other is working to a different clock." },
      { title: "My takeaway", text: "I protect focus blocks in my calendar and try to batch calls together. When I schedule time with other engineers, I aim for the edges of their day, not the middle." },
    ],
  },
  {
    slug: "worse-is-better", title: "Worse Is Better", category: "Engineering", minutes: 3, theme: "primary", mark: "≤",
    source: { author: "Richard P. Gabriel", year: 1991, url: "https://www.dreamsongs.com/WorseIsBetter.html" },
    excerpt: "Why simple, slightly wrong software often beats the perfect design, and spreads further.",
    sections: [
      { title: "The argument", text: "Gabriel contrasts two design philosophies. \"The right thing\" insists on correctness, consistency and completeness, even if the implementation gets complicated. \"Worse is better\" puts simplicity of implementation first and accepts some rough edges in the interface. He argues that the second approach, embodied by Unix and C, tends to win: simple systems are easier to port, ship sooner, and spread, and then improve over time." },
      { title: "The twist", text: "Gabriel himself came from the right-thing school, and spent years arguing with his own essay. That's part of why it's still read: it's an honest description of a trade-off, not a slogan." },
      { title: "My takeaway", text: "A working, simple version in people's hands teaches you more than a perfect design on a whiteboard. I try to ship the smallest thing that's genuinely useful, then let real use tell me where it needs to be better." },
    ],
  },
  {
    slug: "magic-ink", title: "Magic Ink", category: "Design", minutes: 4, theme: "accent", mark: "ink",
    source: { author: "Bret Victor", year: 2006, url: "https://worrydream.com/MagicInk/" },
    excerpt: "Most software is for learning things, not doing things. Design it more like a great infographic.",
    sections: [
      { title: "The argument", text: "Victor observes that most software exists to help people learn something: when the next train leaves, which movie to see, what the weather will do. He calls this information software and argues it should be designed like good graphic design, showing the answer clearly rather than making people click through menus and forms to get it." },
      { title: "Interaction as a cost", text: "In his view, every bit of interaction asks the user to do work the software could have done. Good information software uses context instead: the time, the location, what the person looked at before. That way it can show the most likely answer straight away." },
      { title: "My takeaway", text: "Before adding a filter, a dropdown or another button, I ask whether the screen could simply show what the person most likely wants. The best interfaces I've built usually have fewer controls than the first draft." },
    ],
  },
];


export type Project = (typeof projects)[number];

export const PROJECT_CATEGORIES = ["All", "AI", "Web3", "Backend"] as const;

export function filterByCategory<T extends { category: string }>(items: readonly T[], category: string): T[] {
  return items.filter((item) => category === "All" || item.category === category);
}

export const findProject = (slug: string) => projects.find((p) => p.slug === slug);
export const findPost = (slug: string) => posts.find((p) => p.slug === slug);

/**
 * "What I'm into" cards in the hero card holder.
 * These lists are SAMPLE picks until Shreyansh fills in his real ones; while `sample`
 * is true the panel says so, so nothing reads as a real claim. Edit freely: each list
 * needs 3–6 items. The chess card is a playable mate-in-one: `fen` is the position
 * (White to move) and `solution` the one mating move; the tests check both. Its
 * chess.com stats load live in the browser; `snapshot` is shown first and kept if
 * chess.com is unreachable.
 * Book, song and movie covers are looked up by title: run `npm run covers` after editing
 * these lists to refresh src/components/portfolio/hero/covers.ts.
 */
export type InterestTone = "card" | "pink" | "accent" | "primary";
export interface InterestItem { title: string; meta: string }
export interface ChessStats {
  rapid: number | null;
  puzzles: number | null;
  games: number;
  league: string | null;
  avatar: string | null;
}
interface InterestBase {
  label: string;
  tagline: string;
  tone: InterestTone;
  sample: boolean;
}
export type Interest = InterestBase & (
  | {
      kind: "chess";
      fen: string;
      /** The one mating move; the tests check it with chess.js. `from` doubles as the hint. */
      solution: { from: Square; to: Square };
      solvedCaption: string;
      chessCom: { username: string; snapshot: ChessStats };
    }
  | { kind: "music" | "books" | "movies"; items: readonly InterestItem[] }
);
export type InterestKind = Interest["kind"];

export const interests: readonly Interest[] = [
  {
    kind: "chess", label: "Chess", tagline: "your move. mate in one?", tone: "card", sample: false,
    // Scholar's mate: Qxf7# is the only mating move (Bxf7+ is check, but Ke7 escapes).
    fen: "r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4",
    solution: { from: "h5", to: "f7" },
    solvedCaption: "Qxf7#, the Scholar's mate. The first trap everyone falls for once.",
    chessCom: {
      username: "shreyansh_sachan",
      // From api.chess.com on 2 Nov 2026; replaced by live numbers when the panel opens.
      snapshot: {
        rapid: 756, puzzles: 1640, games: 2058, league: "Champion",
        avatar: "https://images.chesscomfiles.com/uploads/v1/user/176441593.ac978c37.200x200o.5b5c1e03e387.jpg",
      },
    },
  },
  {
    kind: "music", label: "Music", tagline: "what's in my headphones while I code.", tone: "pink", sample: true,
    items: [
      { title: "Blinding Lights", meta: "The Weeknd" },
      { title: "Kesariya", meta: "Arijit Singh" },
      { title: "Do I Wanna Know?", meta: "Arctic Monkeys" },
      { title: "Time", meta: "Hans Zimmer" },
      { title: "Sunflower", meta: "Post Malone & Swae Lee" },
    ],
  },
  {
    kind: "books", label: "Books", tagline: "pages that changed how I think.", tone: "accent", sample: false,
    items: [
      { title: "The Myth of Sisyphus", meta: "Albert Camus" },
      { title: "Crime and Punishment", meta: "Fyodor Dostoevsky" },
      { title: "Siddhartha", meta: "Hermann Hesse" },
      { title: "The Pragmatic Programmer", meta: "Hunt & Thomas" },
      { title: "Sapiens", meta: "Yuval Noah Harari" },
    ],
  },
  {
    kind: "movies", label: "Movies", tagline: "stories I'd happily watch again.", tone: "primary", sample: true,
    items: [
      { title: "Interstellar", meta: "2014" },
      { title: "3 Idiots", meta: "2009" },
      { title: "The Dark Knight", meta: "2008" },
      { title: "Barfi!", meta: "2012" },
    ],
  },
];
