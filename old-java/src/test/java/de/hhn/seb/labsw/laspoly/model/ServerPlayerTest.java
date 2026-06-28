package de.hhn.seb.labsw.laspoly.model;

import de.hhn.seb.labsw.laspoly.test.TestFixtures;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ServerPlayerTest {
    @Test
    void startsWithDefaultMoney() {
        ServerPlayer player = new ServerPlayer(TestFixtures.user("alice", 1));
        assertEquals(1300, player.getMoneyAmount());
    }

    @Test
    void removeMoneyFailsWhenInsufficientFunds() {
        ServerPlayer player = new ServerPlayer(TestFixtures.user("alice", 1));
        assertFalse(player.removeMoney(1301));
        assertEquals(1300, player.getMoneyAmount());
    }

    @Test
    void removeMoneySucceedsWhenEnoughFunds() {
        ServerPlayer player = new ServerPlayer(TestFixtures.user("alice", 1));
        assertTrue(player.removeMoney(300));
        assertEquals(1000, player.getMoneyAmount());
    }

    @Test
    void addMoneyIncreasesBalance() {
        ServerPlayer player = new ServerPlayer(TestFixtures.user("alice", 1));
        player.addMoney(250);
        assertEquals(1550, player.getMoneyAmount());
    }
}
