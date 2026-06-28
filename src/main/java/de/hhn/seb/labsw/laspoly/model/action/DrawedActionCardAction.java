/*
 * Decompiled with CFR 0.152.
 */
package de.hhn.seb.labsw.laspoly.model.action;

import de.hhn.seb.labsw.laspoly.model.User;
import de.hhn.seb.labsw.laspoly.model.action.Action;
import de.hhn.seb.labsw.laspoly.model.action.ActionType;
import java.util.Arrays;

public class DrawedActionCardAction
extends Action {
    private final User drawer;
    private final String identifier;
    private final Object[] values;

    public DrawedActionCardAction(User actuator, User cardDrawer, String ident, Object[] vals) {
        super(ActionType.ACTION_CARD, actuator);
        this.drawer = cardDrawer;
        this.identifier = ident;
        this.values = vals;
    }

    public User getDrawer() {
        return this.drawer;
    }

    public String getIdentifier() {
        return this.identifier;
    }

    public Object[] getValues() {
        return this.values;
    }

    @Override
    public String toString() {
        return this.getClass().getName() + "{drawer=" + this.drawer + ", identifier='" + this.identifier + '\'' + ", values=" + Arrays.toString(this.values) + '}';
    }
}

