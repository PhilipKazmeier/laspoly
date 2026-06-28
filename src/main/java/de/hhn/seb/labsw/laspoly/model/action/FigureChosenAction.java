/*
 * Decompiled with CFR 0.152.
 */
package de.hhn.seb.labsw.laspoly.model.action;

import de.hhn.seb.labsw.laspoly.model.User;
import de.hhn.seb.labsw.laspoly.model.action.Action;
import de.hhn.seb.labsw.laspoly.model.action.ActionType;

public class FigureChosenAction
extends Action {
    private final User user;
    private final boolean hasSelected;

    public FigureChosenAction(User actuator, User readyUser, boolean hasSel) {
        super(ActionType.FIGURE_CHOSEN, actuator);
        this.user = readyUser;
        this.hasSelected = hasSel;
    }

    public User getUser() {
        return this.user;
    }

    public boolean isHasSelected() {
        return this.hasSelected;
    }

    @Override
    public String toString() {
        return this.getClass().getName() + "{" + "user=" + this.user + ", hasSelected=" + this.hasSelected + '}';
    }
}

