/*
 * Decompiled with CFR 0.152.
 */
package de.hhn.seb.labsw.laspoly.utils.dataloading;

public enum MusicSource {
    CRUISIN("/de/hhn/seb/labsw/laspoly/utils/audio/music/Cruisin.mp3"),
    THEJAZZPIANO("/de/hhn/seb/labsw/laspoly/utils/audio/music/thejazzpiano.mp3"),
    JAZZCOMEDY("/de/hhn/seb/labsw/laspoly/utils/audio/music/jazzcomedy.mp3");

    private final String source;

    private MusicSource(String formSource) {
        this.source = formSource;
    }

    public String source() {
        return this.source;
    }
}

