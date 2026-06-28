/*
 * Decompiled with CFR 0.152.
 */
package de.hhn.seb.labsw.laspoly.exception;

import de.hhn.seb.labsw.laspoly.model.User;

public class FigureNotFoundException
extends RuntimeException {
    public FigureNotFoundException(User user) {
        super("There was no figure found for the user: " + user.toString());
    }
}

