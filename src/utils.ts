const routes: Record<string, string> = {
  Home: "/home",
  CoinStore: "/coin-store",
  Apply: "/apply",
  HowItWorks: "/how-it-works",
  Profile: "/profile",
  AdminDashboard: "/admin",
  Leaderboard: "/leaderboard",
  JudgeApplication: "/judge-application",
  Messages: "/messages",
  ContestantProfile: "/contestant",
  Auth: "/auth",
  Audition: "/audition",
};

export function createPageUrl(name: string) {
  return routes[name] ?? "/";
}
