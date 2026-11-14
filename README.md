# Battle Chess

A web-based chess game where every capture plays out as an animated battle.
Lead the brass automatons of the **Clockwork Legion** (white) against the living
forest of the **Wildwood Court** (black). Challenge friends by username or email
and climb the scoreboard.

## Tech stack

- **Backend:** Laravel 13 (PHP 8.3+), Fortify authentication
- **Frontend:** Vue 3 + Inertia + TypeScript, Tailwind CSS
- **Database:** MySQL
- **Testing:** Pest / PHPUnit, PHPStan, Pint
- **Planned:** Laravel Reverb (real-time moves), PixiJS (battle animations)

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

This starts the Laravel server, queue worker and Vite dev server together.
The queue worker sends challenge emails. With the default `MAIL_MAILER=log`
they are written to `storage/logs/laravel.log` instead of being delivered.
Open the URL it prints (or your Herd/XAMPP site URL), register an account and
log in with your email or username.

## Quality checks

```bash
php artisan test        # feature and unit tests (in-memory SQLite)
composer run test       # Pint + PHPStan + tests
npm run check           # frontend formatting and lint
npm run types:check     # TypeScript type check
```

## Roadmap

1. ✅ Foundation: authentication with usernames, navigation shell
2. ✅ Players and invites: challenge by username or email, accept, decline, cancel
3. ✅ Core game: board, legal moves, server-side move validation, resign and draws
4. Real-time play with Reverb
5. Scoreboard with Elo ratings
6. Battle animations for Clockwork Legion vs. Wildwood Court
7. Polish: sounds, clocks, rematches
