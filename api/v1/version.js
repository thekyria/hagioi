// Serves build/version info for the footer. Since the site is deployed
// continuously, the deployed git commit is the version. Values come from
// Vercel's system environment variables (exposed automatically to functions);
// they are optional, so missing values yield nulls rather than an error.
export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const commit = process.env.VERCEL_GIT_COMMIT_SHA || null;
  const environment = process.env.VERCEL_ENV || null;
  const provider = process.env.VERCEL_GIT_PROVIDER;
  const owner = process.env.VERCEL_GIT_REPO_OWNER;
  const slug = process.env.VERCEL_GIT_REPO_SLUG;

  const commitUrl = commit && provider === 'github' && owner && slug
    ? `https://github.com/${encodeURIComponent(owner)}/${encodeURIComponent(slug)}/commit/${encodeURIComponent(commit)}`
    : null;

  res.status(200).json({
    commit,
    shortCommit: commit ? commit.slice(0, 7) : null,
    commitUrl,
    environment,
  });
}
