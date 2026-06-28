package de.hhn.labsw.laspoly.model.field;

import de.hhn.labsw.laspoly.exception.BuildingConstructionException;
import de.hhn.labsw.laspoly.model.building.Building;
import de.hhn.labsw.laspoly.model.building.Factory;
import de.hhn.labsw.laspoly.model.building.Hotel;
import de.hhn.labsw.laspoly.model.building.House;
import de.hhn.labsw.laspoly.utils.Xform;
import javafx.scene.Group;
import javafx.scene.Node;
import javafx.scene.paint.Color;
import javafx.scene.paint.PhongMaterial;
import javafx.scene.shape.Box;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import static de.hhn.labsw.laspoly.view.View.CanvasMeasures.COLOR_BAR_DEPTH;
import static de.hhn.labsw.laspoly.view.View.CanvasMeasures.COLOR_BAR_HEIGHT;
import static de.hhn.labsw.laspoly.view.View.CanvasMeasures.HALF_COLOR_BAR_DEPTH;
import static de.hhn.labsw.laspoly.view.View.CanvasMeasures.HALF_COLOR_BAR_HEIGHT;

/**
 * This class represents a special {@link de.hhn.labsw.laspoly.model.field.Property} on which it is possible to build
 * {@link de.hhn.labsw.laspoly.model.building.Building}. This is ony possible if one {@link
 * de.hhn.labsw.laspoly.model.Player} has all {@link de.hhn.labsw.laspoly.model.field.Street} of the same color. The
 * base rent for a {@link de.hhn.labsw.laspoly.model.field.Street} doubles if a {@link
 * de.hhn.labsw.laspoly.model.Player} has all {@link de.hhn.labsw.laspoly.model.field.Street} of the same color. If a
 * {@link de.hhn.labsw.laspoly.model.Player} buys a {@link de.hhn.labsw.laspoly.model.building.Building} the rent
 * changes and other things of the {@link de.hhn.labsw.laspoly.model.field.Street} can possibly change.
 */
public class Street extends Property implements Groupable {
    /**
     * The color of the street's color bar.
     */
    private final Color color;
    /**
     * List of Buildings that are currently built on the Street.
     */
    private List<Building> buildings;
    /**
     * A 3D Shape which renders the coloured bar of a street at the top edge.
     */
    private final NodeHolder nodes;
    private FieldGroup colourGroup;

    /**
     * Creates a new Street with the arguments.
     *
     * @param fieldPos position on the board
     * @param name     Name which is shown as label
     * @param price    price of the street when for offer
     * @param rents    rent prices for different amount of buildings on top
     */
    public Street(int fieldPos, String name, Color color, int price, int[] rents) {
        super(fieldPos, name);
        this.color = color;
        buildings = new ArrayList<>();
        nodes = new NodeHolder();

        /* START OF DEBUGGING PART */
//        construct(new House());
//        construct(new House());
        /* END OF DEBUGGING */
    }

    @Override
    public Group draw() {
        Group graphicsGroup = super.draw();
        Xform buildingsGroup = new Xform();
        for (int i = 0; i < buildings.size(); i++) {
            Building building = buildings.get(i);
            Node drawing = building.draw();
            // TODO: enhance the following lines
                /* the space which can be spread between all buildings*/
            double spaceLeft = Field.WIDTH - House.WIDTH * buildings.size();
            double margin = spaceLeft / (double) buildings.size() / 2.0;
            double translateX = i * House.WIDTH + (i + 1) * margin;
            if (buildings.size() < 4 && buildings.size() > 1) {
                translateX += House.WIDTH / 4.0;
            }
            drawing.setTranslateX(-translateX);
            buildingsGroup.getChildren().add(drawing);
        }

        buildingsGroup.setTranslateZ(Field.HALF_WIDTH + 6);
        // TODO: woher kommt die 6 in der zeile drüber?  mathematische rangehensweise gesucht :)
        buildingsGroup.setTranslateX(Field.HALF_WIDTH - House.WIDTH / 2.0);
        graphicsGroup.getChildren().addAll(nodes.colorBar, buildingsGroup);
        return graphicsGroup;
    }

    @Override
    protected void onHoverStart() {
        super.onHoverStart();
        nodes.colorBar.setMaterial(nodes.colorBarMaterialHover);
    }

    /**
     * Creates an immutable read only copy of the buildings.
     * Add buildings by calling {@link #construct(de.hhn.labsw.laspoly.model.building.Building)} instead.
     *
     * @return an immutable read only copy of the buildings.
     */
    public List<Building> getBuildings() {
        return Collections.unmodifiableList(buildings);
    }

    @Override
    protected void onHoverEnd() {
        super.onHoverEnd();
        nodes.colorBar.setMaterial(nodes.colorBarMaterial);
    }

    /**
     * return the color of the group of streets this street belongs to.
     */
    public Color getColor() {
        return color;
    }

    @Override
    public FieldGroup getFieldGroup() {
        return colourGroup;
    }

    @Override
    public void setFieldGroup(FieldGroup colourGroup) {
        this.colourGroup = colourGroup;
    }

