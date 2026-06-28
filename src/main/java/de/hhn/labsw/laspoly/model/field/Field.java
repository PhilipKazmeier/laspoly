package de.hhn.labsw.laspoly.model.field;

import de.hhn.labsw.laspoly.model.Figure;
import de.hhn.labsw.laspoly.utils.Xform;
import de.hhn.labsw.laspoly.view.paint.AbsNodeHolder;
import de.hhn.labsw.laspoly.view.paint.Drawable;
import javafx.scene.Group;
import javafx.scene.shape.Box;

import java.util.ArrayList;
import java.util.List;

import static de.hhn.labsw.laspoly.view.View.Materials.FIELD_MATERIAL;
import static de.hhn.labsw.laspoly.view.View.Materials.FIELD_MATERIAL_HOVER;

/**
 * This class represents one gamescene on the game board. It's the base class for more precisely classes.
 */
public class Field implements Drawable {
    /**
     * Height of a gamescene on the board.
     */
    public static final double HEIGHT = 5;
    /**
     * @see {@link Field#HEIGHT}
     */
    public static final double HALF_HEIGHT = HEIGHT / 2.0;
    /**
     * Width of a Field on the board.
     */
    public static final double WIDTH = 100;
    /**
     * @see {@link de.hhn.labsw.laspoly.model.field.Field#WIDTH
     */
    public static final double HALF_WIDTH = WIDTH / 2.0;
    /**
     * Depth of a Field on the board. It looks best with the original Monopoly ratio
     * of about 1.5 times the width
     */
    public static final double DEPTH = 1.5 * WIDTH; // Original Monopoly ratio
    /**
     * @see {@link Field#DEPTH}
     */
    public static final double HALF_DEPTH = DEPTH / 2.0;
    /**
     * Class that holds the nodes so that they do not have to be recreated when re-drawing.
     */
    protected NodeHolder nodes;
    /**
     * Index of the filed on the Las Poly board.
     * The start gamescene has the index 0.
     * There are 40 gamescene. So {@code pos} can
     * have the values 0..39 :D :D
     */
    private int pos;
    /**
     * List of {@link de.hhn.labsw.laspoly.model.Figure} that are on this field.
     */
    private List<Figure> figureList;

    /**
     * Creates a new gamescene and saves the {@code pos} on the board.
     */
    public Field(int pos) {
        this.pos = pos;
        figureList = new ArrayList<>();
        nodes = new NodeHolder();
    }

    /**
     * @return the index of this gamescene on the game board
     */
    public int getPosition() {
        return pos;
    }

    @Override
    public Group draw() {
        Xform graphicsGroup = new Xform();
        graphicsGroup.getChildren().addAll(nodes.baseShape);
        return graphicsGroup;
    }


    /**
     * This method can be overridden. It gets called every time the mouse
     * begins to hover over the gamescene shape.
     */
    protected void onHoverStart() {
        nodes.baseShape.setMaterial(FIELD_MATERIAL_HOVER);
    }

    /**
     * This method can be overridden. It gets called every time the mouse
     * exits the gamescene shape.
     */
    protected void onHoverEnd() {
        nodes.baseShape.setMaterial(FIELD_MATERIAL);
    }

    /**
     * @return {@link #figureList}.
     */
    public List<Figure> getFigureList() {
        return figureList;
    }

    /**
     * @return the width
     */
    public double getWidth() {
        return WIDTH;
    }

    /**
     * This class manages the creation and storage of 3D Shapes.
     * Every shape that can be reused should be stored in here.
     * The Shapes have to be created only once and on redraw,
     * it is sufficient to change only the shape properties that have changed
     */
    public class NodeHolder extends AbsNodeHolder{
        /**
         * The base Shape is the bottom box every gamescene is based on.
         * The base shape of Special fields is usually wider and deeper than the base shape
         * of a default gamescene.
         */
        public final Box baseShape;

        /**
         * Creates all shapes and gives them their default configuration.
         */
        protected NodeHolder() {
            baseShape = createBaseShape();
            baseShape.setCache(true);
        }

        protected Box createBaseShape(){
            Box box = new Box(getWidth(), HEIGHT, DEPTH);
            box.setMaterial(FIELD_MATERIAL);
            box.setTranslateY(getBottomHeight() + HALF_HEIGHT);
            box.setOnMouseEntered(e -> onHoverStart());
            box.setOnMouseExited(e -> onHoverEnd());
            return box;
        }

        @Override
        public double getBottomHeight() {
            return 0;
        }
    }
}
