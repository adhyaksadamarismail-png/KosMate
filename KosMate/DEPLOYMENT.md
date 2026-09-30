# KosMate deployment setup

## Supabase

KosMate uses the Supabase browser client with Row Level Security. Only the project URL and a publishable key belong in the browser environment. Never add a `service_role` or `sb_secret_...` key to a `NEXT_PUBLIC_` variable.

1. Copy `.env.example` to `.env.local` for local development.
2. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` from the selected KosMate Supabase project.
3. Apply `supabase/migrations/20260930055153_kosmate_core.sql` to that project's database before enabling the application.
4. Add the same two variables to the Vercel project's Production, Preview, and Development environments, then redeploy.

Configure Supabase Auth's site URL and allowed redirect URLs for both localhost and the Vercel production/preview domains. Email confirmation may be enabled; in that case a new customer confirms their address before signing in. Google and Apple sign-in remain disabled until OAuth providers are configured.

The SQL migration seeds the public prototype catalog (10 services, mock kosts, mock merchants, and sample menus). Its coordinates are labeled and intended only for the prototype. Supabase Auth is used for account sessions; row ownership is enforced by RLS.

The application can still build without environment variables so local preview and CI builds do not fail during static generation. Without the variables, data access remains in prototype local mode and is not suitable for a persistent deployment. Configure both variables before presenting the deployment as connected to Supabase.

## Vercel build

The project uses Next.js App Router and can be imported into Vercel as a standard Next.js project. Keep the repository's `pnpm-lock.yaml` and install with pnpm, or use `npm install` if the deployment is configured to use npm. The production command is `npm run build` (or `pnpm build`). Leaflet is loaded only from client effects and the OpenStreetMap attribution remains visible.

## Location and maps

The map uses Leaflet and OpenStreetMap tiles. Device location is requested only after the customer selects the location action. Manual locations remain available if permission is declined. Route distance is still prototype data; no routing API or API key is required.
