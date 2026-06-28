/*
 * Decompiled with CFR 0.152.
 */
package de.hhn.seb.labsw.laspoly.utils.dataloading;

public enum ResourceBundleSource {
    GET_USER_DETAIL_DIALOG("de.hhn.seb.labsw.laspoly.main.GetUserDetailDialog"),
    CHANGE_DIALOG("de.hhn.seb.labsw.laspoly.view.changeDialog"),
    ERROR("de.hhn.seb.labsw.laspoly.network.client.Error"),
    MAIN_WINDOW("de.hhn.seb.labsw.laspoly.view.mainWindow"),
    GAME_LOBBY("de.hhn.seb.labsw.laspoly.view.game.lobby.GameLobby"),
    LOBBY_ADD_GAME("de.hhn.seb.labsw.laspoly.view.lobby.LobbyAddGame"),
    LOBBY("de.hhn.seb.labsw.laspoly.view.lobby.lobby"),
    GAME_SCENE("de.hhn.seb.labsw.laspoly.view.game.gamescene.GameScene"),
    SWAP_OFFER("de.hhn.seb.labsw.laspoly.view.game.gamescene.Swapoffer"),
    GAME_WINDOW("de.hhn.seb.labsw.laspoly.view.game.GameWindow"),
    ABOUT("de.hhn.seb.labsw.laspoly.view.about.about"),
    ACTION_CARD("de.hhn.seb.labsw.laspoly.model.card.action.actionCard"),
    SETTINGS("de.hhn.seb.labsw.laspoly.view.settings.settings"),
    GAME_CLOSING_DIALOG("de.hhn.seb.labsw.laspoly.view.gameClosingDialog"),
    KEY_ACTIONS("de.hhn.seb.labsw.laspoly.view.keyActions"),
    LEAVE_GAME("de.hhn.seb.labsw.laspoly.view.game.leaveGame");

    private final String source;

    private ResourceBundleSource(String bundleSource) {
        this.source = bundleSource;
    }

    String source() {
        return this.source;
    }
}

