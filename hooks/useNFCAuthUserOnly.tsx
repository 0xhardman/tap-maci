import { useEffect } from "react";
import { redirect } from "next/navigation";
import { useNFCAuthContext } from "~~/contexts/AuthNFCContext";

export function useNFCAuthUserOnly({ inverted }: { inverted?: boolean }) {
  const { isRegistered } = useNFCAuthContext();

  useEffect(() => {
    if (inverted && isRegistered) {
      redirect("/polls");
    }

    if (!inverted && !isRegistered) {
      redirect("/");
    }
  }, [isRegistered, inverted]);

  return;
}
