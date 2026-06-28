package de.hhn.labsw.laspoly.model.building;
import de.hhn.labsw.laspoly.utils.Shape3dUtil;
import de.hhn.labsw.laspoly.view.paint.Material;
import javafx.scene.Group;
import javafx.scene.Node;
import javafx.scene.shape.Box;
import javafx.scene.shape.DrawMode;
import javafx.scene.shape.MeshView;

/**
 * This class represents a special {@link de.hhn.labsw.laspoly.model.building.Building} called House that can only be
 * build if there is no {@link de.hhn.labsw.laspoly.model.building.Factory} on the {@link
 * de.hhn.labsw.laspoly.model.field.Street}. This is one of the first {@link de.hhn.labsw.laspoly.model.building.Building}
 * that can be build. It is possible to build up to 4 {@link de.hhn.labsw.laspoly.model.building.House} on a {@link
 * de.hhn.labsw.laspoly.model.field.Street}. The price of the rent of the {@link de.hhn.labsw.laspoly.model.field.Street}
 * increases with every {@link de.hhn.labsw.laspoly.model.building.House} build.
 */
public class House extends Building {

    /**
     * Height without roof
     */
    public static final float CUBE_HEIGHT = (float) WIDTH;
    /**
     * Holds the 3D shapes.
     */
    private final NodeHolder nodes;

    /**
     * Creates a new House and its 3D shapes.
     */
    public House(){
        nodes = new NodeHolder();
    }

    @Override
    public Node draw () {
        Group graphicsGroup = new Group();
        graphicsGroup.getChildren().addAll(nodes.bottomBox, nodes.roof);
        return graphicsGroup;
    }

    /**
     * This class manages the creation and storage of 3D Shapes. Every shape that can be reused should be stored in
     * here. The Shapes have to be created only once and on redraw, it is sufficient to change only the shape properties
     * that have changed
     */
    public class NodeHolder extends Building.NodeHolder {
        /**
         * The bottom cuboid symbolizes the walls of an house.
         */
        final Box bottomBox;
        /**
         * The roof MeshView is a pyramid which renders the roof of the house.
         */
        final MeshView roof;

        /**
         * Creates all shapes and gives them their default configuration.
         */
        public NodeHolder () {
            bottomBox = super.bottomBox;
            bottomBox.setHeight(CUBE_HEIGHT);

            roof = Shape3dUtil.createPyramid(20, (float) WIDTH, (float) DEPTH);
            roof.setDrawMode(DrawMode.FILL);
            roof.setMaterial(Material.RED);
            bottomBox.setTranslateY(getBottomHeight() + CUBE_HEIGHT / 2.0);
            roof.setTranslateY(getBottomHeight() + CUBE_HEIGHT);
        }

    }

    @Override
    public String toString() {
        return "de.hhn.labsw.laspoly.model.building.House{" + "CUBE_HEIGHT=" + CUBE_HEIGHT + ", nodes=" + nodes + '}';
    }
}
