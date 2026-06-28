package de.hhn.seb.labsw.laspoly.test;

import de.hhn.seb.labsw.laspoly.model.Game;
import de.hhn.seb.labsw.laspoly.model.ServerGame;
import de.hhn.seb.labsw.laspoly.model.User;
import java.util.Locale;

public final class TestFixtures {
    private TestFixtures() {
    }

    public static User user(String name, int id) {
        User user = new User(name, Locale.ENGLISH);
        user.setId(id);
        return user;
    }

    public static ServerGame serverGame(User host, User... others) {
        Game game = new Game("test-game", host);
        game.setId(1);
        for (User other : others) {
            game.addUser(other);
        }
        ServerGame serverGame = new ServerGame(game);
        serverGame.addUser(host);
        for (User other : others) {
            serverGame.addUser(other);
        }
        return serverGame;
    }
}
