/*
 * Decompiled with CFR 0.152.
 */
package de.hhn.seb.labsw.laspoly.exception;

import de.hhn.seb.labsw.laspoly.model.building.Building;
import java.util.List;

public class BuildingConstructionException
extends IllegalStateException {
    public BuildingConstructionException(List<Building> config, String message) {
        super(message + "\ncurrent configuration of the street: " + config.toString());
    }

    public BuildingConstructionException(String message) {
        super(message);
    }
}

