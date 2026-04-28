"use client";

interface SquadPotCardProps {
  potBalance: number;
  memberCount: number;
}

export function SquadPotCard({ potBalance, memberCount }: SquadPotCardProps) {
  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-muted-foreground">{memberCount} members</p>
      <div className="text-right">
        <p className="text-xs text-muted-foreground">Crew Pot</p>
        <p className="text-2xl font-bold text-accent">${potBalance}</p>
      </div>
    </div>
  );
}
