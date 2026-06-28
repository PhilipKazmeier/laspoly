/*
 * Decompiled with CFR 0.152.
 */
package de.hhn.seb.labsw.laspoly.model.settings;

import de.hhn.seb.labsw.laspoly.model.settings.GeneralSettings;
import de.hhn.seb.labsw.laspoly.model.settings.KeySettings;
import de.hhn.seb.labsw.laspoly.model.settings.Settings;
import de.hhn.seb.labsw.laspoly.model.settings.SettingsListener;
import de.hhn.seb.labsw.laspoly.model.settings.SoundSettings;
import de.hhn.seb.labsw.laspoly.utils.StorageUtils;
import de.hhn.seb.labsw.laspoly.utils.audio.BackgroundMusic;
import de.hhn.seb.labsw.laspoly.utils.audio.Sound;

public class SettingsHandler
implements SettingsListener {
    private GeneralSettings generalSettings;
    private KeySettings keySettings;
    private SoundSettings soundSettings;

    public SettingsHandler() {
        this.onSettingsChanged(Settings.Category.GENERAL);
        this.onSettingsChanged(Settings.Category.KEYS);
        this.onSettingsChanged(Settings.Category.SOUND);
    }

    /*
     * WARNING - Removed try catching itself - possible behaviour change.
     */
    public void updateSettings(Settings.Category category) {
        Settings.Category category2 = category;
        synchronized (category2) {
            switch (category) {
                case GENERAL: {
                    break;
                }
                case KEYS: {
                    break;
                }
                case SOUND: {
                    Sound.setVolume(this.soundSettings.getSoundEffectVolume());
                    BackgroundMusic.setVolume(this.soundSettings.getBackgroundMusicVolume());
                    if (this.soundSettings.isSoundEffect()) {
                        Sound.unMuteAll();
                    } else {
                        Sound.muteAll();
                    }
                    if (this.soundSettings.isBackgroundMusic()) {
                        BackgroundMusic.unMute();
                        break;
                    }
                    BackgroundMusic.mute();
                    break;
                }
            }
        }
    }

    /*
     * WARNING - Removed try catching itself - possible behaviour change.
     */
    @Override
    public void onSettingsChanged(Settings.Category category) {
        Settings.Category category2 = category;
        synchronized (category2) {
            switch (category) {
                case GENERAL: {
                    this.generalSettings = (GeneralSettings)StorageUtils.loadSettings(category);
                    this.updateSettings(category);
                    break;
                }
                case KEYS: {
                    this.keySettings = (KeySettings)StorageUtils.loadSettings(category);
                    this.updateSettings(category);
                    break;
                }
                case SOUND: {
                    this.soundSettings = (SoundSettings)StorageUtils.loadSettings(category);
                    this.updateSettings(category);
                    break;
                }
            }
        }
    }

    public GeneralSettings getGeneralSettings() {
        return this.generalSettings;
    }

    public KeySettings getKeySettings() {
        return this.keySettings;
    }

    public SoundSettings getSoundSettings() {
        return this.soundSettings;
    }
}

