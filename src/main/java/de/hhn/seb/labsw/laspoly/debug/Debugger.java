/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  javafx.application.Application
 *  javafx.fxml.FXMLLoader
 *  javafx.scene.Parent
 *  javafx.scene.Scene
 *  javafx.scene.layout.AnchorPane
 *  javafx.stage.Stage
 */
package de.hhn.seb.labsw.laspoly.debug;

import de.hhn.seb.labsw.laspoly.debug.DebugClient;
import de.hhn.seb.labsw.laspoly.debug.DebuggerController;
import de.hhn.seb.labsw.laspoly.model.User;
import de.hhn.seb.labsw.laspoly.utils.LoggerFactory;
import de.hhn.seb.labsw.laspoly.utils.dataloading.FXMLFile;
import de.hhn.seb.labsw.laspoly.view.MainWindow;
import java.awt.Dimension;
import java.io.IOException;
import java.util.Locale;
import java.util.logging.Logger;
import javafx.application.Application;
import javafx.fxml.FXMLLoader;
import javafx.scene.Parent;
import javafx.scene.Scene;
import javafx.scene.layout.AnchorPane;
import javafx.stage.Stage;

public class Debugger
extends Application {
    public static final Dimension PREF_DEBUGGER_SIZE = new Dimension(500, 500);
    private static final Dimension MAX_DEBUGGER_SIZE = new Dimension((int)((double)MainWindow.SCREEN_WIDTH * 0.7), (int)((double)MainWindow.SCREEN_HEIGHT * 0.7));
    public static final Dimension DEBUGGER_SIZE = new Dimension(Math.min(Debugger.PREF_DEBUGGER_SIZE.width, Debugger.MAX_DEBUGGER_SIZE.width), Math.min(Debugger.PREF_DEBUGGER_SIZE.height, Debugger.MAX_DEBUGGER_SIZE.height));
    private Logger logger;
    private DebugClient client;

    public static void main(String args) {
        Debugger.launch((String[])new String[]{args});
    }

    public void start(Stage primaryStage) throws Exception {
        User user = new User("Admin", Locale.ENGLISH);
        this.client = new DebugClient(user);
        FXMLLoader loader = new FXMLLoader();
        loader.setLocation((this).getClass().getResource(FXMLFile.DEBUGGER.source()));
        this.logger = LoggerFactory.initializeLogger((this).getClass(), "de/hhn/seb/labsw/laspoly/debug/debugger_logging.properties");
        try {
            AnchorPane pane = (AnchorPane)loader.load();
            primaryStage.setScene(new Scene((Parent)pane, (double)Debugger.DEBUGGER_SIZE.width, (double)Debugger.DEBUGGER_SIZE.height));
            primaryStage.setMinWidth(600.0);
            primaryStage.setMinHeight(600.0);
            DebuggerController controller = (DebuggerController)loader.getController();
            controller.setDebugger(this);
            primaryStage.setOnCloseRequest(ev -> {
                controller.clearAllGames(null);
                System.exit(0);
            });
            primaryStage.show();
        }
        catch (IOException e) {
            this.logger.severe("Debugger couldn't start");
            e.printStackTrace();
        }
    }

    public DebugClient getClient() {
        return this.client;
    }
}

