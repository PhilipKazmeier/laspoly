/*
 * Decompiled with CFR 0.152.
 */
package de.hhn.seb.labsw.laspoly.model.settings;

import de.hhn.seb.labsw.laspoly.model.settings.Settings;

public interface SettingsListener {
    public void onSettingsChanged(Settings.Category var1);
}

