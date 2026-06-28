/*
 * Decompiled with CFR 0.152.
 */
package de.hhn.seb.labsw.laspoly.model.action;

import de.hhn.seb.labsw.laspoly.model.User;
import de.hhn.seb.labsw.laspoly.model.action.Action;
import de.hhn.seb.labsw.laspoly.model.action.ActionType;

public class RolledAction
extends Action {
    private final User roller;
    private final int rollOne;
    private final int rollTwo;

    public RolledAction(User user, int roll1, int roll2, User actuator) {
        super(ActionType.ROLLED, actuator);
        this.roller = user;
        this.rollOne = roll1;
        this.rollTwo = roll2;
    }

    public User getRoller() {
        return this.roller;
    }

    public int getRollOne() {
        return this.rollOne;
    }

    public int getRollTwo() {
        return this.rollTwo;
    }

    @Override
    public String toString() {
        return this.getClass().getName() + "{" + "roller=" + this.roller + ", rollOne=" + this.rollOne + ", rollTwo=" + this.rollTwo + '}';
    }
}

