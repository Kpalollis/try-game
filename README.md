# Arknights Tactics Fan Game

A browser-based Arknights-inspired tactics game. It runs as a static site and supports single-player battles plus casual real-time 1v1 rooms.

## Run locally

Open `arknights-tactics.html` in a browser, or serve this folder with any static web server. Single-player works without any online service configuration.

## Enable online 1v1

Multiplayer uses Supabase Realtime broadcast and presence. No database tables or server-side code are needed.

1. Create a Supabase project.
2. In the Supabase dashboard, make sure Realtime is enabled for the project.
3. Copy the project URL and the project's **publishable/anon key**. Never use a `service_role` or secret key in this browser app.
4. Put those values in `supabase-config.js`:

   ```js
   window.SUPABASE_CONFIG = {
     url: "https://your-project.supabase.co",
     anonKey: "your-public-anon-key"
   };
   ```

5. Publish the repository as a static site, for example with GitHub Pages. Both players need to open the same deployed game URL.
6. One player selects **Create Room**, then **Copy Invite** and shares the link. The other player opens that link (or enters the room code and selects **Join Room**). Both deploy operators and select **Ready for Battle** to begin each round.

Room codes are temporary and multiplayer is intended for casual play with friends. The browser host determines battle results; this is not authenticated or cheat-resistant matchmaking, so do not treat it as competitive or secure.

## GitHub Pages

In the repository settings, open **Pages**, choose the branch and root folder to publish, and save. The game is a static HTML/JavaScript site, so no build step is required.
link:https://kpalollis.github.io/try-game/arknights-tactics.html
