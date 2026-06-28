/*
 * Decompiled with CFR 0.152.
 */
package de.hhn.seb.labsw.laspoly.utils.dataloading;

public enum FigureSource {
    CAR1("/de/hhn/seb/labsw/laspoly/model/figure/car1.obj"),
    CAR2("/de/hhn/seb/labsw/laspoly/model/figure/car2.obj"),
    CAR3("/de/hhn/seb/labsw/laspoly/model/figure/car3.obj"),
    CAR4("/de/hhn/seb/labsw/laspoly/model/figure/car4.obj"),
    CAR5("/de/hhn/seb/labsw/laspoly/model/figure/car5.obj"),
    YACHT("/de/hhn/seb/labsw/laspoly/model/figure/yacht_low_poly.obj"),
    EIFFEL("/de/hhn/seb/labsw/laspoly/model/figure/Eiffel.obj"),
    ElAINE("/de/hhn/seb/labsw/laspoly/model/figure/BigElaine.obj"),
    PORL("/de/hhn/seb/labsw/laspoly/model/figure/PorlBig.obj"),
    ED("/de/hhn/seb/labsw/laspoly/model/figure/EdBig.obj"),
    CIRCUS("/de/hhn/seb/labsw/laspoly/model/figure/circus_tent.obj"),
    POLICE_CAR("/de/hhn/seb/labsw/laspoly/model/figure/police.obj");

    private static final FigureSource[] VALUES;
    private final String source;

    private FigureSource(String formSource) {
        this.source = formSource;
    }

    public String source() {
        return this.source;
    }

    public FigureSource next() {
        return VALUES[(this.ordinal() + 1) % VALUES.length];
    }

    public FigureSource previous() {
        int i = this.ordinal() - 1;
        if (i < 0) {
            i = VALUES.length - 1;
        }
        return VALUES[i];
    }

    static {
        VALUES = FigureSource.values();
    }
}

