import { useQuery } from "@tanstack/react-query";
import { getWeeklyEligibility } from "@/services/support.service";
import { WeeklyEligibilityResponse } from "@/types/support";

/**
 * Hook to fetch weekly eligibility status for a caretaker
 *
 * SYSTEM INVARIANT: Birds never multiply money.
 * One user = one wallet = capped baseline support.
 *
 * @param userId - The caretaker's user ID (person receiving support)
 * @returns Eligibility data including weekly cap, received amount, and remaining allowance
 */
export function useEligibility(userId: string | undefined) {
  const query = useQuery<WeeklyEligibilityResponse>({
    queryKey: ["eligibility", userId],
    queryFn: () => getWeeklyEligibility(userId!),
    enabled: !!userId,
    staleTime: 30 * 1000, // 30 seconds - eligibility can change quickly
    refetchOnWindowFocus: true,
  });

  const eligibility = query.data;

  return {
    // Query state
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,

    // Eligibility data from backend (authority on eligibility)
    weeklyCap: eligibility?.weeklyCap ?? 0,
    receivedThisWeek: eligibility?.receivedThisWeek ?? 0,
    remaining: eligibility?.remaining ?? 0,
    weekId: eligibility?.weekId,
    hasWallet: eligibility?.hasWallet ?? false,
    walletAddress: eligibility?.walletAddress,
    caretakerName: eligibility?.caretakerName,

    // Backend-computed states (backend is authority)
    /** Can receive baseline support (backend determines this) */
    canReceiveBaseline: eligibility?.canReceiveBaseline ?? false,
    /** Has reached weekly cap */
    hasReachedCap: !eligibility?.canReceiveBaseline,
    /** Progress percentage toward weekly cap */
    progressPercent: eligibility?.weeklyCap
      ? Math.min(100, (eligibility.receivedThisWeek / eligibility.weeklyCap) * 100)
      : 0,
  };
}
