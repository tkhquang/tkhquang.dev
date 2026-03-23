import { getFormattedDuration, getYearsOfExperience } from "@/utils/date";
import clsx from "clsx";

interface Info {
  firstName: string;
  lastName: string;
  title: string;
  summary: string;
}

interface Skill {
  name: string;
  subskills: string[];
}

interface Certificate {
  name: string;
  url: string | null;
  issueDate?: string | null;
  expirationDate?: string | null;
}

interface CertificateGroup {
  organization: string;
  certificates: Certificate[];
}

interface Project {
  name: string;
  url: string | null;
  summary: string;
  teamSize: number | null;
  tasks: string[];
  stacks: string[];
}

interface WorkExperience {
  title: string;
  company: string;
  note?: string;
  url: string | null;
  duration: string;
  projects: Project[];
}

const INFO: Info = {
  firstName: "Quang",
  lastName: "Trinh Khac",
  title: "Senior Frontend Engineer",
  summary: `Senior Frontend Engineer with ${getYearsOfExperience("2019-01-01")}+ years of experience building and scaling web applications in React and Vue. Strong track record of architecting frontend systems end-to-end, from design systems and monorepo strategies to full-stack product features. Leverages AI-assisted tooling to accelerate delivery while owning technical direction, mentoring engineers, and shipping products that drive business outcomes. Shares technical notes on a <a href="https://tkhquang.dev/blog/categories/technical" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">personal blog</a>.`,
};

const SKILLS: Skill[] = [
  {
    name: "Programming Languages",
    subskills: ["JavaScript/TypeScript", "Elixir"],
  },
  {
    name: "Frontend Frameworks & Libraries",
    subskills: [
      "React.js",
      "Vue.js",
      "Next.js",
      "LiveView (Elixir/Phoenix)",
      "Jest",
      "Cypress",
    ],
  },
  {
    name: "Styling & UI",
    subskills: [
      "HTML/CSS",
      "SCSS/Sass",
      "Tailwind CSS",
      "CSS-in-JS",
      "styled-components",
      "Ant Design",
      "Headless UI",
      "Responsive Design",
      "Accessibility (a11y)",
    ],
  },
  {
    name: "State Management",
    subskills: ["Redux", "Zustand", "Jotai", "Vuex", "Context API"],
  },
  {
    name: "API Integration",
    subskills: ["GraphQL", "REST APIs"],
  },
  {
    name: "Backend & Databases",
    subskills: ["Elixir/Phoenix", "Node.js", "PostgreSQL"],
  },
  {
    name: "Tooling & DevOps",
    subskills: [
      "Git",
      "CI/CD",
      "Webpack",
      "Turbopack",
      "Puppeteer",
      "Docker",
      "Vercel",
      "Netlify",
    ],
  },
];

const CERTIFICATIONS: CertificateGroup[] = [
  {
    organization: "Wizeline Academy",
    certificates: [
      {
        name: "APAC React Bootcamp Certificate",
        url: "https://github.com/tkhquang/tkhquang-resume/blob/main/public/assets/documents/Wizeline_Academy-APAC_React_Bootcamp_Certificate.pdf",
      },
    ],
  },
  {
    organization: "freeCodeCamp",
    certificates: [
      {
        name: "Responsive Web Design",
        url: "https://www.freecodecamp.org/certification/fcc6b7548be-1204-45a1-9ef0-f5cf14fbafe9/responsive-web-design",
      },
      {
        name: "JavaScript Algorithms & Data Structures",
        url: "https://www.freecodecamp.org/certification/fcc6b7548be-1204-45a1-9ef0-f5cf14fbafe9/javascript-algorithms-and-data-structures",
      },
      {
        name: "Front End Development Libraries",
        url: "https://www.freecodecamp.org/certification/fcc6b7548be-1204-45a1-9ef0-f5cf14fbafe9/front-end-development-libraries",
      },
      {
        name: "Back End Development & APIs",
        url: "https://www.freecodecamp.org/certification/fcc6b7548be-1204-45a1-9ef0-f5cf14fbafe9/back-end-development-and-apis",
      },
    ],
  },
  {
    organization: "Dwarves Foundation",
    certificates: [
      {
        name: "Software Engineering Internship Completion",
        url: "https://github.com/dwarvesf/training/blob/master/2019/TrinhKhacQuang.pdf",
      },
    ],
  },
  {
    organization: "IIG Vietnam",
    certificates: [
      {
        name: "TOEIC English Proficiency - Score: 870",
        url: null,
        issueDate: "12/2014",
        expirationDate: "12/2016",
      },
    ],
  },
];

