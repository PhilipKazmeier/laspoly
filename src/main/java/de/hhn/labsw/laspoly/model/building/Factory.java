package de.hhn.labsw.laspoly.model.building;
import de.hhn.labsw.laspoly.model.field.Field;
import de.hhn.labsw.laspoly.utils.Shape3dUtil;
import de.hhn.labsw.laspoly.view.paint.Material;
import javafx.scene.Group;
import javafx.scene.Node;
import javafx.scene.shape.MeshView;

/**
 * This class is a special {@link de.hhn.labsw.laspoly.model.building.Building} called Factory that can only be build if
 * there are no other {@link de.hhn.labsw.laspoly.model.building.Building} on the {@link
 * de.hhn.labsw.laspoly.model.field.Street}. If a {@link de.hhn.labsw.laspoly.model.Player} builds a {@link
 * de.hhn.labsw.laspoly.model.building.Factory} the rent of the {@link de.hhn.labsw.laspoly.model.field.Street} the
 * {@link de.hhn.labsw.laspoly.model.building.Factory} is standing on will change to 0, but every time the {@link
 * de.hhn.labsw.laspoly.model.Player} passes this {@link de.hhn.labsw.laspoly.model.field.Street} the {@link
 * de.hhn.labsw.laspoly.model.Player} will get a specific amount of money.
 */
public class Factory extends Building {
    /**
     * Width of a factory which is larger than a house.
     */
    public static final double WIDTH = Field.WIDTH * 0.75;
    /**
     * Height without roof
     */
    public static final double HEIGHT = Hotel.CUBE_HEIGHT;
    /**
     * Holds the cube and the roof objects.
     */
    private final NodeHolder nodes;

    /**
     * Creates a new Factory and its 3D shapes.
     */
    public Factory() {
        nodes = new NodeHolder();
    }

    @Override
    public Node draw() {
        Group graphicsGroup = new Group();
        graphicsGroup.getChildren().addAll(nodes.factory);
        return graphicsGroup;
    }

    /**
     * This class manages the creation and storage of 3D Shapes.
     * Every shape that can be reused should be stored in here.
     * The Shapes have to be created only once and on redraw,
     * it is sufficient to change only the shape properties that have changed
     */
    public class NodeHolder extends Building.NodeHolder{
        final MeshView factory;

        /**
         * Creates all shapes and gives them their default configuration.
         */
        public NodeHolder() {
            factory = Shape3dUtil.createFactory((float) WIDTH,(float)HEIGHT,(float)DEPTH);
            factory.setMaterial(Material.RED);
        }
    }
}
