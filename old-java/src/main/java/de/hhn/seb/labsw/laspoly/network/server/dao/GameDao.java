/*
 * Decompiled with CFR 0.152.
 */
package de.hhn.seb.labsw.laspoly.network.server.dao;

import de.hhn.seb.labsw.laspoly.exception.GameNotKnownException;
import de.hhn.seb.labsw.laspoly.model.Game;
import de.hhn.seb.labsw.laspoly.model.User;
import java.util.List;

public interface GameDao {
    public List<Game> getModel();

    public List<Game> getOpenGames();

    public void add(Game var1);

    public void remove(Game var1);

    public void addUser(Game var1, User var2);

    public Game removeUser(Game var1, User var2);

    public Game getGame(int var1) throws GameNotKnownException;

    public void start(Game var1);
}

