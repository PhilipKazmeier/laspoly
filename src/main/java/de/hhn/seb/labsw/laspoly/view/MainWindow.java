/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  javafx.fxml.FXMLLoader
 *  javafx.scene.Cursor
 *  javafx.scene.Node
 *  javafx.scene.Parent
 *  javafx.scene.Scene
 *  javafx.scene.control.Alert
 *  javafx.scene.control.Alert$AlertType
 *  javafx.scene.control.Button
 *  javafx.scene.control.ButtonType
 *  javafx.scene.image.Image
 *  javafx.scene.image.ImageView
 *  javafx.scene.layout.AnchorPane
 *  javafx.stage.Stage
 */
package de.hhn.seb.labsw.laspoly.view;

import de.hhn.seb.labsw.laspoly.network.client.Client;
import de.hhn.seb.labsw.laspoly.utils.LoggerFactory;
import de.hhn.seb.labsw.laspoly.utils.dataloading.DataLoader;
import de.hhn.seb.labsw.laspoly.utils.dataloading.FXMLFile;
import de.hhn.seb.labsw.laspoly.utils.dataloading.GameImage;
import de.hhn.seb.labsw.laspoly.utils.dataloading.ResourceBundleSource;
import de.hhn.seb.labsw.laspoly.view.MainWindowController;
import java.awt.Dimension;
import java.awt.Toolkit;
import java.io.IOException;
import java.util.Optional;
import java.util.ResourceBundle;
import java.util.logging.Logger;
import javafx.fxml.FXMLLoader;
import javafx.scene.Cursor;
import javafx.scene.Node;
import javafx.scene.Parent;
import javafx.scene.Scene;
import javafx.scene.control.Alert;
import javafx.scene.control.Button;
import javafx.scene.control.ButtonType;
import javafx.scene.image.Image;
import javafx.scene.image.ImageView;
import javafx.scene.layout.AnchorPane;
import javafx.stage.Stage;

public class MainWindow
extends Stage {
    public static final int SCREEN_WIDTH = Toolkit.getDefaultToolkit().getScreenSize().width;
    public static final int SCREEN_HEIGHT = Toolkit.getDefaultToolkit().getScreenSize().height;
    public static final Dimension MIN_GAME_SIZE = new Dimension(940, 705);
    private static final Dimension MAX_LOBBY_SIZE = new Dimension((int)((double)SCREEN_WIDTH * 0.7), (int)((double)SCREEN_HEIGHT * 0.8));
    private static final Dimension MAX_GAME_SIZE = new Dimension((int)((double)SCREEN_WIDTH * 0.8), (int)((double)SCREEN_HEIGHT * 0.9));
    public static final Dimension GAME_SIZE = new Dimension(Math.max(MainWindow.MIN_GAME_SIZE.width, MainWindow.MAX_GAME_SIZE.width), Math.max(MainWindow.MIN_GAME_SIZE.height, MainWindow.MAX_GAME_SIZE.height));
    private static final Dimension PREF_LOBBY_SIZE = new Dimension(610, 600);
    public static final Dimension LOBBY_SIZE = new Dimension(Math.min(MainWindow.PREF_LOBBY_SIZE.width, MainWindow.MAX_LOBBY_SIZE.width), Math.min(MainWindow.PREF_LOBBY_SIZE.height, MainWindow.MAX_LOBBY_SIZE.height));
    private final Logger logger;
    private final MainWindowController controller;

    public MainWindow(final Client client) {
        FXMLLoader loader = FXMLFile.MAIN_WINDOW.toFXMLLoader((this).getClass());
        this.logger = LoggerFactory.initializeLogger((this).getClass(), "de/hhn/seb/labsw/laspoly/view/view_logging.properties");
        try {
            AnchorPane pane = (AnchorPane)loader.load();
            this.setScene(new Scene((Parent)pane, (double)MainWindow.LOBBY_SIZE.width, (double)MainWindow.LOBBY_SIZE.height));
            this.setMinWidth(620.0);
            this.setMinHeight(620.0);
            this.getIcons().add(new Image((this).getClass().getResourceAsStream("/de/hhn/seb/labsw/laspoly/view/LasPolyIcon_64x64.png")));
        }
        catch (IOException e2) {
            this.logger.severe("Couldn't create a new main window with the given client.");
            e2.printStackTrace();
        }
        this.setTitle("Las Poly");
        this.controller = (MainWindowController)loader.getController();
        this.controller.setMainWindow(this);
        this.controller.setClient(client);
        Runtime.getRuntime().addShutdownHook(new Thread(){

            @Override
            public void run() {
                MainWindow.this.controller.stopUpdate();
                client.logout();
            }
        });
        this.getScene().setOnKeyPressed(this.controller::onKeyPressed);
        this.getScene().setOnKeyReleased(this.controller::onKeyReleased);
        this.setOnCloseRequest(e -> {
            ResourceBundle bundle = DataLoader.getInstance().getResourceBundle(ResourceBundleSource.GAME_CLOSING_DIALOG, client.getUser().getLocale());
            Alert alert = new Alert(Alert.AlertType.CONFIRMATION);
            alert.getDialogPane().getStylesheets().add((this).getClass().getResource("/de/hhn/seb/labsw/laspoly/alert.css").toExternalForm());
            alert.getDialogPane().getStyleClass().add("alertStyle");
            Stage stage = (Stage)alert.getDialogPane().getScene().getWindow();
            stage.getIcons().add(new Image((this).getClass().getResourceAsStream("/de/hhn/seb/labsw/laspoly/view/LasPolyIcon_64x64.png")));
            alert.setTitle(bundle.getString("title"));
            alert.setHeaderText(bundle.getString("header"));
            alert.setContentText(bundle.getString("content"));
            Button submitButton = (Button)alert.getDialogPane().lookupButton(ButtonType.OK);
            Button cancelButton = (Button)alert.getDialogPane().lookupButton(ButtonType.CANCEL);
            ImageView checkView = new ImageView(DataLoader.getInstance().getGameImage(GameImage.CHECK));
            checkView.setFitHeight(25.0);
            checkView.setFitWidth(25.0);
            submitButton.setGraphic((Node)checkView);
            submitButton.setCursor(Cursor.HAND);
            submitButton.getStyleClass().add("greenActionButton");
            ImageView crossView = new ImageView(DataLoader.getInstance().getGameImage(GameImage.CROSS));
            crossView.setFitHeight(25.0);
            crossView.setFitWidth(25.0);
            cancelButton.setGraphic((Node)crossView);
            cancelButton.setCursor(Cursor.HAND);
            cancelButton.getStyleClass().add("redActionButton");
            Optional optional = alert.showAndWait();
            optional.ifPresent(buttonType -> {
                if (buttonType.equals(ButtonType.CANCEL)) {
                    e.consume();
                } else {
                    this.controller.closeProgram();
                    System.exit(0);
                }
            });
        });
    }

    public final void showLobby() {
        this.controller.showLobby();
    }
}

