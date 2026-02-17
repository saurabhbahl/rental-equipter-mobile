# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Sanity (Equipter-Sanity) content

This app reads content from the same Sanity project as **Equipter-Sanity** (studio and frontend). Set these in `.env` (see `.env.example`):

| Variable | Description |
|----------|-------------|
| `EXPO_PUBLIC_SANITY_PROJECT_ID` | Sanity project ID (same as Equipter-Sanity studio) |
| `EXPO_PUBLIC_SANITY_DATASET` | Dataset name, e.g. `production` or `development` |
| `EXPO_PUBLIC_SANITY_API_VERSION` | Optional; defaults to `2025-09-25` |
| `EXPO_PUBLIC_SANITY_API_READ_TOKEN` | Optional; use if you get **403** (see below) |

**Fixing 403 Forbidden from Sanity**

If the app gets `403` when loading the rental page (e.g. step 2 equipment list empty), do one of the following:

1. **Use a read token (recommended for mobile)**  
   - [sanity.io/manage](https://sanity.io/manage) → your project → **API** → **Tokens** → **Add API token**  
   - Name it (e.g. "Mobile read"), role **Viewer**, then create.  
   - In `.env`:  
     `EXPO_PUBLIC_SANITY_API_READ_TOKEN=sk...`  
   - Restart Expo. Authenticated requests are allowed even when CORS would block anonymous ones.

2. **Allow CORS origin (required for Expo dev)**  
   - Same project → **API** → **CORS origins** → **Add origin**.  
   - Origin: **`http://localhost:8081`** (Expo dev server).  
   - Check **Allow credentials** if you use a token.  
   - Save. Then reload the app so requests from `http://localhost:8081` are allowed.

**"Form not found" on submit**

The app sends the form reference from the Sanity rental page to `FORMS_SUBMIT_URL/api/forms/submit`. If you see "Form not found. Please contact support...", then:

1. In **Sanity Studio** (Equipter-Sanity): open **Rental Pages** → **Page & form** tab → set **Rental Form** to a **Form** document. Save and publish.
2. Create a **Form** document (e.g. "Rental Request Form") if you don’t have one, then link it as above and **publish the form** (the API only sees published forms).
3. Ensure the frontend (Heroku) uses the same dataset as the app (e.g. both `development` or both `production`).

**Network error when submitting from a phone or tablet**

In the browser, `http://localhost:3000` points to your computer. On a **physical device or emulator**, "localhost" is the device itself, so the request never reaches your dev server. Fix: in `.env` set `EXPO_PUBLIC_FORMS_SUBMIT_URL` to your **computer’s LAN IP** and port (e.g. `http://192.168.1.5:3000`). Find the IP from your machine (e.g. Mac: System Settings → Network, or run `ipconfig getifaddr en0`). Restart Expo after changing `.env`.

- **Client:** `lib/sanity.ts`  
- **Queries:** `lib/sanityQueries.ts` (e.g. `fetchRentalPage`, `RENTAL_PAGE_QUERY`)  
- **Hook:** `hooks/useRentalPage.ts` → `useRentalPage()` for rental form/success content  

Restart the Expo dev server after changing `.env`.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
