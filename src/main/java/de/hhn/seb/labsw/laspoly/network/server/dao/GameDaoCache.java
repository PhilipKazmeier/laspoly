/*
 * Decompiled with CFR 0.152.
 */
package de.hhn.seb.labsw.laspoly.network.server.dao;

import de.hhn.seb.labsw.laspoly.exception.GameNotKnownException;
import de.hhn.seb.labsw.laspoly.model.Game;
import de.hhn.seb.labsw.laspoly.model.User;
import de.hhn.seb.labsw.laspoly.network.server.dao.GameDao;
import java.util.ArrayList;
import java.util.List;
import java.util.logging.Logger;

public enum GameDaoCache implements GameDao
{
    instance;

    private static int id;
    private final Logger logger = Logger.getAnonymousLogger();
    private final List<Game> games = new ArrayList<Game>();
    private final List<Game> runningGames = new ArrayList<Game>();

    @Override
    public List<Game> getModel() {
        return this.games;
    }

    @Override
    public List<Game> getOpenGames() {
        ArrayList<Game> temp = new ArrayList<Game>();
        this.games.forEach(g -> {
            if (!this.runningGames.contains(g)) {
                temp.add((Game)g);
            }
        });
        return temp;
    }

    @Override
    public void add(Game game) {
        this.logger.fine("Add game: " + String.valueOf(game));
        game.setId(++id);
        this.games.add(game);
    }

    @Override
    public void remove(Game game) {
        this.logger.fine("Removing game: " + String.valueOf(game));
        this.games.remove(game);
        this.runningGames.remove(game);
        if (this.games.isEmpty()) {
            id = 0;
        }
    }

    @Override
    public final void addUser(Game game, User user) {
        this.logger.fine("Adding User: " + String.valueOf(user) + " to game: " + String.valueOf(game));
        game.addUser(user);
    }

    @Override
    public final Game removeUser(Game game, User user) {
        this.logger.info("Removing User: " + String.valueOf(user) + " from game: " + String.valueOf(game));
        if (game.isHost(user) && game.getUsers().size() > 1) {
            game.setHost(game.getUsers().get(1));
        }
        game.removeUser(user);
        this.logger.info("Removed user: " + game.getUsers().isEmpty());
        if (game.getUsers().isEmpty()) {
            this.remove(game);
            return null;
        }
        return game;
    }

    @Override
    public Game getGame(int gameId) throws GameNotKnownException {
        Game temp = null;
        for (Game game : this.getModel()) {
            if (game.getId() != gameId) continue;
            temp = game;
        }
        if (temp == null) {
            throw new GameNotKnownException(gameId);
        }
        return temp;
    }

    @Override
    public void start(Game game) {
        this.runningGames.add(game);
    }
}

