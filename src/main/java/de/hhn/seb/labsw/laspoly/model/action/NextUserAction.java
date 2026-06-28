/*
 * Decompiled with CFR 0.152.
 */
package de.hhn.seb.labsw.laspoly.model.action;

import de.hhn.seb.labsw.laspoly.model.User;
import de.hhn.seb.labsw.laspoly.model.action.Action;
import de.hhn.seb.labsw.laspoly.model.action.ActionType;

public class NextUserAction
extends Action {
    private final User user;

    public NextUserAction(User nextUser, User actuator) {
        super(ActionType.NEXT_USER, actuator);
        this.user = nextUser;
    }

    public User getUser() {
        return this.user;
    }

    @Override
    public String toString() {
        return this.getClass().getName() + "{" + "user=" + this.user + '}';
    }
}

