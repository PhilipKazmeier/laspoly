package de.hhn.seb.labsw.laspoly.model;

import de.hhn.seb.labsw.laspoly.test.JavaFxTest;
import de.hhn.seb.labsw.laspoly.test.TestFixtures;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PlayerTest extends JavaFxTest {
    @Test
    void defaultLastRollIsUninitialized() {
        Player player = new Player(TestFixtures.user("alice", 1));
        assertEquals(-1, player.getLastRoll()[0]);
        assertEquals(-1, player.getLastRoll()[1]);
    }

    @Test
    void removeMoneyFailsWhenInsufficientFunds() {
        Player player = new Player(TestFixtures.user("alice", 1));
        assertFalse(player.removeMoney(2000));
        assertEquals(1300, player.getMoneyAmount());
    }

    @Test
    void prisonCounterDecrementsTowardRelease() {
        Player player = new Player(TestFixtures.user("alice", 1));
        player.setPrisonCounter(3);
        player.decrementPrisonCounter();
        assertEquals(2, player.getPrisonCounter());
    }
}
