# Sketch: "The Ballot Office"

Open `index.html` straight from disk. It shows all 16 frames (390×844) in one scrollable page. The dashed "Hold to check your vote" bars work: press and hold. Frames 6a and 6b play the reveal when they scroll into view, and the "Replay the reveal" button under each plays it again.

## The idea

Each phone is a ballot card in a dim ministry back room, after hours. There's a lamp-off desk, buff card stock, typed rosters, brass fittings, and a rubber stamp for the verdict. The mood comes from period print materials (wood-type poster headlines, typewritten records, framed ballot cards, a mourning-bordered death notice, a sealed envelope) rather than from any imagery of the regime or the board game. So there are no emblems, no eagles and no faction colours. The security rule drives the main visual decision: JA! and NEIN are printed on literally the same ballot card, frame and all, and a cast vote goes into an envelope that looks the same whatever is inside. Brass is the only "press me" colour. The two stamp inks (verdigris, oxblood) appear only on the result screen and in the ledger, where the outcome is public anyway.

## Palette

| Role | Name | Hex |
|---|---|---|
| Screen background | ink | `#14120f` |
| Raised surface (buttons, bars) | desk | `#1e1b17` |
| Pressed / secondary surface | desk-2 | `#29251f` |
| Hairlines | rule | `#3b352c` |
| Text on dark | text | `#ece3cf` |
| Secondary text on dark | muted | `#a89c86` |
| Ballot card stock | paper | `#e8dcc2` |
| Paper edge / shadow | paper-edge | `#cbbd9c` |
| Ink on paper | paper-ink | `#1c1813` |
| Secondary ink on paper | paper-muted | `#63584a` |
| Primary action | brass | `#c9a24a` (text on it `#1f1806`) |
| FAILED stamp, destructive | oxblood | `#a3342a` (on dark: `#e3786a`) |
| PASSED stamp | verdigris | `#2c6a4f` (on dark: `#8cc4a6`) |
| Envelope | kraft / kraft-dark | `#7b5e40` / `#644b31` |
| Reconnecting | amber | `#d9a441` |
| Connected | live | `#86b593` |

It's dark by default because the app is used at a table in the evening, often under dim light. All body text clears 4.5:1 against its background.

## Fonts (Google Fonts)

- **Big Shoulders Display** (700–900) is used for headlines, the room code, the ballot cards, counts and stamps. It's a condensed wood-type poster face that stays readable across a table at 128px.
- **Libre Franklin** (400–700) is used for interface copy and buttons. It's a revival of Franklin Gothic, a 1900s grotesque.
- **Courier Prime** (400/700) is used for typed records: player names, serial numbers, the ledger and the URL. A typewritten roster is the dossier detail.

## The reveal animation (about 1.5 s, the same on every phone)

A game has 10 or more votes, so the reveal is short and can be skipped. The clock below is in seconds from the moment the result arrives.

| t (s) | Beat |
|---|---|
| 0–0.2 | **Flash.** The screen cuts to black with `ALL BALLOTS IN` typed in the middle. It fades out by 0.4. |
| 0.1–0.45 | The "Vote 5" heading rises in and the buff tally sheet snaps up from below, settling out of a 3° tilt. Column labels fade in at 0.3. |
| 0.3–0.8 | **Count.** Both columns count up together, adding a number and one tally stroke (groups of five with a diagonal) per step. The step is `min(0.13 s, 0.5 s ÷ larger total)`, so the whole count always fits in 0.5 s, from a 1–0 vote up to a 10-player table. The smaller column stops first, so with 4–2 JA! climbs alone for a beat. A tie finishes level. |
| count end + 0.1 | **Stamp.** PASSED (verdigris) or FAILED (oxblood) slams from 2.8× scale, blurred and over-rotated, down to −7° in 0.22 s. The sheet takes a 4px thud and the phone buzzes (`navigator.vibrate([60, 40, 60])`). |
| stamp + 0.12 → about 1.4–1.5 | The verdict line, the hold-to-check bar, "New vote" and the ledger strip rise in over 0.35 s. |

Example: a 4–2 vote is fully settled at 1.37 s (measured in the sketch).

