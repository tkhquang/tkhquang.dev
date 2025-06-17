import { getFormattedDuration, getYearsOfExperience } from "@/utils/date";
import clsx from "clsx";

//================================================================================
// TYPESCRIPT INTERFACES
//================================================================================
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
  teamSize: number;
  tasks: string[];
  stacks: string[];
}

interface WorkExperience {
  title: string;
  company: string;
  url: string | null;
  duration: string;
  projects: Project[];
}

//================================================================================
// 3. PROFESSIONALLY REWRITTEN & COMPLETE DATA
//================================================================================
const INFO: Info = {
  firstName: "Quang",
  lastName: "Trinh Khac",
  title: "Senior Frontend Engineer",
  summary: `Accomplished Senior Frontend Engineer with ${getYearsOfExperience("2019-01-01")}+ years of expertise in architecting, developing, and deploying scalable web applications using modern JavaScript frameworks. Acknowledged expert in React and Vue, with a proven ability to lead technical initiatives, enhance user experience, and drive business objectives. Passionate about clean code, performance optimization, and collaborative problem-solving.`,
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
      "Gridsome",
      "Jest",
      "Cypress",
    ],
  },
  {
    name: "Styling & UI",
    subskills: [
      "HTML5",
      "CSS3",
      "SCSS/Sass",
      "Tailwind CSS",
      "CSS-in-JS",
      "styled-components",
      "Headless UI",
      "Ant Design",
      "Bootstrap",
    ],
  },
  {
    name: "State Management",
    subskills: ["Redux", "Zustand", "Recoil", "Jotai", "Vuex", "Context API"],
  },
  {
    name: "API Integration",
    subskills: ["GraphQL", "REST APIs"],
  },
  {
    name: "Backend & Databases",
    subskills: ["Node.js", "Elixir/Phoenix", "PostgreSQL"],
  },
  {
    name: "Tooling & DevOps",
    subskills: [
      "Git",
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
    company: "Care",
    url: "https://www.wearecare.sg/",
    duration: getFormattedDuration({ startDate: "2023-08-07" }),
    projects: [
      {
        name: "Health Screening Report Generation System",
        summary:
          "Architected and led the development of a mission-critical service for generating dynamic PDF health reports from complex lab data, guiding a small frontend team. This system streamlined clinical workflows and established a foundation for future data products.",
        teamSize: 4,
        url: null,
        tasks: [
          "Engineered a scalable microservice using Next.js API routes, integrating Puppeteer for precise server-side PDF rendering and Recharts for data visualization.",
          "Defined and implemented the complete project architecture, coding standards, and CI/CD pipeline, ensuring a maintainable and high-quality codebase.",
          "Orchestrated a seamless integration with frontend teams, accelerating feature delivery and enabling new platform capabilities.",
        ],
        stacks: [
          "Next.js",
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
          "Spearheaded frontend development for a partner-facing wellness platform, delivering advanced customization and mobile-integrated features that measurably improved partner engagement.",
        teamSize: 10,
        url: null,
        tasks: [
          "Developed highly responsive and accessible user interfaces using React and TypeScript, meeting ambitious deadlines while fulfilling all business requirements.",
          "Engineered a flawless webview integration for the core Flutter application, ensuring a consistent and fluid user experience across both Android and iOS.",
          "Architected and executed a monorepo strategy for four frontend repositories, significantly reducing code duplication and standardizing component usage.",
          "Integrated analytics and event tracking to provide actionable data insights, leading to data-driven improvements in the user experience.",
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
          "Enhanced the core membership system and partner back-office, focusing on UX improvements and third-party integrations to boost user satisfaction and streamline data collection.",
        teamSize: 12,
        url: null,
        tasks: [
          "Collaborated within a cross-functional team to design and implement user-centric interfaces, ensuring strict alignment with the company's comprehensive design system.",
          "Led a research initiative to evaluate and integrate third-party form-builder frameworks (form.io, BEEKAI), presenting a POC that demonstrated a path to faster client onboarding.",
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
    url: "https://eats.deliany.co/en",
    duration: getFormattedDuration({
      startDate: "2020-10-21",
      endDate: "2023-07-28",
    }),
    projects: [
      {
        name: "Multi-tenant Restaurant Cloud Platform",
        summary:
          "Progressed from a Frontend to a pivotal Full-Stack role, where I led the architecture of a new POS system and established a company-wide UI library, driving major improvements in developer productivity and product cohesion.",
        teamSize: 8,
        url: null,
        tasks: [
          "Architected and delivered a feature-rich Point-of-Sale system using an Elixir/Phoenix backend and React frontend for complex real-time order management.",
          "Created and governed a comprehensive React UI component library based on Headless UI, which was adopted as the company-wide design standard.",
          "Drove a 20% increase in key conversion rates by leveraging user analytics to optimize UI layouts and critical user flows.",
          "Reduced technical debt across multiple codebases through systematic refactoring, resulting in a measurable increase in team velocity and application performance.",
          "Mentored two junior developers through structured code reviews and pair programming, measurably improving their technical proficiency and autonomy.",
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
        name: "Logistics & Package Tracking Platform",
        summary:
          "Developed a complete frontend solution for a shipping logistics platform with real-time package tracking, focusing on high performance and component reusability.",
        teamSize: 3,
        url: null,
        tasks: [
          "Engineered a modular Vue.js component library that cut new feature implementation time by 40%.",
          "Achieved a 200% improvement in page load times by implementing advanced code-splitting, lazy loading, and dependency optimization techniques.",
        ],
        stacks: ["Vue.js", "Vuex", "Bootstrap"],
      },
      {
        name: "practice.dev - Developer Education Platform",
        summary:
          "Served as a key contributor to an educational platform for developers, responsible for quality assurance and the technical correctness of coding challenges.",
        teamSize: 2,
        url: null,
        tasks: [
          "Performed comprehensive testing and debugging of both frontend and back-end coding challenges, ensuring functional accuracy and educational value.",
          "Collaborated with platform authors to refine challenge specifications and enhance the user feedback system.",
        ],
        stacks: ["React", "Vue.js", "Node.js", "Firebase", "TailwindCSS"],
      },
      {
        name: "Real-Time Video Communication Application",
        summary:
          "Orchestrated the architectural migration and feature development for a video chat application, enhancing performance and ensuring cross-platform stability.",
        teamSize: 5,
        url: null,
        tasks: [
          "Led a large-scale migration from a legacy Vue/Parcel architecture to a modern React/Webpack stack, resulting in a 30% performance boost and improved maintainability.",
          "Integrated WebRTC to enable reliable, low-latency video communication.",
        ],
        stacks: ["React", "Vue", "Redux", "WebRTC", "Webpack"],
      },
    ],
  },
  {
    title: "Software Engineer",
    company: "Dwarves Foundation",
    url: "https://dwarves.foundation/",
    duration: getFormattedDuration({
      startDate: "2019-06-01",
      endDate: "2019-09-06",
    }),
    projects: [
      {
        name: "TelemetryTV Digital Signage Platform",
        summary:
          "Contributed core features to an enterprise-grade digital signage platform, focusing on a major architectural migration and developing rich, interactive features.",
        teamSize: 5,
        url: "https://www.telemetrytv.com/",
        tasks: [
          "Migrated dozens of business-critical components to a new architectural framework, enhancing both system performance and developer experience.",
          "Translated complex Figma designs into pixel-perfect, interactive user experiences that demonstrably increased user engagement metrics.",
        ],
        stacks: ["Vue.js", "Vuex", "Gridsome", "GraphQL", "TailwindCSS"],
      },
    ],
  },
  {
    title: "Software Engineer Intern",
    company: "Dwarves Foundation",
    url: "https://dwarves.foundation/",
    duration: getFormattedDuration({
      startDate: "2019-04-01",
      endDate: "2019-06-01",
    }),
    projects: [
      {
        name: "DATCOM Internal Application",
        summary:
          "Acquired comprehensive full-stack experience by building an internal lunch-ordering system from the ground up within an Agile team.",
        teamSize: 5,
        url: null,
        tasks: [
          "Contributed to the full software development lifecycle, from database design with GORM and PostgreSQL to API development with Golang (Gin).",
          "Developed and tested RESTful API endpoints for all core application functionalities.",
          "Built the entire administrative frontend using React and Tailwind CSS, focusing on a clean and intuitive user experience.",
        ],
        stacks: ["Golang", "PostgreSQL", "RESTful API", "React", "TailwindCSS"],
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
  <section className={clsx("mb-6", className)}>
    <h2 className="mb-3 border-b border-slate-300 pb-1 text-sm font-bold uppercase tracking-wide text-slate-800">
      {title}
    </h2>
    {children}
  </section>
);

//================================================================================
// COMPONENTS
//================================================================================
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
    <div className="space-y-3">
      {experience.projects.map((project, index) => (
        <ProjectItem key={index} project={project} />
      ))}
    </div>
  </div>
);

const ProjectItem: React.FC<{ project: Project }> = ({ project }) => (
  <div className="ml-4 border-l-2 border-slate-200 pl-4">
    <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
      <span className="font-semibold text-slate-800">{project.name}</span>
      <span className="text-xs text-slate-500">Team of {project.teamSize}</span>
    </div>
    <p className="mb-1 text-sm leading-relaxed text-slate-700">
      {project.summary}
    </p>
    <ul className="mb-1 list-inside list-disc space-y-1 text-sm text-slate-700">
      {project.tasks.map((task, taskIndex) => (
        <li key={taskIndex} className="list-item">
          <span className="leading-relaxed">{task}</span>
        </li>
      ))}
    </ul>
    <div className="mt-1 text-xs italic text-slate-500">
      {project.stacks.join(", ")}
    </div>
  </div>
);

const SKILL_LABELS: Record<string, string> = {
  "Programming Languages": "Languages",
  "Frontend Frameworks & Libraries": "Frontend",
  "Styling & UI": "Styling/UI",
  "State Management": "State",
  "API Integration": "API",
  "Backend & Databases": "Backend",
  "Tooling & DevOps": "DevOps",
};

const SkillsSection: React.FC = () => (
  <dl className="space-y-1 text-sm text-slate-800">
    {SKILLS.map((skill) => (
      <div key={skill.name} className="flex flex-row flex-wrap">
        <dt className="min-w-[80px] font-semibold">
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
    <div
      className={clsx(
        "min-h-screen bg-slate-100 p-6 antialiased",
        "font-sans-inter"
      )}
    >
      <div
        className={clsx(
          "mx-auto max-w-3xl bg-white px-6 pt-6 shadow-xl print:shadow-none"
        )}
      >
        <ResumeHeader />

        <main className="space-y-6">
          <Section title="Professional Summary">
            <p className="text-sm leading-relaxed text-slate-700">
              {INFO.summary}
            </p>
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
