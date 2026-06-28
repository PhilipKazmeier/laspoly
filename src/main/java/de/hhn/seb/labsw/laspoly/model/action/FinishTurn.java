/*
 * Decompiled with CFR 0.152.
 */
package de.hhn.seb.labsw.laspoly.model.action;

import de.hhn.seb.labsw.laspoly.model.User;
import de.hhn.seb.labsw.laspoly.model.action.Action;
import de.hhn.seb.labsw.laspoly.model.action.ActionType;

public class FinishTurn
extends Action {
    public FinishTurn(User actuator) {
        super(ActionType.FINISH, actuator);
    }

    @Override
    public String toString() {
        return this.getClass().getName() + "{}";
    }
}

