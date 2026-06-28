/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  javafx.fxml.FXML
 *  javafx.fxml.Initializable
 *  javafx.scene.Cursor
 *  javafx.scene.Node
 *  javafx.scene.control.Button
 *  javafx.scene.control.Tab
 *  javafx.scene.control.Tooltip
 *  javafx.scene.image.ImageView
 */
package de.hhn.seb.labsw.laspoly.view.settings;

import de.hhn.seb.labsw.laspoly.model.settings.Settings;
import de.hhn.seb.labsw.laspoly.model.settings.SettingsListener;
import de.hhn.seb.labsw.laspoly.utils.ThreadRunner;
import de.hhn.seb.labsw.laspoly.utils.dataloading.DataLoader;
import de.hhn.seb.labsw.laspoly.utils.dataloading.GameImage;
import de.hhn.seb.labsw.laspoly.view.settings.SettingsController;
import de.hhn.seb.labsw.laspoly.view.settings.SettingsWindow;
import de.hhn.seb.labsw.laspoly.view.settings.TabKeysController;
import de.hhn.seb.labsw.laspoly.view.settings.TabSoundController;
import java.net.URL;
import java.util.ResourceBundle;
import javafx.fxml.FXML;
import javafx.fxml.Initializable;
import javafx.scene.Cursor;
import javafx.scene.Node;
import javafx.scene.control.Button;
import javafx.scene.control.Tab;
import javafx.scene.control.Tooltip;
import javafx.scene.image.ImageView;

public class SettingsWindowController
implements Initializable,
SettingsController {
    @FXML
    private TabKeysController keysController;
    @FXML
    private TabSoundController soundController;
    @FXML
    private Tab tabKeys;
    @FXML
    private Tab tabSound;
    @FXML
    private Button save;
    private SettingsWindow settingsWindow;
    private boolean unsavedChanges = false;

    public void initialize(URL location, ResourceBundle resources) {
        ImageView keyboardView = new ImageView(DataLoader.getInstance().getGameImage(GameImage.KEYBOARD));
        keyboardView.setFitHeight(25.0);
        keyboardView.setFitWidth(25.0);
        this.tabKeys.setGraphic((Node)keyboardView);
        ImageView musicView = new ImageView(DataLoader.getInstance().getGameImage(GameImage.MUSIC));
        musicView.setFitHeight(25.0);
        musicView.setFitWidth(25.0);
        this.tabSound.setGraphic((Node)musicView);
        ImageView saveView = new ImageView(DataLoader.getInstance().getGameImage(GameImage.SAVE));
        saveView.setFitHeight(25.0);
        saveView.setFitWidth(25.0);
        this.save.setGraphic((Node)saveView);
    }

    public void setSettingsWindow(SettingsWindow window) {
        this.settingsWindow = window;
        this.keysController.setSettingsWindowController(this);
        this.soundController.setSettingsWindowController(this);
        this.tabKeys.setText(this.getBundle().getString("tabKeys"));
        this.tabSound.setText(this.getBundle().getString("tabSound"));
        this.save.setTooltip(new Tooltip(this.getBundle().getString("tooltipSave")));
        this.save.setText(this.getBundle().getString("save"));
        this.save.setCursor(Cursor.HAND);
    }

    public ResourceBundle getBundle() {
        return this.settingsWindow.getBundle();
    }

    @Override
    public void save() {
        SettingsListener listener = this.settingsWindow.getSettingsListener();
        this.settingsWindow.setIsSaving();
        this.settingsWindow.close();
        ThreadRunner.run(() -> {
            this.keysController.save();
            listener.onSettingsChanged(Settings.Category.KEYS);
        });
        ThreadRunner.run(() -> {
            this.soundController.save();
            listener.onSettingsChanged(Settings.Category.SOUND);
        });
    }

    public boolean isUnsavedChanges() {
        return this.unsavedChanges;
    }

    protected void setUnsavedChanges(boolean unsaved) {
        this.unsavedChanges = unsaved;
    }
}

