/*
 * Decompiled with CFR 0.152.
 */
package de.hhn.seb.labsw.laspoly.model.action;

import de.hhn.seb.labsw.laspoly.model.User;
import de.hhn.seb.labsw.laspoly.model.action.Action;
import de.hhn.seb.labsw.laspoly.model.action.ActionType;
import de.hhn.seb.labsw.laspoly.utils.dataloading.FigureSource;

public class FigureChangedAction
extends Action {
    private final User user;
    private final FigureSource figureSource;

    public FigureChangedAction(User figureUser, FigureSource source, User actuator) {
        super(ActionType.FIGURE_CHANGED, actuator);
        this.user = figureUser;
        this.figureSource = source;
    }

    public User getUser() {
        return this.user;
    }

    public FigureSource getFigureSource() {
        return this.figureSource;
    }

    @Override
    public String toString() {
        return this.getClass().getName() + "{" + "user=" + this.user + ", figureSource=" + this.figureSource + '}';
    }
}

