import { getFormattedDuration, getYearsOfExperience } from "@/utils/date";
import clsx from "clsx";
import {
  Github,
  Linkedin,
  Globe,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
  Award,
  Calendar,
  Users,
} from "lucide-react";
import type React from "react";

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

interface Link {
  title: string;
  content: string;
  url: string;
  Icon: React.ElementType;
}

interface Contact {
  title: string;
  content: string;
  url?: string | null;
  Icon: React.ElementType;
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
  title: "Senior Front-End Engineer",
  summary: `Accomplished Senior Front-End Engineer with ${getYearsOfExperience("2019-01-01")}+ years of expertise in architecting, developing, and deploying scalable web applications using modern JavaScript frameworks. Acknowledged expert in React and Vue, with a proven ability to lead technical initiatives, enhance user experience, and drive business objectives. Passionate about clean code, performance optimization, and collaborative problem-solving.`,
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

const LINKS: Link[] = [
  {
    title: "Portfolio",
    content: "tkhquang.dev",
    url: "https://tkhquang.dev/",
    Icon: Globe,
  },
  {
    title: "LinkedIn",
    content: "linkedin.com/in/tkhquang",
    url: "https://www.linkedin.com/in/quang-trinh-khac-66476517b/",
    Icon: Linkedin,
  },
  {
    title: "GitHub",
    content: "github.com/tkhquang",
    url: "https://github.com/tkhquang",
    Icon: Github,
  },
];

const CONTACTS: Contact[] = [
  {
    title: "Phone",
    content: "+84 8585 33839",
    url: "tel:+84858533839",
    Icon: Phone,
  },
  {
    title: "Email",
    content: "khacquang.trinh@gmail.com",
    url: "mailto:khacquang.trinh@gmail.com",
    Icon: Mail,
  },
  {
    title: "Location",
    content: "District 1, HCMC, Vietnam",
    url: null,
    Icon: MapPin,
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
    title: "Senior Front-End Engineer",
    company: "Care",
    url: "https://www.wearecare.sg/",
    duration: getFormattedDuration({ startDate: "2023-08-07" }),
    projects: [
      {
        name: "Health Screening Report Generation System",
        summary:
          "Architected and single-handedly developed a mission-critical service for generating dynamic PDF health reports from complex lab data. This system streamlined clinical workflows and established a foundation for future data products.",
        teamSize: 4,
        url: null,
        tasks: [
          "Engineered a scalable microservice using Next.js API routes, integrating Puppeteer for precise server-side PDF rendering and Recharts for data visualization.",
          "Defined and implemented the complete project architecture, coding standards, and CI/CD pipeline, ensuring a maintainable and high-quality codebase.",
          "Orchestrated a seamless integration with front-end teams, accelerating feature delivery and enabling new platform capabilities.",
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
          "Spearheaded front-end development for a partner-facing wellness platform, delivering advanced customization and mobile-integrated features that measurably improved partner engagement.",
        teamSize: 10,
        url: null,
        tasks: [
          "Developed highly responsive and accessible user interfaces using React and TypeScript, meeting ambitious deadlines while fulfilling all business requirements.",
          "Engineered a flawless webview integration for the core Flutter application, ensuring a consistent and fluid user experience across both Android and iOS.",
          "Architected and executed a monorepo strategy for four front-end repositories, significantly reducing code duplication and standardizing component usage.",
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
    url: "https://eats.deliany.co/",
    duration: getFormattedDuration({
      startDate: "2020-10-21",
      endDate: "2023-07-28",
    }),
    projects: [
      {
        name: "SaaS Food Ordering Platform",
        summary:
          "Progressed from a Front-End to a pivotal Full-Stack role, where I led the architecture of a new POS system and established a company-wide UI library, driving major improvements in developer productivity and product cohesion.",
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
    title: "Front-End Engineer (Freelance)",
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
          "Developed a complete front-end solution for a shipping logistics platform with real-time package tracking, focusing on high performance and component reusability.",
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
          "Performed comprehensive testing and debugging of both front-end and back-end coding challenges, ensuring functional accuracy and educational value.",
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
        stacks: ["React", "Redux", "WebRTC", "Webpack"],
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
          "Built the entire administrative front-end using React and Tailwind CSS, focusing on a clean and intuitive user experience.",
        ],
        stacks: ["Golang", "PostgreSQL", "RESTful API", "React", "TailwindCSS"],
      },
    ],
  },
];

//================================================================================
// COMPONENTS
//================================================================================
const Section: React.FC<{
  title: string;
  children: React.ReactNode;
  className?: string;
}> = ({ title, children, className = "" }) => (
  <section className={`mb-6 ${className}`}>
    <h2 className="mb-3 border-b border-slate-300 pb-1 text-sm font-bold uppercase tracking-wide text-slate-800">
      {title}
    </h2>
    {children}
  </section>
);

const ResumeHeader: React.FC = () => (
  <header className="mb-6 border-b border-slate-200 pb-4">
    <div className="text-center">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">
        {INFO.firstName} {INFO.lastName}
      </h1>
      <h2 className="mt-1 text-lg font-semibold text-blue-600">{INFO.title}</h2>
    </div>

    <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-slate-600">
      <div className="space-y-1">
        {CONTACTS.map(({ title, content, url, Icon }) => (
          <div key={title} className="flex items-center">
            <Icon className="mr-2 size-3.5 shrink-0 text-slate-500" />
            {url ? (
              <a
                href={url}
                className="transition-colors hover:text-blue-600 hover:underline"
              >
                {content}
              </a>
            ) : (
              <span>{content}</span>
            )}
          </div>
        ))}
      </div>
      <div className="space-y-1">
        {LINKS.map(({ title, content, url, Icon }) => (
          <div key={title} className="flex items-center">
            <Icon className="mr-2 size-3.5 shrink-0 text-slate-500" />
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center transition-colors hover:text-blue-600 hover:underline"
            >
              {content}
              <ExternalLink className="ml-1 size-3" />
            </a>
          </div>
        ))}
      </div>
    </div>
  </header>
);

const ExperienceItem: React.FC<{ experience: WorkExperience }> = ({
  experience,
}) => (
  <div className="mb-5 last:mb-0">
    <div className="mb-2 flex items-start justify-between gap-4">
      <div>
        <h3 className="text-base font-bold text-slate-900">
          {experience.title}
        </h3>
        <div className="flex items-center gap-2">
          {experience.url ? (
            <a
              href={experience.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-sm font-semibold text-blue-600 transition-colors hover:underline"
            >
              {experience.company}
              <ExternalLink className="ml-1 size-3" />
            </a>
          ) : (
            <span className="text-sm font-semibold text-blue-600">
              {experience.company}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center whitespace-nowrap font-mono text-xs text-slate-500">
        <Calendar className="mr-1 size-3" />
        {experience.duration}
      </div>
    </div>

    <div className="space-y-4">
      {experience.projects.map((project, index) => (
        <ProjectItem key={index} project={project} />
      ))}
    </div>
  </div>
);

const ProjectItem: React.FC<{ project: Project }> = ({ project }) => (
  <div className="ml-4 border-l-2 border-slate-200 pl-4">
    <div className="mb-1 flex items-start justify-between gap-2">
      <h4 className="text-sm font-semibold text-slate-800">{project.name}</h4>
      <div className="flex items-center whitespace-nowrap text-xs text-slate-500">
        <Users className="mr-1 size-3" />
        Team of {project.teamSize}
      </div>
    </div>

    <p className="mb-2 text-sm leading-relaxed text-slate-700">
      {project.summary}
    </p>

    <ul className="mb-3 list-inside list-disc space-y-1 text-sm text-slate-700">
      {project.tasks.map((task, taskIndex) => (
        <li key={taskIndex} className="list-item">
          <span className="leading-relaxed">{task}</span>
        </li>
      ))}
    </ul>

    <div className="flex flex-wrap gap-1.5">
      {project.stacks.map((stack) => (
        <span
          key={stack}
          className="rounded border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700"
        >
          {stack}
        </span>
      ))}
    </div>
  </div>
);

const SkillsSection: React.FC = () => (
  <div className="space-y-3">
    {SKILLS.map((skill) => (
      <div key={skill.name} className="grid grid-cols-5 items-start gap-3">
        <div className="col-span-2 text-sm font-semibold text-slate-800">
          {skill.name}
        </div>
        <div className="col-span-3 text-sm text-slate-700">
          {skill.subskills.join(", ")}
        </div>
      </div>
    ))}
  </div>
);

const CertificationsSection: React.FC = () => (
  <div className="space-y-3">
    {CERTIFICATIONS.map((group) => (
      <div key={group.organization} className="">
        <h3 className="mb-1 flex items-center text-sm font-semibold text-slate-800">
          <Award className="mr-1 size-4 text-blue-600" />
          {group.organization}
        </h3>
        <ul className="ml-5 space-y-1">
          {group.certificates.map((cert) => (
            <li key={cert.name} className="text-sm text-slate-700">
              {cert.url ? (
                <a
                  href={cert.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center transition-colors hover:text-blue-600 hover:underline"
                >
                  {cert.name}
                  <ExternalLink className="ml-1 size-3" />
                </a>
              ) : (
                <span>{cert.name}</span>
              )}
              {cert.issueDate && (
                <span className="ml-2 text-xs text-slate-500">
                  ({cert.issueDate} - {cert.expirationDate})
                </span>
              )}
            </li>
          ))}
        </ul>
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
          "mx-auto bg-white shadow-xl print:shadow-none",
          "px-6 py-10"
        )}
      >
        <ResumeHeader />

        <main className="space-y-5">
          <Section title="Professional Summary">
            <p className="text-sm leading-relaxed text-slate-700">
              {INFO.summary}
            </p>
          </Section>

          <Section title="Technical Skills">
            <SkillsSection />
          </Section>

          <Section title="Professional Experience" className="">
            {WORK_EXPERIENCE.map((exp, index) => (
              <ExperienceItem key={index} experience={exp} />
            ))}
          </Section>

          <Section title="Certifications & Professional Development">
            <CertificationsSection />
          </Section>
        </main>
      </div>
    </div>
  );
}
