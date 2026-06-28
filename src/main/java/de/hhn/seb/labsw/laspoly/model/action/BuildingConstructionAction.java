/*
 * Decompiled with CFR 0.152.
 */
package de.hhn.seb.labsw.laspoly.model.action;

import de.hhn.seb.labsw.laspoly.model.User;
import de.hhn.seb.labsw.laspoly.model.action.Action;
import de.hhn.seb.labsw.laspoly.model.action.ActionType;

public class BuildingConstructionAction
extends Action {
    private final int position;
    private final BuildingType buildingType;
    private final User user;

    public BuildingConstructionAction(User builder, int pos, BuildingType type, User actuator) {
        super(ActionType.BUILDING, actuator);
        this.user = builder;
        this.position = pos;
        this.buildingType = type;
    }

    public int getPosition() {
        return this.position;
    }

    public BuildingType getBuildingType() {
        return this.buildingType;
    }

    public User getUser() {
        return this.user;
    }

    @Override
    public String toString() {
        return this.getClass().getName() + "{position=" + this.position + ", buildingType=" + this.buildingType + ", user=" + this.user + '}';
    }

    public static enum BuildingType {
        HOUSE,
        HOTEL,
        FACTORY;

    }
}

