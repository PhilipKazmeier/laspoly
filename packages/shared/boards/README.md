# City Board Files

Each `.json` in this directory defines one playable city map.

## How to add a new city board

1. Copy `vegas.json` to `<cityid>.json`.
2. Change the top-level `id` and `name` fields.
3. Rename every `tile.name` (and optionally `tile.description`) to city-specific streets and landmarks.
   - Keep all `pos`, `type`, `group`, and numeric fields (`price`, `rent`, `mortgage`, `houseCost`, `hotelCost`, `factoryCost`, `factoryRevenue`) **identical** to vegas so game balance is preserved.
4. Import the new file in `packages/shared/src/board.ts` and add it to `REGISTRY`.
5. Run `npm test` — the suite in `boards.test.ts` validates tile count, special-tile positions, and numeric parity with vegas automatically.

## Special tile positions (must not move)

| pos | type        |
|-----|-------------|
| 0   | go          |
| 2   | tax         |
| 5   | station     |
| 7   | action      |
| 10  | freeparking |
| 12  | attraction  |
| 15  | station     |
| 17  | action      |
| 20  | casino      |
| 22  | action      |
| 25  | station     |
| 27  | attraction  |
| 30  | gotojail    |
| 32  | action      |
| 35  | station     |
| 36  | tax         |
