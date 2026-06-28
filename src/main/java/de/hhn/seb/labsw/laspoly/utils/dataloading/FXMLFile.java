/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  javafx.fxml.FXMLLoader
 */
package de.hhn.seb.labsw.laspoly.utils.dataloading;

import de.hhn.seb.labsw.laspoly.utils.LoggerFactory;
import java.io.IOException;
import java.util.logging.Logger;
import javafx.fxml.FXMLLoader;

public enum FXMLFile {
    USER_SETUP_DIALOG("/de/hhn/seb/labsw/laspoly/main/usersetupdialog.fxml"),
    DEBUGGER("/de/hhn/seb/labsw/laspoly/debug/debug.fxml"),
    DEBUG_MAIN("/de/hhn/seb/labsw/laspoly/debug/debugMain.fxml"),
    BUY_DIALOG("/de/hhn/seb/labsw/laspoly/view/game/gamescene/buydialog.fxml"),
    SWAPOFFER_DIALOG("/de/hhn/seb/labsw/laspoly/view/game/gamescene/swapofferdialog.fxml"),
    SWAP_PANE("/de/hhn/seb/labsw/laspoly/view/game/gamescene/swapoffer.fxml"),
    SWAP_OFFER("/de/hhn/seb/labsw/laspoly/view/game/gamescene/swapoffer.fxml"),
    PROP_LIST("/de/hhn/seb/labsw/laspoly/view/game/gamescene/propertycardlist.fxml"),
    FINISH_DIALOG("/de/hhn/seb/labsw/laspoly/view/game/gamescene/finishturn.fxml"),
    CASINODIALOG("/de/hhn/seb/labsw/laspoly/view/game/gamescene/Casinodialog.fxml"),
    TICKET("/de/hhn/seb/labsw/laspoly/view/game/gamescene/ticketdialog.fxml"),
    MORTGAGE_DIALOG("/de/hhn/seb/labsw/laspoly/view/game/gamescene/mortgagedialog.fxml"),
    PREVIEW_ATTRACTION("/de/hhn/seb/labsw/laspoly/view/game/gamescene/preview_attraction.fxml"),
    NAME_LABEL("/de/hhn/seb/labsw/laspoly/view/game/gamescene/namelabel.fxml"),
    PREVIEW_GO_TO_PRISON_FIELD("/de/hhn/seb/labsw/laspoly/view/game/gamescene/preview_gotoprison.fxml"),
    PREVIEW_FREE_PARKING("/de/hhn/seb/labsw/laspoly/view/game/gamescene/preview_freeparking.fxml"),
    PREVIEW_CASINO("/de/hhn/seb/labsw/laspoly/view/game/gamescene/preview_casino.fxml"),
    PREVIEW_PAY_TO_CASINO_FIELD("/de/hhn/seb/labsw/laspoly/view/game/gamescene/preview_pay_into_casino.fxml"),
    PREVIEW_START_FIELD("/de/hhn/seb/labsw/laspoly/view/game/gamescene/preview_startfield.fxml"),
    PREVIEW_STREET("/de/hhn/seb/labsw/laspoly/view/game/gamescene/preview_street.fxml"),
    PREVIEW_ACTION_FIELD("/de/hhn/seb/labsw/laspoly/view/game/gamescene/preview_actionfield.fxml"),
    PREVIEW_PLAYER("/de/hhn/seb/labsw/laspoly/view/game/gamescene/preview_player.fxml"),
    PREVIEW_PRISON("/de/hhn/seb/labsw/laspoly/view/game/gamescene/preview_prison.fxml"),
    PREVIEW_STATION("/de/hhn/seb/labsw/laspoly/view/game/gamescene/preview_station.fxml"),
    MAIN_WINDOW("/de/hhn/seb/labsw/laspoly/view/mainWindow.fxml"),
    ABOUT("/de/hhn/seb/labsw/laspoly/view/about/aboutDialog.fxml"),
    GAME_LOBBY("/de/hhn/seb/labsw/laspoly/view/game/lobby/gameLobby.fxml"),
    GAME_WINDOW("/de/hhn/seb/labsw/laspoly/view/game/gameWindow.fxml"),
    LOBBY("/de/hhn/seb/labsw/laspoly/view/lobby/lobbyWindow.fxml"),
    LIST_USER("/de/hhn/seb/labsw/laspoly/view/game/lobby/list_user.fxml"),
    USER_MESSAGE("/de/hhn/seb/labsw/laspoly/model/message/userMessage.fxml"),
    SYSTEM_MESSAGE("/de/hhn/seb/labsw/laspoly/model/message/systemMessage.fxml"),
    INGAME_MESSAGE("/de/hhn/seb/labsw/laspoly/model/message/ingamesMessage.fxml"),
    NEW_MESSAGE_DIALOG("/de/hhn/seb/labsw/laspoly/model/message/newMessageDialog.fxml"),
    SETTINGS_WINDOW("/de/hhn/seb/labsw/laspoly/view/settings/settingsWindow.fxml"),
    KEY_SETTINGS_DIALOG("/de/hhn/seb/labsw/laspoly/view/settings/keySettingsDialog.fxml");

    private final String source;
    private Logger logger;

    private FXMLFile(String fileSource) {
        this.source = fileSource;
        this.logger = LoggerFactory.initializeLogger((this).getClass(), "de/hhn/seb/labsw/laspoly/main/main_logging.properties");
    }

    public String source() {
        return this.source;
    }

    public FXMLLoader toFXMLLoader(Class aClass) {
        return new FXMLLoader(aClass.getResource(this.source));
    }

    public <T> T toLayout(Class aClass) {
        try {
            return (T)this.toFXMLLoader(aClass).load();
        }
        catch (IOException e) {
            e.printStackTrace();
            this.logger.severe("Couldn't load the layout fxml file: " + e.getMessage());
            throw new RuntimeException("could not load layout fxml file: " + this.source);
        }
    }
}