const WORK_EXPERIENCE: WorkExperience[] = [
  {
    title: "Senior Frontend Engineer",
    company: "TruckerPath",
    note: "Moatable Inc. · Employer of Record: PERSOL Vietnam",
    url: "https://truckerpath.com/",
    duration: getFormattedDuration({
      startDate: "2025-10-13",
    }),
    projects: [
      {
        name: "NavPro v2: Fleet TMS & Navigation Platform",
        summary:
          "Shaped early technical direction for NavPro v2, a cloud-based TMS and navigation tool for commercial truck fleets, within a distributed international team.",
        teamSize: 12,
        url: null,
        tasks: [
          "Defined coding conventions, project structure, and shared patterns for the v2 codebase, setting the foundation for consistent contributions across the team.",
          "Ported v1 modules to v2, preserving core logic while enhancing UX and aligning with the new design system, leveraging AI-assisted tooling (Cursor, Claude Code) to accelerate delivery.",
          "Rebuilt the interactive map layer from scratch on Google Maps API (replacing HERE Maps), enabling complex multi-stop fleet routing.",
          "Established a review workflow across PRDs, Figma specs, and frontend PRs that improved code quality and delivery speed.",
        ],
        stacks: [
          "React",
          "TypeScript",
          "Redux Toolkit",
          "TailwindCSS",
          "shadcn/ui",
          "React Hook Form",
          "Zod",
          "Google Maps API",
        ],
      },
      {
        name: "Truckloads Carrier Page Enhancement",
        summary:
          "Built carrier-facing features for TruckLoads, a free load board connecting owner-operators with 150,000+ daily freight listings.",
        teamSize: 5,
        url: null,
        tasks: [
          "Shipped the Docs Pro subscription feature end-to-end, including document scanning, signing, and management with an upgrade flow that opened a new recurring revenue stream.",
          "Created a WEX factoring signup form that achieved a 20% conversion rate, driving freight invoice financing enrollment.",
          "Expanded Mixpanel instrumentation across load search and carrier flows, giving the product team data that shaped iteration priorities.",
        ],
        stacks: ["React", "SCSS", "RxJS", "Ant Design", "Mixpanel"],
      },
      {
        name: "Back Office: POI Data Management",
        summary:
          "Expanded the back office for managing the places database (50K+ POIs) that powers truck navigation.",
        teamSize: 6,
        url: null,
        tasks: [
          "Implemented POI management features for truck stops, weigh stations, and fuel stations, covering requirements through QA sign-off.",
          "Unified Mixpanel tracking across modules and stripped PII from event properties to meet data compliance requirements.",
        ],
        stacks: ["Vue", "SCSS", "single-spa (micro frontend)"],
      },
    ],
  },
  {
    title: "Senior Frontend Engineer",
    company: "Care",
    note: "Employer of Record: Talent Matrix VN → Remote.com",
    url: "https://www.wearecare.sg/",
    duration: getFormattedDuration({
      startDate: "2023-08-07",
      endDate: "2025-06-06",
    }),
    projects: [
      {
        name: "Health Screening Report Generation System",
        summary:
          "Architected a service that cut PDF health report generation from 1-2 hours (manual) to under 60 seconds, leading a 4-person frontend team.",
        teamSize: 4,
        url: null,
        tasks: [
          "Designed the system architecture from scratch and set up coding standards, CI/CD pipelines, and review processes for the team.",
          "Developed a Next.js + Puppeteer microservice for server-side PDF rendering, turning complex lab data into clinician-ready reports with Recharts visualizations.",
          "Aligned frontend, backend, and data teams on integration contracts, unblocking downstream feature work and launching health reports as a new platform capability.",
        ],
        stacks: [
          "Next.js",
          "Turbopack",
          "Puppeteer",
          "Recharts",
          "TypeScript",
          "TailwindCSS",
          "Docker",
        ],
      },
      {
        name: "Enterprise Wellness Platform",
        summary:
          "Led frontend development for a partner-facing wellness platform with mobile-integrated features.",
        teamSize: 10,
        url: null,
        tasks: [
          "Shipped accessible UIs across multiple product modules, coordinating with backend and mobile teams.",
          "Engineered webview integration for the Flutter app, resolving cross-platform edge cases on Android and iOS.",
          "Consolidated four frontend repositories into a monorepo, eliminating duplicated components and cutting onboarding time.",
          "Added event tracking across key user flows, surfacing usage patterns that informed UX redesigns.",
        ],
        stacks: [
          "React",
          "TypeScript",
          "Zustand",
          "Next.js",
          "SCSS",
          "TailwindCSS",
          "Ant Design",
        ],
      },
      {
        name: "Membership Management Module",
        summary:
          "Enhanced the core membership system and partner back-office with UX improvements and third-party integrations.",
        teamSize: 12,
        url: null,
        tasks: [
          "Led frontend delivery alongside product, design, and backend, ensuring all interfaces matched the design system and passed accessibility reviews.",
          "Evaluated form-builder frameworks (form.io, BEEKAI) and delivered a validated POC projected to reduce form-related code duplication by 70%.",
        ],
        stacks: [
          "React",
          "TypeScript",
          "Zustand",
          "Next.js",
          "TailwindCSS",
          "Ant Design",
        ],
      },
    ],
  },
  {
    title: "Full-Stack Engineer",
    company: "Deliany",
    note: "Rebranded: Deliany → Cloud Food System → Norra · norra.ai",
    url: "https://norra.ai/",
    duration: getFormattedDuration({
      startDate: "2020-10-21",
      endDate: "2023-07-28",
    }),
    projects: [
      {
        name: "Multi-tenant Restaurant Cloud Platform",
        summary:
          "Grew from Frontend to Full-Stack, leading the architecture of a new POS system and a company-wide UI library.",
        teamSize: 8,
        url: null,
        tasks: [
          "Architected and delivered a real-time POS system (Elixir/Phoenix + React), owning decisions from data modeling to frontend state management.",
          "Created the company-wide React component library on Headless UI, adopted as the standard design system across all product teams.",
          "Drove a 20% increase in checkout and signup conversion rates by optimizing UI flows based on user behavior data.",
          "Ran targeted refactors across multiple codebases, reducing build times and simplifying the contribution path for new engineers.",
          "Mentored two junior developers through code reviews and pair programming, growing them into independent contributors within six months.",
        ],
        stacks: [
          "Elixir/Phoenix",
          "React",
          "TypeScript",
          "Recoil",
          "Next.js",
          "GraphQL",
          "PostgreSQL",
          "styled-components",
        ],
      },
    ],
  },
  {
    title: "Frontend Engineer (Freelance)",
    company: "Multiple Clients",
    url: null,
    duration: getFormattedDuration({
      startDate: "2019-09-07",
      endDate: "2020-10-20",
    }),
    projects: [
      {
        name: "",
        summary:
          "Built frontend solutions across client projects in shipping logistics and real-time video communication.",
        teamSize: null,
        url: null,
        tasks: [
          "Restructured a Vue.js frontend for a package tracking platform into a modular component library, cutting feature implementation time by 40% and improving page load times by 200% through code-splitting and lazy loading.",
          "Solely responsible for migrating a video communication app from Vue/Parcel to React/Webpack, delivering a 30% performance boost and integrating WebRTC for reliable, low-latency video.",
        ],
        stacks: [
          "React",
          "Vue.js",
          "Redux",
          "Vuex",
          "WebRTC",
          "Webpack",
          "Bootstrap",
        ],
      },
    ],
  },
  {
    title: "Software Engineer",
    company: "Dwarves Foundation",
    url: "https://dwarves.foundation/",
    duration: getFormattedDuration({
      startDate: "2019-04-01",
      endDate: "2019-09-06",
    }),
    projects: [
      {
        name: "",
        summary:
          "Contributed frontend and full-stack work across client-facing and internal projects.",
        teamSize: null,
        url: null,
        tasks: [
          'Migrated dozens of legacy Vue components to a Gridsome-based architecture for <a href="https://www.telemetrytv.com/" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">TelemetryTV</a>, an enterprise digital signage platform.',
          "Developed a full-stack internal lunch-ordering system as part of the DATCOM internship program, covering PostgreSQL schema, Golang REST APIs (Gin/GORM), and a React admin frontend.",
        ],
        stacks: [
          "Vue.js",
          "Vuex",
          "Gridsome",
          "GraphQL",
          "Golang",
          "PostgreSQL",
          "React",
          "TailwindCSS",
        ],
      },
    ],
  },
];

