import { OceanFeed } from './OceanFeed';

export default async function OceanPage({
  params,
}: {
  params: Promise<{ laut: string }>;
}) {
  const { laut } = await params;
  return <OceanFeed ocean={decodeURIComponent(laut)} />;
}
