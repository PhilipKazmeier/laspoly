/*
 * Decompiled with CFR 0.152.
 */
package de.hhn.seb.labsw.laspoly.model.action;

import de.hhn.seb.labsw.laspoly.model.User;
import de.hhn.seb.labsw.laspoly.model.action.Action;
import de.hhn.seb.labsw.laspoly.model.action.ActionType;

public class MortgageAction
extends Action {
    private final int position;
    private final boolean mortgage;

    public MortgageAction(User actuator, int pos, boolean mort) {
        super(ActionType.MORTGAGE, actuator);
        this.position = pos;
        this.mortgage = mort;
    }

    public int getPosition() {
        return this.position;
    }

    public boolean isMortgage() {
        return this.mortgage;
    }

    @Override
    public String toString() {
        return this.getClass().getName() + "{" + "position=" + this.position + ", mortgage=" + this.mortgage + '}';
    }
}

