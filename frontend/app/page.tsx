import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary/50 to-background">
      <header className="flex items-center justify-between p-6 max-w-6xl mx-auto">
        <span className="text-2xl font-bold text-primary">LockIn</span>
        <div className="flex gap-3">
          <Link href="/login">
            <Button variant="ghost">Sign in</Button>
          </Link>
          <Link href="/register">
            <Button>Get Started</Button>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-20 text-center">
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
          Stake your coins.
          <br />
          <span className="text-primary">Lock in your goals.</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
          LockIn is the social accountability app for university students. Put your LockCoins on the line,
          assign a friend to verify, and watch your productivity soar.
        </p>

        <div className="flex gap-4 justify-center mb-20">
          <Link href="/register">
            <Button size="lg" className="text-lg px-8">
              Start for Free
            </Button>
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-8 text-left">
          <div className="bg-card rounded-xl p-6 border">
            <div className="text-3xl mb-3">&#x26A1;</div>
            <h3 className="font-semibold text-lg mb-2">Stake Coins</h3>
            <p className="text-muted-foreground text-sm">
              Put 1-50 LockCoins on the line when you create a task. Real stakes = real motivation.
            </p>
          </div>
          <div className="bg-card rounded-xl p-6 border">
            <div className="text-3xl mb-3">&#x1F91D;</div>
            <h3 className="font-semibold text-lg mb-2">Get Verified</h3>
            <p className="text-muted-foreground text-sm">
              Assign a friend as your accountability partner. They verify your proof of completion.
            </p>
          </div>
          <div className="bg-card rounded-xl p-6 border">
            <div className="text-3xl mb-3">&#x1F525;</div>
            <h3 className="font-semibold text-lg mb-2">Build Streaks</h3>
            <p className="text-muted-foreground text-sm">
              Complete tasks consistently to build streaks and climb the leaderboard.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
