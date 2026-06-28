/*
 * Decompiled with CFR 0.152.
 */
package de.hhn.seb.labsw.laspoly.model.action;

import de.hhn.seb.labsw.laspoly.model.User;
import de.hhn.seb.labsw.laspoly.model.action.Action;
import de.hhn.seb.labsw.laspoly.model.action.ActionType;

public class LeaveGameAction
extends Action {
    private final User user;

    public LeaveGameAction(User actuator, User leavingUser) {
        super(ActionType.LEAVE_GAME, actuator);
        this.user = leavingUser;
    }

    public User getUser() {
        return this.user;
    }

    @Override
    public String toString() {
        return this.getClass().getName() + "{" + "user=" + this.user + '}';
    }
}

