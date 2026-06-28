package de.hhn.labsw.laspoly.network.server;

import de.hhn.labsw.laspoly.exception.GameNotKnownException;
import de.hhn.labsw.laspoly.exception.UserNotKnownException;
import de.hhn.labsw.laspoly.model.Game;
import de.hhn.labsw.laspoly.model.User;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.contrib.java.lang.system.ExpectedSystemExit;
import org.junit.experimental.theories.DataPoints;
import org.junit.experimental.theories.Theories;
import org.junit.experimental.theories.Theory;
import org.junit.rules.ExpectedException;
import org.junit.runner.RunWith;

import java.util.Locale;

import static junit.framework.Assert.assertTrue;
import static junit.framework.TestCase.assertFalse;
import static org.hamcrest.CoreMatchers.is;
import static org.junit.Assert.assertThat;

/**
 * This test class test {@link de.hhn.labsw.laspoly.network.server.Server}.
 */

@RunWith (Theories.class)
public class ServerTest {

    private Server server;

    @Rule
    public ExpectedException expectedException = ExpectedException.none();

    @Rule
    public final ExpectedSystemExit exit = ExpectedSystemExit.none();

    @DataPoints
    public static User[] users = {new User("KingXY", Locale.GERMAN, 0), new User("Philip", Locale.GERMAN, 0), new
            User("Brian", Locale.GERMAN, 0), new User("Patrick", Locale.GERMAN, 0)};

    @DataPoints
    public static Game[] games = {new Game("Test", users[0])};

    @DataPoints
    public static int[] ids = {23, 3454354, 232, 1223, 29304, 2142343};

    @Before
    public void before() {
        server = Server.getInstance();
    }

    @Test
    public void testGenerateUserId() {
        assertTrue(server.getUserIds().contains(server.generateUserId()));
    }

    @Test
    public void testGenerateGameId() {
        assertTrue(server.getGameIds().contains(server.generateGameId()));
    }

    @Theory
    public void testLogin(User user) throws UserNotKnownException {
        server.addUser(user);
        server.login(user);
        assertTrue(server.isOnline(user));
        server.removeUser(user);
    }

    @Theory
    public void testLoginException(User user) throws UserNotKnownException {
        expectedException.expect(UserNotKnownException.class);
        server.login(user);
    }

    @Theory
    public void testLogout(User user) throws UserNotKnownException {
        server.addUser(user);
        server.logout(user);
        assertFalse(server.isOnline(user));
        server.removeUser(user);
    }

    @Theory
    public void testLogoutException(User user) throws UserNotKnownException {
        expectedException.expect(UserNotKnownException.class);
        server.logout(user);
    }

    @Test
    public void testOnShutdown() {
        exit.expectSystemExitWithStatus(0);
        server.onShutdown();
    }

    @Theory
    public void testGetUser(User user) throws UserNotKnownException {
        server.addUser(user);
        assertThat(server.getUser(user.getId()), is(user));
        server.removeUser(user);
    }

    @Theory
    public void testGetUserException(int id) throws UserNotKnownException {
        if (!server.getUserIds().contains(id)) {
            expectedException.expect(UserNotKnownException.class);
            server.getUser(id);
        }
    }

    @Theory
    public void testGetGame(Game game) throws GameNotKnownException {
        server.addGame(game);
        assertThat(server.getGame(game.getId()), is(game));
        server.removeGame(game);
    }

    @Theory
    public void testGetGameException(int id) throws GameNotKnownException {
        if (!server.getGameIds().contains(id)) {
            expectedException.expect(GameNotKnownException.class);
            server.getGame(id);
        }
    }

    @Theory
    public void testAddUser(User user) {
        server.addUser(user);
        assertTrue(server.getUsers().contains(user));
        server.removeUser(user);
    }

    @Theory
    public void testRemoveUser(User user) {
        server.addUser(user);
        assertTrue(server.getUsers().contains(user));
        server.removeUser(user);
        assertFalse(server.getUsers().contains(user));
    }

    @Theory
    public void testAddGame(Game game) {
        server.addGame(game);
        assertTrue(server.getGames().contains(game));
        server.removeGame(game);
    }

    @Theory
    public void testRemoveGame(Game game) {
        server.addGame(game);
        assertTrue(server.getGames().contains(game));
        server.removeGame(game);
        assertFalse(server.getGames().contains(game));
    }

    @Theory
    public void testIsOnline(User user) throws UserNotKnownException {
        server.addUser(user);
        server.login(user);
        assertTrue(server.isOnline(user));
        server.logout(user);
        assertFalse(server.isOnline(user));
        server.removeUser(user);
    }



}
