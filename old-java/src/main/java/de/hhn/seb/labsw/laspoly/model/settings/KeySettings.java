/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  javafx.scene.input.KeyCode
 */
package de.hhn.seb.labsw.laspoly.model.settings;

import de.hhn.seb.labsw.laspoly.model.settings.Settings;
import java.util.HashMap;
import javafx.scene.input.KeyCode;

public class KeySettings
extends Settings {
    private HashMap<KeyAction, KeyCode> keyActionKeyCodeHashMap = new HashMap();

    public KeySettings() {
        this.keyActionKeyCodeHashMap.put(KeyAction.MUTE_UN_MUTE, KeyCode.M);
        this.keyActionKeyCodeHashMap.put(KeyAction.FULL_SCREEN, KeyCode.F);
        this.keyActionKeyCodeHashMap.put(KeyAction.SHOW_BOARD_VIEW, KeyCode.B);
        this.keyActionKeyCodeHashMap.put(KeyAction.ESC_GAME, KeyCode.ESCAPE);
    }

    public KeyCode getKeyCode(KeyAction keyAction) {
        return this.keyActionKeyCodeHashMap.get(keyAction);
    }

    public void setKeyCode(KeyAction keyAction, KeyCode keyCode) {
        this.keyActionKeyCodeHashMap.put(keyAction, keyCode);
    }

    @Override
    public Settings.Category getCategory() {
        return Settings.Category.KEYS;
    }

    public boolean containsKeyCode(KeyCode keyCode) {
        return this.keyActionKeyCodeHashMap.containsValue(keyCode);
    }

    public static enum KeyAction {
        MUTE_UN_MUTE("muteUnMute", false),
        FULL_SCREEN("fullScreen", false),
        SHOW_BOARD_VIEW("showBoardView", false),
        ESC_GAME("escGame", true);

        private final String identifier;
        private final boolean fixed;

        private KeyAction(String ident, boolean fix) {
            this.identifier = ident;
            this.fixed = fix;
        }

        public String getIdentifier() {
            return this.identifier;
        }

        public boolean isFixed() {
            return this.fixed;
        }
    }
}

