# Piece artwork

Original placeholder art for the armies, one folder per army (named like the
server's `Army` enum). Replace any file to restyle a piece; no code changes are
needed. Any army can play either colour: the board marks the side with a rim.

- `clockwork/` — Clockwork Legion: brass, gears, rivets, steam.
- `wildwood/` — Wildwood Court: bark, leaves, antlers, moss.

File names are the chess.js piece types:

| File | Piece  | Clockwork Legion | Wildwood Court  |
| ---- | ------ | ---------------- | --------------- |
| `k`  | King   | The Regulator    | The Elder Stag  |
| `q`  | Queen  | Arc Duchess      | The Thornmother |
| `r`  | Rook   | Bulwark Engine   | Old Bark        |
| `b`  | Bishop | Gearwright       | Moss Oracle     |
| `n`  | Knight | Cog Charger      | Briar Wolf      |
| `p`  | Pawn   | Tick Soldier     | Sproutling      |

Guidelines: square `viewBox="0 0 100 100"`, the piece standing on a pedestal near
the bottom, and a dark outline so it reads on both light and dark squares.
SVG is preferred; PNG works too if you update the glob in `resources/js/lib/armies.ts`.
