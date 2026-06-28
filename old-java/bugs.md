When you pick up one task, move it into the done section. after fixing push the changes.

## Open

## Done

15. **Houses missing on remote clients (`Street.java`, `RunningGameListener.java`)** — Fixed: remote `BUILDING` actions now call `syncBuildingFromNetwork` instead of `construct()`, so validation/state mismatches no longer skip the visual update.

16. **Swap offer could not pick own + desired properties (`NewSwapOfferController.java`)** — Fixed: opponent property list is always populated (including when starting from an own property), and combobox changes no longer wipe a pre-selected opponent property.

17. **Property preview cards off-screen / not shown (`Field.java`, `PreviewManager.java`, `GameScene.java`)** — Fixed: preview PopOver uses JavaFX screen coordinates from the click event instead of AWT `MouseInfo`; preview dedup resets on hide so re-clicks work.

18. **Missing opponent figures after lobby figure change (`GameLobbyController.java`)** — Fixed: final `FigureChangedAction` is sent on select; `getFigureMap()` includes every game user so all tokens are created at game start.

1. **JAX-RS response leak (`ServerClient.java`)** — Fixed: all 13 JAX-RS `Response` usages now use try-with-resources so connections are closed after `readEntity` or status checks, including lobby polling and SSE reconnect paths.

2. **Casino pays out on uninitialized dice (`Casino.java`)** — Fixed: `onFigureEntered` now requires `lastRoll[0] >= 1` before treating equal dice as doubles, so the default `[-1, -1]` no longer triggers a payout.

3. **Attraction rent can add money instead of charging (`Attraction.java`)** — Fixed: rent is only charged when `lastRoll[0] >= 1`, matching the Casino guard so the default `[-1, -1]` no longer yields negative rent via `removeMoney`.

4. **Double GO payout when landing on Start (`GameHandler.java`, `StartField.java`)** — Fixed: GO/Start bonus is awarded once in `GameHandler.placeFigure` (+400 on Start, +200 when passing only); removed duplicate payout from `StartField.onFigureEntered`.

5. **Prison release takes ~9 failed rolls, not 3 (`GameHandler.java`, `Prison.java`)** — Fixed: each failed prison roll now decrements `prisonCounter` directly and ends the turn; removed nested `prisonRollCounter` gate that required three rolls per counter unit (~9 rolls total).

6. **Server never rejects insufficient funds (`ServerPlayer.java`)** — Fixed: `removeMoney` now checks `enoughMoney` before subtracting; `ServerGame` TRANSACTION handler throws `InvalidActionException` when debit fails.

7. **Swap acceptance ignores payment failure (`RunningGameListener.java`)** — Fixed: cash debits run before property transfers; failed `removeMoney` rolls back the other debit and skips property reassignment plus the success chat message.

8. **Wrong figure animated for remote train travel (`RunningGameListener.java`)** — Fixed: remote `move.isRide()` now animates `getPlayer(move.getUser()).getFigure()`, matching `travel()` instead of the local client figure.

9. **NPE when chat message JSON fails to parse (`RunningGameListener.java`)** — Fixed: `gotMessage` returns early when parse fails or yields null, so `message.getActuator()` is never called on a bad payload.

10. **NPE on sold property with no owner (`RunningGameListener.java`)** — Fixed: `soldProperty` only calls `owner.remove(prop)` when `prop.getOwner()` is non-null; still clears owner on the property.

11. **Silent desync after handler exceptions (`RunningGameListener.java`)** — Fixed: `dispatchEvent` now routes parse/handler failures through `ServerClient.handleRunningGameEventFailure`, which shows a warning dialog and triggers `syncGameStateAfterReconnect` instead of logging and continuing silently.

12. **NPE when notifying action on ended game (`GamesResource.java`)** — Fixed: `notifyGameAction` returns false when the server game is missing; `gameAction` responds with 1337 and logs a warning instead of NPE on late/duplicate actions.

13. **NPE on move for unknown player (`ServerGame.java`)** — Fixed: `MOVE_FIGURE` checks `players.containsKey` before `setPosition` and throws `InvalidActionException` for stale/unknown users, matching the TRANSACTION handler pattern.

14. **NPE in `User.equals` (`User.java`)** — Fixed: `equals` now null-checks `id` before `intValue()`; two null ids compare equal, matching existing `hashCode`.

<!-- Move fixed items here with a short note on the fix and commit/PR link if applicable. -->
