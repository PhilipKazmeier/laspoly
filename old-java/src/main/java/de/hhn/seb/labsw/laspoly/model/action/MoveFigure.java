/*
 * Decompiled with CFR 0.152.
 */
package de.hhn.seb.labsw.laspoly.model.action;

import de.hhn.seb.labsw.laspoly.exception.InvalidConditionException;
import de.hhn.seb.labsw.laspoly.model.User;
import de.hhn.seb.labsw.laspoly.model.action.Action;
import de.hhn.seb.labsw.laspoly.model.action.ActionType;

public class MoveFigure
extends Action {
    private final User user;
    private final int fieldPosition;
    private boolean ride = false;

    public MoveFigure(User figUser, int pos, User actuator) {
        super(ActionType.MOVE_FIGURE, actuator);
        this.user = figUser;
        this.fieldPosition = pos;
    }

    public MoveFigure(User figUser, int pos, User actuator, boolean trainRide) {
        this(figUser, pos, actuator);
        this.ride = trainRide;
        if (pos != 5 && pos != 15 && pos != 25 && pos != 35 && trainRide) {
            throw new InvalidConditionException("Train ride is positive but given pos is not a train station position");
        }
    }

    public User getUser() {
        return this.user;
    }

    public int getFieldPosition() {
        return this.fieldPosition;
    }

    public boolean isRide() {
        return this.ride;
    }

    @Override
    public String toString() {
        return this.getClass().getName() + "{" + "user=" + this.user + ", fieldPosition=" + this.fieldPosition + ", ride=" + this.ride + '}';
    }
}

