"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CoinBadge } from "@/components/custom/CoinBadge";
import { StreakBadge } from "@/components/custom/StreakBadge";
import { useAuthStore } from "@/stores/useAuthStore";
import { Separator } from "@/components/ui/separator";

export default function ProfilePage() {
  const { user } = useAuthStore();

  if (!user) return null;

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Profile</h1>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
              {user.display_name.charAt(0).toUpperCase()}
            </div>
            <div>
              <CardTitle>{user.display_name}</CardTitle>
              {user.university && (
                <p className="text-sm text-muted-foreground">{user.university}</p>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Balance</p>
              <CoinBadge amount={user.balance} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Current Streak</p>
              <StreakBadge streak={user.current_streak} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Longest Streak</p>
              <p className="font-semibold">{user.longest_streak} days</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Member since</p>
              <p className="font-semibold text-sm">
                {user.created_at
                  ? new Date(user.created_at).toLocaleDateString()
                  : "N/A"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
