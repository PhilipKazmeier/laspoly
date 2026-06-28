/*
 * Decompiled with CFR 0.152.
 */
package de.hhn.seb.labsw.laspoly.exception;

import de.hhn.seb.labsw.laspoly.model.action.Action;

public class InvalidActionException
extends RuntimeException {
    public InvalidActionException(Action action, String error) {
        super("Invalid action: " + action.toString() + " // " + error);
    }
}

