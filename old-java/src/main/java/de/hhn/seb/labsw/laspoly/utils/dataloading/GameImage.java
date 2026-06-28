/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  javafx.scene.image.ImageView
 */
package de.hhn.seb.labsw.laspoly.utils.dataloading;

import de.hhn.seb.labsw.laspoly.utils.dataloading.DataLoader;
import javafx.scene.image.ImageView;

public enum GameImage {
    IC_SELECTOR("/de/hhn/seb/labsw/laspoly/view/game/gamescene/selector.png"),
    IC_PAY("/de/hhn/seb/labsw/laspoly/view/game/gamescene/ic_pay.png"),
    IC_ACTIONCARD("/de/hhn/seb/labsw/laspoly/view/game/gamescene/actioncard.png"),
    IC_GO_TO_PRISON("/de/hhn/seb/labsw/laspoly/view/game/gamescene/ic_police.png"),
    TEXTURE_BOARD("/de/hhn/seb/labsw/laspoly/view/game/gamescene/tex_felt.png"),
    IC_GO_TO_PRISON_ROTATE("/de/hhn/seb/labsw/laspoly/view/game/gamescene/ic_police_rot.png"),
    IC_CASINO_ROTATE("/de/hhn/seb/labsw/laspoly/view/game/gamescene/ic_casino_rot.png"),
    IC_CASINO("/de/hhn/seb/labsw/laspoly/view/game/gamescene/ic_casino.png"),
    CARD_PATTERN("/de/hhn/seb/labsw/laspoly/view/game/gamescene/cardpattern.png"),
    TABLE_PATTERN("/de/hhn/seb/labsw/laspoly/view/game/gamescene/pattern_table.png"),
    CARD_PATTERN_HOVER("/de/hhn/seb/labsw/laspoly/view/game/gamescene/cardpattern_hover.png"),
    IC_CIRCUS("/de/hhn/seb/labsw/laspoly/view/game/gamescene/ic_circus.png"),
    IC_PARKING("/de/hhn/seb/labsw/laspoly/view/game/gamescene/ic_parking.png"),
    IC_INFO("/de/hhn/seb/labsw/laspoly/view/game/gamescene/ic_info.png"),
    IC_JAIL("/de/hhn/seb/labsw/laspoly/view/game/gamescene/ic_jail.png"),
    IC_WHEEL("/de/hhn/seb/labsw/laspoly/view/game/gamescene/ic_bigwheel.png"),
    IC_TRAIN_STATION("/de/hhn/seb/labsw/laspoly/view/game/gamescene/ic_trainstation.png"),
    PROPERTY_CARD_BACK("/de/hhn/seb/labsw/laspoly/view/game/gamescene/propertyCardBack.png"),
    PLUS_ORANGE("/de/hhn/seb/labsw/laspoly/view/PlusOrange.png"),
    PLUS_GREY("/de/hhn/seb/labsw/laspoly/view/PlusGrey.png"),
    PLUS_GREEN("/de/hhn/seb/labsw/laspoly/main/PlusGreen.png"),
    GEAR("/de/hhn/seb/labsw/laspoly/view/Zahnrad.png"),
    QUESTION_MARK("/de/hhn/seb/labsw/laspoly/view/Fragezeichen.png"),
    ARROW("/de/hhn/seb/labsw/laspoly/view/game/lobby/arrow.png"),
    ARROW_LEFT("/de/hhn/seb/labsw/laspoly/view/game/lobby/arrowLeft.png"),
    ARROW_RIGHT("/de/hhn/seb/labsw/laspoly/view/game/lobby/arrowRight.png"),
    ARROW_ORANGE("/de/hhn/seb/labsw/laspoly/view/game/lobby/arrow_orange.png"),
    EDIT("/de/hhn/seb/labsw/laspoly/view/game/lobby/edit.png"),
    CROSS("/de/hhn/seb/labsw/laspoly/view/game/lobby/cross.png"),
    CROSS_GRAY("/de/hhn/seb/labsw/laspoly/view/crossGray.png"),
    CROSS_WHITE("/de/hhn/seb/labsw/laspoly/view/game/gamescene/crossWhite.png"),
    CHECK("/de/hhn/seb/labsw/laspoly/view/game/lobby/check.png"),
    SEND("/de/hhn/seb/labsw/laspoly/view/game/lobby/sendIcon.png"),
    KEYBOARD("/de/hhn/seb/labsw/laspoly/view/settings/keyboard.png"),
    MUSIC("/de/hhn/seb/labsw/laspoly/view/settings/music.png"),
    SAVE("/de/hhn/seb/labsw/laspoly/view/settings/saveIcon.png"),
    EXCHANGE("/de/hhn/seb/labsw/laspoly/view/game/gamescene/exchange.png"),
    HOME("/de/hhn/seb/labsw/laspoly/view/game/gamescene/home.png"),
    ENVELOPE("/de/hhn/seb/labsw/laspoly/view/game/gamescene/envelope.png"),
    PLUS_WHITE("/de/hhn/seb/labsw/laspoly/view/plusWhite.png");

    private final String source;

    private GameImage(String imageSource) {
        this.source = imageSource;
    }

    public ImageView toButtonGraphic() {
        ImageView imgV = new ImageView(DataLoader.getInstance().getGameImage(this));
        imgV.setFitHeight(25.0);
        imgV.setFitWidth(25.0);
        return imgV;
    }

    String source() {
        return this.source;
    }
}

