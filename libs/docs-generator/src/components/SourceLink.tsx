import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { type ReactNode } from 'react';

/**
 * Anchor that points to a path inside the repo on GitHub. The base URL
 * lives in `customFields.repoUrl` in `docusaurus.config.ts` — change there
 * to repoint every demo / source link in the docs.
 */
export const SourceLink = ({
  path,
  children,
}: {
  path: string;
  children?: ReactNode;
}) => {
  const { siteConfig } = useDocusaurusContext();
  const base = (siteConfig.customFields as { repoUrl: string } | undefined)
    ?.repoUrl;
  const href = base ? `${base}/tree/main/${path}` : `#${path}`;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children ?? `Source: ${path}`}
    </a>
  );
};

export default SourceLink;
