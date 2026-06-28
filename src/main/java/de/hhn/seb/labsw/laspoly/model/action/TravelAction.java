/*
 * Decompiled with CFR 0.152.
 */
package de.hhn.seb.labsw.laspoly.model.action;

import de.hhn.seb.labsw.laspoly.exception.InvalidParameterException;
import de.hhn.seb.labsw.laspoly.model.User;
import de.hhn.seb.labsw.laspoly.model.action.Action;
import de.hhn.seb.labsw.laspoly.model.action.ActionType;

public class TravelAction
extends Action {
    private final User user;
    private final int position;

    public TravelAction(User actuator, User traveler, int pos) {
        super(ActionType.TRAVEL, actuator);
        this.user = traveler;
        if (pos != 5 && pos != 15 && pos != 25 && pos != 35) {
            throw new InvalidParameterException("Given position should be a train station positon", "pos", pos);
        }
        this.position = pos;
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

