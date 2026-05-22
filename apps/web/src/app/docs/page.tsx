"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Database,
  Rocket,
  Key,
  FolderTree,
  Globe,
  CreditCard,
  Shield,
  Upload,
  Bot,
  Smartphone,
  ChevronRight,
} from "lucide-react";

const sections = [
  { id: "architecture", label: "Architecture", icon: FolderTree },
  { id: "env-setup", label: "Environment Setup", icon: Key },
  { id: "seed-data", label: "Seeding Data", icon: Database },
  { id: "deploy-prod", label: "Deploy to Production", icon: Rocket },
  { id: "auth", label: "Authentication", icon: Shield },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "i18n", label: "Internationalization", icon: Globe },
  { id: "uploads", label: "File Uploads (R2)", icon: Upload },
  { id: "ai-tutor", label: "AI English Tutor", icon: Bot },
  { id: "native", label: "Native Mobile App", icon: Smartphone },
];

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="bg-muted/50 border border-border rounded-lg p-4 overflow-x-auto text-sm font-mono">
      <code>{children}</code>
    </pre>
  );
}

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState("architecture");

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight mb-2">Documentation</h1>
        <p className="text-lg text-muted-foreground">
          Everything you need to set up, customize, and deploy your SaaS
          application.
        </p>
      </div>

      <div className="grid lg:grid-cols-[260px_1fr] gap-8">
        {/* Sidebar Navigation */}
        <nav className="hidden lg:block">
          <div className="sticky top-8 space-y-1">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => {
                  setActiveSection(section.id);
                  document
                    .getElementById(section.id)
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors text-left ${
                  activeSection === section.id
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <section.icon className="h-4 w-4 flex-shrink-0" />
                {section.label}
              </button>
            ))}
          </div>
        </nav>

        {/* Content */}
        <div className="space-y-12 min-w-0">
          {/* Architecture */}
          <section id="architecture">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FolderTree className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Architecture Overview</CardTitle>
                    <CardDescription>
                      Monorepo structure and how everything connects
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  This project is a Turborepo monorepo with pnpm workspaces.
                  It contains two applications and shared packages.
                </p>
                <CodeBlock>{`convex-starter/
├── apps/
│   ├── web/                # Next.js web application
│   │   ├── src/app/        # App Router pages
│   │   ├── src/components/ # React components (shadcn/ui)
│   │   └── src/lib/        # Utilities and auth client
│   └── native/             # Expo React Native app
│       ├── app/            # Expo Router screens
│       ├── components/     # Native components (HeroUI Native)
│       └── contexts/       # React contexts
├── packages/
│   ├── backend/            # Convex backend (shared)
│   │   └── convex/         # Convex functions, schema, HTTP
│   └── i18n/               # Shared translations
│       └── messages/       # Translation JSON files
├── turbo.json              # Turborepo config
└── pnpm-workspace.yaml     # Workspace config`}</CodeBlock>
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Key Technologies</h4>
                  <ul className="text-sm text-muted-foreground space-y-1.5 list-disc list-inside">
                    <li>
                      <strong className="text-foreground">Web:</strong> Next.js 16, React 19, shadcn/ui,
                      Tailwind CSS 4, TanStack Query
                    </li>
                    <li>
                      <strong className="text-foreground">Mobile:</strong> Expo 54, React Native, HeroUI
                      Native, NativeWind
                    </li>
                    <li>
                      <strong className="text-foreground">Backend:</strong> Convex (real-time DB), Better
                      Auth, Polar, RevenueCat
                    </li>
                    <li>
                      <strong className="text-foreground">AI:</strong> Convex Agent with Vercel AI Gateway
                    </li>
                    <li>
                      <strong className="text-foreground">Storage:</strong> Cloudflare R2 via Convex plugin
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Environment Setup */}
          <section id="env-setup">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Key className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Environment Setup</CardTitle>
                    <CardDescription>
                      Configure environment variables for all services
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <h4 className="font-semibold">1. Clone and Install</h4>
                  <CodeBlock>{`git clone <your-repo-url> convex-starter
cd convex-starter
pnpm install`}</CodeBlock>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold">
                    2. Convex Backend Environment Variables
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Set these on your Convex deployment using the CLI. These are
                    stored securely on Convex servers.
                  </p>
                  <CodeBlock>{`# Generate and set auth secret
npx convex env set BETTER_AUTH_SECRET=$(openssl rand -base64 32)

# Site URLs
npx convex env set SITE_URL http://localhost:3004
npx convex env set NATIVE_APP_URL quotes://

# Google OAuth (from Google Cloud Console)
npx convex env set GOOGLE_CLIENT_ID your_client_id
npx convex env set GOOGLE_CLIENT_SECRET your_client_secret

# Polar Payments (from polar.sh dashboard)
npx convex env set POLAR_ORGANIZATION_TOKEN your_token
npx convex env set POLAR_WEBHOOK_SECRET your_webhook_secret

# AI Gateway (from Vercel dashboard)
npx convex env set AI_GATEWAY_API_KEY your_api_key

# Cloudflare R2 Storage
npx convex env set R2_TOKEN your_token
npx convex env set R2_ACCESS_KEY_ID your_key
npx convex env set R2_SECRET_ACCESS_KEY your_secret
npx convex env set R2_ENDPOINT your_endpoint
npx convex env set R2_BUCKET your_bucket`}</CodeBlock>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold">
                    3. Web App (.env.local)
                  </h4>
                  <CodeBlock>{`# apps/web/.env.local
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
NEXT_PUBLIC_CONVEX_SITE_URL=https://your-deployment.convex.site`}</CodeBlock>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold">
                    4. Native App (.env.local)
                  </h4>
                  <CodeBlock>{`# apps/native/.env.local
EXPO_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
EXPO_PUBLIC_CONVEX_SITE_URL=https://your-deployment.convex.site
EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=your_key
EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY=your_key`}</CodeBlock>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold">5. Start Development</h4>
                  <CodeBlock>{`# Start everything (Convex + Web + Native)
pnpm run dev

# Or individually:
pnpm run dev --filter backend   # Convex backend
pnpm run dev --filter web       # Next.js web app
pnpm run dev --filter native    # Expo native app`}</CodeBlock>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Seeding Data */}
          <section id="seed-data">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Database className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Seeding Data</CardTitle>
                    <CardDescription>
                      Populate your database with initial or test data
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <h4 className="font-semibold">
                    Option 1: Convex Dashboard (Manual)
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    The simplest way to seed data is through the Convex
                    Dashboard. Navigate to your deployment at{" "}
                    <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
                      dashboard.convex.dev
                    </code>
                    , select a table, and click "Add Document" to manually
                    insert records.
                  </p>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="font-semibold">
                    Option 2: Seed Script (Recommended)
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Create a seed function in your Convex backend. Add the
                    following to{" "}
                    <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
                      packages/backend/convex/seed.ts
                    </code>
                    :
                  </p>
                  <CodeBlock>{`import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const seedTodos = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const todos = [
      { text: "Set up authentication", completed: true },
      { text: "Configure payments", completed: true },
      { text: "Deploy to production", completed: false },
      { text: "Add custom features", completed: false },
    ];

    for (const todo of todos) {
      await ctx.db.insert("todos", todo);
    }
    return null;
  },
});`}</CodeBlock>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Run it from the Convex dashboard or CLI:
                  </p>
                  <CodeBlock>{`# Run via CLI
npx convex run seed:seedTodos

# Or from the dashboard:
# Go to Functions > seed > seedTodos > Run`}</CodeBlock>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="font-semibold">
                    Option 3: One-off Query (Quick Testing)
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    For quick data inspection, use the Convex dashboard's
                    "Run a query" feature. This lets you execute arbitrary
                    read-only queries against your database without deploying
                    code.
                  </p>
                </div>

                <div className="rounded-lg bg-primary/5 border border-primary/10 p-4">
                  <p className="text-sm font-medium mb-1">Important</p>
                  <p className="text-sm text-muted-foreground">
                    Seed functions should be registered as{" "}
                    <code className="bg-muted px-1 py-0.5 rounded text-xs">
                      internalMutation
                    </code>{" "}
                    (not public) so they are not exposed to the public API.
                    Only call them from the CLI or dashboard.
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Deploy to Production */}
          <section id="deploy-prod">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Rocket className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Deploy to Production</CardTitle>
                    <CardDescription>
                      Step-by-step guide to deploying your entire stack
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <h4 className="font-semibold">
                    Step 1: Deploy Convex Backend to Production
                  </h4>
                  <CodeBlock>{`# Deploy to production (creates a production deployment)
npx convex deploy

# This will:
# 1. Push your schema and functions to production
# 2. Run any pending migrations
# 3. Give you production CONVEX_URL and CONVEX_SITE_URL`}</CodeBlock>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    After deploying, set all your environment variables on the
                    production deployment:
                  </p>
                  <CodeBlock>{`# Set production env vars (use --prod flag or deploy first)
npx convex env set BETTER_AUTH_SECRET your_production_secret --prod
npx convex env set SITE_URL https://your-domain.com --prod
npx convex env set GOOGLE_CLIENT_ID your_prod_client_id --prod
npx convex env set GOOGLE_CLIENT_SECRET your_prod_secret --prod
# ... set all other env vars for production`}</CodeBlock>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="font-semibold">
                    Step 2: Deploy Web App (Vercel)
                  </h4>
                  <CodeBlock>{`# Install Vercel CLI
npm i -g vercel

# Deploy from the web app directory
cd apps/web
vercel

# Set environment variables in Vercel dashboard:
# NEXT_PUBLIC_CONVEX_URL = your production convex URL
# NEXT_PUBLIC_CONVEX_SITE_URL = your production convex site URL`}</CodeBlock>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Configure your Vercel project with the root directory set
                    to{" "}
                    <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
                      apps/web
                    </code>{" "}
                    and the build command to{" "}
                    <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
                      cd ../.. && pnpm run build --filter web
                    </code>
                    .
                  </p>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="font-semibold">
                    Step 3: Deploy Native App (EAS)
                  </h4>
                  <CodeBlock>{`# Install EAS CLI
npm i -g eas-cli

# Configure EAS project
cd apps/native
eas build:configure

# Build for iOS
eas build --platform ios --profile production

# Build for Android
eas build --platform android --profile production

# Submit to App Store / Play Store
eas submit --platform ios
eas submit --platform android`}</CodeBlock>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="font-semibold">Step 4: Configure Webhooks</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    After deploying, update your webhook URLs in the respective
                    dashboards:
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1.5 list-disc list-inside">
                    <li>
                      <strong className="text-foreground">Polar:</strong> Set webhook URL to{" "}
                      <code className="bg-muted px-1 py-0.5 rounded text-xs">
                        https://your-convex.site/api/webhook/polar
                      </code>
                    </li>
                    <li>
                      <strong className="text-foreground">RevenueCat:</strong> Set webhook URL to{" "}
                      <code className="bg-muted px-1 py-0.5 rounded text-xs">
                        https://your-convex.site/revenuecat/webhooks
                      </code>
                    </li>
                    <li>
                      <strong className="text-foreground">Google OAuth:</strong> Add your production
                      domain to authorized redirect URIs
                    </li>
                  </ul>
                </div>

                <div className="rounded-lg bg-destructive/5 border border-destructive/10 p-4">
                  <p className="text-sm font-medium mb-1 text-destructive">
                    Production Checklist
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Generate a new BETTER_AUTH_SECRET for production</li>
                    <li>
                      Use production API keys for Google, Polar, RevenueCat
                    </li>
                    <li>Set POLAR_SERVER to "production" (not "sandbox")</li>
                    <li>Update SITE_URL to your production domain</li>
                    <li>
                      Verify webhook endpoints are accessible and responding
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Authentication */}
          <section id="auth">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Authentication</CardTitle>
                    <CardDescription>
                      Better Auth with Convex adapter
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Authentication is powered by Better Auth with the Convex
                  adapter. It supports email/password and Google OAuth out of
                  the box. The auth configuration is in{" "}
                  <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
                    packages/backend/convex/lib/betterAuth/createAuth.ts
                  </code>
                  .
                </p>

                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Supported Methods</h4>
                  <ul className="text-sm text-muted-foreground space-y-1.5 list-disc list-inside">
                    <li>Email/Password (no email verification required by default)</li>
                    <li>Google OAuth</li>
                    <li>Apple Sign-In (native app)</li>
                    <li>Anonymous auth (native app)</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Adding a New OAuth Provider</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Edit{" "}
                    <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
                      createAuth.ts
                    </code>{" "}
                    and add the provider to the{" "}
                    <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
                      socialProviders
                    </code>{" "}
                    section. Then set the required environment variables on your
                    Convex deployment and update the auth client in both web
                    and native apps.
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Auth Triggers</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    User lifecycle events (create, update, delete) trigger
                    callbacks defined in the backend. When a new user signs up,
                    a profile is automatically created with default credits.
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Payments */}
          <section id="payments">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Payments</CardTitle>
                    <CardDescription>
                      Polar for web, RevenueCat for mobile
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Web Payments (Polar)</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Polar handles web subscriptions and one-time purchases.
                    Products are configured in the Polar dashboard and
                    referenced by slug. Webhooks sync subscription status to
                    the Convex database.
                  </p>
                  <CodeBlock>{`# Set Polar env vars on Convex
npx convex env set POLAR_ORGANIZATION_TOKEN your_token
npx convex env set POLAR_WEBHOOK_SECRET your_secret`}</CodeBlock>
                </div>

                <Separator />

                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">
                    Mobile Payments (RevenueCat)
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    RevenueCat handles in-app purchases and subscriptions on
                    iOS and Android. Configure your products in the RevenueCat
                    dashboard and the App Store / Google Play Console. Webhooks
                    sync purchase events to the Convex database.
                  </p>
                </div>

                <Separator />

                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Unified Subscriptions</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Both payment platforms write to the same{" "}
                    <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
                      subscriptions
                    </code>{" "}
                    table with a{" "}
                    <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
                      platform
                    </code>{" "}
                    field ("polar" or "revenuecat"). Premium status is
                    determined by checking for any active subscription
                    regardless of platform.
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Internationalization */}
          <section id="i18n">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Globe className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Internationalization (i18n)</CardTitle>
                    <CardDescription>
                      Multi-language support with shared translations
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Translations are shared between web and native via the{" "}
                  <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
                    @convex-starter/i18n
                  </code>{" "}
                  package. Currently supports English, Spanish, and French.
                </p>

                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Web (next-intl)</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    The web app uses{" "}
                    <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
                      next-intl
                    </code>{" "}
                    without i18n routing. Locale is detected from the browser
                    or stored in a cookie. Use the{" "}
                    <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
                      useTranslations()
                    </code>{" "}
                    hook in any client component.
                  </p>
                  <CodeBlock>{`import { useTranslations } from "next-intl";

function MyComponent() {
  const t = useTranslations("common");
  return <button>{t("save")}</button>;
}`}</CodeBlock>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">
                    Native (expo-localization + i18n-js)
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    The native app uses{" "}
                    <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
                      expo-localization
                    </code>{" "}
                    for device locale detection and{" "}
                    <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
                      i18n-js
                    </code>{" "}
                    for translations. Use the{" "}
                    <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
                      useI18n()
                    </code>{" "}
                    hook.
                  </p>
                  <CodeBlock>{`import { useI18n } from "@/contexts/i18n-context";

function MyScreen() {
  const { t } = useI18n();
  return <Text>{t("common.save")}</Text>;
}`}</CodeBlock>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Adding a New Language</h4>
                  <CodeBlock>{`# 1. Create packages/i18n/messages/de.json (copy from en.json)
# 2. Add "de" to locales array in packages/i18n/index.ts
# 3. Add the import in packages/i18n/index.ts
# 4. Add the import in apps/native/lib/i18n.ts
# 5. Add export in packages/i18n/package.json exports`}</CodeBlock>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">RTL Support</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    RTL locales (Arabic, Hebrew, Farsi, Urdu) are handled
                    automatically. The web app sets{" "}
                    <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
                      dir="rtl"
                    </code>{" "}
                    on the HTML element. The native app uses{" "}
                    <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
                      I18nManager.forceRTL()
                    </code>
                    .
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* File Uploads */}
          <section id="uploads">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Upload className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>File Uploads (R2)</CardTitle>
                    <CardDescription>
                      Cloudflare R2 storage via Convex plugin
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  File uploads use the{" "}
                  <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
                    @convex-dev/r2
                  </code>{" "}
                  Convex component. Files are stored in Cloudflare R2 and
                  metadata is tracked in the Convex database.
                </p>
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Setup</h4>
                  <CodeBlock>{`# Set R2 credentials on Convex
npx convex env set R2_TOKEN your_cf_token
npx convex env set R2_ACCESS_KEY_ID your_key_id
npx convex env set R2_SECRET_ACCESS_KEY your_secret
npx convex env set R2_ENDPOINT https://xxx.r2.cloudflarestorage.com
npx convex env set R2_BUCKET your_bucket_name`}</CodeBlock>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Upload Flow</h4>
                  <ol className="text-sm text-muted-foreground space-y-1.5 list-decimal list-inside">
                    <li>Client requests a signed upload URL from Convex</li>
                    <li>Client uploads file directly to R2 using the signed URL</li>
                    <li>Client calls syncMetadata to record the upload in Convex</li>
                    <li>Files are accessible via signed read URLs</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* AI Tutor */}
          <section id="ai-tutor">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Bot className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>AI English Tutor</CardTitle>
                    <CardDescription>
                      Convex Agent with streaming responses
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  The English Tutor feature uses{" "}
                  <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
                    @convex-dev/agent
                  </code>{" "}
                  for AI-powered conversations with streaming. It connects to
                  AI providers via Vercel AI Gateway.
                </p>
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Setup</h4>
                  <CodeBlock>{`# Set AI Gateway key
npx convex env set AI_GATEWAY_API_KEY your_key`}</CodeBlock>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">How It Works</h4>
                  <ul className="text-sm text-muted-foreground space-y-1.5 list-disc list-inside">
                    <li>Each user gets conversation threads stored in Convex</li>
                    <li>Messages stream in real-time using Convex subscriptions</li>
                    <li>The agent has a system prompt for English tutoring</li>
                    <li>Thread history is maintained for context-aware responses</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Native App */}
          <section id="native">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Smartphone className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Native Mobile App</CardTitle>
                    <CardDescription>
                      Expo with React Native and shared backend
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Running Locally</h4>
                  <CodeBlock>{`cd apps/native

# Start Expo dev server
pnpm run dev

# Run on iOS simulator
pnpm run ios

# Run on Android emulator
pnpm run android

# Prebuild native code (after adding native modules)
pnpm run prebuild`}</CodeBlock>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Key Features</h4>
                  <ul className="text-sm text-muted-foreground space-y-1.5 list-disc list-inside">
                    <li>Expo Router for file-based navigation</li>
                    <li>HeroUI Native components with multiple themes</li>
                    <li>RevenueCat for in-app purchases</li>
                    <li>Push notifications via Expo</li>
                    <li>Shared Convex backend with real-time sync</li>
                    <li>Better Auth with Expo plugin (Google + Apple OAuth)</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">
                    Customizing the App
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Update{" "}
                    <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
                      app.json
                    </code>{" "}
                    with your app name, bundle identifiers, and icons. The
                    current scheme is{" "}
                    <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
                      quotes://
                    </code>{" "}
                    -- change this to match your app's URL scheme.
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
}
