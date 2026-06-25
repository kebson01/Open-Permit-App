# Open Permit

Building permits, simplified — apply, track, and submit permits across Broward County, Florida.

A standalone Vite + React application backed by Supabase (database, auth, and Edge Functions). AI features are powered by the Anthropic API through Supabase Edge Functions.

## Getting started

**Prerequisites:** Node.js 18+ and npm.

1. Clone the repository and navigate into it.
2. Install dependencies:
   ```
   npm install
   ```
3. Create an `.env.local` file with your Supabase project credentials:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```
4. Run the app:
   ```
   npm run dev
   ```

## Build

```
npm run build      # outputs to dist/
npm run preview    # serve the production build locally
```

## Backend

- **Database & Auth:** Supabase. The app role is stored in the user's `user_metadata`.
- **Edge Functions** (`supabase/functions/`): `invoke-llm`, `agent-chat`, `project-ai-assistant`,
  `open-permit-ai`, `extract-permit-from-pdf`, and `invite-user`. The AI functions call the
  Anthropic API and require an `ANTHROPIC_API_KEY` secret set on the Supabase project. The
  `invite-user` function additionally uses the project's service-role key (injected automatically).

Deploy a function with the Supabase CLI:
```
supabase functions deploy <name>
```
