package de.hhn.labsw.laspoly.model.action;

import de.hhn.labsw.laspoly.model.Player;
import de.hhn.labsw.laspoly.model.building.Building;
import de.hhn.labsw.laspoly.model.building.Factory;
import de.hhn.labsw.laspoly.model.building.Hotel;
import de.hhn.labsw.laspoly.model.building.House;
import de.hhn.labsw.laspoly.model.field.Street;

/**
 * Action to build a {@link de.hhn.labsw.laspoly.model.building.Building} on a {@link
 * de.hhn.labsw.laspoly.model.field.Street}.
 */
public class Build implements Action {

    /**
     * Player that is creating this action.
     */
    private final Player player;

    /**
     * Street the building will be build on.
     */
    private final Street street;

    /**
     * Building that will be build.
     */
    private final Building building;

    /**
     * Constructor.
     *
     * @param player   Player that is creating this action.
     * @param street   Street the building will be build on.
     * @param building Building that will be build.
     */
    public Build(Player player, Street street, Building building) {
        this.player = player;
        this.street = street;
        this.building = building;
    }

    @Override
    public void onAction() {
        street.construct(building);
    }

    @Override
    public boolean isActionValid() {
        if (building instanceof House) {
            return street.canConstructHouse();
        } else if (building instanceof Hotel) {
            return street.canConstructHotel();
        } else if (building instanceof Factory) {
            return street.canConstructFactory();
        }
        return false;
    }

    public Street getStreet() {
        return street;
    }

    public Building getBuilding() {
        return building;
    }

    public Player getPlayer() {
        return player;
    }
}
