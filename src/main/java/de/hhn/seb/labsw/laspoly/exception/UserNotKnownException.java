/*
 * Decompiled with CFR 0.152.
 */
package de.hhn.seb.labsw.laspoly.exception;

import de.hhn.seb.labsw.laspoly.model.User;

public class UserNotKnownException
extends Exception {
    public UserNotKnownException(User user) {
        super("This user is not known by the server: " + String.valueOf(user));
    }
}

