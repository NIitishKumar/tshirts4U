import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth-session";
import ProfileAddressesClient from "./ProfileAddressesClient";

export const metadata = {
  title: "Profile — tshirts4U",
  robots: { index: false, follow: false },
};

export default async function ProfilePage() {
  const session = await getAuthSession();
  if (!session) redirect("/login");

  return (
    <div className="mx-auto max-w-4xl px-6 pt-28 pb-24 lg:px-8">
      <h1 className="font-display text-4xl uppercase tracking-tighter text-foreground">
        Profile
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Manage your saved addresses for faster checkout.
      </p>
      <div className="mt-8">
        <ProfileAddressesClient userId={session.userId} />
      </div>
    </div>
  );
}

