package de.hhn.labsw.laspoly.model;

import de.hhn.labsw.laspoly.view.game.GameWindowController;
import javafx.collections.ObservableList;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

/**
 * A game is a match between different people. Contains the basic information about that match.
 */
public class Game implements Serializable {

    /**
     * {@link User} that is hosting this game.
     */
    private User host;

    /**
     * Name of the {@link de.hhn.labsw.laspoly.model.Game}.
     */
    private String name;

    /**
     * Count of the players displayed as x/4.
     */
    private String usersCount;

    /**
     * List of all {@link User} that are part of this game.
     */
    private List<User> users;

    /**
     * Boolean variable whether the game has started.
     */
    private boolean started = false;

    /**
     * ID des {@link de.hhn.labsw.laspoly.model.Game}, durch die es eindeutig von anderen unterscheidbar ist.
     */
    private int id;

    /**
     * {@link de.hhn.labsw.laspoly.view.game.GameWindowController} of this {@link de.hhn.labsw.laspoly.model.Game}.
     */
    private GameWindowController gameWindowController;

    /**
     * Constructor with name and host for this game as parameters.
     *
     * @param gameName Name for this game.
     * @param gameHost {@link User} that is host of this game.
     */
    public Game (String gameName, User gameHost) {
        name = gameName;
        host = gameHost;
        users = new ArrayList<>(6);
        users.add(host);
        usersCount = users.size() + "/4";
        id = -1;
    }

    /**
     * @param gameName Name for this game.
     * @param gameHost {@link User} that is host of this game.
     * @param users    List of {@link User} that are part of this game. Without the host.
     */
    public Game (String gameName, User gameHost, ObservableList<User> users) {
        name = gameName;
        host = gameHost;
        this.users = users;
        this.users.add(host);
        usersCount = users.size() + "/4";
        id = -1;
    }

    /**
     * @return The {@link User} that is host of this game ({@link #host}).
     */
    public User getHost () {
        return host;
    }

    /**
     * Sets the {@link User} that is host of this game ({@link #host}).
     *
     * @param host {@link User} that is the new host for this game.
     */
    public void setHost (User host) {
        this.host = host;
    }

    /**
     * @return The String value of the name of the game ({@link #name}).
     */
    public String getName () {
        return name;
    }


    /**
     * Sets the value of the name of the game ({@link #users});
     *
     * @param name New name for the game.
     */
    public void setName (String name) {
        this.name = name;
    }

    /**
     * @return List of {@link User} that are part of this game ({@link #users}).
     */
    public List<User> getUsers () {
        return users;
    }

    /**
     * Adds a {@link User} to {@link #users}.
     *
     * @param user {@link User} that is added.
     */
    public void addUser (User user) {
        users.add(user);
        usersCount = users.size() + "/4";
    }

    /**
     * @return The string value of {@link #usersCount}.
     */
    public String getUsersCount () {
        return usersCount;
    }

    /**
     * @return {@link #id}.
     */
    public int getId () {
        return id;
    }

    /**
     * Sets {@link #id}.
     *
     * @param id New value for the id.
     */
    public void setId (int id) {
        this.id = id;
    }

    /**
     * Sets the List of {@link de.hhn.labsw.laspoly.model.User} that are part of this {@link
     * de.hhn.labsw.laspoly.model.Game}.
     *
     * @param users List of {@link de.hhn.labsw.laspoly.model.User}.
     */
    public void setUsers (List<User> users) {
        this.users = users;
    }

    /**
     * Removes {@link de.hhn.labsw.laspoly.model.User} from the {@link de.hhn.labsw.laspoly.model.Game}.
     *
     * @param user {@link de.hhn.labsw.laspoly.model.User} that is removed.
     */
    public void removeUser (User user) {
        users.remove(user);
        usersCount = users.size() + "/4";
    }

    @Override
    public String toString () {
        return "Game{" +
                "host=" + host +
                ", name=" + name +
                ", users=" + users.size() +
                ", id=" + id +
                '}';
    }

    /**
     * @return Whether the game has started or not.
     */
    public boolean isStarted () {
        return started;
    }

    /**
     * Starts the game.
     */
    public void start () {
        this.started = true;
    }

    /**
     * This method is called when the game is started.
     */
    private void startGame () {

    }

    /**
     * Ends the game.
     */
    public void stop () {
        this.started = false;
    }

    @Override
    public boolean equals (Object o) {
        if (this == o)
            return true;
        if (o == null || getClass() != o.getClass())
            return false;

        Game game = (Game) o;

        return id == game.id;
    }

    @Override
    public int hashCode () {
        return id;
    }
}
