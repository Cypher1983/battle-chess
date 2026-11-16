# Battle Chess

A web-based chess game where every capture plays out as an animated battle.
Pick one of fifteen original armies, from the brass automatons of the
**Clockwork Legion** to the living forest of the **Wildwood Court**, and lead it
on either side of the board. Challenge friends by username or email, band
together in clans and climb the scoreboard.

## Tech stack

- **Backend:** Laravel 13 (PHP 8.3+), Fortify authentication
- **Frontend:** Vue 3 + Inertia + TypeScript, Tailwind CSS
- **Database:** MySQL
- **Testing:** Pest / PHPUnit, PHPStan, Pint
- **Real-time:** Laravel Reverb + Echo (optional; pages fall back to polling)
- **3D board and battles:** three.js (lazy-loaded), with a 2D fallback
- **2D battles:** PixiJS capture scenes (lazy-loaded)

## Requirements

- PHP 8.3 or newer with the `pdo_mysql` extension
- Composer 2
- Node.js 22+ and npm
- MySQL 8 (or MariaDB 10.6+)

## Local setup

```bash
git clone <repository-url> battle-chess
cd battle-chess

composer install
npm install

cp .env.example .env
php artisan key:generate
```

Create an empty database and set your credentials in `.env`:

```sql
CREATE DATABASE battle_chess CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

```dotenv
DB_DATABASE=battle_chess
DB_USERNAME=root
DB_PASSWORD=your-password
```

Then run the migrations:

```bash
php artisan migrate
```

## Running the app

```bash
composer run dev
```

This starts the Laravel server, queue worker, Reverb WebSocket server and Vite
dev server together. Live updates are broadcast through the queue, so the
queue worker must be running. Without Reverb keys in `.env` (generate them with
`php artisan reverb:install`) the game still works and polls for moves instead.
The queue worker sends challenge emails. With the default `MAIL_MAILER=log`
they are written to `storage/logs/laravel.log` instead of being delivered.
Open the URL it prints (or your Herd/XAMPP site URL), register an account and
log in with your email or username.

## Public pages

These pages are open to everyone, logged in or not. They share the public site
header and footer.

| Path          | Shows                                                                 |
| ------------- | --------------------------------------------------------------------- |
| `/`           | Landing page: features, a preview of every army and the top 5 players |
| `/armies`     | All fifteen armies with their pieces and tagline                      |
| `/rules`      | How each piece moves, special moves, how battles end, and Elo ratings |
| `/scoreboard` | Full ranking. Guests see usernames only; players also see real names  |

Logged-in players get the same Armies and Rules pages from the sidebar.

## 3D board

The game page shows a 3D board by default (scroll or pinch to
zoom, **Reset view** to return). The pieces are characters: tin soldiers, a
clockwork war-horse and a grandfather-clock king for the Clockwork Legion;
seedlings, a bramble wolf, a treant and a stag lord for the Wildwood Court.
They walk to their squares and, at High quality and above, breathe and look
around. Captures play out as 3D battles on the board itself: spear thrusts
and charges, lightning bolts and thorn vines, and leaping slams, with slow
motion, dust and sparks as the blow lands. The
**3D board** checkbox switches to the flat 2D board with its PixiJS battle
scenes. The choice is remembered per browser, and browsers without WebGL always
get the 2D board. Keyboard players can tab to the board and use the arrow keys
and Enter in either view.

The **Graphics** setting picks the 3D quality (remembered per browser):

- **Low:** no screen effects and no idle animation; chosen automatically on
  small touch devices and computers without a graphics card.
- **High** (the automatic choice otherwise): bloom on glowing eyes and magic,
  soft shadows, depth of field in battles, idle animation.
- **Ultra (4K):** adds ambient occlusion, sharper shadows and draws at up to
  3× pixel density for 4K screens.

The 3D code lives in `resources/js/lib/board3d`: `BoardView.ts` runs the board,
`pieces/` builds the characters, `post.ts` holds the screen effects, `idle.ts`
the idle animation, and `battle/` the battle timeline, attacks, spells,
gestures, effects and defeat animation.

## Armies

Each player picks an army for every game: the challenger when sending the
challenge (or asking for a rematch), the challenged player when accepting it.
The challenger's army is taken, so both sides always lead different armies.
The picker starts on the army saved under **Settings → Army**. Any army can
play either colour; a soft glow at each piece's feet, ivory for white and dark
for black, shows the side. Armies are saved with each game when it starts.

| Army                | Spell (bishops and queens) |
| ------------------- | -------------------------- |
| Clockwork Legion    | forked lightning           |
| Wildwood Court      | thorn vine                 |
| Ember Dynasty       | fireball                   |
| Frost Covenant      | ice shards                 |
| Sunken Fleet        | water spout                |
| Sky Armada          | wind gust                  |
| Sun Pharaohs        | sunbeam                    |
| Night Spirits       | spectral bolt              |
| Star Mechs          | laser                      |
| Void Swarm          | acid glob                  |
| Human Kingdom       | arrow volley               |
| Greek Polis         | thunderbolt                |
| Viking Clans        | thrown axe                 |
| Zombie Horde        | bile glob                  |
| Wasteland Survivors | firebomb                   |

To add an army: add a case to `App\Enums\Army`, an entry in
`resources/js/lib/armies.ts` (names, tagline, effect palette), a model builder
in `resources/js/lib/board3d/pieces/<id>.ts` and an entry in
`resources/js/lib/board3d/styles.ts` (magic colour, debris, spell), plus six
SVGs in `resources/js/assets/pieces/<id>/`.

## Board themes

The challenger also picks the board, and both players see it, in 3D and 2D:
Classic walnut, Marble, Tournament green, Lava, Ice, Ocean, Night, and Ebony &
gold. A rematch starts on the same board.

To add a board: add a case to `App\Enums\BoardTheme` and an entry in
`resources/js/lib/boardThemes.ts` (square, frame, trim and label colours,
grain and surface finish).

## Clans

Players can found a clan from the **Clan** page in the sidebar and lead it.
A clan has a unique name, a 2–4 character tag shown as `[TAG]`, an optional
description and an emblem. The emblem is drawn in code from a shape, an icon
and two colours (`resources/js/lib/emblems.ts`), so nothing is uploaded.

- A player belongs to at most one clan.
- Joining is by invitation only: the leader invites players by username. The
  player gets an email and a live toast, and accepts or declines on the Clan
  page. Invitations expire after 7 days.
- The leader edits the clan, removes members, hands over leadership and can
  disband the clan. Members can leave; the leader must hand over leadership
  or disband first.
- Signed-in players see a **Clans** tab on the scoreboard (`/scoreboard/clans`)
  ranking clans by the average rating of members who have finished a battle,
  and a clan badge next to names on the scoreboard, invites and game pages.
  Guests see neither.

To add an emblem shape or icon: add a case to `App\Enums\EmblemShape` or
`App\Enums\EmblemIcon` and its path to `resources/js/lib/emblems.ts`.

## Artwork

Piece art lives in `resources/js/assets/pieces/<army>/`, one SVG per piece
type. The included SVGs are original placeholders: replace any file to restyle
a piece without code changes. See the README in that folder.
The 3D characters are built from simple shapes in code
(`resources/js/lib/board3d/pieces`), so restyling those means editing the
model builders. Their movable parts (head, arms, legs) are named with `RIG`
in `parts.ts`, which battles and the idle animation rely on.

## Quality checks

```bash
php artisan test        # feature and unit tests (in-memory SQLite)
composer run test       # Pint + PHPStan + tests
npm run check           # frontend formatting and lint
npm run types:check     # TypeScript type check
```

### Browser tests

End-to-end tests in `tests/Browser` drive real Chromium through Pest's browser
plugin. They need the PHP `sockets` extension and a one-off browser download:

```bash
npx playwright install chromium
npm run build             # the tests use the built assets
composer run test:browser
```

They are kept out of the default `php artisan test` run because they are slower.
Tests that click squares switch the game page to the 2D board first
(`visitIn2d()`); `Board3DTest.php` covers the 3D board through its keyboard
controls.

## Roadmap

1. ✅ Foundation: authentication with usernames, navigation shell
2. ✅ Players and invites: challenge by username or email, accept, decline, cancel
3. ✅ Core game: board, legal moves, server-side move validation, resign and draws
4. ✅ Real-time play with Reverb: live moves, opponent online status, challenge toasts
5. ✅ Scoreboard with Elo ratings (start 1200, K=32), records and dashboard stats
6. ✅ Battle animations: PixiJS capture scenes and original army artwork
7. ✅ Polish: synthesized sound effects, 72-hour move deadline with timeout claims, rematches
8. ✅ 3D: three.js board with zoom and animated moves, 3D capture battles
9. ✅ Armies: fifteen original armies to choose from, each with its own characters, art and spell
10. ✅ Clans: invite-only teams with a custom emblem, clan rankings for signed-in players
