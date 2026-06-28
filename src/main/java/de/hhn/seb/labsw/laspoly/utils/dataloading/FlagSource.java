/*
 * Decompiled with CFR 0.152.
 */
package de.hhn.seb.labsw.laspoly.utils.dataloading;

public enum FlagSource {
    GERMAN("/de/hhn/seb/labsw/laspoly/main/Germany-Flag.png"),
    USA("/de/hhn/seb/labsw/laspoly/main/United-States-Flag.png");

    private final String source;

    private FlagSource(String flagSource) {
        this.source = flagSource;
    }

    String source() {
        return this.source;
    }
}

