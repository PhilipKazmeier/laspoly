/*
 * Decompiled with CFR 0.152.
 */
package de.hhn.seb.labsw.laspoly.model.action;

import de.hhn.seb.labsw.laspoly.model.User;
import de.hhn.seb.labsw.laspoly.model.action.Action;
import de.hhn.seb.labsw.laspoly.model.action.ActionType;
import de.hhn.seb.labsw.laspoly.model.field.Property;

public class PropertyBoughtAction
extends Action {
    private final int propertyPosition;
    private final User user;

    public PropertyBoughtAction(Property prop, User buyer, User actuator) {
        super(ActionType.PROPERTY_BOUGHT, actuator);
        this.propertyPosition = prop.getPosition();
        this.user = buyer;
    }

    public int getPropertyPosition() {
        return this.propertyPosition;
    }

    public User getUser() {
        return this.user;
    }

    @Override
    public String toString() {
        return this.getClass().getName() + "{" + "propertyPosition=" + this.propertyPosition + ", user=" + this.user + '}';
    }
}

