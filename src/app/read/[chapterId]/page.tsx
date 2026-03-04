import ReadClient from "./ReadClient";

export default async function ReadPage({
  params,
}: {
  params: Promise<{ chapterId: string }>;
}) {
  const { chapterId } = await params;
  return <ReadClient chapterId={chapterId} />;
}