    /**
     * Constructs a building on this street if possible.
     *
     * @param building the building to be constructed.
     * @throws de.hhn.labsw.laspoly.exception.BuildingConstructionException if the current configuration is wrong.
     */
    // todo test
    public void construct(Building building) throws BuildingConstructionException {
        if (building == null || buildings.contains(building)) {
            throw new IllegalArgumentException("Constructed building" + building == null ? "may not be null." : "is already built.");
        }
        if (building instanceof House) {
            if (canConstructHouse()) {
                buildings.add(building);
                draw();
            } else {
                throw new BuildingConstructionException(buildings, "A house cannot be built if its owner doesn't own all other fields of the " + "field group. A house cannot be built if there is a hotel or a factory already.");
            }
        } else if (building instanceof Hotel) {
            if (canConstructHotel()) {
                buildings.clear();
                buildings.add(building);
            } else {
                throw new BuildingConstructionException(buildings, "A hotel cannot be built if its owner doesn't own all other fields of the " + "field group. A hotel can only be built if there are currently four houses built on this street.");
            }
        } else {
            /* construct factory: */
            if (canConstructFactory()) {
                buildings.clear();
                buildings.add(building);
            } else {
                throw new BuildingConstructionException(buildings, "A factory cannot be built if its owner doesn't own all other fields of the " + "field group. A factory cannot be built if there is a house or a hotel or a factory already.");
            }
        }
    }

    /**
     * Checks weather a house can be built on this street with its current configuration.
     * A house cannot be built if its owner doesn't own all other fields of the field group.<br>
     * A house cannot be built if there is a hotel or a factory already.<br><br>
     * Note that this method <b>does not check if its owner has enough money</b>
     *
     * @return true if a house can be constructed on this street; false otherwise.
     */
    public boolean canConstructHouse() {
        final int buildingCount = buildings.size();
        final boolean hasHotelOrFactory = buildingCount > 0 && (buildings.get(0) instanceof Hotel || buildings.get(0) instanceof Factory);
        final boolean groupComplete = true /* TODO: check in FieldGroup if owner has all fields*/;
        return groupComplete && buildingCount < 4 && !hasHotelOrFactory;
    }

    /**
     * Checks weather a hotel can be built on this street with its current configuration.
     * a hotel cannot be built if its owner doesn't own all other fields of the field group.<br>
     * a hotel can only be built if there are currently four houses built on this street.<br>
     * Note that this method <b>does not check if its owner has enough money</b>
     *
     * @return true if a hotel can be constructed on this street; false otherwise.
     */
    public boolean canConstructHotel() {
        return buildings.size() == 4;
    }

    /**
     * Checks weather a factory can be built on this street with its current configuration.
     * A factory cannot be built if its owner doesn't own all other fields of the field group.<br>
     * A house cannot be built if there is a house or a hotel or a factory already.<br><br>
     * Note that this method <b>does not check if its owner has enough money</b>
     *
     * @return true if a factory can be constructed on this street; false otherwise.
     */
    public boolean canConstructFactory() {
        final boolean groupComplete = true /* TODO: check in FieldGroup if owner has all fields*/;
        return groupComplete && buildings.size() == 0;
    }

    /**
     * This class manages the creation and storage of 3D Shapes.
     * Every shape that can be reused should be stored in here.
     * The Shapes have to be created only once and on redraw,
     * it is sufficient to change only the shape properties that have changed
     */
    public class NodeHolder extends Property.NodeHolder {
        /**
         * Material of the color Bar. The material defines the colour.
         */
        PhongMaterial colorBarMaterial;
        /**
         * Material of the color Bar during the mouse hovers. The material defines the colour.
         */
        PhongMaterial colorBarMaterialHover;
        final Box colorBar;

        /**
         * Creates all shapes and gives them their default configuration.
         */
        public NodeHolder() {
            colorBar = new Box(WIDTH, COLOR_BAR_HEIGHT, COLOR_BAR_DEPTH);
            colorBar.setCache(true);
            colorBar.setTranslateY(getBottomHeight() + HALF_COLOR_BAR_HEIGHT);
            colorBar.setTranslateZ(HALF_DEPTH - HALF_COLOR_BAR_DEPTH);
            colorBar.setOnMouseEntered(e -> onHoverStart());
            colorBar.setOnMouseExited(e -> onHoverEnd());
            colorBarMaterial = new PhongMaterial(color);
            colorBarMaterialHover = new de.hhn.labsw.laspoly.view.paint.Material(color.darker());
            colorBar.setMaterial(colorBarMaterial);
        }
    }

    @Override
    public String toString() {
        final StringBuilder sb = new StringBuilder("de.hhn.labsw.laspoly.model.field.Street{");
        sb.append("buildings=");
        for (Building b : buildings) {
            sb.append(", ").append(b.getClass().getName());
        }
        sb.append(", color=").append(color);
        sb.append(", nodes=").append(nodes);
        sb.append(", colourGroup=").append(colourGroup);
        sb.append('}');
        return sb.toString();
    }
}