- **Tap to skip:** a tap anywhere on the screen while the reveal plays jumps to the final state at once: final numbers, stamp down, controls showing, buzz fired if it hadn't yet. That tap does nothing else, so it can't land on "New vote" or the hold bar by accident.
- **Reduced motion:** with `prefers-reduced-motion`, the final state shows straight away. Only the buzz remains.

## Ballot cards (JA! / NEIN)

These are based on the official print-and-play sheets of the physical cards (secrethitler.com, CC BY-NC-SA 4.0).

**What we took** (proportion, framing, how the lettering sits):
- **Proportion:** portrait poker-card size, 5:7, with rounded corners. On the voting screen the two cards are 146 × 204 px, side by side and centred.
- **Framing:** a heavy dark frame set in from the card edge, then a thin hairline rule inside it. The double frame is the card's main ornament.
- **Lettering:** the word is turned 90° and runs bottom-to-top along the long side, very large and filling the frame. It is the only thing on the face.
- **Gloss:** a small, widely spaced translation, `(YES)` / `(NO)`, sits beside the word in the same orientation.
- **In the envelope:** the sealed card lies on its side, so the same card reads horizontally when you hold to check.

**What we left out on purpose:**
- **Blackletter:** the originals set *ja!* / *nein* in a blackletter face. That lettering is the card's trade dress, and blackletter carries baggage we don't need, so we use our own Big Shoulders Display, uppercase.
- **Inverted colours and distressing:** on the real set, Ja! is a light card and Nein is a dark, distressed card. That difference is exactly what a neighbour could spot, so both of ours are the same buff card with the same ink.
- **Everything else:** no illustrations, artwork, logos, party symbols, card backs or edition marks.

**Hard rules kept:**
- Same colour, size, frame, gloss style and shadow on both cards. Only the word and its gloss differ.
- JA! is always on the left.
- Pressing either card gives the same press animation, and the vote-cast screen looks identical whichever you chose.

## Room-code entry (landing)

There are four separate letter boxes under a "Room code" label, then a full-width **Join room** button. An empty box has a dashed outline, the active box has a brass outline, and a filled box turns into a small buff card with the letter in Big Shoulders. The code fills in like dealing four cards.

- **Typing:** each letter goes into the current box and focus moves to the next. Focus on a box selects its letter, so typing over it replaces it.
- **Backspace:** in a filled box, it clears that box. In an empty box, it clears the previous box and moves there. Arrow keys move between boxes, and Enter joins once the code is complete.
- **Paste:** pasting into any box fills all four. It accepts a bare code (`mbzr`) or a whole room link (`https://secret-hitler-voting.ycmjason.com/MBZR`), taking the last four letters.
- **Uppercase only:** input is forced to uppercase, and anything that isn't A–Z is dropped.
- **No I or O:** codes never use them (the server's alphabet is `ABCDEFGHJKLMNPQRSTUVWXYZ`). Typing or pasting either is rejected: the box shakes, its outline turns oxblood, and "Codes never use I or O." shows for about 2 s.
- **Join:** disabled (dimmed, flat) until all four boxes hold valid letters, then it turns brass.
- **Input attributes:** `autocapitalize="characters"`, `autocomplete="off"`, `spellcheck="false"`, one `aria-label` per box ("Letter 2 of 4").

## Decisions worth flagging

- **Round history is called "the ledger".** It opens from the book icon in the header on every screen, and the last two entries also appear under each result. It records totals and outcome only, flags "tie" and "shown early · n missing", and the current vote shows as "in progress".
- **Hold to check:** in the resting state you see a sealed envelope, which looks the same whatever you voted. Holding breaks the seal and slides the card out just far enough to read, and the bar itself turns to paper and says "You voted JA!". On the result screen, only the bar does this.
- **Dead player:** no ballot cards are rendered at all, so there is nothing to tap by mistake. Instead you get a death notice with a black mourning border.
- **Manage mode:** the header becomes a brass bar and every status badge turns into an action button. The two can't be confused. "Show result now" confirms with a sheet that names who hasn't voted.
- **Empty room:** the ballot cards are hidden and the invite takes their place until a second player joins.
- **Brief vs. prototype:** "Withdraw" stays. "Change vote" brings the cards back, but the sealed vote stands until you tap a new one.
