package de.hhn.labsw.laspoly.view.game;

import javafx.fxml.Initializable;

import java.net.URL;
import java.util.ResourceBundle;

/**
 * Controller for {@link de.hhn.labsw.laspoly.view.game.GameWindow}.
 */
public class GameWindowController implements Initializable {

    /**
     * {@link de.hhn.labsw.laspoly.view.game.GameWindow} of this controller.
     */
    private GameWindow gameWindow;

    @Override
    public void initialize (URL location, ResourceBundle resources) {

    }

    /**
     * Sets the {@link de.hhn.labsw.laspoly.view.game.GameWindow} of this controller.
     *
     * @param window Instance of {@link de.hhn.labsw.laspoly.view.game.GameWindow}.
     */
    public void setGameWindow (GameWindow window) {
        gameWindow = window;
    }
}
