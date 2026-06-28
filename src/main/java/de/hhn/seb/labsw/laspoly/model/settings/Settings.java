/*
 * Decompiled with CFR 0.152.
 */
package de.hhn.seb.labsw.laspoly.model.settings;

import de.hhn.seb.labsw.laspoly.utils.StorageUtils;

public abstract class Settings {
    public void save() {
        StorageUtils.saveSetting(this, this.getCategory());
    }

    public abstract Category getCategory();

    public static enum Category {
        GENERAL("general"),
        KEYS("keys"),
        SOUND("sound");

        private String name;

        private Category(String fileName) {
            this.name = fileName;
        }

        public String getName() {
            return this.name;
        }
    }
}

