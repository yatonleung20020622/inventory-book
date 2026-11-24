import type { CvProfileRecord } from "@/lib/actions/cv";

function telHref(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

function whatsappHref(whatsapp: string) {
  const digits = whatsapp.replace(/\D/g, "");
  return digits ? `https://wa.me/${digits}` : "";
}

function mailtoHref(email: string) {
  return email ? `mailto:${email}` : "";
}

export function CvView({ profile }: { profile: CvProfileRecord }) {
  const wa = whatsappHref(profile.whatsapp);
  const mail = mailtoHref(profile.email);
  const ctaHref = mail || profile.websiteUrl || "#";

  return (
    <div
      style={{
        maxWidth: 860,
        margin: "0 auto",
        padding: "clamp(48px, 8vw, 96px) clamp(20px, 5vw, 40px) 64px",
      }}
    >
      <header className="cv-rise" style={{ marginBottom: "clamp(40px, 8vw, 72px)" }}>
        <p
          style={{
            margin: "0 0 12px",
            color: "var(--cv-muted)",
            fontSize: 13,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
          }}
        >
          Curriculum Vitae
        </p>
        <h1
          className="cv-display"
          style={{
            margin: 0,
            fontSize: "clamp(2.6rem, 8vw, 4.6rem)",
            color: "var(--cv-fg)",
          }}
        >
          {profile.displayName}
        </h1>
        {profile.headline ? (
          <p
            className="cv-rise-delay-1"
            style={{
              margin: "14px 0 0",
              fontSize: "clamp(1.1rem, 2.4vw, 1.4rem)",
              color: "var(--cv-muted)",
            }}
          >
            {profile.headline}
          </p>
        ) : null}

        <div className="cv-contact-row cv-rise-delay-2" style={{ marginTop: 22 }}>
          {profile.phone ? (
            <a href={telHref(profile.phone)}>{profile.phone}</a>
          ) : null}
          {wa ? <a href={wa}>WhatsApp</a> : null}
          {profile.email ? <a href={mail}>{profile.email}</a> : null}
          {profile.websiteUrl ? (
            <a href={profile.websiteUrl} target="_blank" rel="noreferrer">
              {profile.websiteLabel || profile.websiteUrl} ↗
            </a>
          ) : null}
        </div>
      </header>

      {profile.summary ? (
        <section className="cv-rise" style={{ marginBottom: 48 }}>
          <h2 className="cv-section-title">Professional Summary</h2>
          <p
            style={{
              margin: 0,
              fontSize: "1.05rem",
              lineHeight: 1.7,
              color: "var(--cv-muted)",
              maxWidth: "68ch",
            }}
          >
            {profile.summary}
          </p>
        </section>
      ) : null}

      {profile.experiences.length > 0 ? (
        <section style={{ marginBottom: 48 }}>
          <h2 className="cv-section-title">Working Experience</h2>
          <div style={{ display: "grid", gap: 28 }}>
            {profile.experiences.map((job) => (
              <article
                key={job.id}
                style={{
                  paddingBottom: 24,
                  borderBottom: "1px solid var(--cv-rule)",
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    fontSize: "1.2rem",
                    fontWeight: 650,
                  }}
                >
                  {job.role}
                </h3>
                <p style={{ margin: "6px 0 0", color: "var(--cv-accent)" }}>
                  {job.companyUrl ? (
                    <a
                      href={job.companyUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: "inherit", textDecoration: "none" }}
                    >
                      {job.company} ↗
                    </a>
                  ) : (
                    job.company
                  )}
                </p>
                {job.summary ? (
                  <p
                    style={{
                      margin: "12px 0 0",
                      color: "var(--cv-muted)",
                      lineHeight: 1.65,
                    }}
                  >
                    {job.summary}
                  </p>
                ) : null}
                {job.bullets.length > 0 ? (
                  <ul
                    style={{
                      margin: "14px 0 0",
                      padding: 0,
                      listStyle: "none",
                      display: "grid",
                      gap: 8,
                    }}
                  >
                    {job.bullets.map((bullet) => (
                      <li
                        key={bullet}
                        style={{ color: "var(--cv-muted)", lineHeight: 1.55 }}
                      >
                        <span style={{ color: "var(--cv-accent)" }}>▸ </span>
                        {bullet}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {profile.educations.length > 0 ? (
        <section style={{ marginBottom: 48 }}>
          <h2 className="cv-section-title">Education</h2>
          <div style={{ display: "grid", gap: 22 }}>
            {profile.educations.map((edu) => (
              <article key={edu.id}>
                <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 650 }}>
                  {edu.degree}
                </h3>
                <p style={{ margin: "6px 0 0", color: "var(--cv-accent)" }}>
                  {edu.school}
                </p>
                {edu.detail ? (
                  <p
                    style={{
                      margin: "8px 0 0",
                      color: "var(--cv-muted)",
                      lineHeight: 1.6,
                    }}
                  >
                    {edu.detail}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {profile.skillGroups.length > 0 ? (
        <section style={{ marginBottom: 56 }}>
          <h2 className="cv-section-title">Skills</h2>
          <div style={{ display: "grid", gap: 22 }}>
            {profile.skillGroups.map((group) => (
              <div key={group.id}>
                <h3
                  style={{
                    margin: "0 0 10px",
                    fontSize: "1.05rem",
                    fontWeight: 650,
                  }}
                >
                  {group.title}
                </h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {group.items.map((item) => (
                    <span key={item} className="cv-skill-chip">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {(profile.ctaTitle || profile.ctaBody || profile.ctaButtonLabel) && (
        <section
          style={{
            marginBottom: 40,
            padding: "28px 24px",
            borderRadius: 18,
            background: "var(--cv-panel)",
            border: "1px solid var(--cv-rule)",
            backdropFilter: "blur(10px)",
          }}
        >
          {profile.ctaTitle ? (
            <h2 className="cv-section-title" style={{ marginBottom: 8 }}>
              {profile.ctaTitle}
            </h2>
          ) : null}
          {profile.ctaBody ? (
            <p style={{ margin: 0, color: "var(--cv-muted)", lineHeight: 1.6 }}>
              {profile.ctaBody}
            </p>
          ) : null}
          {profile.ctaButtonLabel ? (
            <a className="cv-cta" href={ctaHref}>
              {profile.ctaButtonLabel} →
            </a>
          ) : null}
        </section>
      )}

      {profile.footerText ? (
        <footer
          style={{
            paddingTop: 20,
            borderTop: "1px solid var(--cv-rule)",
            color: "var(--cv-muted)",
            fontSize: 13,
          }}
        >
          {profile.footerText}
        </footer>
      ) : null}
    </div>
  );
}

export function CvUnavailable() {
  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        padding: 24,
        textAlign: "center",
      }}
    >
      <div>
        <h1 className="cv-display" style={{ margin: 0, fontSize: "2rem" }}>
          CV unavailable
        </h1>
        <p style={{ color: "var(--cv-muted)", marginTop: 12 }}>
          This page is not published yet.
        </p>
      </div>
    </div>
  );
}
