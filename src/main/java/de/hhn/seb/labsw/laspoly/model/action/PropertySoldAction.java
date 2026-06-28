/*
 * Decompiled with CFR 0.152.
 */
package de.hhn.seb.labsw.laspoly.model.action;

import de.hhn.seb.labsw.laspoly.model.User;
import de.hhn.seb.labsw.laspoly.model.action.Action;
import de.hhn.seb.labsw.laspoly.model.action.ActionType;
import de.hhn.seb.labsw.laspoly.model.field.Property;

public class PropertySoldAction
extends Action {
    private final int position;

    public PropertySoldAction(User actuator, Property prop) {
        super(ActionType.PROPERTY_SOLD, actuator);
        this.position = prop.getPosition();
    }

    public int getPosition() {
        return this.position;
    }

    @Override
    public String toString() {
        return this.getClass().getName() + "{" + "position=" + this.position + '}';
    }
}

