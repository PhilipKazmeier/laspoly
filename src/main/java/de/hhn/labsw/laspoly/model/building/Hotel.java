package de.hhn.labsw.laspoly.model.building;

import de.hhn.labsw.laspoly.model.field.Field;
import javafx.scene.Group;
import javafx.scene.Node;
import javafx.scene.shape.Box;

import static de.hhn.labsw.laspoly.view.View.CanvasMeasures.COLOR_BAR_HEIGHT;

/**
 * This class represents a special {@link de.hhn.labsw.laspoly.model.building.Building} called Hotel that can only be
 * build when there are 4 {@link de.hhn.labsw.laspoly.model.building.House} on a {@link
 * de.hhn.labsw.laspoly.model.field.Street}. Building a {@link de.hhn.labsw.laspoly.model.building.Hotel} will remove
 * all {@link de.hhn.labsw.laspoly.model.building.House} on that {@link de.hhn.labsw.laspoly.model.field.Street}. The
 * rent of the {@link de.hhn.labsw.laspoly.model.field.Street} is on its maximum if a {@link
 * de.hhn.labsw.laspoly.model.building.Hotel} is build.
 */
public class Hotel extends Building {
    /**
     * Height of the hotel
     */
    public static final float CUBE_HEIGHT = House.CUBE_HEIGHT * 2;
    /**
     * Width of the hotel.
     */
    public static final float CUBE_WIDTH = (float) (House.WIDTH);
    /**
     * Holds the 3D shapes.
     */
    private final NodeHolder nodes;

    /**
     * Creates a new Hotel and its 3D shapes.
     */
    public Hotel() {
        nodes = new NodeHolder();
    }

    @Override
    public Node draw() {
        Group graphicsGroup = new Group();
        graphicsGroup.getChildren().addAll(nodes.bottomBox);
        return graphicsGroup;
    }

    /**
     * This class manages the creation and storage of 3D Shapes. Every shape that can be reused should be stored in
     * here. The Shapes have to be created only once and on redraw, it is sufficient to change only the shape properties
     * that have changed
     */
    public class NodeHolder extends Building.NodeHolder {
        /**
         * The bottom cuboid symbolizes the walls of a hotel.
         */
        final Box bottomBox;

        /**
         * Creates all shapes and gives them their default configuration.
         */
        public NodeHolder() {
            bottomBox = super.bottomBox;
            bottomBox.setHeight(CUBE_HEIGHT);
            bottomBox.setWidth(CUBE_WIDTH);
            bottomBox.setTranslateY(Field.HEIGHT + COLOR_BAR_HEIGHT + CUBE_HEIGHT / 2.0);
        }
    }

    @Override
    public String toString() {
        return "de.hhn.labsw.laspoly.model.building.Hotel{" + "CUBE_HEIGHT=" + CUBE_HEIGHT + "CUBE_WIDTH=" +
                CUBE_WIDTH + ", nodes=" + nodes + '}';
    }
}
