/*
 * Decompiled with CFR 0.152.
 */
package de.hhn.seb.labsw.laspoly.exception;

import de.hhn.seb.labsw.laspoly.model.Game;

public class GameClosedException
extends Exception {
    public GameClosedException(Game game) {
        super("Game was closed: " + String.valueOf(game));
    }
}

