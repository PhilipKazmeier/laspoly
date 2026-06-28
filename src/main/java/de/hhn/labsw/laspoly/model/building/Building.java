package de.hhn.labsw.laspoly.model.building;

import de.hhn.labsw.laspoly.model.field.Field;
import de.hhn.labsw.laspoly.view.View;
import de.hhn.labsw.laspoly.view.paint.AbsNodeHolder;
import de.hhn.labsw.laspoly.view.paint.Drawable;
import de.hhn.labsw.laspoly.view.paint.Material;
import javafx.scene.Node;
import javafx.scene.shape.Box;

import static de.hhn.labsw.laspoly.view.View.CanvasMeasures.COLOR_BAR_HEIGHT;

/**
 * This class represents a building that can be build on a {@link de.hhn.labsw.laspoly.model.field.Street}.
 */
public abstract class Building implements Drawable {

    public static final double WIDTH = Field.WIDTH * 0.23;

    /**
     * Depth of the bottom cube of a house
     */
    public static final double DEPTH = WIDTH;

    /**
     * Holds the house base cube object.
     */
    protected final NodeHolder nodes;

    /**
     * Creates a new Building
     */
    protected Building () {
        nodes = new NodeHolder();
    }

    @Override
    public abstract Node draw ();

    /**
     * This class manages the creation and storage of 3D Shapes. Every shape that can be reused should be stored in
     * here. The Shapes have to be created only once and on redraw, it is sufficient to change only the shape properties
     * that have changed
     */
    public class NodeHolder extends AbsNodeHolder {
        /**
         * The bottom cuboid symbolizes the walls of a building.
         */
        protected final Box bottomBox;

        /**
         * Creates all shapes and gives them their default configuration.
         */
        public NodeHolder () {
            bottomBox = new Box(WIDTH, House.CUBE_HEIGHT, DEPTH);
            bottomBox.setMaterial(Material.BLACK);
            bottomBox.setMaterial(View.Materials.BUILDING_CUBE_MATERIAL);
        }

        @Override
        public double getBottomHeight () {
            return Field.HEIGHT + COLOR_BAR_HEIGHT;
        }
    }

    @Override
    public String toString() {
        return "de.hhn.labsw.laspoly.model.building.Building{" + "DEPTH=" + DEPTH + ", WIDTH=" + WIDTH + ", nodes=" +
                nodes + '}';
    }
}
