/*
 * Decompiled with CFR 0.152.
 */
package de.hhn.seb.labsw.laspoly.model.settings;

import de.hhn.seb.labsw.laspoly.model.settings.Settings;

public class SoundSettings
extends Settings {
    private boolean sound = true;
    private boolean backgroundMusic = true;
    private boolean soundEffect = true;
    private double soundVolume = 100.0;
    private double backgroundMusicVolume = 100.0;
    private double soundEffectVolume = 100.0;

    @Override
    public Settings.Category getCategory() {
        return Settings.Category.SOUND;
    }

    public boolean isSound() {
        return this.sound;
    }

    public void setSound(boolean s) {
        this.sound = s;
    }

    public boolean isBackgroundMusic() {
        return this.backgroundMusic;
    }

    public void setBackgroundMusic(boolean bM) {
        this.backgroundMusic = bM;
    }

    public boolean isSoundEffect() {
        return this.soundEffect;
    }

    public void setSoundEffect(boolean sE) {
        this.soundEffect = sE;
    }

    public double getSoundVolume() {
        return this.soundVolume;
    }

    public void setSoundVolume(double sV) {
        this.soundVolume = sV;
    }

    public double getBackgroundMusicVolume() {
        return this.backgroundMusicVolume;
    }

    public void setBackgroundMusicVolume(double bMV) {
        this.backgroundMusicVolume = bMV;
    }

    public double getSoundEffectVolume() {
        return this.soundEffectVolume;
    }

    public void setSoundEffectVolume(double sEV) {
        this.soundEffectVolume = sEV;
    }
}

