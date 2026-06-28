/*
 * Decompiled with CFR 0.152.
 */
package de.hhn.seb.labsw.laspoly.utils.dataloading;

public enum GameSceneModelSource {
    PRISON("/de/hhn/seb/labsw/laspoly/view/game/gamescene/prison.obj"),
    FACTORY("/de/hhn/seb/labsw/laspoly/view/game/gamescene/factory.obj"),
    HOTEL("/de/hhn/seb/labsw/laspoly/view/game/gamescene/hotel.obj"),
    HOUSE("/de/hhn/seb/labsw/laspoly/model/house.obj"),
    INDICATOR("/de/hhn/seb/labsw/laspoly/model/arrow.obj"),
    PLAYER_INDICATOR("/de/hhn/seb/labsw/laspoly/model/arrowblue.obj"),
    DICE_CUP("/de/hhn/seb/labsw/laspoly/model/DiceCup.obj"),
    DICE_1("/de/hhn/seb/labsw/laspoly/model/rounded-dice.obj"),
    DICE_2("/de/hhn/seb/labsw/laspoly/model/rounded-dice.obj"),
    TRAIN_SIGN("/de/hhn/seb/labsw/laspoly/model/underground.obj"),
    CHIP_1_LPD("/de/hhn/seb/labsw/laspoly/view/game/gamescene/chips/oneLPD.obj"),
    CHIP_10_LPD("/de/hhn/seb/labsw/laspoly/view/game/gamescene/chips/tenLPD.obj"),
    CHIP_100_LPD("/de/hhn/seb/labsw/laspoly/view/game/gamescene/chips/hundretLPD.obj"),
    CHIP_1000_LPD("/de/hhn/seb/labsw/laspoly/view/game/gamescene/chips/thousandLPD.obj");

    private final String source;

    private GameSceneModelSource(String formSource) {
        this.source = formSource;
    }

    String source() {
        return this.source;
    }
}

