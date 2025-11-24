This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Documentation

See the full project documentation index at `docs/README.md`.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploying to Vercel

1. Create a new project in [Vercel](https://vercel.com) and link it to your GitHub repository.
2. In the project settings, add the following environment variables (copy the keys from `env.example` and provide your real values):

   | Name                            | Value                     | Notes                                       |
   | ------------------------------- | ------------------------- | ------------------------------------------- |
   | `NEXT_PUBLIC_SUPABASE_URL`      | Supabase project URL      | safe to expose                              |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key         | safe to expose                              |
   | `SUPABASE_SERVICE_ROLE_KEY`     | Supabase service role key | **server-side only** – store as "Encrypted" |

   > **Important:** never commit real keys to the repository. The `env.example` file is provided only as a reference.

3. Trigger a deployment (either by pushing to the connected branch or using **Deploy** in the Vercel dashboard).
4. After the first deployment, review the environment variables in Vercel and add them to any Preview/Production environments as needed.

For more background, review the official [Next.js deployment guide](https://nextjs.org/docs/app/building-your-application/deploying).

## Troubleshooting

### CORS Errors

If you encounter CORS errors like:
```
Access to fetch at 'https://your-project.supabase.co/auth/v1/token' from origin 'http://localhost:3000' has been blocked by CORS policy
```

**Why this happens now:**
- Supabase's client-side SDK automatically refreshes authentication tokens when they expire
- This token refresh happens directly from the browser to Supabase's auth API
- Recent Supabase updates have tightened CORS security, requiring explicit origin allowlisting
- If tokens weren't expiring before, or if Supabase had more permissive defaults, it would have worked without configuration

**Solution:** Add your local development URL to Supabase's allowed origins:

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **Authentication** → **URL Configuration**
4. Under **Redirect URLs**, add:
   - `http://localhost:3000`
   - `http://localhost:3000/**` (wildcard for all routes)
5. Under **Site URL**, ensure it's set to `http://localhost:3000` (for local development)
6. Click **Save**

**Note:** 
- The app will still work via server-side token refresh (handled by middleware), but client-side refresh requires CORS configuration
- Changes may take a few moments to propagate. Refresh your browser after updating the configuration
- For production, add your production domain (e.g., `https://yourdomain.com`) to the allowed origins