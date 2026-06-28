/*
 * Decompiled with CFR 0.152.
 */
package de.hhn.seb.labsw.laspoly.model.action;

import de.hhn.seb.labsw.laspoly.model.User;
import de.hhn.seb.labsw.laspoly.model.action.Action;
import de.hhn.seb.labsw.laspoly.model.action.ActionType;

public class KnockDownBuildingAction
extends Action {
    private final User user;
    private final int position;

    public KnockDownBuildingAction(User knockDownUser, int pos, User actuator) {
        super(ActionType.KNOCK_DOWN_BUILDING, actuator);
        this.position = pos;
        this.user = knockDownUser;
    }

    public User getUser() {
        return this.user;
    }

    public int getPosition() {
        return this.position;
    }

    @Override
    public String toString() {
        return this.getClass().getName() + "{" + "user=" + this.user + ", position=" + this.position + '}';
    }
}

