/*
 * Decompiled with CFR 0.152.
 */
package de.hhn.seb.labsw.laspoly.model.action;

import de.hhn.seb.labsw.laspoly.model.User;
import de.hhn.seb.labsw.laspoly.model.action.Action;
import de.hhn.seb.labsw.laspoly.model.action.ActionType;

public class PaidOutOfPrisonAction
extends Action {
    private final User user;

    public PaidOutOfPrisonAction(User actuator, User payer) {
        super(ActionType.OUT_OF_PRISON, actuator);
        this.user = payer;
    }

    public User getUser() {
        return this.user;
    }
}

