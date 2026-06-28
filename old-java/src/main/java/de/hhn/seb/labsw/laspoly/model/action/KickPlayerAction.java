/*
 * Decompiled with CFR 0.152.
 */
package de.hhn.seb.labsw.laspoly.model.action;

import de.hhn.seb.labsw.laspoly.model.User;
import de.hhn.seb.labsw.laspoly.model.action.Action;
import de.hhn.seb.labsw.laspoly.model.action.ActionType;

public class KickPlayerAction
extends Action {
    private final User user;
    private final String identifier;

    public KickPlayerAction(User actuator, User kickedUser, String ident) {
        super(ActionType.KICK_PLAYER, actuator);
        this.user = kickedUser;
        this.identifier = ident;
    }

    public User getUser() {
        return this.user;
    }

    @Override
    public String toString() {
        return this.getClass().getName() + "{" + "user=" + this.user + '}';
    }

    public String getIdentifier() {
        return this.identifier;
    }
}

