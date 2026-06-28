/*
 * Decompiled with CFR 0.152.
 */
package de.hhn.seb.labsw.laspoly.utils.dataloading;

public enum ShortSource {
    LOOP("/de/hhn/seb/labsw/laspoly/utils/audio/short/808-loop.mp3"),
    SINATRA("/de/hhn/seb/labsw/laspoly/utils/audio/short/Frank_Sinatra_-_This_Town.mp3");

    private final String source;

    private ShortSource(String formSource) {
        this.source = formSource;
    }

    public String source() {
        return this.source;
    }
}

