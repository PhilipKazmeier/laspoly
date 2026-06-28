/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  javafx.fxml.Initializable
 */
package de.hhn.seb.labsw.laspoly.view.settings;

import de.hhn.seb.labsw.laspoly.model.settings.GeneralSettings;
import de.hhn.seb.labsw.laspoly.model.settings.Settings;
import de.hhn.seb.labsw.laspoly.utils.StorageUtils;
import de.hhn.seb.labsw.laspoly.view.settings.SettingsController;
import de.hhn.seb.labsw.laspoly.view.settings.SettingsWindowController;
import java.net.URL;
import java.util.ResourceBundle;
import javafx.fxml.Initializable;

public class TabGeneralController
implements Initializable,
SettingsController {
    private SettingsWindowController settingsWindowController;
    private GeneralSettings settings;

    public void initialize(URL location, ResourceBundle resources) {
        this.settings = (GeneralSettings)StorageUtils.loadSettings(Settings.Category.GENERAL);
    }

    public void setSettingsWindowController(SettingsWindowController controller) {
        this.settingsWindowController = controller;
    }

    @Override
    public void save() {
        this.settings.save();
    }
}

