import { apiHelper } from "./api-helper";

export interface LinkedWallet {
  publicKey: string;
  linkedAt: string;
}

export async function linkWallet(publicKey: string): Promise<LinkedWallet> {
  return apiHelper.post<LinkedWallet>("wallets/link", { publicKey });
}

export async function getLinkedWallet(): Promise<LinkedWallet | null> {
  try {
    return await apiHelper.get<LinkedWallet>("wallets/me");
  } catch {
    return null;
  }
}

export async function unlinkWallet(): Promise<void> {
  return apiHelper.delete("wallets/me");
}
