import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ storeSlug: string }>;
}

export default async function StoreAdminRootPage({ params }: PageProps) {
  const { storeSlug } = await params;
  redirect(`/${storeSlug}/admin/dashboard`);
}
