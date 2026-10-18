import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowUpRightIcon, GithubLogoIcon } from "@/components/shared/icons";
import type { Project } from "@/lib/projects";
import type { Dictionary } from "@/lib/i18n/id";

export function ProjectLinks({
  project,
  labels,
}: {
  project: Project;
  labels: Dictionary["projectsDetail"];
}) {
  const isPrivate = project.repoVisibility === "private";
  if (!isPrivate && !project.live && !project.github) return null;
  return (
    <div className="flex flex-wrap gap-2 pt-2">
      {!isPrivate && project.live && (
        <Button asChild size="sm" variant="default">
          <Link
            href={project.live as never}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ArrowUpRightIcon
              data-icon="inline-start"
              className="size-4"
              aria-hidden="true"
            />
            <span>{labels.live}</span>
          </Link>
        </Button>
      )}
      {!isPrivate && project.github && (
        <Button asChild size="sm" variant="outline">
          <Link
            href={project.github as never}
            target="_blank"
            rel="noopener noreferrer"
          >
            <GithubLogoIcon
              data-icon="inline-start"
              className="size-4"
              aria-hidden="true"
            />
            <span>GitHub</span>
          </Link>
        </Button>
      )}
      <Button asChild size="sm" variant="ghost">
        <Link href="/projects">{labels.backToProjects}</Link>
      </Button>
    </div>
  );
}
