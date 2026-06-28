/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  javafx.application.Application
 *  javafx.application.Preloader$PreloaderNotification
 *  javafx.application.Preloader$StateChangeNotification
 *  javafx.application.Preloader$StateChangeNotification$Type
 *  javafx.stage.Stage
 */
package de.hhn.seb.labsw.laspoly.main;

import de.hhn.seb.labsw.laspoly.main.UserDialogSetup;
import de.hhn.seb.labsw.laspoly.model.User;
import de.hhn.seb.labsw.laspoly.model.card.action.ActionCardDeck;
import de.hhn.seb.labsw.laspoly.model.field.FieldConfiguration;
import de.hhn.seb.labsw.laspoly.network.client.Client;
import de.hhn.seb.labsw.laspoly.network.client.ServerClient;
import de.hhn.seb.labsw.laspoly.utils.LoggerFactory;
import de.hhn.seb.labsw.laspoly.utils.ThreadRunner;
import de.hhn.seb.labsw.laspoly.utils.VersionChecker;
import de.hhn.seb.labsw.laspoly.utils.dataloading.DataLoader;
import de.hhn.seb.labsw.laspoly.view.MainWindow;
import java.util.Locale;
import java.util.logging.Logger;
import javafx.application.Application;
import javafx.application.Preloader;
import javafx.scene.control.ButtonType;
import javafx.stage.Stage;

public class Main
extends Application {
    private static Application instance;
    private static Logger logger;
    private static int serverListIndex;
    private static String serverAddress;

    public static String getServerAddress() {
        if (serverListIndex == -1) {
            return serverAddress;
        }
        return ServerClient.SERVER_ADDRESSES[serverListIndex];
    }

    public static void main(String[] args) {
        VersionChecker.run();
        instance = new Main();
        if (args.length == 1) {
            int val;
            try {
                val = Integer.parseInt(args[0]);
            }
            catch (NumberFormatException e) {
                val = -1;
                serverAddress = args[0];
                System.out.println("Set server to:" + serverAddress);
            }
            serverListIndex = val;
        }
        Main.launch((String[])args);
    }

    public static void debuggerLaunch(String[] arguments) {
        VersionChecker.run();
        instance = new Main();
        if (arguments.length == 2) {
            int val;
            try {
                val = Integer.parseInt(arguments[0]);
            }
            catch (NumberFormatException e) {
                logger.severe("Wrong input param was given: " + arguments[0]);
                val = 0;
            }
            serverListIndex = val;
            boolean active = Boolean.parseBoolean(arguments[1]);
            ActionCardDeck.setMoveActionActive(active);
        } else {
            ActionCardDeck.setMoveActionActive(false);
            serverListIndex = 0;
        }
        try {
            instance.start(new Stage());
        }
        catch (Exception e) {
            logger.severe("Debugger couldn't start");
            e.printStackTrace();
        }
    }

    public static Application getApplication() {
        return instance;
    }

    public void start(Stage primaryStage) throws Exception {
        logger = LoggerFactory.initializeLogger((this).getClass(), "de/hhn/seb/labsw/laspoly/main/main_logging.properties");
        DataLoader.getInstance();
        ThreadRunner.run(FieldConfiguration::load);
        this.notifyPreloader((Preloader.PreloaderNotification)new Preloader.StateChangeNotification(Preloader.StateChangeNotification.Type.BEFORE_START));
        Locale selectedLocale = Locale.getDefault();
        if (!selectedLocale.equals(Locale.GERMAN) && !selectedLocale.equals(Locale.ENGLISH)) {
            selectedLocale = Locale.GERMAN;
        }
        new UserDialogSetup(selectedLocale, false).showAndWait().ifPresent(o -> {
            if (o.equals(ButtonType.CANCEL)) {
                System.exit(0);
            } else if (o instanceof User user) {
                this.startLobby(new ServerClient(user));
            }
        });
    }

    protected void startLobby(Client client) {
        Long millis = System.currentTimeMillis();
        logger.info("calculating time betw. user dialog & lobby");
        logger.fine("Starting the gui");
        DataLoader.getInstance().loadResourceBundles(client.getUser().getLocale());
        MainWindow window = new MainWindow(client);
        window.showLobby();
        window.show();
        logger.info("time btw. dialog & lobby: " + (System.currentTimeMillis() - millis));
    }

    static {
        serverListIndex = -1;
        serverAddress = ServerClient.PRODUCTION_SERVER;
    }
}

