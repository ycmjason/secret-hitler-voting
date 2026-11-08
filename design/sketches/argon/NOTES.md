# Design Sketch Notes — `argon` ("Midnight Parliamentary Dossier")

## Direction (Idea Behind the Look)
Secret Hitler is played in warm, dim living rooms where glances across the table are weapons, so this direction treats each phone as a **1930s parliamentary night-dispatch clipboard** rather than a bright game app. Heavy lampblack and smoked-walnut surfaces keep screen glare off players' faces and glasses, while letterpress ivory ink, corner-registered paper ballot slips, security-envelope hatching, and rubber-stamped verdicts carry the tension of secret cabinet votes without borrowing a single motif, colour pair, or symbol from the physical board game. During voting, every screen element is strictly monochrome ivory, charcoal, and muted brass—making `JA!` and `NEIN` visually indistinguishable from the next seat—saving saturated pigment (`Verdigris` and `Censor Vermilion`) exclusively for the simultaneous public reveal when every phone erupts at once. A wry, deadpan civil-service voice keeps instructions brief, clear, and dryly conspiratorial.

## Palette
| Token | Hex | Role |
|---|---|---|
| `--bg-void` | `#0B0A09` | Sketchbook canvas behind the phone frames |
| `--bg-ink` | `#141210` | App background — warm lampblack, low luminance in dim rooms |
| `--bg-dossier` | `#1D1A16` | Elevated dossier cards, player roll, and bottom sheets |
| `--bg-slip` | `#26221C` | Identical `JA!` / `NEIN` ballot slips and tactile secondary controls |
| `--bg-slip-press` | `#312B23` | Active / pressed ballot state and security-envelope hatch base |
| `--line-subtle` | `#332E27` | Hairline ledger rules and player list dividers |
| `--line-rule` | `#4C4337` | Double-rule ballot frames and registration ticks |
| `--ink-ivory` | `#EDE3D2` | Primary aged-newsprint typography and monochrome peek text |
| `--ink-muted` | `#9E9382` | Secondary copy, waiting list, and round timestamps |
| `--ink-faint` | `#665E52` | Dead / offline player treatment and disabled labels |
| `--brass` | `#CFA14A` | Room code, sealed ballot pips, primary CTAs, and Manage Mode border |
| `--brass-ink` | `#18130A` | High-contrast dark ink on `--brass` primary buttons |
| `--stamp-pass` | `#4E9E76` | Public `PASSED` rubber stamp & ink (simultaneous result & history only) |
| `--stamp-pass-bg` | `#15281F` | Tinted ink-wash backdrop behind `PASSED` stamp |
| `--stamp-fail` | `#CC4836` | Public `FAILED` rubber stamp, ties, & destructive confirmation |
| `--stamp-fail-bg` | `#2B1613` | Tinted ink-wash backdrop behind `FAILED` stamp |

## Typography (Google Fonts)
- **`Oswald`** (`500`, `600`, `700`) — Condensed 1930s European grotesque headline face used for `JA!`, `NEIN`, `PASSED` / `FAILED` stamps, room codes (`KRVM`), and dossier headers. Commands attention at a glance and reads cleanly one-handed.
- **`IBM Plex Sans`** (`400`, `500`, `600`) — Crisp, open-counter grotesque used for player names, button labels, and wry table microcopy in low ambient light.
- **`IBM Plex Mono`** (`400`, `500`, `600`) — Typewritten tabular face used for ballot numbers (`BALLOT № 04`), live progress (`3 / 7`), status tags (`SEALED`, `WAITING`, `DEAD`), and anonymous round history (`№ 03 · 5–2`).

## Reveal Animation Choreography
When the final living player casts their ballot, all connected phones fire a synchronized **900ms three-beat reveal** (replayable live in the mockup via the *"Replay Reveal"* button on Frames 06A & 06B):

1. **Beat 1 — Ballot Box Lock (`0ms – 260ms`)**: All progress pips snap solid brass, the screen dims slightly with a radial vignette, `navigator.vibrate([60, 40, 60])` fires a double pulse, and a brief `ALL BALLOTS SEALED — TALLYING…` ticker locks the room's attention so everyone looks down together.
2. **Beat 2 — Slip Unfold & Count (`260ms – 620ms`)**: The `JA!` (left) and `NEIN` (right) tally cards unfold vertically (`scaleY(0.86) → 1`, `opacity: 0 → 1`, `280ms cubic-bezier(0.16, 1, 0.3, 1)`) while the condensed numerals settle into their final counts (`5` vs `2`, or `3` vs `3`). Showing the raw numbers **before** the stamp gives a 180ms beat of collective mental math around the table.
3. **Beat 3 — The Wet-Ink Stamp (`620ms – 900ms`)**: The tilted double-bordered `PASSED` (`-2deg`) or `FAILED` (`+1.8deg`) verdict stamp slams down from `scale(1.42)` to `scale(1)` (`220ms cubic-bezier(0.22, 1, 0.36, 1)`), accompanied by a crisp `2px` vertical dossier impact jolt and a subtle ink-ring bloom that settles into static print.

## Feature Placement Note — Round History
Round history lives as a **compact, one-thumb collapsible ledger (`Past Ballots · 4`)** anchored near the bottom of both the Voting and Result screens (mirrored by a quick-jump `№ 04 · Log` badge in the top bar). Players most often check past results mid-debate to verify how many governments just failed on the election tracker; keeping it an inline drawer over the current room lets anyone check `Vote 3 · 5–2 · Passed` without navigating away, while strictly storing only round number, anonymous tally, and outcome.
