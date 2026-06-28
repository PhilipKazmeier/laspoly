package de.hhn.labsw.laspoly.view.lobby;

import de.hhn.labsw.laspoly.network.client.Client;
import javafx.fxml.FXMLLoader;
import javafx.scene.Scene;
import javafx.scene.layout.AnchorPane;
import javafx.stage.Stage;

import java.io.IOException;

/**
 * {@link javafx.stage.Stage} representing the lobby of this game.
 */
public class LobbyWindow extends Stage {

    /**
     * Constructor that is loading the layout.
     *
     * @param client {@link de.hhn.labsw.laspoly.network.client.Client} that is using the game.
     */
    public LobbyWindow(Client client) {
        FXMLLoader loader = new FXMLLoader();
        loader.setLocation(getClass().getResource("/de/hhn/labsw/laspoly/view/lobby/lobbyWindow.fxml"));

        try {
            AnchorPane pane = loader.load();
            setScene(new Scene(pane, 600, 600));
        } catch (IOException e) {
            e.printStackTrace();
        }
        setTitle("LasPoly");
        LobbyWindowController controller = loader.getController();
        controller.setLobbyWindow(this);
        controller.setClient(client);
        setOnCloseRequest(e -> {
            client.notifyExited();
            System.exit(0);
        });
        setResizable(false);

    }

}
