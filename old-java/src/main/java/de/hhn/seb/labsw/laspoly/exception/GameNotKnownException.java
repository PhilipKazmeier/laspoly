/*
 * Decompiled with CFR 0.152.
 */
package de.hhn.seb.labsw.laspoly.exception;

import de.hhn.seb.labsw.laspoly.model.Game;

public class GameNotKnownException
extends Exception {
    public GameNotKnownException(Game game) {
        super("This game is not known by the server: " + String.valueOf(game));
    }

    public GameNotKnownException(int id) {
        super("This game is not known by the server (id = " + id + ")");
    }
}