const EDUCATION = [
  {
    program: "Advanced Education Program (AEP), Information Systems",
    university:
      "Ho Chi Minh City University of Information Technology (UIT) - VNUHCM",
  },
];

// Section component for consistent section layout
const Section: React.FC<{
  title: string;
  children: React.ReactNode;
  className?: string;
}> = ({ title, children, className = "" }) => (
  <section className={clsx("", className)}>
    <h2 className="mb-3 border-b border-slate-300 pb-1 text-sm font-bold tracking-wide text-slate-800 uppercase">
      {title}
    </h2>
    {children}
  </section>
);

const ResumeHeader: React.FC = () => (
  <header className="mb-6 border-b border-slate-200 pb-4">
    <div className="mb-2 text-center">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">
        {INFO.firstName} {INFO.lastName}
      </h1>
    </div>
    <div className="mx-auto max-w-2xl">
      <div className="grid grid-cols-3 gap-x-8 gap-y-1 text-xs text-slate-700">
        <div className="flex whitespace-nowrap">
          <span className="font-semibold">Phone:</span>
          <a
            href="tel:+84858533839"
            className="ml-1 text-blue-600 hover:underline"
          >
            +84 8585 33839
          </a>
        </div>
        <div className="flex whitespace-nowrap">
          <span className="font-semibold">Portfolio:</span>
          <a
            href="https://tkhquang.dev/"
            className="ml-1 text-blue-600 hover:underline"
          >
            tkhquang.dev
          </a>
        </div>
        <div className="flex whitespace-nowrap">
          <span className="font-semibold">GitHub:</span>
          <a
            href="https://github.com/tkhquang"
            className="ml-1 text-blue-600 hover:underline"
          >
            github.com/tkhquang
          </a>
        </div>

        <div className="flex whitespace-nowrap">
          <span className="font-semibold">Email:</span>
          <a
            href="mailto:khacquang.trinh@gmail.com"
            className="ml-1 text-blue-600 hover:underline"
          >
            khacquang.trinh@gmail.com
          </a>
        </div>
        <div className="flex whitespace-nowrap">
          <span className="font-semibold">LinkedIn:</span>
          <a
            href="https://www.linkedin.com/in/tkhquang/"
            className="ml-1 text-blue-600 hover:underline"
          >
            linkedin.com/in/tkhquang
          </a>
        </div>
        <div className="flex whitespace-nowrap">
          <span className="font-semibold">Location:</span>
          <span className="ml-1">District 1, HCMC, Vietnam</span>
        </div>
      </div>
    </div>
  </header>
);

