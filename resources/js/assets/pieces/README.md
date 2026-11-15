# Piece artwork

Original placeholder art for the armies, one folder per army (named like the
server's `Army` enum, e.g. `clockwork/`, `wildwood/`, `ember/`). Replace any
file to restyle a piece; no code changes are needed. Any army can play either
colour: the board marks the side with a soft glow at the piece's feet.

File names are the chess.js piece types: `k` king, `q` queen, `r` rook,
`b` bishop, `n` knight, `p` pawn. Each army's piece names are listed in
`resources/js/lib/armies.ts`.

Guidelines: square `viewBox="0 0 100 100"`, the character's feet near the
bottom with no pedestal (the board draws the side glow under it), and a dark
outline so it reads on both light and dark squares. SVG is preferred; PNG works too if you update the glob in
`resources/js/lib/armies.ts`.
