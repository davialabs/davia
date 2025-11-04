export default async function RepoPage({
  params,
}: {
  params: Promise<{ repoId: string }>;
}) {
  const { repoId } = await params;
  console.log(repoId);

  return <div>RepoPage</div>;
}