const ExperienceItem: React.FC<{ experience: WorkExperience }> = ({
  experience,
}) => (
  <div className="mb-4 last:mb-0">
    <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
      <div className="flex flex-wrap items-baseline gap-x-2">
        <span className="font-bold text-slate-900">{experience.title}</span>
        {experience.url ? (
          <a
            href={experience.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-blue-600 hover:underline"
          >
            @ {experience.company}
          </a>
        ) : (
          <span className="text-sm font-semibold text-blue-600">
            @ {experience.company}
          </span>
        )}
      </div>
      <span className="font-mono text-xs text-slate-500">
        {experience.duration}
      </span>
    </div>
    {experience.note && (
      <p className="-mt-0.5 mb-2 text-xs text-slate-400 italic">
        {experience.note}
      </p>
    )}
    <div className="space-y-3">
      {experience.projects.map((project, index) => (
        <ProjectItem key={index} project={project} />
      ))}
    </div>
  </div>
);

const ProjectItem: React.FC<{ project: Project }> = ({ project }) => (
  <div className="ml-4 border-l-2 border-slate-200 pl-4">
    {(project.name || project.teamSize) && (
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        {project.name && (
          <span className="font-semibold text-slate-800">{project.name}</span>
        )}
        {project.teamSize && (
          <span className="text-xs text-slate-500">
            Team of {project.teamSize}
          </span>
        )}
      </div>
    )}
    <p className="mb-1 text-sm leading-relaxed text-slate-700">
      {project.summary}
    </p>
    <ul className="mb-1 list-inside list-disc space-y-1 text-sm text-slate-700">
      {project.tasks.map((task, taskIndex) => (
        <li key={taskIndex} className="no-break-inside list-item">
          <span
            className="leading-relaxed"
            dangerouslySetInnerHTML={{ __html: task }}
          />
        </li>
      ))}
    </ul>
    <div className="mt-1 text-xs text-slate-500 italic">
      {project.stacks.join(", ")}
    </div>
  </div>
);

const SKILL_LABELS: Record<string, string> = {
  "Programming Languages": "Languages",
  "Frontend Frameworks & Libraries": "Frontend",
  "Styling & UI": "Styling/UI",
  "State Management": "State Management",
  "API Integration": "API Integration",
  "Backend & Databases": "Backend",
  "Tooling & DevOps": "Tooling & DevOps",
};

const SkillsSection: React.FC = () => (
  <dl className="space-y-1 text-sm text-slate-800">
    {SKILLS.map((skill) => (
      <div key={skill.name} className="flex flex-row flex-wrap">
        <dt className="min-w-[140px] font-semibold">
          {SKILL_LABELS[skill.name] || skill.name}:
        </dt>
        <dd className="ml-2 flex-1 text-slate-700">
          {skill.subskills.join(", ")}
        </dd>
      </div>
    ))}
  </dl>
);

const CertificationsSection: React.FC = () => (
  <div className="space-y-2">
    {CERTIFICATIONS.map((group) => (
      <div key={group.organization} className="flex">
        <span className="min-w-[160px] text-sm font-semibold text-slate-800">
          {group.organization}:
        </span>
        <span className="flex-1 text-sm text-slate-700">
          {group.certificates.map((cert, idx) => (
            <span key={cert.name}>
              {cert.url ? (
                <a
                  href={cert.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {cert.name}
                </a>
              ) : (
                <span>{cert.name}</span>
              )}
              {cert.issueDate && (
                <span className="ml-1 text-xs text-slate-500">
                  ({cert.issueDate} - {cert.expirationDate})
                </span>
              )}
              {idx < group.certificates.length - 1 && <span>, </span>}
            </span>
          ))}
        </span>
      </div>
    ))}
  </div>
);

const EducationSection: React.FC = () => (
  <div className="space-y-2">
    {EDUCATION.map((edu, idx) => (
      <div key={idx}>
        <div className="text-sm font-semibold text-slate-800">
          {edu.program}
        </div>
        <div className="text-sm text-slate-700">{edu.university}</div>
      </div>
    ))}
  </div>
);

export const dynamic = "force-static";
export const revalidate = 86400;

export default function ResumePage() {
  return (
    <div className={clsx("bg-slate-100 antialiased", "font-sans-inter")}>
      <div
        className={clsx(
          "mx-auto max-w-3xl bg-white px-8 pt-10 shadow-xl print:shadow-none"
        )}
      >
        <ResumeHeader />

        <main className="space-y-6">
          <Section title="Professional Summary">
            <p
              className="text-sm leading-relaxed text-slate-700"
              dangerouslySetInnerHTML={{ __html: INFO.summary }}
            />
          </Section>

          <Section title="Technical Skills">
            <SkillsSection />
          </Section>

          <Section title="Professional Experience">
            {WORK_EXPERIENCE.map((exp, index) => (
              <ExperienceItem key={index} experience={exp} />
            ))}
          </Section>

          <Section title="Certifications & Professional Development">
            <CertificationsSection />
          </Section>

          <Section title="Education">
            <EducationSection />
          </Section>

          <Section title="Languages">
            <div className="text-sm text-slate-800">
              <span className="font-semibold">Vietnamese:</span> Native,{" "}
              <span className="font-semibold">English:</span> Fluent
            </div>
          </Section>
        </main>
      </div>
    </div>
  );
}
