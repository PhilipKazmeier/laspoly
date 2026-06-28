package de.hhn.labsw.laspoly.model;

import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import org.junit.Before;
import org.junit.Test;
import org.junit.experimental.theories.DataPoints;
import org.junit.experimental.theories.Theories;
import org.junit.experimental.theories.Theory;
import org.junit.runner.RunWith;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

import static org.hamcrest.CoreMatchers.is;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

/**
 * This test class tests {@link de.hhn.labsw.laspoly.model.Game}.
 */
@RunWith (Theories.class)
public class GameTest {

    private Game game;

    @DataPoints
    public static User[] users = {new User("KingXY", Locale.GERMAN,0), new User("Philip", Locale.GERMAN,0), new User("Brian", Locale.GERMAN,0), new User("Patrick", Locale.GERMAN,0)};

    @DataPoints
    public static String[] names = {"Game1", "LasPoly", "Monopoly", "Cool", "Best game ever"};

    @DataPoints
    public static int[] ids = {1, 34, 3423, 234324, 3454354};

    @Before
    public void before () {
        User user = new User("Test", Locale.GERMAN,0);
        user.setId(0);
        game = new Game("", user);
    }

    @Theory
    public void testSetGetHost (User user) {
        game.setHost(user);
        assertThat(game.getHost(), is(user));
    }

    @Theory
    public void testSetGetName (String name) {
        game.setName(name);
        assertThat(game.getName(), is(name));
    }

    @Theory
    public void testAddUser (User user) {
        game.addUser(user);
        assertTrue(game.getUsers().contains(user));
        game.removeUser(user);
    }

    @Theory
    public void testRemoveUser (User user) {
        game.addUser(user);
        game.removeUser(user);
        assertFalse(game.getUsers().contains(user));
    }

    @Theory
    public void testSetGetId (int id) {
        game.setId(id);
        assertThat(game.getId(), is(id));
    }

    @Theory
    public void testSetGetUsersList (User user) {
        List<User> userList = new ArrayList<>();
        userList.add(game.getHost());
        userList.add(user);
        game.setUsers(userList);
        assertThat(game.getUsers(), is(userList));
        game.removeUser(user);
    }

    @Test
    public void testToString () {
        String toString = "Game{" +
                "host=" + game.getHost() +
                ", name=" + game.getName() +
                ", users=" + game.getUsers().size() +
                ", id=" + game.getId() +
                '}';
        assertThat(game.toString(), is(toString));
    }

    @Theory
    public void testConstructorWithoutUsersList (String name, User user) {
        Game game1 = new Game(name, user);
        assertThat(game1.getName(), is(name));
        assertThat(game1.getHost(), is(user));
    }

    @Theory
    public void testConstructorWitUsersList (String name, User user, User user2) {
        ObservableList<User> userList = FXCollections.observableArrayList();
        userList.add(user);
        Game game1 = new Game(name, user2, userList);
        assertThat(game1.getName(), is(name));
        assertThat(game1.getHost(), is(user2));
        assertTrue(game1.getUsers().contains(user));
        assertTrue(game1.getUsers().contains(user2));
    }

    @Test
    public void testIsStarted () {
        game.start();
        assertTrue(game.isStarted());
    }

    @Test
    public void testStop () {
        game.start();
        game.stop();
        assertFalse(game.isStarted());
    }
}
