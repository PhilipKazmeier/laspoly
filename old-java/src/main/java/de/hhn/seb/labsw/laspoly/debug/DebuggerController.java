/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  javafx.application.Platform
 *  javafx.collections.ObservableList
 *  javafx.event.ActionEvent
 *  javafx.fxml.FXML
 *  javafx.fxml.Initializable
 *  javafx.scene.control.Button
 *  javafx.scene.control.ChoiceBox
 *  javafx.scene.control.ListView
 *  javafx.scene.control.TextField
 */
package de.hhn.seb.labsw.laspoly.debug;

import de.hhn.seb.labsw.laspoly.debug.Debugger;
import de.hhn.seb.labsw.laspoly.main.Main;
import de.hhn.seb.labsw.laspoly.model.Game;
import de.hhn.seb.labsw.laspoly.model.field.FieldConfiguration;
import de.hhn.seb.labsw.laspoly.utils.LoggerFactory;
import de.hhn.seb.labsw.laspoly.utils.dataloading.DataLoader;
import de.hhn.seb.labsw.laspoly.view.game.gamescene.CameraPolicy;
import de.hhn.seb.labsw.laspoly.view.game.gamescene.Perspective;
import java.net.URL;
import java.util.ResourceBundle;
import java.util.Timer;
import java.util.TimerTask;
import java.util.logging.Logger;
import javafx.application.Platform;
import javafx.collections.ObservableList;
import javafx.event.ActionEvent;
import javafx.fxml.FXML;
import javafx.fxml.Initializable;
import javafx.scene.control.Button;
import javafx.scene.control.ChoiceBox;
import javafx.scene.control.ListView;
import javafx.scene.control.TextField;

public class DebuggerController
implements Initializable {
    private static Logger logger;
    @FXML
    private ChoiceBox<Perspective> perspectivechoicebox;
    @FXML
    private ChoiceBox<CameraPolicy> camprefcheckbox;
    @FXML
    private Button perspectiveapplybutton;
    @FXML
    private Button camprefButton;
    @FXML
    private Button showactioncardButton;
    private Debugger debugger;
    @FXML
    private TextField gameName;
    @FXML
    private TextField localeField;
    @FXML
    private TextField camanimtextfield;
    @FXML
    private ListView<Game> gamesList;

    public DebuggerController() {
        logger = LoggerFactory.initializeLogger(this.getClass(), "de/hhn/seb/labsw/laspoly/debug/debugger_logging.properties");
    }

    public void initialize(URL location, ResourceBundle resources) {
        Timer timer = new Timer();
        timer.schedule(new TimerTask(){

            @Override
            public void run() {
                DebuggerController.this.refreshGames();
            }
        }, 0L, 1000L);
        new Timer().schedule(new TimerTask(){

            @Override
            public void run() {
                DataLoader.getInstance();
                new Thread(FieldConfiguration::load).start();
            }
        }, 2000L);
    }

    public void clearAll(ActionEvent actionEvent) {
        this.debugger.getClient().clearAll();
    }

    public void clearAllUsers(ActionEvent actionEvent) {
        this.debugger.getClient().clearAllUsers();
    }

    public void clearAllGames(ActionEvent actionEvent) {
        this.debugger.getClient().clearAllGames();
    }

    public void setDebugger(Debugger debug) {
        this.debugger = debug;
    }

    public void addGame(ActionEvent actionEvent) {
        this.debugger.getClient().addGame(this.gameName.getText(), this.debugger.getClient().getUser());
    }

    public final void refreshGames() {
        Platform.runLater(() -> {
            ObservableList<Game> list = this.debugger.getClient().getGamesList();
            if (!list.equals(this.gamesList.getItems())) {
                Game[] gameList = (Game[])list.toArray((Object[])new Game[list.size()]);
                this.gamesList.getItems().clear();
                for (Game game : gameList) {
                    this.gamesList.getItems().add(game);
                }
            }
        });
    }

    public void deleteGame(ActionEvent actionEvent) {
        Game game = (Game)this.gamesList.getSelectionModel().getSelectedItem();
        if (game != null) {
            this.debugger.getClient().removeGame(game);
        }
    }

    public void startGameScene(ActionEvent actionEvent) {
    }

    public void startMainJava() {
        Main.debuggerLaunch(new String[0]);
    }
}

