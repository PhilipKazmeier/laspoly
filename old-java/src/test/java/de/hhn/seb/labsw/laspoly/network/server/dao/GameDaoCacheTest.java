package de.hhn.seb.labsw.laspoly.network.server.dao;

import de.hhn.seb.labsw.laspoly.model.Game;
import de.hhn.seb.labsw.laspoly.model.User;
import de.hhn.seb.labsw.laspoly.test.TestFixtures;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class GameDaoCacheTest {
    private GameDaoCache dao;

    @BeforeEach
    void setUp() {
        this.dao = GameDaoCache.instance;
        for (Game game : this.dao.getModel().toArray(new Game[0])) {
            this.dao.remove(game);
        }
    }

    @Test
    void assignsIncrementingIds() {
        User host = TestFixtures.user("host", 1);
        Game first = new Game("first", host);
        Game second = new Game("second", host);
        this.dao.add(first);
        this.dao.add(second);
        assertTrue(second.getId() > first.getId());
    }

    @Test
    void removeUserPromotesNewHostWhenHostLeaves() {
        User host = TestFixtures.user("host", 1);
        User guest = TestFixtures.user("guest", 2);
        Game game = new Game("party", host);
        this.dao.add(game);
        this.dao.addUser(game, guest);
        Game updated = this.dao.removeUser(game, host);
        assertEquals(guest, updated.getHost());
        assertEquals(1, updated.getUsers().size());
    }

    @Test
    void removeUserDeletesEmptyGame() {
        User host = TestFixtures.user("solo", 1);
        Game game = new Game("solo", host);
        this.dao.add(game);
        assertNull(this.dao.removeUser(game, host));
        assertTrue(this.dao.getModel().isEmpty());
    }
}
