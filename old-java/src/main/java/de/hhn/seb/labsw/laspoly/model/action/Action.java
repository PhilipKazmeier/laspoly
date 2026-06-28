/*
 * Decompiled with CFR 0.152.
 */
package de.hhn.seb.labsw.laspoly.model.action;

import de.hhn.seb.labsw.laspoly.model.User;
import de.hhn.seb.labsw.laspoly.model.action.ActionType;

public abstract class Action {
    private final ActionType type;
    private final User actuator;

    public Action(ActionType actionType, User user) {
        this.type = actionType;
        this.actuator = user;
    }

    public ActionType getType() {
        return this.type;
    }

    public User getActuator() {
        return this.actuator;
    }

    public String toString() {
        return this.getClass().getName() + "{" + "type=" + this.type + ", actuator=" + this.actuator + "}";
    }
}

