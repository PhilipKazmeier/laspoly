/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  javafx.collections.ObservableList
 */
package de.hhn.seb.labsw.laspoly.network.client;

import de.hhn.seb.labsw.laspoly.model.Game;
import de.hhn.seb.labsw.laspoly.model.User;
import de.hhn.seb.labsw.laspoly.model.action.Action;
import de.hhn.seb.labsw.laspoly.utils.dataloading.FigureSource;
import de.hhn.seb.labsw.laspoly.view.BaseController;
import java.util.HashMap;
import javafx.collections.ObservableList;

public interface Client {
    public User getUser();

    public void register(User var1);

    public void login();

    public void logout();

    public void notifyUserDataChanged();

    public ObservableList<Game> getGamesList();

    public Game addGame(String var1, User var2);

    public void removeGame(Game var1);

    public HashMap<User, FigureSource> notifyGameLobbyOpened(Game var1);

    public void notifyGameLobbyClosed(Game var1);

    public void initializeGame(Game var1);

    public void removeUserFromGame(Game var1, User var2);

    public void listenToServer(BaseController var1, ServerUpdate var2);

    public void stopListening();

    public void addAction(Action var1, Game var2);

    public void changeListeningController(BaseController var1);

    public static enum ServerUpdate {
        GAMES_LIST,
        GAME;

    }
}

