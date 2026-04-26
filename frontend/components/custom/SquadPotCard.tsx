"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CoinBadge } from "./CoinBadge";

interface SquadPotCardProps {
  potBalance: number;
  memberCount: number;
}

export function SquadPotCard({ potBalance, memberCount }: SquadPotCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Squad Pot</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <CoinBadge amount={potBalance} size="lg" />
        <p className="text-sm text-muted-foreground">
          Shared by {memberCount} members
        </p>
      </CardContent>
    </Card>
  );
}
