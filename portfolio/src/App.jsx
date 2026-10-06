import "./App.css";
import buildaiThumb from "./assets/buildai-thumb.jpg";

// ---- EDIT ME: placeholder content ------------------------------------
// Everything marked PLACEHOLDER below is sample text — swap it for your
// own bio, links, and projects whenever you're ready. Nothing else in
// this file needs to change to update the content.
const PROFILE = {
  name: "James Nevin",
  title: "Full-Stack Developer",
  tagline:
    "I build web apps end to end — from the database up to the UI.", // PLACEHOLDER
  bio: `I came to software development after a varied career — financial
compliance work at Investec, freelance copywriting, and several years
coaching rowing and surfing — and found that coding suits the way I
think in a way nothing else has. I've worked through Code College ZA's
MERN stack, SQL, Java, and Spring curriculum, and BuildAI is where that
training turned into a real, deployed product: authentication, image
uploads, AI integration, and production hardening, built and shipped
end to end. I'm now looking for my first full-time developer role.`,
  email: "jnevin7@gmail.com",
  github: "https://github.com/jnevin7",
  linkedin: "https://www.linkedin.com/in/7a1/",
};

const PROJECTS = [
  {
    name: "BuildAI",
    description:
      "AI-assisted triage for property and building faults. A property owner photographs an issue and GPT-4o vision gives an instant severity read, while a human expert reviews before anything is acted on.",
    image: buildaiThumb,
    tags: ["React", "Node.js", "MongoDB", "OpenAI", "Cloudinary"],
    demoUrl: "https://build-ai-green.vercel.app",
    codeUrl: "https://github.com/jnevin7/currentPortfolio/tree/main/buildAI",
  },
  { placeholder: true },
  { placeholder: true },
];
// ------------------------------------------------------------------------

function ProjectCard({ project }) {
  if (project.placeholder) {
    return (
      <div className="project-card project-card--placeholder">
        <span>More projects coming soon</span>
      </div>
    );
  }

  return (
    <div className="project-card">
      <div className="project-card__image">
        <img src={project.image} alt={`${project.name} screenshot`} />
      </div>
      <div className="project-card__body">
        <h3>{project.name}</h3>
        <p>{project.description}</p>
        <ul className="project-card__tags">
          {project.tags.map((tag) => (
            <li key={tag}>{tag}</li>
          ))}
        </ul>
        <div className="project-card__links">
          <a href={project.demoUrl} target="_blank" rel="noreferrer">
            Live demo →
          </a>
          <a href={project.codeUrl} target="_blank" rel="noreferrer">
            Code →
          </a>
        </div>
      </div>
    </div>
  );
}

const CURRENT_YEAR = new Date().getFullYear();

export default function App() {
  return (
    <>
      <header className="nav">
        <a className="nav__brand" href="#top">
          {PROFILE.name}
        </a>
        <nav className="nav__links">
          <a href="#about">About</a>
          <a href="#projects">Projects</a>
          <a href="#contact">Contact</a>
        </nav>
      </header>

      <main id="top">
        <section className="hero">
          <p className="hero__eyebrow">{PROFILE.title}</p>
          <h1>{PROFILE.name}</h1>
          <p className="hero__tagline">{PROFILE.tagline}</p>
          <div className="hero__actions">
            <a className="button button--primary" href="#projects">
              View projects
            </a>
            <a className="button" href="#contact">
              Get in touch
            </a>
          </div>
        </section>

        <section id="about" className="about">
          <h2>About</h2>
          <p>{PROFILE.bio}</p>
        </section>

        <section id="projects" className="projects">
          <h2>Projects</h2>
          <div className="projects__grid">
            {PROJECTS.map((project, i) => (
              <ProjectCard key={project.name ?? `placeholder-${i}`} project={project} />
            ))}
          </div>
        </section>

        <section id="contact" className="contact">
          <h2>Get in touch</h2>
          <p>
            Always happy to chat about projects, opportunities, or just
            talk shop.
          </p>
          <div className="contact__links">
            <a href={`mailto:${PROFILE.email}`}>{PROFILE.email}</a>
            <a href={PROFILE.github} target="_blank" rel="noreferrer">
              GitHub
            </a>
            <a href={PROFILE.linkedin} target="_blank" rel="noreferrer">
              LinkedIn
            </a>
          </div>
        </section>
      </main>

      <footer className="footer">
        <p>
          © {CURRENT_YEAR} {PROFILE.name}. Built with React + Vite.
        </p>
      </footer>
    </>
  );
}
