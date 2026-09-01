import type { CvExperienceBasic } from "@/lib/cv/split-summary";

export function CvExperienceList({ jobs }: { jobs: CvExperienceBasic[] }) {
  if (jobs.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="cv-experience-basics">
      <h3
        id="cv-experience-basics"
        className="text-xs font-medium tracking-wide text-muted-foreground uppercase"
      >
        Experience
      </h3>
      <div className="mt-1">
        {jobs.map((job, index) => (
          <article
            key={`${job.org}-${index}`}
            className="border-b border-border/80 py-4 last:border-b-0"
          >
            <p className="font-semibold tracking-tight">{job.org}</p>
            {job.metaHtml ? (
              <p
                className="mt-1 text-sm text-muted-foreground"
                dangerouslySetInnerHTML={{ __html: job.metaHtml }}
              />
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
