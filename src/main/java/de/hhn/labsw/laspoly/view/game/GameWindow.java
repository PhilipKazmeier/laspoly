package de.hhn.labsw.laspoly.view.game;

import de.hhn.labsw.laspoly.model.Game;
import de.hhn.labsw.laspoly.network.client.Client;
import de.hhn.labsw.laspoly.view.game.gamescene.GameScene;
import javafx.fxml.FXMLLoader;
import javafx.scene.Scene;
import javafx.scene.layout.AnchorPane;
import javafx.stage.Stage;

import java.io.IOException;

/**
 * {@link javafx.stage.Stage} that contains the {@link de.hhn.labsw.laspoly.view.game.gamescene.GameScene} and other
 * components used during the {@link de.hhn.labsw.laspoly.model.Game}.
 */
public class GameWindow extends Stage {

    /**
     * Pane of this {@link javafx.stage.Stage}.
     */
    private AnchorPane pane;

    /**
     * {@link de.hhn.labsw.laspoly.view.game.GameWindowController} of this class.
     */
    private GameWindowController controller;

    /**
     * {@link de.hhn.labsw.laspoly.model.Game} this is representing.
     */
    private Game game;

    /**
     * Constructor.
     *
     * @param game   {@link de.hhn.labsw.laspoly.model.Game} this is representing.
     * @param client {@link de.hhn.labsw.laspoly.network.client.Client} of the program.
     */
    public GameWindow(Game game, Client client) {
        this.game = game;
        FXMLLoader loader = new FXMLLoader();
        loader.setLocation(getClass().getResource("/de/hhn/labsw/laspoly/view/game/gameWindow.fxml"));
        try {
            pane = loader.load();
            setScene(new Scene(pane));
            controller = loader.getController();
            controller.setGameWindow(this);
        } catch (IOException e) {
            e.printStackTrace();
        }
        GameScene field = new GameScene();
        field.setLayoutX(0);
        field.setLayoutY(0);
        pane.getChildren().add(field);
        getScene().setOnKeyPressed(field::onKeyPressed);

        setTitle("LasPoly");
        setOnCloseRequest(w -> {
            client.notifyExited(); /* TODO Lobby wieder anzeigen */
        });
    }

    /**
     * @return {@link #controller}.
     */
    public GameWindowController getController() {
        return controller;
    }

    /**
     * @return {@link #game}.
     */
    public Game getGame() {
        return game;
    }
}
