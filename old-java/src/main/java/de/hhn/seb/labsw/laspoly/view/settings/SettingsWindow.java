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
 *  javafx.stage.Modality
 *  javafx.stage.Stage
 */
package de.hhn.seb.labsw.laspoly.view.settings;

import de.hhn.seb.labsw.laspoly.model.settings.Settings;
import de.hhn.seb.labsw.laspoly.model.settings.SettingsListener;
import de.hhn.seb.labsw.laspoly.utils.LoggerFactory;
import de.hhn.seb.labsw.laspoly.utils.dataloading.DataLoader;
import de.hhn.seb.labsw.laspoly.utils.dataloading.FXMLFile;
import de.hhn.seb.labsw.laspoly.utils.dataloading.GameImage;
import de.hhn.seb.labsw.laspoly.utils.dataloading.ResourceBundleSource;
import de.hhn.seb.labsw.laspoly.view.settings.SettingsWindowController;
import java.io.IOException;
import java.util.Locale;
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
import javafx.stage.Modality;
import javafx.stage.Stage;

public class SettingsWindow
extends Stage {
    private final ResourceBundle bundle;
    private final SettingsListener settingsListener;
    private final Logger logger;
    private SettingsWindowController controller;
    private boolean isSaving = false;

    public SettingsWindow(Locale loc, SettingsListener listener) {
        this.settingsListener = listener;
        this.bundle = DataLoader.getInstance().getResourceBundle(ResourceBundleSource.SETTINGS, loc);
        this.logger = LoggerFactory.initializeLogger((this).getClass(), "de/hhn/seb/labsw/laspoly/view/view_logging.properties");
        try {
            FXMLLoader loader = FXMLFile.SETTINGS_WINDOW.toFXMLLoader((this).getClass());
            AnchorPane pane = (AnchorPane)loader.load();
            this.setScene(new Scene((Parent)pane));
            this.setTitle(this.bundle.getString("title"));
            this.controller = (SettingsWindowController)loader.getController();
            this.controller.setSettingsWindow(this);
            this.setResizable(false);
            this.initModality(Modality.APPLICATION_MODAL);
            this.getIcons().add(new Image((this).getClass().getResourceAsStream("/de/hhn/seb/labsw/laspoly/view/LasPolyIcon_64x64.png")));
            this.setOnCloseRequest(ev -> {
                if (!this.isSaving && this.controller.isUnsavedChanges()) {
                    Alert alert = new Alert(Alert.AlertType.CONFIRMATION);
                    alert.getDialogPane().getStylesheets().add((this).getClass().getResource("/de/hhn/seb/labsw/laspoly/alert.css").toExternalForm());
                    alert.getDialogPane().getStyleClass().add("alertStyle");
                    alert.setTitle(this.bundle.getString("title"));
                    alert.setHeaderText(this.bundle.getString("headerUnsaved"));
                    alert.setContentText(this.bundle.getString("contentUnsaved"));
                    Button yesButton = (Button)alert.getDialogPane().lookupButton(ButtonType.OK);
                    Button noButton = (Button)alert.getDialogPane().lookupButton(ButtonType.CANCEL);
                    ImageView checkView = new ImageView(DataLoader.getInstance().getGameImage(GameImage.CHECK));
                    checkView.setFitHeight(25.0);
                    checkView.setFitWidth(25.0);
                    yesButton.setGraphic((Node)checkView);
                    yesButton.setCursor(Cursor.HAND);
                    yesButton.getStyleClass().add("greenActionButton");
                    ImageView crossView = new ImageView(DataLoader.getInstance().getGameImage(GameImage.CROSS));
                    crossView.setFitHeight(25.0);
                    crossView.setFitWidth(25.0);
                    noButton.setGraphic((Node)crossView);
                    noButton.setCursor(Cursor.HAND);
                    noButton.getStyleClass().add("redActionButton");
                    yesButton.setText(this.bundle.getString("yes"));
                    noButton.setText(this.bundle.getString("no"));
                    Optional optional = alert.showAndWait();
                    optional.ifPresent(buttonType -> {
                        if (buttonType.equals(ButtonType.CANCEL)) {
                            ev.consume();
                        }
                    });
                    listener.onSettingsChanged(Settings.Category.SOUND);
                    listener.onSettingsChanged(Settings.Category.KEYS);
                }
            });
        }
        catch (IOException e) {
            this.logger.severe("Couldn't create a new settings window");
            e.printStackTrace();
        }
    }

    public ResourceBundle getBundle() {
        return this.bundle;
    }

    public void setIsSaving() {
        this.isSaving = true;
    }

    public SettingsListener getSettingsListener() {
        return this.settingsListener;
    }
}

