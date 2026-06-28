/*
 * Decompiled with CFR 0.152.
 */
package de.hhn.seb.labsw.laspoly.model.action;

import de.hhn.seb.labsw.laspoly.model.User;
import de.hhn.seb.labsw.laspoly.model.action.Action;
import de.hhn.seb.labsw.laspoly.model.action.ActionType;

public class StartGameAction
extends Action {
    public StartGameAction(User actuator) {
        super(ActionType.START_GAME, actuator);
    }

    @Override
    public String toString() {
        return this.getClass().getName() + "{}";
    }
}

