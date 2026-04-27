import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between p-6 max-w-6xl mx-auto">
        <span className="text-2xl font-bold">LockIn</span>
        <div className="flex gap-3">
          <Link href="/login">
            <button className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Sign in
            </button>
          </Link>
          <Link href="/register">
            <button className="px-5 py-2 text-sm font-medium rounded-xl bg-gray-900 text-white hover:bg-gray-800 transition-colors">
              Get Started
            </button>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-20 text-center">
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
          Stake your coins.
          <br />
          <span className="text-accent">Lock in your goals.</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
          LockIn is the social accountability app for university students. Put your money on the line,
          assign a friend to verify, and watch your productivity soar.
        </p>

        <div className="flex gap-4 justify-center mb-20">
          <Link href="/register">
            <button className="px-8 py-3 text-lg font-medium rounded-xl bg-gray-900 text-white hover:bg-gray-800 transition-colors">
              Start for Free
            </button>
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-6 text-left">
          <div className="rounded-2xl p-6 border border-border bg-card">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-lg mb-4">
              &#x1F4B0;
            </div>
            <h3 className="font-semibold text-lg mb-2">Stake Money</h3>
            <p className="text-muted-foreground text-sm">
              Put $1-$50 on the line when you create a task. Real stakes = real motivation.
            </p>
          </div>
          <div className="rounded-2xl p-6 border border-border bg-card">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-lg mb-4">
              &#x1F91D;
            </div>
            <h3 className="font-semibold text-lg mb-2">Get Verified</h3>
            <p className="text-muted-foreground text-sm">
              Assign a friend as your accountability partner. They verify your proof of completion.
            </p>
          </div>
          <div className="rounded-2xl p-6 border border-border bg-card">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-lg mb-4">
              &#x1F525;
            </div>
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
