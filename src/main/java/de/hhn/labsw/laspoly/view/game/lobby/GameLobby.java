package de.hhn.labsw.laspoly.view.game.lobby;

import de.hhn.labsw.laspoly.model.Game;
import de.hhn.labsw.laspoly.network.client.Client;
import de.hhn.labsw.laspoly.view.lobby.LobbyWindow;
import javafx.application.Platform;
import javafx.fxml.FXMLLoader;
import javafx.scene.Scene;
import javafx.scene.layout.AnchorPane;
import javafx.stage.Stage;

import java.io.IOException;

/**
 * {@link javafx.stage.Stage} representing the lobby of a {@link de.hhn.labsw.laspoly.model.Game}.
 */
public class GameLobby extends Stage {

    /**
     * {@link Game} of the lobby.
     */
    private Game game;

    /**
     * {@link de.hhn.labsw.laspoly.network.client.Client} of this program.
     */
    private Client client;

    /**
     * If this is true the {@link de.hhn.labsw.laspoly.model.Game} was closed by the host of it.
     */
    private boolean forceClose = false;
    /**
     * {@link de.hhn.labsw.laspoly.view.lobby.LobbyWindow} of the program.
     */
    private LobbyWindow lobbyWindow;


    /**
     * Constructor.
     *
     * @param gameOfLobby {@link Game} of the lobby.
     * @param client      {@link de.hhn.labsw.laspoly.network.client.Client} that is using this instance of {@link
     *                    GameLobby}.
     * @param lobbyWindow {@link de.hhn.labsw.laspoly.view.lobby.LobbyWindow} of the program.
     */
    public GameLobby (Game gameOfLobby, Client client, LobbyWindow lobbyWindow) {
        game = gameOfLobby;
        this.client = client;
        this.lobbyWindow = lobbyWindow;
        FXMLLoader loader = new FXMLLoader();
        loader.setLocation(getClass().getResource("/de/hhn/labsw/laspoly/view/game/lobby/gameLobby.fxml"));
        try {
            AnchorPane pane = loader.load();
            setScene(new Scene(pane, 650, 500));
            GameLobbyController controller = loader.getController();
            controller.setGameLobby(this);
        } catch (IOException e) {
            e.printStackTrace();
        }

        setTitle("LasPoly");
        setOnCloseRequest(e -> {
            System.out.println("CLOSED");
            if (!forceClose) {
                //client.notifyGameLobbyClosed(game);
            }
            lobbyWindow.show();
        });

    }

    /**
     * @return {@link de.hhn.labsw.laspoly.model.Game} that is represented by this lobby.
     */
    public Game getGame () {
        return game;
    }

    /**
     * Sets {@link #game}.
     *
     * @param game {@link de.hhn.labsw.laspoly.model.Game} that is set.
     */
    public void setGame (Game game) {
        this.game = game;
    }

    /**
     * @return The {@link de.hhn.labsw.laspoly.network.client.Client} of this {@link GameLobby}.
     */
    public Client getClient () {
        return client;
    }

    /**
     * @return The {@link de.hhn.labsw.laspoly.view.lobby.LobbyWindow} of the current instance of this program.
     */
    public LobbyWindow getLobbyWindow () {
        return lobbyWindow;
    }

    /**
     * Method is called when {@link de.hhn.labsw.laspoly.model.Game} is closed by the host of the {@link
     * de.hhn.labsw.laspoly.model.Game}.
     */
    public void forceClose () {
        forceClose = true;
        Platform.runLater(() -> {
            close();
            lobbyWindow.show();
        });

    }
}
