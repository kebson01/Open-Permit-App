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
3. *(Optional)* Create an `.env.local` to point the app at a different Supabase
   project (e.g. a staging project). See `.env.example`. When these are unset,
   the app falls back to the production project baked into `src/lib/supabase.js`.
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

## Testing

There is no automated test suite; verify changes by running the app against a
real backend. The Supabase URL/key are read from env vars (`VITE_SUPABASE_URL` /
`VITE_SUPABASE_ANON_KEY`) and fall back to the production project, so a plain
`npm run dev` already exercises the live database, Edge Functions, and AI.

1. **Functional check (fastest):** `npm run dev` and click through the page you
   changed. Hits the real backend, so it's a true end-to-end test.
2. **Production-parity check (before merging):** `npm run build && npm run preview`
   to catch issues that only appear in the minified production bundle.
3. **Mobile / camera / GPS:** features like AI Smart Check use the rear camera
   and geolocation, which need **HTTPS** and a real device. Either deploy a
   preview build, or tunnel your local dev server, e.g.:
   ```
   npx cloudflared tunnel --url http://localhost:5173
   ```
   then open the generated `https://…` URL on your phone.
4. **Backend debugging:** when an Edge Function misbehaves, check its logs in the
   Supabase dashboard (Edge Functions → Logs) — that's where AI/Anthropic errors
   surface.
5. **Avoid polluting prod data:** for features that *write* data, point
   `.env.local` at a Supabase branch or staging project rather than testing
   against production.

## Backend

- **Database & Auth:** Supabase. The app role is stored in the user's `user_metadata`.
- **Edge Functions** (`supabase/functions/`): `invoke-llm`, `ar-tools`, `agent-chat`,
  `project-ai-assistant`, `open-permit-ai`, `extract-permit-from-pdf`, and `invite-user`.
  The AI functions call the Anthropic API and require an `ANTHROPIC_API_KEY` secret set on
  the Supabase project. The `invite-user` function additionally uses the project's
  service-role key (injected automatically).

Deploy a function with the Supabase CLI:
```
supabase functions deploy <name>
```

### AI Smart Check photo zones (and optional SAM segmentation)

The AI Smart Check on the Permit Checklist page detects permit-relevant features
in an uploaded photo and highlights them. By default it uses a vision LLM
(`invoke-llm`) that returns labeled outline **polygons** — tight, but estimated.

For pixel-accurate "molded" highlights that hug each object, there is an optional
**SAM segmentation** prototype (`segment-zones` Edge Function → Replicate SAM 2):
the LLM finds/labels each feature, SAM carves the exact mask. It is **off by
default and not deployed**. To trial it:

1. Deploy the function: `supabase functions deploy segment-zones`
2. Set secrets on the project: `REPLICATE_API_TOKEN` and `REPLICATE_SAM_VERSION`
   (the version hash of a box-promptable SAM 2 image model).
3. Build the frontend with `VITE_USE_SAM=true`.

Note: the Replicate model input/output mapping in `segment-zones/index.ts` is
marked for verification against the live model on first run; failures degrade
gracefully back to the LLM polygons.
