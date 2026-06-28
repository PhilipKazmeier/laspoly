/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  javafx.beans.value.ObservableValue
 *  javafx.fxml.FXMLLoader
 *  javafx.scene.Parent
 *  javafx.scene.Scene
 *  javafx.scene.image.Image
 *  javafx.scene.layout.AnchorPane
 *  javafx.stage.Stage
 */
package de.hhn.seb.labsw.laspoly.view.game;

import de.hhn.seb.labsw.laspoly.debug.GameDebugger;
import de.hhn.seb.labsw.laspoly.model.Game;
import de.hhn.seb.labsw.laspoly.model.User;
import de.hhn.seb.labsw.laspoly.network.client.Client;
import de.hhn.seb.labsw.laspoly.utils.LoggerFactory;
import de.hhn.seb.labsw.laspoly.utils.dataloading.FXMLFile;
import de.hhn.seb.labsw.laspoly.utils.dataloading.FigureSource;
import de.hhn.seb.labsw.laspoly.view.MainWindow;
import de.hhn.seb.labsw.laspoly.view.MainWindowController;
import de.hhn.seb.labsw.laspoly.view.game.GameController;
import java.io.IOException;
import java.util.HashMap;
import java.util.logging.Logger;
import javafx.beans.value.ObservableValue;
import javafx.fxml.FXMLLoader;
import javafx.scene.Parent;
import javafx.scene.Scene;
import javafx.scene.image.Image;
import javafx.scene.layout.AnchorPane;
import javafx.stage.Stage;

public class GameWindow
extends Stage {
    private static Logger logger;
    private final Game game;
    private GameController controller;

    public GameWindow(Client client, Game runningGame, HashMap<User, FigureSource> figureList, MainWindowController mainWindowController) {
        this.game = runningGame;
        try {
            logger = LoggerFactory.initializeLogger((this).getClass(), "de/hhn/seb/labsw/laspoly/view/view_logging.properties");
            FXMLLoader loader = FXMLFile.GAME_WINDOW.toFXMLLoader((this).getClass());
            AnchorPane pane = (AnchorPane)loader.load();
            this.controller = (GameController)loader.getController();
            Scene scene = new Scene((Parent)pane, (double)MainWindow.GAME_SIZE.width, (double)MainWindow.GAME_SIZE.height);
            this.setMinHeight(MainWindow.MIN_GAME_SIZE.getHeight());
            this.setMinWidth(MainWindow.MIN_GAME_SIZE.getWidth());
            pane.prefWidthProperty().bind((ObservableValue)this.widthProperty());
            pane.prefHeightProperty().bind((ObservableValue)this.heightProperty());
            client.changeListeningController(this.controller);
            this.setScene(scene);
            this.getIcons().add(new Image((this).getClass().getResourceAsStream("/de/hhn/seb/labsw/laspoly/view/LasPolyIcon_64x64.png")));
            this.controller.setGameWindow(this);
            this.controller.setClient(client);
            this.controller.setUpGameScene(figureList, this, client.getUser().getLocale());
            this.controller.setMainWindowController(mainWindowController);
            this.getScene().setOnKeyPressed(this.controller::onKeyPressed);
            this.getScene().setOnKeyReleased(this.controller::onKeyReleased);
            this.focusedProperty().addListener((observable, oldValue, hasFocus) -> {
                if (!hasFocus.booleanValue()) {
                    this.controller.getScene().hideLastPreview();
                }
            });
            Runtime.getRuntime().addShutdownHook(new Thread(){

                @Override
                public void run() {
                    GameWindow.this.controller.closeProgram();
                    if (GameDebugger.isDebugActive()) {
                        GameDebugger.closeDebugWindow();
                    }
                }
            });
            this.setOnCloseRequest(ev -> {
                ev.consume();
                this.controller.onCloseClicked();
            });
            this.setTitle("Las Poly");
            if (GameDebugger.isDebugActive()) {
                new GameDebugger().startDebugWindow(this.controller);
            }
        }
        catch (IOException e) {
            logger.severe("Couldn't create a new game window.");
            e.printStackTrace();
        }
    }

    public Game getGame() {
        return this.game;
    }
}

