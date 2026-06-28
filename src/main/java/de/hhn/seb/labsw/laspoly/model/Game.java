/*
 * Decompiled with CFR 0.152.
 */
package de.hhn.seb.labsw.laspoly.model;

import de.hhn.seb.labsw.laspoly.model.User;
import java.util.ArrayList;
import java.util.List;

public class Game {
    private User host;
    private String name;
    private String usersCount;
    private List<User> users;
    private int id;
    private List<User> playerReady;

    public Game(String gameName, User gameHost) {
        this.name = gameName;
        this.host = gameHost;
        this.users = new ArrayList<User>(4);
        this.users.add(this.host);
        this.usersCount = " " + String.valueOf(4 - this.users.size());
        this.playerReady = new ArrayList<User>();
        this.id = -1;
    }

    public Game(String gameName, User gameHost, List<User> usersList) {
        this.name = gameName;
        this.host = gameHost;
        this.users = usersList;
        this.users.add(this.host);
        this.usersCount = " " + String.valueOf(4 - this.users.size());
        this.playerReady = new ArrayList<User>();
        this.id = -1;
    }

    public final User getHost() {
        return this.host;
    }

    public final void setHost(User userHost) {
        this.host = userHost;
    }

    public final boolean isHost(User user) {
        return user.equals(this.host);
    }

    public final String getName() {
        return this.name;
    }

    public final void setName(String gameName) {
        this.name = gameName;
    }

    public final List<User> getUsers() {
        return this.users;
    }

    public final void setUsers(List<User> usersList) {
        this.users = usersList;
    }

    public final void addUser(User user) {
        if (!this.users.contains(user)) {
            this.users.add(user);
            this.usersCount = " " + String.valueOf(4 - this.users.size());
        }
    }

    public final String getUsersCount() {
        return this.usersCount;
    }

    public final int getId() {
        return this.id;
    }

    public final void setId(int gameId) {
        this.id = gameId;
    }

    public final void removeUser(User user) {
        this.users.remove(user);
        if (this.playerReady.contains(user)) {
            this.playerReady.remove(user);
        }
        this.usersCount = " " + String.valueOf(4 - this.users.size());
    }

    public int hashCode() {
        return this.id;
    }

    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (o == null || this.getClass() != o.getClass()) {
            return false;
        }
        Game game = (Game)o;
        return this.id == game.id;
    }

    public String toString() {
        return "Game{host=" + this.host + ", name='" + this.name + '\'' + ", usersCount='" + this.usersCount + '\'' + ", " + "users=" + this.users + ", id=" + this.id + '}';
    }

    public List<User> getPlayerReady() {
        return this.playerReady;
    }
}

