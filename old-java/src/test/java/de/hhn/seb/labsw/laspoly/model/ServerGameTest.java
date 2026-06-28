package de.hhn.seb.labsw.laspoly.model;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import de.hhn.seb.labsw.laspoly.System;
import de.hhn.seb.labsw.laspoly.exception.InvalidActionException;
import de.hhn.seb.labsw.laspoly.model.action.ActionType;
import de.hhn.seb.labsw.laspoly.model.action.MoveFigure;
import de.hhn.seb.labsw.laspoly.model.action.PingAction;
import de.hhn.seb.labsw.laspoly.model.action.TransactionAction;
import de.hhn.seb.labsw.laspoly.test.JavaFxTest;
import de.hhn.seb.labsw.laspoly.test.TestFixtures;
import de.hhn.seb.labsw.laspoly.utils.DateTimeConverter;
import java.lang.reflect.Type;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ServerGameTest extends JavaFxTest {
    private final Gson gson = new GsonBuilder().registerTypeAdapter((Type) de.hhn.seb.labsw.laspoly.model.action.MessageAction.class, new DateTimeConverter()).create();
    private User alice;
    private User bob;
    private Game game;
    private ServerGame serverGame;

    @BeforeEach
    void setUp() {
        this.alice = TestFixtures.user("alice", 1);
        this.bob = TestFixtures.user("bob", 2);
        this.game = new Game("test-game", this.alice);
        this.game.setId(1);
        this.game.addUser(this.bob);
        this.serverGame = new ServerGame(this.game);
        this.serverGame.addUser(this.alice);
        this.serverGame.addUser(this.bob);
    }

    @Test
    void rejectsDebitWhenPlayerHasInsufficientFunds() {
        TransactionAction debit = new TransactionAction(this.alice, 2000, false, this.alice);
        assertThrows(InvalidActionException.class, () -> this.notify(ActionType.TRANSACTION, debit));
        assertEquals(1300, this.serverGame.getPlayers().get(this.alice).getMoneyAmount());
    }

    @Test
    void appliesValidDebitAndCredit() {
        this.notify(ActionType.TRANSACTION, new TransactionAction(this.alice, 200, false, this.alice));
        this.notify(ActionType.TRANSACTION, new TransactionAction(this.bob, 200, true, this.bob));
        assertEquals(1100, this.serverGame.getPlayers().get(this.alice).getMoneyAmount());
        assertEquals(1500, this.serverGame.getPlayers().get(this.bob).getMoneyAmount());
    }

    @Test
    void rejectsMoveForUnknownPlayer() {
        User stranger = TestFixtures.user("stranger", 99);
        MoveFigure move = new MoveFigure(stranger, 5, stranger);
        assertThrows(InvalidActionException.class, () -> this.notify(ActionType.MOVE_FIGURE, move));
    }

    @Test
    void updatesPositionForKnownPlayer() {
        MoveFigure move = new MoveFigure(this.alice, 12, this.alice);
        this.notify(ActionType.MOVE_FIGURE, move);
        assertEquals(12, this.serverGame.getPlayers().get(this.alice).getPosition());
    }

    @Test
    void rejectsPropertyPurchaseForUnknownPlayer() {
        String json = "{\"propertyPosition\":5,\"user\":{\"name\":\"stranger\",\"id\":99,\"locale\":\"en\"}}";
        assertThrows(InvalidActionException.class, () -> this.serverGame.notifyAction(ActionType.PROPERTY_BOUGHT, json, null));
    }

    @Test
    void recordsPropertyForKnownPlayer() {
        String json = "{\"propertyPosition\":5,\"user\":{\"name\":\"alice\",\"id\":1,\"locale\":\"en\"}}";
        this.serverGame.notifyAction(ActionType.PROPERTY_BOUGHT, json, null);
        assertTrue(this.serverGame.getPlayers().get(this.alice).getProperties().contains(5));
    }

    @Test
    void rejectsCasinoPayoutAboveHalfPot() {
        TransactionAction payout = new TransactionAction(System.CASINO_USER, 700, false, this.alice);
        assertThrows(InvalidActionException.class, () -> this.notify(ActionType.TRANSACTION, payout));
    }

    @Test
    void doesNotKickRecentlyJoinedPlayerWithStalePing() {
        long now = java.lang.System.currentTimeMillis();
        this.serverGame.getPlayers().get(this.bob).setJoinedAt(now - 10_000L);
        this.serverGame.getPlayers().get(this.bob).setLastPingAt(now - 90_000L);
        this.notify(ActionType.PING, new PingAction(this.alice));
        assertEquals(2, this.game.getUsers().size());
    }

    @Test
    void kicksPlayerWhoHasNotPingedWithinTimeout() {
        long now = java.lang.System.currentTimeMillis();
        this.serverGame.getPlayers().get(this.bob).setJoinedAt(now - 120_000L);
        this.serverGame.getPlayers().get(this.bob).setLastPingAt(now - 90_000L);
        this.notify(ActionType.PING, new PingAction(this.alice));
        assertEquals(1, this.game.getUsers().size());
        assertTrue(this.game.getUsers().contains(this.alice));
    }

    @Test
    void doesNotKickHealthyPlayerWhenAnotherPlayerPings() {
        long now = java.lang.System.currentTimeMillis();
        this.serverGame.getPlayers().get(this.alice).setJoinedAt(now - 120_000L);
        this.serverGame.getPlayers().get(this.bob).setJoinedAt(now - 120_000L);
        this.serverGame.getPlayers().get(this.bob).setLastPingAt(now - 5_000L);
        this.notify(ActionType.PING, new PingAction(this.alice));
        assertEquals(2, this.game.getUsers().size());
    }

    private void notify(ActionType type, de.hhn.seb.labsw.laspoly.model.action.Action action) {
        this.serverGame.notifyAction(type, this.gson.toJson(action), null);
    }
}
