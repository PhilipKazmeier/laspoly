/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  javafx.fxml.FXML
 *  javafx.fxml.Initializable
 *  javafx.scene.control.Label
 *  javafx.scene.control.Slider
 *  javafx.scene.control.ToggleButton
 *  javafx.scene.control.Tooltip
 */
package de.hhn.seb.labsw.laspoly.view.settings;

import de.hhn.seb.labsw.laspoly.model.settings.Settings;
import de.hhn.seb.labsw.laspoly.model.settings.SoundSettings;
import de.hhn.seb.labsw.laspoly.utils.StorageUtils;
import de.hhn.seb.labsw.laspoly.utils.audio.BackgroundMusic;
import de.hhn.seb.labsw.laspoly.utils.audio.Sound;
import de.hhn.seb.labsw.laspoly.view.settings.SettingsController;
import de.hhn.seb.labsw.laspoly.view.settings.SettingsWindowController;
import java.net.URL;
import java.util.ResourceBundle;
import javafx.fxml.FXML;
import javafx.fxml.Initializable;
import javafx.scene.control.Label;
import javafx.scene.control.Slider;
import javafx.scene.control.ToggleButton;
import javafx.scene.control.Tooltip;

public class TabSoundController
implements Initializable,
SettingsController {
    @FXML
    private Label soundLabel;
    @FXML
    private Label backgroundMusicLabel;
    @FXML
    private Label soundEffectsLabel;
    @FXML
    private Slider soundSlider;
    @FXML
    private Slider backgroundMusicSlider;
    @FXML
    private Slider soundEffectSlider;
    @FXML
    private ToggleButton soundCheckBox;
    @FXML
    private ToggleButton backgroundMusicCheckBox;
    @FXML
    private ToggleButton soundEffectsCheckBox;
    private SettingsWindowController settingsWindowController;
    private SoundSettings settings;

    public void initialize(URL location, ResourceBundle resources) {
        this.settings = (SoundSettings)StorageUtils.loadSettings(Settings.Category.SOUND);
        this.soundCheckBox.setUserData(true);
        this.soundEffectsCheckBox.setUserData(true);
        this.backgroundMusicCheckBox.setUserData(true);
        this.soundCheckBox.setSelected(this.settings.isSound());
        this.backgroundMusicCheckBox.setSelected(this.settings.isBackgroundMusic());
        this.soundEffectsCheckBox.setSelected(this.settings.isSoundEffect());
        this.soundSlider.setValue(this.settings.getSoundVolume());
        this.backgroundMusicSlider.setValue(this.settings.getBackgroundMusicVolume());
        this.soundEffectSlider.setValue(this.settings.getSoundEffectVolume());
        this.soundSlider.valueProperty().addListener((observable, oldValue, newValue) -> {
            this.settingsWindowController.setUnsavedChanges(true);
            this.backgroundMusicSlider.setValue(Math.min(newValue.doubleValue(), this.backgroundMusicSlider.getValue()));
            this.soundEffectSlider.setValue(Math.min(newValue.doubleValue(), this.soundEffectSlider.getValue()));
            this.settings.setSoundVolume(newValue.doubleValue());
        });
        this.backgroundMusicSlider.valueProperty().addListener((observable, oldValue, newValue) -> {
            this.settingsWindowController.setUnsavedChanges(true);
            this.soundSlider.setValue(Math.max(newValue.doubleValue(), this.soundSlider.getValue()));
            this.settings.setBackgroundMusicVolume(newValue.doubleValue());
            BackgroundMusic.setVolume(newValue.doubleValue());
        });
        this.soundEffectSlider.valueProperty().addListener((observable, oldValue, newValue) -> {
            this.settingsWindowController.setUnsavedChanges(true);
            this.soundSlider.setValue(Math.max(newValue.doubleValue(), this.soundSlider.getValue()));
            this.settings.setSoundEffectVolume(newValue.doubleValue());
            Sound.setVolume(newValue.doubleValue());
        });
    }

    @FXML
    public void backgroundMusicChecked() {
        this.settingsWindowController.setUnsavedChanges(true);
        this.settings.setBackgroundMusic(this.backgroundMusicCheckBox.isSelected());
        if (this.backgroundMusicCheckBox.isSelected()) {
            BackgroundMusic.unMute();
        } else {
            BackgroundMusic.mute();
        }
        if (this.backgroundMusicCheckBox.isSelected()) {
            this.backgroundMusicCheckBox.setTooltip(new Tooltip(this.settingsWindowController.getBundle().getString("tooltipMute")));
        } else {
            this.backgroundMusicCheckBox.setTooltip(new Tooltip(this.settingsWindowController.getBundle().getString("tooltipUnmute")));
        }
    }

    @FXML
    public void soundEffectsChecked() {
        this.settingsWindowController.setUnsavedChanges(true);
        this.settings.setSoundEffect(this.soundEffectsCheckBox.isSelected());
        if (this.soundEffectsCheckBox.isSelected()) {
            Sound.unMuteAll();
        } else {
            Sound.muteAll();
        }
        if (this.soundEffectsCheckBox.isSelected()) {
            this.soundEffectsCheckBox.setTooltip(new Tooltip(this.settingsWindowController.getBundle().getString("tooltipMute")));
        } else {
            this.soundEffectsCheckBox.setTooltip(new Tooltip(this.settingsWindowController.getBundle().getString("tooltipUnmute")));
        }
    }

    @FXML
    public void soundChecked() {
        this.settingsWindowController.setUnsavedChanges(true);
        this.settings.setSound(this.soundCheckBox.isSelected());
        if (((Boolean)this.soundEffectsCheckBox.getUserData()).booleanValue()) {
            this.soundEffectsCheckBox.setSelected(false);
        }
        if (((Boolean)this.backgroundMusicCheckBox.getUserData()).booleanValue()) {
            this.backgroundMusicCheckBox.setSelected(false);
        }
        if (this.soundCheckBox.isSelected()) {
            this.soundCheckBox.setTooltip(new Tooltip(this.settingsWindowController.getBundle().getString("tooltipMute")));
        } else {
            this.soundCheckBox.setTooltip(new Tooltip(this.settingsWindowController.getBundle().getString("tooltipUnmute")));
        }
        this.backgroundMusicChecked();
        this.soundEffectsChecked();
    }

    public void setSettingsWindowController(SettingsWindowController controller) {
        this.settingsWindowController = controller;
        this.soundLabel.setText(this.settingsWindowController.getBundle().getString("soundLabel"));
        this.backgroundMusicLabel.setText(this.settingsWindowController.getBundle().getString("backgroundMusicLabel"));
        this.soundEffectsLabel.setText(this.settingsWindowController.getBundle().getString("soundEffectsLabel"));
        this.soundLabel.setTooltip(new Tooltip(this.settingsWindowController.getBundle().getString("soundTooltip")));
        this.backgroundMusicLabel.setTooltip(new Tooltip(this.settingsWindowController.getBundle().getString("backgroundMusicTooltip")));
        if (this.soundCheckBox.isSelected()) {
            this.soundCheckBox.setTooltip(new Tooltip(this.settingsWindowController.getBundle().getString("tooltipMute")));
        } else {
            this.soundCheckBox.setTooltip(new Tooltip(this.settingsWindowController.getBundle().getString("tooltipUnmute")));
        }
        if (this.backgroundMusicCheckBox.isSelected()) {
            this.backgroundMusicCheckBox.setTooltip(new Tooltip(this.settingsWindowController.getBundle().getString("tooltipMute")));
        } else {
            this.backgroundMusicCheckBox.setTooltip(new Tooltip(this.settingsWindowController.getBundle().getString("tooltipUnmute")));
        }
        if (this.soundEffectsCheckBox.isSelected()) {
            this.soundEffectsCheckBox.setTooltip(new Tooltip(this.settingsWindowController.getBundle().getString("tooltipMute")));
        } else {
            this.soundEffectsCheckBox.setTooltip(new Tooltip(this.settingsWindowController.getBundle().getString("tooltipUnmute")));
        }
    }

    @Override
    public void save() {
        this.settings.save();
    }
}

