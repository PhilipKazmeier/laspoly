/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  javafx.application.Application
 *  javafx.event.Event
 *  javafx.fxml.FXMLLoader
 *  javafx.scene.Parent
 *  javafx.scene.Scene
 *  javafx.scene.image.Image
 *  javafx.scene.layout.AnchorPane
 *  javafx.stage.Stage
 */
package de.hhn.seb.labsw.laspoly.debug;

import de.hhn.seb.labsw.laspoly.debug.GameDebuggerController;
import de.hhn.seb.labsw.laspoly.main.Main;
import de.hhn.seb.labsw.laspoly.utils.LoggerFactory;
import de.hhn.seb.labsw.laspoly.utils.ThreadRunner;
import de.hhn.seb.labsw.laspoly.utils.dataloading.FXMLFile;
import de.hhn.seb.labsw.laspoly.view.game.GameController;
import java.io.IOException;
import java.util.logging.Logger;
import javafx.application.Application;
import javafx.event.Event;
import javafx.fxml.FXMLLoader;
import javafx.scene.Parent;
import javafx.scene.Scene;
import javafx.scene.image.Image;
import javafx.scene.layout.AnchorPane;
import javafx.stage.Stage;

public class GameDebugger
extends Application {
    private static boolean debugActive = false;
    private static String[] arguments;
    private static Stage gameDebugger;
    private Logger logger;

    public static void main(String[] args) {
        debugActive = true;
        arguments = args;
        GameDebugger.launch((String[])new String[0]);
    }

    public static boolean isDebugActive() {
        return debugActive;
    }

    public static void closeDebugWindow() {
        if (gameDebugger != null) {
            ThreadRunner.onFX(() -> {
                gameDebugger.setOnCloseRequest(null);
                gameDebugger.close();
                gameDebugger = null;
            }, 0L);
        }
    }

    public void startDebugWindow(GameController controller) {
        FXMLLoader loader = FXMLFile.DEBUG_MAIN.toFXMLLoader((this).getClass());
        this.logger = LoggerFactory.initializeLogger((this).getClass(), "de/hhn/seb/labsw/laspoly/debug/debugger_logging.properties");
        try {
            gameDebugger = new Stage();
            AnchorPane root = (AnchorPane)loader.load();
            Scene scene = new Scene((Parent)root);
            gameDebugger.setScene(scene);
            gameDebugger.getIcons().add(new Image((this).getClass().getResourceAsStream("/de/hhn/seb/labsw/laspoly/view/LasPolyIcon_64x64.png")));
            GameDebuggerController gameDebuggerController = (GameDebuggerController)loader.getController();
            gameDebuggerController.setGameController(controller);
            gameDebugger.setOnCloseRequest(Event::consume);
            gameDebugger.show();
        }
        catch (IOException e) {
            this.logger.severe("Debug Window couldn't start");
            e.printStackTrace();
        }
    }

    public void start(Stage debugStage) throws Exception {
        Main.debuggerLaunch(arguments);
    }
}

