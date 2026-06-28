package de.hhn.labsw.laspoly.exception;
import de.hhn.labsw.laspoly.model.building.Building;

import java.util.List;

/**
 * Thrown when its tried to add a {@link de.hhn.labsw.laspoly.model.building.Building} to a {@link
 * de.hhn.labsw.laspoly.model.field.Street} that is not valid for this {@link de.hhn.labsw.laspoly.model.field.Street}.
 * <br> Examples:<br> - There are other {@link de.hhn.labsw.laspoly.model.building.Building} on a {@link
 * de.hhn.labsw.laspoly.model.field.Street} when building a {@link de.hhn.labsw.laspoly.model.building.Factory}.<br> -
 * There are less than 4 {@link de.hhn.labsw.laspoly.model.building.House} on a {@link
 * de.hhn.labsw.laspoly.model.field.Street} when building a {@link de.hhn.labsw.laspoly.model.building.Hotel}. <br> -
 * There is already a {@link de.hhn.labsw.laspoly.model.building.Hotel} on a {@link
 * de.hhn.labsw.laspoly.model.field.Street} when building a {@link de.hhn.labsw.laspoly.model.building.Hotel}. <br> -
 * There is a {@link de.hhn.labsw.laspoly.model.building.Factory} on a {@link de.hhn.labsw.laspoly.model.field.Street}
 * when building a {@link de.hhn.labsw.laspoly.model.building.House} or {@link de.hhn.labsw.laspoly.model.building.Hotel}.
 * <br>
 */
public class BuildingConstructionException extends IllegalStateException {
    /**
     * Constructor.
     *
     * @param message Message of the exception.
     */
    public BuildingConstructionException(List<Building> currentConfiguration, String message) {
        super(message + (currentConfiguration == null ? "" : "\ncurrent configuration of the street: " + currentConfiguration.toString()));
    }
}
